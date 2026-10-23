import React from 'react';
import { 
  Zap, 
  BookOpen, 
  GraduationCap, 
  Scan, 
  ChevronRight, 
  HeartPulse, 
  Shield, 
  Crosshair,
  Sparkles,
  FileText
} from 'lucide-react';
import { Destination } from '../../types';
import { EmergencyActionMatrix } from '../common/EmergencyActionMatrix';

interface HomeViewProps {
  onSelectDestination: (dest: Destination) => void;
  onStartRespond: (protocolId?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectDestination,
  onStartRespond
}) => {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12 animate-in fade-in duration-300">
      {/* Hero Section with Camera-Mock Visual (not a stat block) */}
      <section className="relative overflow-hidden rounded-3xl bg-surface border border-border p-6 sm:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Wordmark Hero Headline & One Glowing Respond CTA */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>Instant Decision Support</span>
            </div>

            <div className="space-y-3">
              <h1 className="font-display-italic text-4xl sm:text-5xl lg:text-[54px] leading-[1.08] tracking-tight text-ink">
                Sanjeevani
              </h1>
              <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-xl">
                Immediate, calm first-aid guidance in emergencies. One micro-step at a time, backed by on-device visual positioning and deterministic safety checks.
              </p>
            </div>

            {/* Glowing "Ask AI First-Aid Guardian" CTA */}
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => onSelectDestination('chat')}
                className="group relative inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-xl btn-tactile-primary text-white text-base sm:text-lg font-bold transition-all cursor-pointer"
              >
                {/* Subtle outer amber glow */}
                <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary to-accent opacity-30 blur-md group-hover:opacity-60 transition duration-300 -z-10" />
                <Zap className="h-5 w-5 text-accent animate-pulse" strokeWidth={2.5} />
                <span>Ask AI First-Aid Guardian</span>
                <ChevronRight className="h-5 w-5 opacity-70 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onSelectDestination('handoff')}
                className="inline-flex items-center justify-center space-x-2 px-6 py-4 rounded-xl border border-border bg-base hover:bg-surface text-ink text-sm font-bold btn-press transition-colors cursor-pointer"
              >
                <span>Paramedic Handoff</span>
              </button>
            </div>

            {/* Quiet Disclaimer */}
            <p className="text-xs text-ink-muted/80 pt-1 leading-normal max-w-md">
              AHA 2020 & AIIMS Emergency Medicine compliant protocol engine.
            </p>
          </div>

          {/* Right Column: Emergency Action Matrix */}
          <div className="lg:col-span-5">
            <EmergencyActionMatrix
              onLaunchProtocol={(proto) => onStartRespond(proto)}
              onOpenHandoff={() => onSelectDestination('handoff')}
            />
          </div>
        </div>
      </section>

      {/* Two Balanced Smaller Entries: Library & Practice */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Entry: Library */}
        <button
          onClick={() => onSelectDestination('library')}
          className="group text-left p-6 rounded-2xl bg-surface border border-border hover:border-primary/40 hover:shadow-md transition-all btn-press flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                <BookOpen className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
                <Shield className="w-3 h-3 mr-1" />
                100% Offline
              </span>
            </div>
            <h2 className="text-xl font-bold text-ink mb-1">
              First-Aid Library
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Searchable offline encyclopedia with illustrated steps, "What NOT to Do" warnings, and direct live guides.
            </p>
          </div>

          <div className="mt-6 flex items-center text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
            <span>Browse encyclopedia</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </button>

        {/* Entry: Practice */}
        <button
          onClick={() => onSelectDestination('practice')}
          className="group text-left p-6 rounded-2xl bg-surface border border-border hover:border-primary/40 hover:shadow-md transition-all btn-press flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-ink group-hover:scale-105 transition-transform">
                <GraduationCap className="h-6 w-6 text-primary" strokeWidth={1.75} />
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-ink bg-accent/20 px-2.5 py-1 rounded-full">
                <Sparkles className="w-3 h-3 mr-1 text-accent" />
                Level: Safety Smart
              </span>
            </div>
            <h2 className="text-xl font-bold text-ink mb-1">
              Skill Practice & Quizzes
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Test your instincts with interactive "What would you do?" classroom scenarios and drill 110 BPM rhythmic CPR pacing.
            </p>
          </div>

          <div className="mt-6 flex items-center text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
            <span>Start scenario quiz</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </button>
      </section>

      {/* Paramedic Handoff Feature Banner */}
      <section className="rounded-3xl border border-border bg-gradient-to-r from-alert/10 via-surface to-accent/15 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-alert text-white shadow-xs">
            <FileText className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-ink">
                Black-Box Trauma Docket & Paramedic Handoff
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-alert/15 text-alert border border-alert/30">
                Encrypted QR Beacon
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-xl leading-relaxed">
              Eliminate pre-hospital data blindness. AI captures incident video, tracks real-time CPR telemetry, and generates an offline SBAR briefing for arriving EMS in 0.5 seconds.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectDestination('handoff')}
          className="shrink-0 inline-flex items-center space-x-2 px-5 py-3 rounded-xl btn-tactile-primary text-white text-xs font-bold transition-all cursor-pointer"
        >
          <span>Open Paramedic Handoff</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </section>
    </div>
  );
};
