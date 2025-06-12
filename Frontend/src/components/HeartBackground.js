import React from 'react';
import './HeartBackground.css';

const HeartBackground = () => {
  return (
    <div className="heart-bg">
      {[...Array(25)].map((_, i) => (
        <div
          key={i}
          className="heart"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${6 + Math.random() * 8}s`,
            animationDelay: `${Math.random() * 8}s`,
            transform: `scale(${0.8 + Math.random() * 0.4})`,
            opacity: 0.7 + Math.random() * 0.3
          }}
        />
      ))}
    </div>
  );
};

export default HeartBackground;