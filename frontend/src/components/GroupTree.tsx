import React, { useEffect, useState, useMemo } from 'react';
import { getRound, getRoundStatus, MemberStatus, Round } from '../services/api';
import Ornament from './Ornament';
import './GroupTree.css';

const ORNAMENT_COLORS = [
  '#E879F9', '#FB923C', '#60A5FA', '#A3E635',
  '#F87171', '#FBBF24', '#34D399', '#A78BFA',
];

function generateRandomPosition(index: number, seed: string) {
  var hash = (seed + index).split('').reduce(function(a, b) {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  var topPercent = 20 + Math.abs(hash % 55);
  var narrowness = (topPercent - 20) / 55;
  var minLeft = 35 - (narrowness * 15);
  var maxLeft = 65 + (narrowness * 15);
  var leftRange = maxLeft - minLeft;
  var leftPercent = minLeft + (Math.abs((hash * 7) % 100) / 100 * leftRange);

  return {
    top: topPercent + '%',
    left: leftPercent + '%',
  };
}

function GroupTree(props: { roundId: string; groupName?: string }) {
  var [members, setMembers] = useState<MemberStatus[]>([]);
  var [round, setRound] = useState<Round | null>(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState<string | null>(null);

  useEffect(function() {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        var roundData = await getRound(props.roundId);
        var statusData = await getRoundStatus(props.roundId);
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
    loadData();
  }, [props.roundId]);

  function getUserColor(index: number) {
    return ORNAMENT_COLORS[index % ORNAMENT_COLORS.length];
  }

  var completedMembers = members.filter(function(m) {
    return m.completed;
  });

  var ornamentPositions = useMemo(function() {
    return completedMembers.map(function(member, index) {
      return generateRandomPosition(index, member._id);
    });
  }, [completedMembers]);

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

  var groupName = props.groupName || (round ? round.name : 'Group');

  return (
    <div className="group-tree-container">
      <div className="tree-content">
        <section className="members-panel">
          <h2 className="group-name">[{groupName}]</h2>

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

          <button className="deed-btn">See your good deed!</button>
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
                var position = ornamentPositions[index];
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