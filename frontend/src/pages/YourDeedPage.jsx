import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyDeed, completeDeed, getGroup, getRound } from '../services/api';

export default function YourDeedPage() {
  var [user, setUser] = useState(null);
  var [group, setGroup] = useState(null);
  var [round, setRound] = useState(null);
  var [deed, setDeed] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState('');
  var [completing, setCompleting] = useState(false);
  var navigate = useNavigate();

  useEffect(function() {
    loadData();
  }, []);

  async function loadData() {
    var storedUser = localStorage.getItem('user');
    var storedGroup = localStorage.getItem('group');
    var storedRound = localStorage.getItem('round');

    if (!storedUser || !storedGroup || !storedRound) {
      navigate('/login');
      return;
    }

    var userData = JSON.parse(storedUser);
    var groupData = JSON.parse(storedGroup);
    var roundData = JSON.parse(storedRound);

    setUser(userData);
    setGroup(groupData);
    setRound(roundData);

    try {
      // Get user-specific deed for this round
      var myDeed = await getMyDeed(roundData._id, userData._id);
      setDeed(myDeed);
    } catch (err) {
      setError('No deed assigned yet');
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    if (!user || !round) {
      return;
    }

    setCompleting(true);

    try {
      var updatedDeed = await completeDeed(round._id, user._id);
      setDeed(updatedDeed);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to complete deed');
      }
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <>
        <div style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '24px' }}>❄️ Loading your deed...</div>
        </div>
      </>
    );
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
        padding: '100px 20px 40px 20px',
        boxSizing: 'border-box'
      }}>

        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontFamily: "'Mountains of Christmas', cursive",
            fontSize: '48px',
            margin: '0 0 10px 0',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            🎄 Your Good Deed 🎄
          </h1>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            marginTop: '20px'
          }}>
            {user && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '10px 20px',
                borderRadius: '30px',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}>
                <span style={{ color: '#D4D4D4', fontSize: '14px' }}>👤 </span>
                <span style={{ fontWeight: '600' }}>{user.name}</span>
              </div>
            )}

            {group && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '10px 20px',
                borderRadius: '30px',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}>
                <span style={{ color: '#D4D4D4', fontSize: '14px' }}>👥 </span>
                <span style={{ fontWeight: '600' }}>{group.name}</span>
              </div>
            )}

            {round && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '10px 20px',
                borderRadius: '30px',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}>
                <span style={{ color: '#D4D4D4', fontSize: '14px' }}>📅 </span>
                <span style={{ fontWeight: '600' }}>{round.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && !deed && (
          <div style={{
            background: 'rgba(248, 113, 113, 0.2)',
            border: '2px solid #F87171',
            padding: '20px 40px',
            borderRadius: '12px',
            color: '#F87171'
          }}>
            {error}
          </div>
        )}

        {/* Deed Card */}
        {deed && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '24px',
            padding: '50px',
            maxWidth: '550px',
            width: '100%',
            textAlign: 'center',
            border: deed.completed ? '4px solid #34D399' : '4px solid #FFD700',
            boxShadow: deed.completed
              ? '0 0 30px rgba(52, 211, 153, 0.3)'
              : '0 0 30px rgba(255, 215, 0, 0.3)',
            position: 'relative'
          }}>

            {/* Completed Badge */}
            {deed.completed && (
              <div style={{
                position: 'absolute',
                top: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#34D399',
                color: 'white',
                padding: '10px 25px',
                borderRadius: '30px',
                fontWeight: '700',
                fontSize: '16px',
                boxShadow: '0 4px 15px rgba(52, 211, 153, 0.4)'
              }}>
                ✅ Completed!
              </div>
            )}

            {/* Pending Badge */}
            {!deed.completed && (
              <div style={{
                position: 'absolute',
                top: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#FFD700',
                color: '#1a1a1a',
                padding: '10px 25px',
                borderRadius: '30px',
                fontWeight: '700',
                fontSize: '16px',
                boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)'
              }}>
                ⏳ In Progress
              </div>
            )}

            {/* Task Label */}
            <p style={{
              color: '#D4D4D4',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginTop: '20px',
              marginBottom: '15px'
            }}>
              Your Task This Week
            </p>

            {/* Deed Description */}
            <p style={{
              fontSize: '28px',
              fontFamily: "'Quicksand', sans-serif",
              fontWeight: '700',
              lineHeight: '1.4',
              margin: '20px 0',
              color: 'white'
            }}>
              "{deed.deed_description}"
            </p>

            {/* Complete Button */}
            {!deed.completed && (
              <button
                onClick={handleComplete}
                disabled={completing}
                style={{
                  marginTop: '30px',
                  padding: '18px 50px',
                  fontSize: '18px',
                  fontWeight: '700',
                  fontFamily: "'Quicksand', sans-serif",
                  background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: completing ? 'not-allowed' : 'pointer',
                  opacity: completing ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 6px 20px rgba(52, 211, 153, 0.4)'
                }}
              >
                {completing ? '⏳ Completing...' : '✓ Mark as Complete'}
              </button>
            )}

            {/* Completion Date */}
            {deed.completed && deed.completed_at && (
              <p style={{
                marginTop: '25px',
                fontSize: '14px',
                color: '#34D399'
              }}>
                🎉 Completed on {new Date(deed.completed_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            )}
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={function() { navigate('/dashboard'); }}
          style={{
            marginTop: '40px',
            padding: '12px 30px',
            background: 'transparent',
            border: '2px solid #D4D4D4',
            color: '#D4D4D4',
            borderRadius: '30px',
            cursor: 'pointer',
            fontFamily: "'Quicksand', sans-serif",
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
        >
          ← Back to Group
        </button>
      </div>
    </>
  );
}