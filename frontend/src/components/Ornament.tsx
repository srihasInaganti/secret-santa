import React from 'react';
import './Ornament.css';

interface OrnamentProps {
  color: string;
  size?: number;
  completed?: boolean;
  onTree?: boolean;
}

const Ornament: React.FC<OrnamentProps> = ({ color, size = 32, completed = false, onTree = false }) => {
  return (
    <div
      className={`ornament-wrapper ${completed ? 'completed' : 'incomplete'} ${onTree ? 'on-tree' : ''}`}
      style={{ width: size, height: size * 1.3 }}
    >
      <svg viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg" className="ornament-svg">
        <rect x="16" y="0" width="8" height="8" rx="1" fill={completed ? '#6B7280' : '#9CA3AF'} className="ornament-cap" />
        <path d="M20 0 Q20 -4 24 -4 Q28 -4 28 0" stroke={completed ? '#6B7280' : '#9CA3AF'} strokeWidth="2" fill="none" className="ornament-hook" />
        <circle cx="20" cy="32" r="18" fill={color} className="ornament-ball" />
        <ellipse cx="14" cy="26" rx="5" ry="7" fill="rgba(255,255,255,0.3)" className="ornament-shine" />
      </svg>
    </div>
  );
};

export default Ornament;