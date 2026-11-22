import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  HeartPulse, 
  Sparkles, 
  FileText, 
  Mountain, 
  ShieldCheck, 
  Clock, 
  Users, 
  QrCode, 
  MapPin, 
  Pill, 
  Activity, 
  Camera,
  ChevronDown,
  Stethoscope,
  Building2,
  Check,
  X,
  Award,
  PhoneCall
} from 'lucide-react';
import { Destination } from '../../types';
import { CommunityReviewsSection } from './CommunityReviewsSection';

interface LandingPageProps {
  onStartRespond: (protocolId?: string) => void;
  onSelectDestination: (dest: Destination) => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onBackToDashboard?: () => void;
  onOpenCrowdModal?: () => void;
  onOpenRadar?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartRespond,
  onSelectDestination,
  onOpenAuth,
  onBackToDashboard,
  onOpenCrowdModal,
  onOpenRadar
}) => {
  // Category filter state for "Pre-Hospital Arsenal"
  const [activeCategory, setActiveCategory] = useState<'all' | 'cardiac' | 'trauma' | 'medicines' | 'crowd'>('all');

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Mobile Sticky Action Bar visibility (past hero)
  const [showMobileStickyBar, setShowMobileStickyBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setShowMobileStickyBar(window.scrollY > 420);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(prev => prev === index ? null : index);
  };

  const faqs = [
    {
      q: "Does RakshaSaathi work without internet in school basements or remote roads?",
      a: "Yes, 100%. RakshaSaathi is architected as an offline-first Progressive Web App (PWA). All 12 accredited clinical protocols, the 110 BPM audio metronome synthesizer, and the paramedic SBAR docket run locally in your browser memory without cell towers or Wi-Fi."
    },
    {
      q: "How does the AI Medical Camera guide CPR hand placement?",
      a: "The AI Medical Camera projects an interactive acoustic reticle directly onto the lower half of the victim's breastbone. It combines a Web Audio 110 BPM metronome beep with a live 5–6 cm compression depth meter. If webcam permissions are unavailable on stage, our instant Demo Patient mode renders an anatomical patient torso simulation."
    },
    {
      q: "Are PMBJP Jan Aushadhi generic medicines 100% chemically identical?",
      a: "Yes. Under CDSCO (Central Drugs Standard Control Organisation) guidelines, Jan Aushadhi generic medicines contain the identical active chemical salts, purity, and dosage as expensive branded equivalents. For example, generic Amoxy-Clav 625 costs ₹55 versus ₹210 for branded Augmentin—saving families 70% to 75% per strip."
    },
    {
      q: "Do crowd bystanders need to install an app to join the rescue squad?",
      a: "Zero app download and zero signup required. RakshaSaathi generates a high-density vector QR code locally. Any passerby points their normal phone camera at the screen and is instantly assigned a coordinated mission: dialing 112, clearing traffic, or fetching clean cloth."
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-50/50 dark:bg-base text-ink space-y-16 sm:space-y-20 lg:space-y-24 pb-24 sm:pb-20 animate-in fade-in duration-300">
      
      {/* Back to Dashboard Banner */}
      {onBackToDashboard && (
        <div className="bg-slate-100 dark:bg-surface border-b border-border/70 py-2.5 px-4 text-center">
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-primary dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <span>← Back to your Guardian Dashboard</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. HERO SECTION (Clean 2-Column Desktop / Stacked Mobile) */}
      {/* ======================================================== */}
      <section className="relative pt-4 sm:pt-6 lg:pt-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-surface border border-slate-200/90 dark:border-border/80 p-6 sm:p-10 lg:p-12 shadow-sm">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Narrative & Primary CTAs */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary dark:text-emerald-400">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                <span className="uppercase tracking-wider text-[11px] font-bold">
                  Pre-hospital Emergency Protocol Engine
                </span>
              </div>

              {/* Bold Display Heading (Clean, no dated highlighter) */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
                Protect Lives in the <span className="text-primary dark:text-emerald-400">Critical First 300 Seconds.</span>
              </h1>

              {/* 2-Line Plain-Language Subhead */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl font-normal">
                When someone collapses, ambulances take 15–20 minutes. RakshaSaathi gives anyone with a phone the step-by-step guidance to keep them alive until paramedics arrive.
              </p>

              {/* 2 Distinct CTAs (Primary 48px + Secondary Outline) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1">
                <button
                  onClick={() => onSelectDestination('chat')}
                  className="h-12 px-7 sm:px-8 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-sm sm:text-base shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
                >
                  <Zap className="w-4.5 h-4.5 text-accent" />
                  <span>Launch AI Guardian</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  onClick={() => onSelectDestination('camera')}
                  className="h-12 px-6 sm:px-7 rounded-full border border-slate-300 dark:border-border bg-white dark:bg-surface text-slate-800 dark:text-white font-bold text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-2xs transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <Camera className="w-4.5 h-4.5 text-primary dark:text-emerald-400" />
                  <span>Open AI Medical Camera</span>
                </button>
              </div>

              {/* School Credit Line */}
              <div className="pt-1 flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-primary dark:text-emerald-400 shrink-0" />
                <span className="leading-snug">
                  Created at Seth M.R. Jaipuria School, Lucknow · T4 Education Top 10 Community Collaboration
                </span>
              </div>

            </div>

            {/* Right Column: Rapid Response Cockpit (Clean High-Fidelity App Preview Card) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-border p-5 sm:p-6 space-y-4 shadow-2xs">
                
                {/* Cockpit Card Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-border/70 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary dark:text-emerald-400">
                      <HeartPulse className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Rapid Response Cockpit
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        1-Tap Emergency Field Instruments
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                    <span>PWA READY</span>
                  </span>
                </div>

                {/* Subtle ECG Heartbeat Pulse SVG Wave */}
                <div className="h-6 w-full overflow-hidden flex items-center px-1 text-primary/70 dark:text-emerald-400/80">
                  <svg className="w-full h-5" viewBox="0 0 320 20" fill="none" preserveAspectRatio="none">
                    <path
                      d="M0 10 L50 10 L60 4 L70 16 L80 10 L140 10 L150 2 L160 18 L170 10 L240 10 L250 5 L260 15 L270 10 L320 10"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-ecg-pulse"
                    />
                  </svg>
                </div>

                {/* 2×2 Grid of Key Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onStartRespond('unconscious')}
                    className="p-3.5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-border hover:border-primary/50 text-left transition-all duration-200 cursor-pointer group space-y-1 shadow-2xs hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <HeartPulse className="w-4 h-4 text-primary dark:text-emerald-400" />
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary dark:text-emerald-400">110 BPM</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-emerald-400 transition-colors">
                      Adult CPR Guide
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Audio metronome + reticle
                    </p>
                  </button>

                  <button
                    onClick={() => onSelectDestination('camera')}
                    className="p-3.5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-border hover:border-primary/50 text-left transition-all duration-200 cursor-pointer group space-y-1 shadow-2xs hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <Camera className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">VISION AI</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      Wound & Rx Scan
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Optical triage & strip OCR
                    </p>
                  </button>

                  <button
                    onClick={() => onSelectDestination('medicines')}
                    className="p-3.5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-border hover:border-primary/50 text-left transition-all duration-200 cursor-pointer group space-y-1 shadow-2xs hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <Pill className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">-75% MRP</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Jan Aushadhi Meds
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Exact generic salt matches
                    </p>
                  </button>

                  <button
                    onClick={() => onSelectDestination('handoff')}
                    className="p-3.5 rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-border hover:border-primary/50 text-left transition-all duration-200 cursor-pointer group space-y-1 shadow-2xs hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">0.5s SYNC</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      SBAR Trauma QR
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Offline 108/112 EMS docket
                    </p>
                  </button>
                </div>

                {/* Full-Width Red Action Button at Bottom */}
                {onOpenCrowdModal && (
                  <button
                    onClick={onOpenCrowdModal}
                    className="w-full py-3 px-4 rounded-xl bg-alert hover:bg-red-700 text-white text-xs font-bold flex items-center justify-between shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-alert/40"
                  >
                    <span className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Deploy Bystander Crowd Squad</span>
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. STATS STRIP & 3. TRUST ROW (Clean Horizontal Cards)   */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-4">
        
        {/* 4 Metric Blocks */}
        <div className="rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border p-6 shadow-xs">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:divide-x divide-slate-200 dark:divide-border/60">
            
            {/* Stat 1: 04:00 Mins */}
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Brain Window</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                04:00 Mins
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                Permanent cerebral hypoxia begins without blood flow.
              </p>
            </div>

            {/* Stat 2: 110 BPM */}
            <div className="space-y-1 lg:pl-6">
              <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:text-emerald-400">
                <HeartPulse className="w-3.5 h-3.5 shrink-0" />
                <span>CPR Cadence</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                110 BPM
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                Optimal chest compression rate for cardiac perfusion.
              </p>
            </div>

            {/* Stat 3: 100% Offline */}
            <div className="space-y-1 lg:pl-6">
              <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Zero Signal</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                100% Offline
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                Runs in basements, sports grounds & remote highways.
              </p>
            </div>

            {/* Stat 4: 70% – 75% Savings */}
            <div className="space-y-1 lg:pl-6">
              <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Pill className="w-3.5 h-3.5 shrink-0" />
                <span>Jan Aushadhi</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                70%–75%
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                Save ~₹155 per strip on generic Augmentin 625.
              </p>
            </div>

          </div>
        </div>

        {/* Trust Badges Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 py-3 px-4 rounded-xl bg-white dark:bg-surface/60 border border-slate-200 dark:border-border text-xs text-slate-600 dark:text-slate-300 font-medium">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>AHA 2020 Guidelines</span>
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-border">•</span>
          <span className="flex items-center space-x-1.5">
            <Stethoscope className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>AIIMS Emergency Protocols</span>
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-border">•</span>
          <span className="flex items-center space-x-1.5">
            <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>PMBJP Jan Aushadhi Verified</span>
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-border">•</span>
          <span className="flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>CDSCO Bio-Equivalent Standards</span>
          </span>
        </div>

      </section>

      {/* ======================================================== */}
      {/* 4. PURPOSE QUOTE (Calm Callout with Left Accent Border)  */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border border-l-4 border-l-primary p-6 sm:p-8 shadow-xs space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-primary dark:text-emerald-400">
            <Mountain className="w-4 h-4" />
            <span>THE PURPOSE OF RAKSHASAATHI</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Lifting the Mountain of Medical Panic
          </h2>
          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            "In the Ramayana, Hanuman could not identify which herb would save Lakshmana, so he lifted the entire Mount Dronagiri. RakshaSaathi lifts the mountain of medical panic off your shoulders — turning complex clinical protocols into simple, 1-2-3 actions anyone can execute."
          </p>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. THE 4 PILLARS (Dark Section: Slate-950)               */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="rounded-3xl bg-slate-950 border border-slate-800 p-8 sm:p-12 lg:p-14 text-white shadow-md relative overflow-hidden space-y-8">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              CLINICAL RESUSCITATION INTELLIGENCE
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              The Four Pillars of Pre-Hospital Care
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every second from collapse to hospital handoff is deterministically guided with zero guesswork.
            </p>
          </div>

          {/* 4 Equal-Height Dark Glass Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Pillar 1: AI Guardian */}
            <div 
              onClick={() => onSelectDestination('chat')}
              className="p-6 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  AI Guardian Triage
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hands-free voice triage, red-flag detection, and instant 1-2-3 steps with strict contraindications.
                </p>
              </div>
              <div className="text-xs font-semibold text-emerald-400 flex items-center space-x-1 pt-2">
                <span>Start Triage</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Pillar 2: AI Medical Camera */}
            <div 
              onClick={() => onSelectDestination('camera')}
              className="p-6 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sky-400">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                  AI Medical Camera
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  110 BPM audio-visual metronome, sternum reticle, 5–6 cm depth guide, and demo-patient simulation.
                </p>
              </div>
              <div className="text-xs font-semibold text-sky-400 flex items-center space-x-1 pt-2">
                <span>Open Camera</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Pillar 3: Reality Check Engine */}
            <div 
              onClick={() => onSelectDestination('mythbuster')}
              className="p-6 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Reality Check Engine
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tests WhatsApp folklore (toothpaste on burns, raw haldi, keys in seizures) against AIIMS protocols.
                </p>
              </div>
              <div className="text-xs font-semibold text-amber-400 flex items-center space-x-1 pt-2">
                <span>Bust Myths</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Pillar 4: Jan Aushadhi Finder */}
            <div 
              onClick={() => onSelectDestination('medicines')}
              className="p-6 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-400">
                  <Pill className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Jan Aushadhi Finder
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Maps expensive branded prescriptions to identical-salt generic medicines saving 70–85%.
                </p>
              </div>
              <div className="text-xs font-semibold text-indigo-400 flex items-center space-x-1 pt-2">
                <span>Find Generics</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>

          {/* Full-Width Bystander Squad & Paramedic SBAR Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-accent shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">
                  Zero-Download Bystander Squad QR & Paramedic SBAR
                </span>
                <span className="text-xs text-slate-400">
                  Passersby scan to divide tasks; arriving 112 paramedics scan in 0.5s without Wi-Fi.
                </span>
              </div>
            </div>
            {onOpenCrowdModal && (
              <button
                onClick={onOpenCrowdModal}
                className="px-5 py-2.5 rounded-full bg-accent hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs whitespace-nowrap cursor-pointer transition-colors shrink-0"
              >
                Generate Crowd QR
              </button>
            )}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. PRE-HOSPITAL ARSENAL (Tool Tabs & Feature Grid)       */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
        
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-emerald-400">
            EVERYTHING YOU NEED
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            The Complete Pre-Hospital Arsenal
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Engineered with zero fluff so rescuers never freeze during critical moments.
          </p>
        </div>

        {/* Clean Segmented Control Tabs (No wrapping or clipping) */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-100 dark:bg-surface border border-slate-200 dark:border-border overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Tools
            </button>
            <button
              onClick={() => setActiveCategory('cardiac')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === 'cardiac'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Resuscitation & CPR
            </button>
            <button
              onClick={() => setActiveCategory('trauma')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === 'trauma'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Trauma & Burns
            </button>
            <button
              onClick={() => setActiveCategory('medicines')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === 'medicines'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Medicines & Savings
            </button>
            <button
              onClick={() => setActiveCategory('crowd')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === 'crowd'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Crowd Response
            </button>
          </div>
        </div>

        {/* 3-Column Tool Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          
          {/* Card 1: Optical Wound Evaluation */}
          {(activeCategory === 'all' || activeCategory === 'trauma') && (
            <div className="p-6 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-border px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-400">
                  Wound Scan
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Optical Wound Evaluation</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Evaluates skin tears, bleeding, and burn depth with a built-in false alarm filter that prevents fake AI injury hallucinations.
              </p>
            </div>
          )}

          {/* Card 2: CPR Visual Metronome */}
          {(activeCategory === 'all' || activeCategory === 'cardiac') && (
            <div className="p-6 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary dark:text-emerald-400 flex items-center justify-center">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-border px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-400">
                  110 BPM HUD
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">CPR Visual Metronome</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Emits an audible 110 BPM metronome while animating concentric shockwaves and a 5–6 cm compression depth meter directly on screen.
              </p>
            </div>
          )}

          {/* Card 3: OCR Strip & Script Scanner */}
          {(activeCategory === 'all' || activeCategory === 'medicines') && (
            <div className="p-6 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Pill className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-border px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-400">
                  Prescription OCR
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">OCR Strip & Script Scanner</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Deciphers unreadable doctor handwriting and matches active chemical salts to government Jan Aushadhi generic equivalents.
              </p>
            </div>
          )}

          {/* Card 4: Bystander Squad QR */}
          {(activeCategory === 'all' || activeCategory === 'crowd') && (
            <div className="p-6 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-border px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-400">
                  Zero Download
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Bystander Squad QR</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Breaks crowd paralysis by assigning tasks (112 caller, traffic controller, first-aid runner) to bystanders via an ordinary camera scan.
              </p>
            </div>
          )}

          {/* Card 5: Paramedic SBAR Docket */}
          {(activeCategory === 'all' || activeCategory === 'cardiac') && (
            <div className="p-6 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-border px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-400">
                  0.5s Transfer
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Paramedic SBAR Docket</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Compiles Situation, Background, Assessment, and vitals into an offline QR docket that 108/112 ambulance staff scan in 0.5 seconds.
              </p>
            </div>
          )}

          {/* Card 6: Hospital & AED Radar */}
          {(activeCategory === 'all' || activeCategory === 'medicines') && (
            <div className="p-6 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-border px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-400">
                  Geo-Radar
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Hospital & AED Radar</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Doorstep GPS mapping showing verified trauma centers, real driving times, and direct 1-tap emergency dialers across Indian cities.
              </p>
            </div>
          )}

        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. FOLKLORE VS MEDICAL PROTOCOL (Side-by-Side Cards)     */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
        
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            CLINICAL REALITY CHECK
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Folklore vs. Accredited Medical Protocol
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Dangerous home remedies vs. what emergency physicians actually recommend.
          </p>
        </div>

        {/* 3 Unified Side-by-Side Comparison Cards */}
        <div className="space-y-4">
          
          {/* Example 1: Burns */}
          <div className="rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border p-5 sm:p-6 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Myth Left */}
              <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-2">
                <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400">
                  <X className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">Folklore Myth: Toothpaste or Butter on Burns</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  Applying white toothpaste, butter, or raw haldi because the menthol feels cold. This creates an airtight barrier that traps thermal heat deep in tissue, worsening destruction and introducing severe infection risks.
                </p>
              </div>

              {/* Protocol Right */}
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">AIIMS / AHA Protocol: Cool Running Tap Water</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  Hold under gentle, cool running tap water for 15 to 20 minutes continuously. Never apply ice. Cover loosely with a sterile, non-adherent film or clean dry cloth and elevate the limb.
                </p>
              </div>
            </div>
          </div>

          {/* Example 2: Snakebites */}
          <div className="rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border p-5 sm:p-6 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Myth Left */}
              <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-2">
                <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400">
                  <X className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">Folklore Myth: Cutting, Sucking or Tight Tourniquets</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  Slashing the bite mark with blades, sucking venom by mouth, or tying tight ropes. Cutting damages vital blood vessels; tight tourniquets cause total ischemia, leading to gangrene and limb amputation.
                </p>
              </div>

              {/* Protocol Right */}
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">AIIMS / WHO Protocol: Pressure Immobilization</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  Keep patient calm and completely immobilize the bitten limb below heart level using a splint and broad bandage (as for a sprain). Transport immediately to a hospital stocked with Anti-Snake Venom (ASV).
                </p>
              </div>
            </div>
          </div>

          {/* Example 3: Seizures */}
          <div className="rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border p-5 sm:p-6 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Myth Left */}
              <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-2">
                <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400">
                  <X className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">Folklore Myth: Metal Keys, Spoons or Restraint</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  Forcing iron keys into convulsing palms or prying teeth open with metal spoons to "prevent tongue biting". Forcing objects breaks teeth, fractures jaws, and triggers fatal airway obstruction.
                </p>
              </div>

              {/* Protocol Right */}
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">Neurological Protocol: Protect & Recovery Position</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  Clear hard and sharp objects. Cushion head with folded jacket, time the seizure, and do not restrain. Once jerking stops, roll gently onto their side (recovery position) to keep the airway clear.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. CARE CONTINUUM (Horizontal / Vertical Timeline)       */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
        
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-emerald-400">
            CARE CONTINUUM
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How Care Flows in the First 5 Minutes
          </h2>
        </div>

        <div className="rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border p-6 sm:p-8 lg:p-10 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            
            {/* Step 1 */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-border/60">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs shrink-0">
                  01
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-emerald-400">
                  00:00 — RECOGNITION
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Voice, Text or Optical Triage
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Triage airway patency, bleeding, and consciousness in under 2 seconds hands-free.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-border/60">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  02
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  00:30 — MOBILIZATION
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                110 BPM CPR & Crowd Tasks
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Locked chest compression audio cadence while onlookers scan Crowd QR to fetch AEDs.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-border/60">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  03
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  04:30 — HANDOVER
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                0.5s Paramedic SBAR Docket
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ambulance crew scans complete offline vitals telemetry instantly without screaming.
              </p>
            </div>

          </div>
        </div>

      </section>

      {/* ======================================================== */}
      {/* 9. COMMUNITY REVIEWS & STORIES                           */}
      {/* ======================================================== */}
      <CommunityReviewsSection />

      {/* ======================================================== */}
      {/* 10. FAQ ACCORDION SECTION (Clear Affordance & Focus)    */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
        
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-emerald-400">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Everything You Need to Know
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full py-4 sm:py-5 px-5 sm:px-6 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-inset"
                aria-expanded={openFaq === idx}
              >
                <span className="leading-snug">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${openFaq === idx ? 'transform rotate-180 text-primary dark:text-emerald-400' : 'text-slate-400'}`} />
              </button>
              {openFaq === idx && (
                <div className="px-5 sm:px-6 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-border/60 pt-3.5 font-normal">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

      </section>

      {/* ======================================================== */}
      {/* 11. FINAL HIGH-CONTRAST CTA BANNER                       */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-primary text-white p-8 sm:p-14 text-center space-y-6 shadow-lg">
          
          <div className="inline-block px-3.5 py-1 rounded-full bg-white/10 text-white text-xs font-bold tracking-wider uppercase border border-white/20">
            Pre-Hospital Safety Network
          </div>
          
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Ready to Protect Your School & Family?
          </h2>
          
          <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed font-normal">
            Open RakshaSaathi instantly on any smartphone, tablet, or laptop. 100% free, 100% offline-resilient.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 max-w-md sm:max-w-none mx-auto">
            <button
              onClick={() => onSelectDestination('chat')}
              className="h-12 px-8 rounded-full bg-white text-primary font-bold text-sm sm:text-base shadow-sm hover:bg-slate-100 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <span>Launch AI Guardian</span>
            </button>
            <button
              onClick={() => onSelectDestination('camera')}
              className="h-12 px-7 rounded-full border border-white/40 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold backdrop-blur-md cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <span>Open AI Medical Camera</span>
            </button>
          </div>

          <p className="text-xs text-white/70 pt-1 font-medium">
            No install required · Works offline · Zero signup needed for emergencies
          </p>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 12. CLEAN 4-COLUMN FOOTER (No Text Collision)            */}
      {/* ======================================================== */}
      <footer className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pt-10 border-t border-slate-200 dark:border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 text-xs">
          
          {/* Col 1: Brand & Attribution */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">RakshaSaathi</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:text-emerald-400">v2.0</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              The Pre-Hospital Digital Nervous System designed for Indian schools, teachers, and everyday families.
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">
              Seth M.R. Jaipuria School, Lucknow · Kaleidoscope 2025–26
            </p>
          </div>

          {/* Col 2: Instruments */}
          <div className="space-y-2.5">
            <span className="font-bold text-slate-900 dark:text-white block uppercase tracking-wider text-[11px]">
              Instruments
            </span>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400 font-medium">
              <li><button onClick={() => onSelectDestination('chat')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">AI Guardian Triage</button></li>
              <li><button onClick={() => onSelectDestination('camera')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">AI Medical Camera</button></li>
              <li><button onClick={() => onSelectDestination('remedies')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer text-emerald-600 dark:text-emerald-400 font-bold">🌿 Home Remedies & Substitutes</button></li>
              <li><button onClick={() => onSelectDestination('mythbuster')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">MythBuster Engine</button></li>
              <li><button onClick={() => onSelectDestination('medicines')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">Cheap Medicines Finder</button></li>
            </ul>
          </div>

          {/* Col 3: Protocols */}
          <div className="space-y-2.5">
            <span className="font-bold text-slate-900 dark:text-white block uppercase tracking-wider text-[11px]">
              Protocols
            </span>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400 font-medium">
              <li><button onClick={() => onStartRespond('unconscious')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">Adult CPR (110 BPM)</button></li>
              <li><button onClick={() => onStartRespond('bleeding')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">Arterial Bleeding</button></li>
              <li><button onClick={() => onStartRespond('burns')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">Thermal Burns</button></li>
              <li><button onClick={() => onStartRespond('choking')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">Choking Relief</button></li>
            </ul>
          </div>

          {/* Col 4: Account & SOS */}
          <div className="space-y-2.5">
            <span className="font-bold text-slate-900 dark:text-white block uppercase tracking-wider text-[11px]">
              Account & SOS
            </span>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400 font-medium">
              <li><button onClick={() => onOpenAuth('signin')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">Sign In</button></li>
              <li><button onClick={() => onOpenAuth('signup')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">Create Account</button></li>
              <li><button onClick={() => onSelectDestination('handoff')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">Paramedic Docket</button></li>
              <li><span className="text-emerald-600 dark:text-emerald-400 font-semibold">PWA Offline Cache Active</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom Legal & Disclaimer */}
        <div className="py-6 border-t border-slate-200 dark:border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-500 dark:text-slate-400">
          <span>© 2026 RakshaSaathi v2.0 • Seth M.R. Jaipuria School Innovation.</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            First-aid guidance only. In serious emergencies, always dial 112 immediately.
          </span>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* 13. BOTTOM PADDING FOR FLOATING PROMPT BAR               */}
      {/* ======================================================== */}
      <div className="h-16 sm:h-20" aria-hidden="true" />

    </div>
  );
};
