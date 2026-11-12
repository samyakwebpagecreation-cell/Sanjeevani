import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, Badge } from '../common/DesignSystem';

export interface BentoToolItem {
  id: 'cpr-metronome' | 'optical-wound' | 'ocr-scanner' | 'crowd-qr' | 'sbar-docket' | 'hospital-radar';
  category: 'cardiac' | 'trauma' | 'medicines' | 'crowd';
  tag: string;
  title: string;
  description: string;
  stat: string;
  icon: React.ReactNode;
  featured?: boolean;
  onClick: () => void;
}

interface BentoCardProps {
  tool: BentoToolItem;
  isFeaturedLayout: boolean;
}

export const BentoCard: React.FC<BentoCardProps> = ({ tool, isFeaturedLayout }) => {
  const spanClasses = isFeaturedLayout
    ? 'md:col-span-2 lg:col-span-2 lg:row-span-2 bg-navy text-white border-teal-400/30'
    : '';

  if (isFeaturedLayout) {
    return (
      <Card
        variant="dark"
        interactive
        onClick={tool.onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            tool.onClick();
          }
        }}
        className={`p-6 sm:p-8 flex flex-col justify-between gap-6 cursor-pointer group relative overflow-hidden ${spanClasses}`}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-teal-300">
            {tool.icon}
          </div>
          <Badge variant="dark">{tool.tag}</Badge>
        </div>

        {/* Center Live-Looking CPR Concentric Ring & ECG Visual */}
        <div className="my-2 p-5 sm:p-6 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full border-2 border-teal-400/50 animate-metronome-ring"
              />
              <span
                aria-hidden="true"
                className="absolute inset-3 rounded-full border-2 border-teal-300/35"
              />
              <div className="w-16 h-16 rounded-full bg-primary flex flex-col items-center justify-center text-white shadow-md">
                <span className="text-xl font-mono font-extrabold leading-tight tabular-nums">
                  5–6
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-teal-200 mt-0.5 leading-tight">
                  CM
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm font-mono font-bold uppercase tracking-wider text-teal-300">
                5–6 cm Sternum Depth Lock
              </div>
              <p className="text-base text-white/90 font-medium max-w-sm">
                Concentric visual shockwaves paired with an offline Web Audio CPR cadence synthesizer.
              </p>
            </div>
          </div>

          <svg
            viewBox="0 0 220 48"
            fill="none"
            aria-hidden="true"
            className="w-full sm:w-44 h-12 text-teal-300 shrink-0"
          >
            <path
              d="M0 24 H45 L58 12 L70 36 L84 4 L98 44 L110 16 L122 24 H220"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-ecg-line"
            />
          </svg>
        </div>

        {/* Text & Footer */}
        <div className="space-y-4 relative z-10">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white group-hover:text-teal-300 transition-colors">
              {tool.title}
            </h3>
            <p className="text-base sm:text-lg text-white/85 font-normal leading-relaxed max-w-[60ch]">
              {tool.description}
            </p>
          </div>

          <div className="pt-4 border-t border-white/15 flex items-center justify-between text-sm font-bold text-teal-300">
            <span>{tool.stat}</span>
            <span className="inline-flex items-center gap-1.5 text-white group-hover:text-teal-300">
              <span>Launch Metronome</span>
              <ArrowRight
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      interactive
      onClick={tool.onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tool.onClick();
        }
      }}
      className="p-6 flex flex-col justify-between gap-5 h-full cursor-pointer group relative overflow-hidden"
    >
      {/* Top-Right Low-Opacity Decorative SVG Glyph for Wound / OCR / Radar */}
      {(tool.id === 'optical-wound' ||
        tool.id === 'ocr-scanner' ||
        tool.id === 'hospital-radar') && (
        <svg
          viewBox="0 0 80 80"
          fill="none"
          aria-hidden="true"
          className="w-20 h-20 absolute -top-2 -right-2 text-primary/10 pointer-events-none"
        >
          <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="40" cy="40" r="18" stroke="currentColor" strokeWidth="2" />
          <path d="M40 4 V20 M40 60 V76 M4 40 H20 M60 40 H76" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}

      <div className="space-y-4 relative z-10">
        {/* Icon + Readable 14px Tinted Pill Tag */}
        <div className="flex items-center justify-between gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary-soft border border-primary/20 flex items-center justify-center shrink-0">
            {tool.icon}
          </div>
          <Badge variant="soft">{tool.tag}</Badge>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-ink group-hover:text-primary transition-colors">
            {tool.title}
          </h3>
          <p className="text-base text-ink-muted font-normal leading-relaxed">
            {tool.description}
          </p>
        </div>

        {/* Custom Inline Visuals for Squad QR & SBAR Cards */}
        {tool.id === 'crowd-qr' && (
          <div
            aria-hidden="true"
            className="p-3 rounded-xl bg-base border border-border flex items-center justify-between gap-3"
          >
            {/* Stylized SVG QR Pattern */}
            <svg viewBox="0 0 36 36" className="w-9 h-9 text-primary shrink-0" fill="currentColor">
              <path d="M2 2h12v12H2V2zm3 3v6h6V5H5zm17-3h12v12H22V2zm3 3v6h6V5h-6zM2 22h12v12H2V22zm3 3v6h6v-6H5zm17-3h4v4h-4v-4zm6 4h6v4h-6v-4zm-6 6h6v4h-6v-4zm8 0h4v4h-4v-4z" />
            </svg>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface border border-border text-xs font-bold text-ink">
                <span className="w-4 h-4 rounded-full bg-primary text-white text-[11px] flex items-center justify-center">
                  1
                </span>
                112 Dialer
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface border border-border text-xs font-bold text-ink">
                <span className="w-4 h-4 rounded-full bg-primary text-white text-[11px] flex items-center justify-center">
                  2
                </span>
                AED Runner
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface border border-border text-xs font-bold text-ink">
                <span className="w-4 h-4 rounded-full bg-primary text-white text-[11px] flex items-center justify-center">
                  3
                </span>
                Crowd Clear
              </span>
            </div>
          </div>
        )}

        {tool.id === 'sbar-docket' && (
          <div
            aria-hidden="true"
            className="p-3 rounded-xl bg-base border border-border flex items-center gap-3"
          >
            <div className="flex flex-col gap-1 shrink-0">
              {['S', 'B', 'A', 'R'].map((letter) => (
                <span
                  key={letter}
                  className="w-5 h-5 rounded bg-primary-soft text-primary font-mono text-xs font-bold flex items-center justify-center"
                >
                  {letter}
                </span>
              ))}
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-2.5 w-4/5 rounded-full bg-primary/25" />
              <div className="h-2 w-full rounded-full bg-border" />
              <div className="h-2 w-11/12 rounded-full bg-border" />
              <div className="h-2 w-2/3 rounded-full bg-primary/20" />
            </div>
          </div>
        )}
      </div>

      {/* Footer Stat */}
      <div className="pt-4 border-t border-border flex items-center justify-between text-sm font-bold text-ink mt-auto relative z-10">
        <span>{tool.stat}</span>
        <ArrowRight
          className="w-4 h-4 text-primary transition-transform group-hover:translate-x-1 shrink-0"
          aria-hidden="true"
        />
      </div>
    </Card>
  );
};
