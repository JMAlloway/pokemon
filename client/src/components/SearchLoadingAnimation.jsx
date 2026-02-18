import { useState, useEffect } from 'react';

const MESSAGES = [
  'Searching the tall grass...',
  'Checking the bargain bin...',
  'Scanning for misspellings...',
  'Comparing market prices...',
  'Peeking in seller binders...',
  'Hunting for hidden deals...',
  'Analyzing recent sales...',
  'Scouting for underpriced cards...',
  'Rummaging through listings...',
  'Calculating deal scores...',
];

export default function SearchLoadingAnimation() {
  const [messageIndex, setMessageIndex] = useState(() => Math.floor(Math.random() * MESSAGES.length));
  const [dots, setDots] = useState('');

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(msgInterval);
  }, []);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => clearInterval(dotInterval);
  }, []);

  // Strip trailing dots/ellipsis from message since we animate them
  const baseMessage = MESSAGES[messageIndex].replace(/\.+$/, '');

  return (
    <div className="mt-16 flex flex-col items-center gap-6">
      {/* Pokeball */}
      <div className="relative" style={{ width: 72, height: 72 }}>
        <svg
          viewBox="0 0 100 100"
          width="72"
          height="72"
          className="animate-[wobble_1.2s_ease-in-out_infinite]"
        >
          {/* Top half — red */}
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="#ef4444"
            stroke="#2d2d52"
            strokeWidth="4"
          />
          {/* Bottom half — white */}
          <path
            d="M 5 50 A 45 45 0 0 0 95 50"
            fill="#e8e8f0"
            stroke="#2d2d52"
            strokeWidth="4"
          />
          {/* Center band */}
          <line x1="5" y1="50" x2="95" y2="50" stroke="#2d2d52" strokeWidth="5" />
          {/* Center button — outer */}
          <circle cx="50" cy="50" r="14" fill="#2d2d52" />
          {/* Center button — inner with pulse */}
          <circle
            cx="50"
            cy="50"
            r="9"
            fill="#e8e8f0"
            className="animate-[pulse_2s_ease-in-out_infinite]"
          />
          {/* Shine highlight */}
          <ellipse cx="35" cy="32" rx="10" ry="6" fill="white" opacity="0.2" transform="rotate(-20 35 32)" />
        </svg>
      </div>

      {/* Message */}
      <div className="text-center">
        <p className="text-sm text-text-secondary transition-opacity duration-300">
          <span className="inline-block min-w-[260px]">
            {baseMessage}
            <span className="inline-block w-[18px] text-left">{dots}</span>
          </span>
        </p>
      </div>
    </div>
  );
}
