import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRound, getRoundStatus, checkRoundComplete, advanceToNextRound, markCelebrationSeen, MemberStatus, Round } from '../services/api';
import Ornament from './Ornament';
import Celebration from './Celebration';
import './GroupTree.css';

const ORNAMENT_COLORS = [
  "#FF0000",
  "#008000",
  "#FFD700",
  "#FFFFFF",
  "#00FF00",
  "#8B0000",
  "#FF4500",
  "#FF69B4",
  "#ADD8E6",
  "#1E90FF",
  "#00CED1",
  "#87CEEB",
  "#C0C0C0",
  "#DAA520",
  "#32CD32",
  "#FA8072",
  "#DC143C",
  "#F0E68C",
  "#B22222",
  "#2E8B57",
];


const ORNAMENT_POSITIONS = [
  { top: '18%', left: '50%' },
  { top: '28%', left: '38%' },
  { top: '28%', left: '62%' },
  { top: '40%', left: '30%' },
  { top: '40%', left: '50%' },
  { top: '40%', left: '70%' },
  { top: '52%', left: '25%' },
  { top: '52%', left: '42%' },
  { top: '52%', left: '58%' },
  { top: '52%', left: '75%' },
  { top: '65%', left: '20%' },
  { top: '65%', left: '35%' },
  { top: '65%', left: '50%' },
  { top: '65%', left: '65%' },
  { top: '65%', left: '80%' },
  { top: '78%', left: '18%' },
  { top: '78%', left: '32%' },
  { top: '78%', left: '50%' },
  { top: '78%', left: '68%' },
  { top: '78%', left: '82%' },
];

function getOrnamentPosition(index: number, odId: string) {
  if (index < ORNAMENT_POSITIONS.length) {
    return ORNAMENT_POSITIONS[index];
  }

  var basePosition = ORNAMENT_POSITIONS[index % ORNAMENT_POSITIONS.length];
  var hash = odId.split('').reduce(function(a, b) {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  var offsetX = (Math.abs(hash) % 10) - 5;
  var offsetY = (Math.abs(hash * 7) % 10) - 5;

  return {
    top: `calc(${basePosition.top} + ${offsetY}px)`,
    left: `calc(${basePosition.left} + ${offsetX}px)`,
  };
}

function GroupTree(props: { roundId: string; groupName?: string }) {
  var [members, setMembers] = useState<MemberStatus[]>([]);
  var [round, setRound] = useState<Round | null>(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState<string | null>(null);
  var [showCelebration, setShowCelebration] = useState(false);
  var [currentRoundId, setCurrentRoundId] = useState(props.roundId);
  var [pendingNewRoundId, setPendingNewRoundId] = useState<string | null>(null);
  var navigate = useNavigate();

  function getCurrentUser() {
    var storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    return null;
  }

  useEffect(function() {
    loadData();
  }, [currentRoundId]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      var user = getCurrentUser();
      var userId = user ? user._id : null;

      // First check completion status
      var completion = await checkRoundComplete(currentRoundId, userId);

      console.log('Completion check:', completion); // Debug log

      // If user should see celebration
      if (completion.show_celebration) {
        // If round already completed, store the new round ID for after celebration
        if (completion.round_completed && completion.new_round_id) {
          setPendingNewRoundId(completion.new_round_id);
        }
        setShowCelebration(true);
        setLoading(false);
        return;
      }

      // If round completed but user already saw celebration, go to new round
      if (completion.round_completed && completion.new_round_id && !completion.show_celebration) {
        await switchToNewRound(completion.new_round_id);
        return;
      }

      // Load current round data normally
      var roundData = await getRound(currentRoundId);
      var statusData = await getRoundStatus(currentRoundId);
      setRound(roundData);
      setMembers(statusData);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  }

  async function switchToNewRound(newRoundId: string) {
    try {
      var newRound = await getRound(newRoundId);
      localStorage.setItem('round', JSON.stringify(newRound));
      setCurrentRoundId(newRoundId);
      setPendingNewRoundId(null);
    } catch (err) {
      console.error('Failed to switch to new round:', err);
    }
  }

  async function handleCelebrationComplete() {
    try {
      var user = getCurrentUser();

      // Mark that this user has seen the celebration
      if (user) {
        await markCelebrationSeen(currentRoundId, user._id);
      }

      setShowCelebration(false);

      // If there's already a new round (another user advanced it)
      if (pendingNewRoundId) {
        await switchToNewRound(pendingNewRoundId);
        return;
      }

      // Otherwise, advance to next round (first user to complete)
      var newRound = await advanceToNextRound(currentRoundId);

      // Update localStorage
      localStorage.setItem('round', JSON.stringify(newRound));

      // Update state
      setCurrentRoundId(newRound._id);
    } catch (err) {
      console.error('Failed to advance round:', err);
    }
  }

  function getUserColor(index: number) {
    return ORNAMENT_COLORS[index % ORNAMENT_COLORS.length];
  }

  function handleSeeDeed() {
    navigate('/deed');
  }

  var completedMembers = members.filter(function(m) {
    return m.completed;
  });

  if (loading) {
    return (
      <div className="group-tree-container">
        <div className="loading-state">
          <div className="snowflake">❄</div>
          <p>Loading your group...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="group-tree-container">
        <div className="error-state">
          <p>🎄 Oops! {error}</p>
          <button onClick={function() { window.location.reload(); }}>Try Again</button>
        </div>
      </div>
    );
  }

  // Show celebration overlay
  if (showCelebration) {
    return (
      <div className="group-tree-container">
        <Celebration onComplete={handleCelebrationComplete} />
      </div>
    );
  }

  var groupName = props.groupName || (round ? round.name : 'Group');

  return (
    <div className="group-tree-container">
      <div className="tree-content">
        <section className="members-panel">
          <h2 className="group-name">[{groupName}]</h2>

          {round && (
            <p className="round-name">📅 {round.name}</p>
          )}

          <p className="round-status started">
            🎁 {completedMembers.length}/{members.length} deeds complete
          </p>

          <ul className="members-list">
            {members.map(function(member, index) {
              return (
                <li key={member._id} className="member-item">
                  <span className="member-name">
                    {member.name}: {member.completed ? 'Complete' : 'Incomplete'}
                  </span>
                  <Ornament color={getUserColor(index)} size={40} completed={member.completed} />
                </li>
              );
            })}
          </ul>

          {members.length === 0 && (
            <p className="no-members">No members yet!</p>
          )}

          <button className="deed-btn" onClick={handleSeeDeed}>
            See your good deed!
          </button>
        </section>

        <section className="tree-panel">
          <div className="tree-wrapper">
            <div className="tree-star">★</div>
            <svg className="christmas-tree" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
              <polygon className="tree-layer" points="100,10 140,70 60,70" />
              <polygon className="tree-layer" points="100,50 155,120 45,120" />
              <polygon className="tree-layer" points="100,90 170,180 30,180" />
              <rect className="tree-trunk" x="85" y="180" width="30" height="40" />
            </svg>

            <div className="tree-ornaments">
              {completedMembers.map(function(member, index) {
                var originalIndex = members.findIndex(function(m) {
                  return m._id === member._id;
                });
                var position = getOrnamentPosition(index, member._id);
                return (
                  <div
                    key={member._id}
                    className="tree-ornament"
                    style={{ top: position.top, left: position.left }}
                    title={member.name + ' completed their deed!'}
                  >
                    <Ornament color={getUserColor(originalIndex)} size={28} completed={true} onTree={true} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default GroupTree;