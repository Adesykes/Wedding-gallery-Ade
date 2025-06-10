import React from 'react';
import './HeartBackground.css';

const HeartBackground = () => {
  return (
    <div className="heart-bg">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="heart"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${4 + Math.random() * 6}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
};

export default HeartBackground;