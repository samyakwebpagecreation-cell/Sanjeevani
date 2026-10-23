import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  durationMs?: number;
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  durationMs = 3000,
  onFinish
}) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    const startTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      if (elapsed < durationMs) {
        animId = requestAnimationFrame(tick);
      } else {
        // Ethereal smooth dissolve out
        setIsExiting(true);
        setTimeout(() => {
          setIsMounted(false);
          if (onFinish) onFinish();
        }, 650);
      }
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [durationMs, onFinish]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsMounted(false);
      if (onFinish) onFinish();
    }, 250);
  };

  if (!isMounted) return null;

  // Peaceful, quiet status text based on progress
  const getStatusText = () => {
    if (progress < 40) return 'Initializing accredited protocols...';
    if (progress < 80) return 'Calibrating decision engines...';
    return 'Ready for response.';
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-white text-slate-800 select-none overflow-hidden transition-all duration-700 ease-out ${
        isExiting 
          ? 'opacity-0 scale-[0.99] pointer-events-none' 
          : 'opacity-100 scale-100'
      }`}
    >
      {/* Top Bar: Discreet, elegant Skip option */}
      <div className="w-full max-w-4xl mx-auto px-6 pt-6 flex items-center justify-end">
        <button
          onClick={handleSkip}
          className="text-xs font-medium tracking-wide text-slate-400 hover:text-slate-700 px-3 py-1 rounded-full border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer bg-white/80 backdrop-blur-xs"
          title="Skip intro"
        >
          Skip
        </button>
      </div>

      {/* Centerpiece: Multi-layer Organic Morphing Aura + Respiration Emblem */}
      <div className="flex flex-col items-center text-center px-4 -mt-4 sm:-mt-6">
        
        {/* Organic Morphing Container */}
        <div className="relative flex items-center justify-center mb-6 sm:mb-7">
          
          {/* Layer 1: Soft Pastel Aurora Morph (Mint, Teal & Warm Saffron) */}
          <div className="absolute w-52 h-52 sm:w-64 sm:h-64 bg-gradient-to-tr from-emerald-100/70 via-teal-100/40 to-amber-100/40 blur-2xl animate-gentle-morph pointer-events-none" />
          
          {/* Layer 2: Subtle Focused Emerald Glow */}
          <div className="absolute w-40 h-40 sm:w-48 sm:h-48 bg-emerald-500/10 blur-xl animate-gentle-morph-secondary pointer-events-none" />
          
          {/* Layer 3: Ultra-soft Tranquil Ripple Boundary */}
          <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-emerald-500/10 pointer-events-none animate-calm-breathe" />
          
          {/* Logo with Tranquil 3.2s Respiration Cycle */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center animate-calm-breathe">
            <img 
              src="/sanjeevani-logo.png" 
              alt="Sanjeevani Logo" 
              className="w-full h-full object-contain select-none filter drop-shadow-[0_8px_20px_rgba(14,90,80,0.12)]" 
            />
          </div>
        </div>

        {/* Calm, Typographic Wordmark & Subtitle */}
        <div className="space-y-2 animate-soft-fade-up">
          <h1 className="font-display-italic text-3xl sm:text-4xl text-[#0E5A50] font-normal tracking-tight">
            Sanjeevani
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 tracking-[0.24em] uppercase font-semibold">
            Emergency Decision Support
          </p>
          
          {/* Subtle Clinical Badge */}
          <div className="pt-1 flex items-center justify-center">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800/80 text-[10px] font-medium tracking-wide border border-emerald-100/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>AHA & AIIMS Clinical Protocols</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Hairline Progress & Calm Status */}
      <div className="pb-10 flex flex-col items-center space-y-2.5">
        <div className="w-32 sm:w-40 bg-slate-100 h-1 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0E5A50] to-[#2E9E6D] transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 font-medium tracking-wide">
          {getStatusText()}
        </p>
      </div>

    </div>
  );
};
