import React, { useEffect, useState } from 'react';

interface Props {
  isPlaying: boolean;
}

const AudioVisualizer: React.FC<Props> = ({ isPlaying }) => {
  // Create an array of random heights for the bars
  const [bars] = useState(() => Array.from({ length: 12 }, () => Math.random() * 0.5 + 0.2));

  return (
    <div className="flex items-center justify-center gap-1 h-12 w-full px-4">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full bg-brand-500 transition-all duration-300 ease-in-out ${
            isPlaying ? 'animate-pulse' : ''
          }`}
          style={{
            height: isPlaying ? `${Math.random() * 100}%` : '20%',
            animationDelay: `${i * 0.1}s`,
            opacity: isPlaying ? 1 : 0.5
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;
