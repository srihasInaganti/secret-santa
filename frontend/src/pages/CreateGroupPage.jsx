import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {SnowForeground, SnowBackground} from "../components/Snow.jsx";

export default function CreateGroupPage() {
  var [groupName, setGroupName] = useState('');
  var [userName, setUserName] = useState('');
  var [error, setError] = useState('');
  var [loading, setLoading] = useState(false);
  var navigate = useNavigate();

  async function handleCreate() {
    if (!groupName.trim() || !userName.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    // TODO: Add API calls to create group
    // For now just show message
    setError('Coming soon!');
    setLoading(false);
  }

  return (
    <>
      <SnowForeground />
      <SnowBackground />
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center',
        gap: '20px'
      }}>
        <h1 style={{
          fontFamily: "'Mountains of Christmas', cursive",
          fontSize: '42px',
          marginBottom: '20px'
        }}>
          Create a New Group
        </h1>

        <input
          type="text"
          placeholder="Your name"
          value={userName}
          onChange={function(e) { setUserName(e.target.value); }}
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

        {error && (
          <p style={{ color: '#F87171', margin: '0' }}>{error}</p>
        )}

        <button
          className="btn-primary"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </>
  );
}