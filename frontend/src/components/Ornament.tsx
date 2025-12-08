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
      style={{ width: size, height: size * 1.2 }}
    >
      <svg viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg" className="ornament-svg">
        {/* Cap */}
        <rect x="16" y="4" width="8" height="6" rx="1" fill={completed ? '#C9A227' : '#6B7280'} className="ornament-cap" />
        {/* Hook */}
        <path d="M20 4 Q20 0 22 0 Q24 0 24 4" stroke={completed ? '#C9A227' : '#6B7280'} strokeWidth="2" fill="none" className="ornament-hook" />
        {/* Ball */}
        <circle cx="20" cy="32" r="18" fill={completed ? color : '#374151'} className="ornament-ball" />
        {/* Shine */}
        {completed && (
          <ellipse cx="14" cy="26" rx="5" ry="7" fill="rgba(255,255,255,0.35)" className="ornament-shine" />
        )}
      </svg>
    </div>
  );
};

export default Ornament;