import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, createGroup, joinGroup, createRound } from '../services/api';
import {SnowForeground, SnowBackground} from "../components/Snow.jsx";

export default function CreateGroupPage() {
  var [groupName, setGroupName] = useState('');
  var [users, setUsers] = useState([
    { name: '', status: 'empty', user: null },
    { name: '', status: 'empty', user: null }
  ]);
  var [error, setError] = useState('');
  var [loading, setLoading] = useState(false);
  var navigate = useNavigate();

  async function checkUser(index) {
    var name = users[index].name.trim();

    if (!name) {
      updateUser(index, '', 'empty', null);
      return;
    }

    updateUser(index, name, 'checking', null);

    try {
      var user = await login(name);
      updateUser(index, name, 'found', user);
    } catch (err) {
      updateUser(index, name, 'not-found', null);
    }
  }

  function updateUser(index, name, status, user) {
    var newUsers = users.slice();
    newUsers[index] = { name: name, status: status, user: user };
    setUsers(newUsers);
  }

  function handleNameChange(index, value) {
    var newUsers = users.slice();
    newUsers[index] = { name: value, status: 'empty', user: null };
    setUsers(newUsers);
  }

  function addUserField() {
    setUsers(users.concat([{ name: '', status: 'empty', user: null }]));
  }

  function removeUserField(index) {
    if (users.length <= 2) return;
    var newUsers = users.slice();
    newUsers.splice(index, 1);
    setUsers(newUsers);
  }

  function allUsersValid() {
    var validCount = 0;
    for (var i = 0; i < users.length; i++) {
      if (users[i].status === 'found') {
        validCount++;
      } else if (users[i].name.trim() !== '') {
        return false;
      }
    }
    return validCount >= 2;
  }

  async function handleCreate() {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    var validUsers = users.filter(function(u) {
      return u.status === 'found' && u.user !== null;
    });

    if (validUsers.length < 2) {
      setError('Please add at least 2 valid users');
      return;
    }

    setLoading(true);
    setError('');

    try {
      var group = await createGroup(groupName.trim());

      for (var i = 0; i < validUsers.length; i++) {
        await joinGroup(group._id, validUsers[i].user._id);
      }

      var today = new Date();
      var roundName = 'Week of ' + today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      var round = await createRound(group._id, roundName);

      localStorage.setItem('user', JSON.stringify(validUsers[0].user));
      localStorage.setItem('group', JSON.stringify(group));
      localStorage.setItem('round', JSON.stringify(round));

      navigate('/dashboard');

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create group. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function getInputStyle(status) {
    var borderColor = '#34D399';
    if (status === 'found') borderColor = '#34D399';
    if (status === 'not-found') borderColor = '#F87171';
    if (status === 'checking') borderColor = '#FBBF24';

    return {
      padding: '12px 16px',
      fontSize: '16px',
      borderRadius: '8px',
      border: '2px solid ' + borderColor,
      background: 'rgba(0,0,0,0.3)',
      color: 'white',
      width: '200px',
      fontFamily: "'Quicksand', sans-serif",
      outline: 'none'
    };
  }

  function getStatusIcon(status) {
    if (status === 'found') return '✅';
    if (status === 'not-found') return '❌';
    if (status === 'checking') return '⏳';
    return '';
  }

  return (
    <>
      <SnowForeground />
      <SnowBackground />
      <div style={{
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center',
        gap: '20px',
        padding: '100px 20px 40px 20px',
        boxSizing: 'border-box'
      }}>
        <h1 style={{
          fontFamily: "'Mountains of Christmas', cursive",
          fontSize: '42px',
          marginBottom: '10px'
        }}>
          Create a New Group
        </h1>

        <input
          type="text"
          placeholder="Group name"
          value={groupName}
          onChange={function(e) { setGroupName(e.target.value); }}
          style={{
            padding: '15px 20px',
            fontSize: '18px',
            borderRadius: '8px',
            border: '2px solid #34D399',
            background: 'rgba(0,0,0,0.3)',
            color: 'white',
            width: '300px',
            fontFamily: "'Quicksand', sans-serif",
            outline: 'none'
          }}
        />

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginTop: '10px'
        }}>
          <label style={{ fontSize: '16px', color: '#D4D4D4' }}>
            Add group members
          </label>

          {users.map(function(userEntry, index) {
            return (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  placeholder={'User ' + (index + 1)}
                  value={userEntry.name}
                  onChange={function(e) { handleNameChange(index, e.target.value); }}
                  onBlur={function() { checkUser(index); }}
                  style={getInputStyle(userEntry.status)}
                />
                <span style={{ width: '30px', fontSize: '20px' }}>
                  {getStatusIcon(userEntry.status)}
                </span>
                {users.length > 2 && (
                  <button
                    onClick={function() { removeUserField(index); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#F87171',
                      fontSize: '20px',
                      cursor: 'pointer',
                      padding: '5px'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={addUserField}
            style={{
              background: 'transparent',
              border: '2px dashed #D4D4D4',
              color: '#D4D4D4',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: "'Quicksand', sans-serif",
              fontSize: '14px',
              marginTop: '5px'
            }}
          >
            + Add another user
          </button>
        </div>

        {error && (
          <p style={{ color: '#F87171', margin: '0' }}>{error}</p>
        )}

        <button
          className="btn-primary"
          onClick={handleCreate}
          disabled={loading || !allUsersValid()}
          style={{
            marginTop: '10px',
            opacity: (loading || !allUsersValid()) ? 0.5 : 1
          }}
        >
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </>
  );
}