import React, { useEffect, useState } from 'react';
import './Celebration.css';

interface CelebrationProps {
  onComplete: () => void;
}

function Celebration(props: CelebrationProps) {
  var [show, setShow] = useState(true);

  useEffect(function() {
    var timer = setTimeout(function() {
      setShow(false);
      props.onComplete();
    }, 5000);

    return function() {
      clearTimeout(timer);
    };
  }, [props]);

  if (!show) return null;

  return (
    <div className="celebration-overlay">
      <div className="celebration-content">
        <div className="celebration-emoji">🎉</div>
        <h1 className="celebration-title">Amazing!</h1>
        <p className="celebration-message">Everyone completed their good deeds!</p>
        <div className="celebration-stars">
          <span>⭐</span>
          <span>🌟</span>
          <span>✨</span>
          <span>🌟</span>
          <span>⭐</span>
        </div>
        <p className="celebration-next">Starting next week's round...</p>
        <div className="celebration-tree">🎄</div>
      </div>
      <div className="confetti">
        {Array.from({ length: 50 }).map(function(_, i) {
          return <div key={i} className="confetti-piece" style={{
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 3 + 's',
            backgroundColor: ['#34D399', '#FFD700', '#F87171', '#60A5FA', '#E879F9'][Math.floor(Math.random() * 5)]
          }} />;
        })}
      </div>
    </div>
  );
}

export default Celebration;