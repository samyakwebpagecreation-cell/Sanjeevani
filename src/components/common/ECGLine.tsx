import React from 'react';

export interface ECGLineProps {
  variant?: 'light' | 'dark' | 'banner' | 'compact';
  className?: string;
  label?: string;
}

export const ECGLine: React.FC<ECGLineProps> = ({
  variant = 'light',
  className = '',
  label
}) => {
  const strokeColor =
    variant === 'dark' || variant === 'banner'
      ? 'text-teal-400/50'
      : 'text-primary/50';

  if (variant === 'banner') {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none select-none overflow-hidden ${className}`}
      >
        <svg
          viewBox="0 0 1200 120"
          fill="none"
          preserveAspectRatio="none"
          className={`w-full h-24 sm:h-32 ${strokeColor}`}
        >
          <path
            d="M0 60 H220 L245 42 L262 82 L285 14 L306 106 L326 36 L345 60 H620 L645 42 L662 82 L685 14 L706 106 L726 36 L745 60 H980 L1005 42 L1022 82 L1045 14 L1066 106 L1086 36 L1105 60 H1200"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-ecg-line"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        aria-hidden="true"
        className={`w-full flex items-center gap-2 sm:gap-3 select-none min-w-0 overflow-hidden ${className}`}
      >
        <svg
          viewBox="0 0 260 36"
          fill="none"
          className="w-12 sm:w-36 h-7 text-primary shrink-0"
        >
          <path
            d="M0 18 H45 L58 10 L68 26 L80 4 L92 32 L103 12 L113 18 H155 L168 10 L178 26 L190 4 L202 32 L213 12 L223 18 H260"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-ecg-line"
          />
        </svg>
        {label && (
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.08em] sm:tracking-[0.14em] text-primary truncate">
            {label}
          </span>
        )}
        <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent min-w-[12px]" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 select-none ${className}`}
    >
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-primary/30" />
      <div className="flex items-center gap-3 shrink-0">
        {label && (
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
            {label}
          </span>
        )}
        <svg
          viewBox="0 0 260 36"
          fill="none"
          className={`w-44 sm:w-60 h-8 ${strokeColor}`}
        >
          <path
            d="M0 18 H65 L78 10 L88 26 L100 4 L112 32 L123 12 L133 18 H260"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-ecg-line"
          />
        </svg>
      </div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-primary/30" />
    </div>
  );
};
