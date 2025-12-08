import React, { useEffect, useState } from 'react';
import { fetchMembersWithStatus, fetchRound, MemberWithStatus, Round } from '../services/api';
import Ornament from './Ornament';
import './GroupTree.css';

const ORNAMENT_COLORS = [
  '#E879F9', '#FB923C', '#60A5FA', '#A3E635',
  '#F87171', '#FBBF24', '#34D399', '#A78BFA',
];

interface GroupTreeProps {
  roundId: string;
  onViewDeed?: () => void;
}

const GroupTree: React.FC<GroupTreeProps> = ({ roundId, onViewDeed }) => {
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [roundData, membersData] = await Promise.all([
          fetchRound(roundId),
          fetchMembersWithStatus(roundId),
        ]);
        setRound(roundData);
        setMembers(membersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [roundId]);

  const getUserColor = (index: number): string => ORNAMENT_COLORS[index % ORNAMENT_COLORS.length];
  const completedMembers = members.filter(m => m.completed);

  const getTreeOrnamentPosition = (index: number): { top: string; left: string } => {
    const positions = [
      { top: '18%', left: '48%' }, { top: '32%', left: '30%' }, { top: '32%', left: '66%' },
      { top: '48%', left: '22%' }, { top: '48%', left: '50%' }, { top: '48%', left: '74%' },
      { top: '64%', left: '18%' }, { top: '64%', left: '42%' }, { top: '64%', left: '58%' },
      { top: '64%', left: '78%' }, { top: '78%', left: '28%' }, { top: '78%', left: '50%' },
      { top: '78%', left: '70%' },
    ];
    return positions[index % positions.length];
  };

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
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="group-tree-container">
      <nav className="tree-nav">
        <button className="nav-btn active">Your Group</button>
        <button className="nav-btn" onClick={onViewDeed}>Your Good Deed</button>
        <button className="nav-btn profile-btn">Profile</button>
      </nav>

      <main className="tree-content">
        <section className="members-panel">
          <h2 className="group-name">[{round?.name || 'Group'}]</h2>

          {round?.status === 'pending' && <p className="round-status pending">⏳ Waiting to start...</p>}
          {round?.status === 'started' && (
            <p className="round-status started">🎁 {completedMembers.length}/{members.length} deeds complete</p>
          )}
          {round?.status === 'closed' && <p className="round-status closed">✅ Round complete!</p>}

          <ul className="members-list">
            {members.map((member, index) => (
              <li key={member._id} className="member-item">
                <span className="member-name">
                  {member.name}: {member.completed ? 'Complete' : 'Incomplete'}
                </span>
                <Ornament color={getUserColor(index)} size={40} completed={member.completed} />
              </li>
            ))}
          </ul>

          {members.length === 0 && (
            <p className="no-members">No members yet. Share the access code to invite people!</p>
          )}

          <button className="deed-btn" onClick={onViewDeed}>See your good deed!</button>
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
              {completedMembers.map((member, index) => {
                const originalIndex = members.findIndex(m => m._id === member._id);
                const position = getTreeOrnamentPosition(index);
                return (
                  <div
                    key={member._id}
                    className="tree-ornament"
                    style={{ top: position.top, left: position.left }}
                    title={`${member.name} completed their deed!`}
                  >
                    <Ornament color={getUserColor(originalIndex)} size={28} completed={true} onTree={true} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default GroupTree;