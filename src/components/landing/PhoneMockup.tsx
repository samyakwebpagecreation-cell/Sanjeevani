import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  PhoneCall,
  ShieldCheck,
  WifiOff,
  Users,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Destination } from '../../types';
import { CountdownRing } from '../common/CountdownRing';
import { Button } from '../common/DesignSystem';

interface PhoneMockupProps {
  onStartRespond: (protocolId?: string) => void;
  onSelectDestination: (dest: Destination) => void;
  onOpenCrowdModal?: () => void;
  onTriggerSOS: () => void;
}

interface AppScreenSlide {
  id: string;
  src: string;
  title: string;
  badge: string;
  caption: string;
  destination: Destination;
  openCrowd?: boolean;
}

const APP_SCREEN_SLIDES: AppScreenSlide[] = [
  {
    id: 'guardian-home',
    src: '/assets/aistudio/image_c4db12da.png',
    title: 'AI Guardian · Triage Hub',
    badge: 'AHA 2020 & AIIMS',
    caption: 'Instant emergency triage with 112 SOS & Rescue Toolkit.',
    destination: 'chat'
  },
  {
    id: 'guardian-steps',
    src: '/assets/aistudio/image_ecf75b88.png',
    title: 'AI Guardian · Step-by-Step CPR',
    badge: 'Guided CPR',
    caption: 'Calm 1-2-3 resuscitation steps with hands-free audio.',
    destination: 'chat'
  },
  {
    id: 'rescue-toolkit',
    src: '/assets/aistudio/image_b18b9b8c.png',
    title: 'Rescue Toolkit · Crowd & EMS QR',
    badge: '0-Download Squad',
    caption: 'Bystander & Paramedic QR codes with 5 coordinated roles.',
    destination: 'chat',
    openCrowd: true
  },
  {
    id: 'first-aid-library',
    src: '/assets/aistudio/image_f17ff5b3.png',
    title: 'First-Aid Library · 100 Protocols',
    badge: 'Works Offline',
    caption: '100 clinical emergency protocols cached locally on device.',
    destination: 'library'
  },
  {
    id: 'reality-check-verdict',
    src: '/assets/aistudio/image_081628b7.png',
    title: 'Reality Check · Myth Verdict',
    badge: 'Busted · Dangerous',
    caption: 'Replaces dangerous burn remedies with AHA & AIIMS care.',
    destination: 'mythbuster'
  },
  {
    id: 'reality-check-science',
    src: '/assets/aistudio/image_4083a6c9.png',
    title: 'Reality Check · Clinical Science',
    badge: 'Evidence Ledger',
    caption: 'Explains why household myths fail with cited guidelines.',
    destination: 'mythbuster'
  },
  {
    id: 'cheap-medicines',
    src: '/assets/aistudio/image_b4506002.png',
    title: 'Cheap Medicines · Jan Aushadhi',
    badge: 'Save 60–75%',
    caption: 'WHO-GMP verified generic salt equivalents at lowest MRP.',
    destination: 'medicines'
  }
];

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  onSelectDestination,
  onOpenCrowdModal,
  onTriggerSOS
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % APP_SCREEN_SLIDES.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  const currentSlide = APP_SCREEN_SLIDES[activeIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + APP_SCREEN_SLIDES.length) % APP_SCREEN_SLIDES.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % APP_SCREEN_SLIDES.length);
  };

  const handleOpenCurrentScreen = () => {
    if (currentSlide.openCrowd && onOpenCrowdModal) {
      onOpenCrowdModal();
      return;
    }
    onSelectDestination(currentSlide.destination);
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center py-2 sm:py-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Large 300-Second Countdown Ring Accent Behind Phone */}
      <CountdownRing
        size="lg"
        className="absolute inset-0 -z-10 opacity-75 scale-75 sm:scale-100"
      />

      {/* Floating Chip 1: Works Offline (Top-Left) */}
      <div
        aria-hidden="true"
        className="hidden sm:flex animate-float-chip absolute -left-4 xl:-left-8 top-12 z-20 items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border-2 border-primary/30 text-ink shadow-md text-sm font-bold"
      >
        <WifiOff className="w-4 h-4 text-primary shrink-0" />
        <span>Works offline</span>
      </div>

      {/* Floating Chip 2: Guided CPR & Triage (Bottom-Right) */}
      <div
        aria-hidden="true"
        className="hidden sm:flex animate-float-chip-delayed absolute -right-4 xl:-right-8 bottom-24 z-20 items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border-2 border-primary/30 text-ink shadow-md text-sm font-bold"
      >
        <HeartPulse className="w-4 h-4 text-primary shrink-0" />
        <span>Guided CPR &amp; Triage</span>
      </div>

      {/* Phone Hardware Frame (Scaled neatly on mobile so 360px never overflows) */}
      <div className="w-full max-w-[320px] sm:max-w-[360px] rounded-[36px] bg-navy p-2.5 sm:p-3 shadow-2xl border-2 border-slate-700/80 relative z-10">
        {/* Top Speaker Notch */}
        <div
          aria-hidden="true"
          className="mx-auto w-28 h-4 rounded-b-xl bg-slate-950 flex items-center justify-center mb-1.5"
        >
          <span className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        {/* Inner App Screen */}
        <div className="rounded-[26px] bg-surface text-ink overflow-hidden border border-border flex flex-col">
          {/* App Status Bar */}
          <div className="px-3.5 py-2 bg-base border-b border-border flex items-center justify-between text-[11px] font-mono font-bold text-ink-muted">
            <span>
              SCREEN {activeIndex + 1}/{APP_SCREEN_SLIDES.length} · {currentSlide.badge}
            </span>
            <span className="inline-flex items-center gap-1 text-primary">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>LIVE UI</span>
            </span>
          </div>

          {/* Red "Call 112" Emergency Bar inside Mockup */}
          <button
            type="button"
            onClick={onTriggerSOS}
            className="w-full px-3.5 py-2 bg-alert hover:bg-alert-dark text-white flex items-center justify-between text-xs font-bold transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Call 112 · Emergency Dispatch</span>
            </span>
            <span className="text-[10px] font-mono uppercase bg-black/20 px-1.5 py-0.5 rounded">
              SOS
            </span>
          </button>

          {/* Authentic App Screenshot Viewport */}
          <div className="relative bg-white aspect-[9/16] w-full overflow-hidden group">
            {APP_SCREEN_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={handleOpenCurrentScreen}
                aria-label={`Open ${slide.title}`}
                className={`absolute inset-0 w-full h-full transition-opacity duration-300 cursor-pointer focus:outline-none ${
                  idx === activeIndex
                    ? 'opacity-100 z-10 pointer-events-auto'
                    : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={slide.src}
                  alt={slide.title}
                  className="w-full h-full object-cover object-top select-none"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              </button>
            ))}

            {/* Left / Right Carousel Controls */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous app screen"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-navy/80 hover:bg-navy text-white flex items-center justify-center shadow-md border border-white/20 transition-transform active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next app screen"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-navy/80 hover:bg-navy text-white flex items-center justify-center shadow-md border border-white/20 transition-transform active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Caption + Screen Selector Dots */}
          <div className="p-3 bg-base border-t border-border space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-ink truncate">
                  {currentSlide.title}
                </p>
                <p className="text-[11px] text-ink-muted truncate">
                  {currentSlide.caption}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCurrentScreen}
                className="shrink-0 px-2.5 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary-dark transition-colors cursor-pointer"
              >
                Try live
              </button>
            </div>

            {/* 7 Screen Thumbnail / Step Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-0.5" role="tablist" aria-label="App screen previews">
              {APP_SCREEN_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={idx === activeIndex}
                  aria-label={`Preview ${slide.title}`}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === activeIndex
                      ? 'w-6 bg-primary'
                      : 'w-2 bg-border hover:bg-ink-muted/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overlapping / Bottom Red "Deploy Bystander Crowd Squad" Action Button */}
      <div className="w-full max-w-[320px] sm:max-w-[360px] -mt-3 relative z-20 px-2">
        <Button
          type="button"
          variant="alert"
          fullWidth
          onClick={() =>
            onOpenCrowdModal ? onOpenCrowdModal() : onSelectDestination('chat')
          }
          className="shadow-lg"
        >
          <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Deploy Bystander Crowd Squad</span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};
