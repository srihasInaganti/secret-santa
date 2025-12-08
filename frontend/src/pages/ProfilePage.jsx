import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserGroups, getCurrentRound, getMyDeed } from '../services/api';
import Ornament from '../components/Ornament';

export default function ProfilePage() {
  var [user, setUser] = useState(null);
  var [groups, setGroups] = useState([]);
  var [loading, setLoading] = useState(true);
  var navigate = useNavigate();

  useEffect(function() {
    loadData();
  }, []);

  async function loadData() {
    var storedUser = localStorage.getItem('user');

    if (!storedUser) {
      navigate('/login');
      return;
    }

    var userData = JSON.parse(storedUser);
    setUser(userData);

    try {
      // Get all groups user belongs to
      var userGroups = await getUserGroups(userData._id);

      // For each group, get current round and deed status
      var groupsWithStatus = [];

      for (var i = 0; i < userGroups.length; i++) {
        var group = userGroups[i];
        var groupInfo = {
          _id: group._id,
          name: group.name,
          round: null,
          deed: null,
          completed: false
        };

        try {
          var round = await getCurrentRound(group._id);
          groupInfo.round = round;

          try {
            var deed = await getMyDeed(round._id, userData._id);
            groupInfo.deed = deed;
            groupInfo.completed = deed.completed;
          } catch (err) {
            // No deed assigned yet
          }
        } catch (err) {
          // No active round
        }

        groupsWithStatus.push(groupInfo);
      }

      setGroups(groupsWithStatus);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('group');
    localStorage.removeItem('round');
    navigate('/');
  }

  function handleGroupClick(group) {
    if (group.round) {
      localStorage.setItem('group', JSON.stringify({ _id: group._id, name: group.name }));
      localStorage.setItem('round', JSON.stringify(group.round));
      navigate('/dashboard');
    }
  }

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ fontSize: '24px' }}>❄️ Loading profile...</div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: 'white',
      padding: '100px 20px 40px 20px',
      boxSizing: 'border-box'
    }}>

      {/* Profile Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          fontSize: '48px',
          boxShadow: '0 8px 30px rgba(52, 211, 153, 0.4)'
        }}>
          👤
        </div>

        <h1 style={{
          fontFamily: "'Mountains of Christmas', cursive",
          fontSize: '42px',
          margin: '0 0 10px 0',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          {user ? user.name : 'Guest'}
        </h1>

        <p style={{
          color: '#D4D4D4',
          fontSize: '16px'
        }}>
          {groups.length === 0
            ? "You're not in any groups yet"
            : `Member of ${groups.length} group${groups.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {/* Groups Section */}
      <div style={{
        width: '100%',
        maxWidth: '500px'
      }}>
        <h2 style={{
          fontFamily: "'Quicksand', sans-serif",
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '20px',
          color: '#D4D4D4',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          Your Groups
        </h2>

        {groups.length === 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '30px',
            borderRadius: '16px',
            textAlign: 'center',
            color: '#D4D4D4'
          }}>
            <p style={{ marginBottom: '15px' }}>Join a group to start doing good deeds!</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={function() { navigate('/create'); }}
                className="btn-primary"
              >
                Create a Group
              </button>
            </div>
          </div>
        )}

        {groups.map(function(group, index) {
          return (
            <div
              key={group._id}
              onClick={function() { handleGroupClick(group); }}
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '16px',
                padding: '20px 25px',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: group.round ? 'pointer' : 'default',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontFamily: "'Quicksand', sans-serif",
                  fontSize: '20px',
                  fontWeight: '700',
                  margin: '0 0 8px 0'
                }}>
                  {group.name}
                </h3>

                {group.round ? (
                  <p style={{
                    color: '#D4D4D4',
                    fontSize: '14px',
                    margin: 0
                  }}>
                    📅 {group.round.name}
                  </p>
                ) : (
                  <p style={{
                    color: '#F87171',
                    fontSize: '14px',
                    margin: 0
                  }}>
                    No active round
                  </p>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                {group.round && (
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: group.completed
                      ? 'rgba(52, 211, 153, 0.2)'
                      : 'rgba(255, 215, 0, 0.2)',
                    color: group.completed ? '#34D399' : '#FFD700'
                  }}>
                    {group.completed ? 'Done' : 'Pending'}
                  </div>
                )}

                <Ornament
                  color={group.completed ? '#34D399' : '#1a1a1a'}
                  size={40}
                  completed={group.completed}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          marginTop: '50px',
          padding: '15px 40px',
          background: 'transparent',
          border: '2px solid #F87171',
          color: '#F87171',
          borderRadius: '30px',
          cursor: 'pointer',
          fontFamily: "'Quicksand', sans-serif",
          fontSize: '16px',
          fontWeight: '600',
          transition: 'all 0.3s ease'
        }}
      >
        🚪 Logout
      </button>
    </div>
  );
}