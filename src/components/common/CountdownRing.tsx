import React, { useState, useEffect } from 'react';

export interface CountdownRingProps {
  size?: 'lg' | 'sm' | 'xs';
  label?: string;
  progress?: number; // Optional 0-100 progress override
  className?: string;
}

export const CountdownRing: React.FC<CountdownRingProps> = ({
  size = 'lg',
  label = '04:00',
  progress,
  className = ''
}) => {
  const [secondsLeft, setSecondsLeft] = useState(240);

  useEffect(() => {
    if (size !== 'lg' || typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReduced) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 240 : prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [size]);

  const formattedTime =
    size === 'lg'
      ? `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
          secondsLeft % 60
        ).padStart(2, '0')}`
      : label;

  if (size === 'xs') {
    const circumference = 125.6; // 2 * pi * 20
    const offset =
      progress !== undefined
        ? circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference
        : 28;
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90" aria-hidden="true">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            className="text-primary/15"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeDasharray={String(circumference)}
            strokeDashoffset={String(offset)}
            strokeLinecap="round"
            className="text-primary transition-all duration-300"
          />
        </svg>
        <span className="absolute font-extrabold text-xs text-ink tabular-nums">
          {label}
        </span>
      </div>
    );
  }

  if (size === 'sm') {
    const circumference = 226;
    const offset =
      progress !== undefined
        ? circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference
        : 48;
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 84 84" className="w-20 h-20 -rotate-90" aria-hidden="true">
          <circle
            cx="42"
            cy="42"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-primary/15"
          />
          <circle
            cx="42"
            cy="42"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={String(circumference)}
            strokeDashoffset={String(offset)}
            strokeLinecap="round"
            className="text-primary transition-all duration-300"
          />
        </svg>
        <span className="absolute font-mono font-extrabold text-sm text-ink tabular-nums">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none flex items-center justify-center ${className}`}
    >
      <div className="relative w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle
            cx="100"
            cy="100"
            r="94"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 5"
            className="text-primary/25"
          />
          <circle
            cx="100"
            cy="100"
            r="86"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            className="text-primary/12"
          />
          <circle
            cx="100"
            cy="100"
            r="86"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeDasharray="540"
            strokeDashoffset="110"
            strokeLinecap="round"
            className="text-primary/35 animate-countdown-ring"
          />
        </svg>
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-surface/90 border border-primary/25 text-xs font-mono font-bold text-primary shadow-2xs">
          GOLDEN WINDOW · {formattedTime}
        </div>
      </div>
    </div>
  );
};
