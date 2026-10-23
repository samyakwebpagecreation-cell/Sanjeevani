import React from 'react';

interface LeafBorderProps {
  side?: 'left' | 'right' | 'both' | 'top';
  className?: string;
}

export const LeafBorder: React.FC<LeafBorderProps> = ({
  side = 'left',
  className = ''
}) => {
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 ${
        side === 'left' ? 'left-0 w-3' : side === 'right' ? 'right-0 w-3' : 'inset-x-0 h-3'
      } overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        className="h-full w-full opacity-40 hover:opacity-75 transition-opacity duration-300"
        preserveAspectRatio="none"
        viewBox="0 0 16 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Central golden leaf spine */}
        <line x1="8" y1="0" x2="8" y2="200" stroke="#F0A85B" strokeWidth="2" strokeLinecap="round" />
        
        {/* Organic diagonal lateral veins branching outward (inspired by Sanjeevani leaf macro) */}
        <path d="M8 20 Q 3 25 0 35" stroke="#F0A85B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 20 Q 13 25 16 35" stroke="#F0A85B" strokeWidth="1.5" strokeLinecap="round" />
        
        <path d="M8 50 Q 3 55 0 65" stroke="#F0A85B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 50 Q 13 55 16 65" stroke="#F0A85B" strokeWidth="1.5" strokeLinecap="round" />

        <path d="M8 80 Q 3 85 0 95" stroke="#F0A85B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 80 Q 13 85 16 95" stroke="#F0A85B" strokeWidth="1.5" strokeLinecap="round" />

        <path d="M8 110 Q 3 115 0 125" stroke="#F0A85B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 110 Q 13 115 16 125" stroke="#F0A85B" strokeWidth="1.5" strokeLinecap="round" />

        <path d="M8 140 Q 3 145 0 155" stroke="#F0A85B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 140 Q 13 145 16 155" stroke="#F0A85B" strokeWidth="1.5" strokeLinecap="round" />

        <path d="M8 170 Q 3 175 0 185" stroke="#F0A85B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 170 Q 13 175 16 185" stroke="#F0A85B" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export const BotanicalVeinStrip: React.FC<{ orientation?: 'horizontal' | 'vertical'; className?: string }> = ({
  orientation = 'horizontal',
  className = ''
}) => {
  if (orientation === 'horizontal') {
    return (
      <div className={`relative w-full h-4 overflow-hidden my-4 ${className}`} aria-hidden="true">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center space-x-12 opacity-60">
          {[...Array(6)].map((_, i) => (
            <svg key={i} className="h-3 w-6 text-accent" viewBox="0 0 24 12" fill="none">
              <path d="M0 6 Q6 0 12 6 Q18 12 24 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M6 3 Q12 6 18 3" stroke="#0E5A50" strokeWidth="1" strokeLinecap="round" />
            </svg>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-4 overflow-hidden mx-1 ${className}`} aria-hidden="true">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-full w-[1.5px] bg-gradient-to-b from-transparent via-accent/60 to-transparent" />
      </div>
    </div>
  );
};
