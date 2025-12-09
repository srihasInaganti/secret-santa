import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// NOTE: Using submitDeedForVerification instead of completeDeed
import { getMyDeed, submitDeedForVerification, getGroup, getRound } from '../services/api'; 
import { SnowForeground, SnowBackground } from "../components/Snow.jsx";

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
    
    // NOTE: This is now SUBMISSION. 
    // In a real application, you might show a modal here to collect the proof text.
    const proofNote = "I completed the good deed and am submitting it for verification!";

    try {
      // Call the new submission function
      var updatedDeed = await submitDeedForVerification(round._id, user._id, proofNote);
      setDeed(updatedDeed);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to submit deed for verification');
      }
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <>
        <SnowForeground />
        <SnowBackground />
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
  
  // --- NEW STATUS LOGIC ---
  let statusText = '';
  let statusColor = '';
  let badgeLabel = '';
  let showButton = false;
  let buttonText = 'Send for Verification';
  let completionDetail = null;

  if (deed) {
      if (deed.completed) {
        // 🟢 COMPLETED: Verified and final
        badgeLabel = '✅ Completed!';
        statusColor = '#34D399'; // Green
        statusText = 'Your Good Deed has been verified!';
        completionDetail = `🎉 Verified on ${new Date(deed.completed_at).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}`;
      } else if (deed.verification_status === 'pending') {
        // 🟡 PENDING: Submitted and waiting for recipient/verifier
        badgeLabel = '⏳ Awaiting Verification';
        statusColor = '#FFD700'; // Gold/Yellow
        statusText = 'Deed submitted! The recipient must verify it to be marked complete.';
      } else if (deed.verification_status === 'rejected') {
        // 🔴 REJECTED: Failed verification
        badgeLabel = '❌ Verification Rejected';
        statusColor = '#EF4444'; // Red
        statusText = 'Your submission was rejected. Please review the deed and try again!';
        showButton = true;
        buttonText = 'Resubmit for Verification';
      } else { 
        // 🔵 ACTIVE: Ready to be performed and submitted (default state)
        badgeLabel = '✍️ In Progress';
        statusColor = '#3B82F6'; // Blue
        statusText = 'Complete your good deed, then submit it for verification.';
        showButton = true;
        buttonText = 'Submit for Verification';
      }
  }
  // --- END NEW STATUS LOGIC ---


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
            // Use dynamic statusColor for the border/shadow
            border: `4px solid ${statusColor}`,
            boxShadow: `0 0 30px ${statusColor}4D`,
            position: 'relative'
          }}>

            {/* Status Badge */}
            <div style={{
              position: 'absolute',
              top: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: statusColor,
              // Change text color for light backgrounds
              color: (statusColor === '#FFD700' || statusColor === '#EF4444') ? '#1a1a1a' : 'white',
              padding: '10px 25px',
              borderRadius: '30px',
              fontWeight: '700',
              fontSize: '16px',
              boxShadow: `0 4px 15px ${statusColor}66`
            }}>
              {badgeLabel}
            </div>

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

            {/* Dynamic Button/Status Area */}
            
            {showButton && (
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
                {completing ? '⏳ Submitting...' : buttonText}
              </button>
            )}

            {/* Show the status message for all states */}
            <p style={{
                marginTop: '25px',
                fontSize: '16px',
                fontWeight: completionDetail ? '700' : '600',
                color: completionDetail ? statusColor : '#D4D4D4',
                fontFamily: "'Quicksand', sans-serif"
            }}>
                {statusText}
            </p>

            {/* Completion Date/Detail */}
            {completionDetail && (
                <p style={{
                    marginTop: '10px',
                    fontSize: '14px',
                    color: statusColor
                }}>
                    {completionDetail}
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