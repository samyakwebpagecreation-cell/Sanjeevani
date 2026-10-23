import React, { useState } from 'react';
import { 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  HeartPulse, 
  Sparkles, 
  FileText, 
  Mountain, 
  ShieldCheck, 
  Clock, 
  Flame, 
  Droplet, 
  Users, 
  QrCode, 
  MapPin, 
  Pill, 
  Activity, 
  Wind, 
  Camera,
  ChevronDown,
  HelpCircle,
  Stethoscope,
  Building2,
  Check,
  Award,
  Layers
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
  // Category filter state for "Everything You Need" section
  const [activeCategory, setActiveCategory] = useState<'all' | 'cardiac' | 'trauma' | 'medicines' | 'crowd'>('all');

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(prev => prev === index ? null : index);
  };

  const faqs = [
    {
      q: "Does Sanjeevani work without internet in school basements or remote roads?",
      a: "Yes, 100%. Sanjeevani is architected as an offline-first Progressive Web App (PWA). All 12 accredited clinical protocols, the 110 BPM audio metronome synthesizer, and the paramedic SBAR docket run locally in your browser memory without cell towers or Wi-Fi."
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
      a: "Zero app download and zero signup required. Sanjeevani generates a high-density vector QR code locally. Any passerby points their normal phone camera at the screen and is instantly assigned a coordinated mission: dialing 112, clearing traffic, or fetching clean cloth."
    }
  ];

  return (
    <div className="relative min-h-screen bg-base text-ink space-y-16 sm:space-y-24 pb-20 animate-in fade-in duration-300 overflow-hidden">
      
      {onBackToDashboard && (
        <div className="bg-accent/15 border-b border-accent/30 py-2.5 px-4 text-center">
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center space-x-2 text-xs font-bold text-ink hover:underline cursor-pointer"
          >
            <span>← Back to your Guardian Dashboard</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. LUMINOUS WARM CELESTIAL HERO WITH ADAPTIVE BENTO      */}
      {/* ======================================================== */}
      <section className="relative pt-3 sm:pt-6 lg:pt-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div
          data-component="hero-card"
          style={{ backgroundColor: '#FFFDF5', color: '#0F172A' }}
          className="hero-light-surface relative overflow-hidden rounded-[28px] sm:rounded-[40px] lg:rounded-[48px] bg-[#FFFDF5] bg-gradient-to-b from-[#FFFDF5] via-[#FEF9E7] to-[#F1F8F6] border border-slate-200/90 p-5 sm:p-10 md:p-12 lg:p-14 xl:p-16 shadow-xl"
        >
          
          {/* Luminous Celestial Sun / Orb (Top-Right Gradient Halo) */}
          <div className="absolute -top-16 -right-16 sm:-top-24 sm:-right-24 w-64 h-64 sm:w-[480px] sm:h-[480px] rounded-full bg-gradient-to-br from-[#FDE68A]/60 via-[#F0A85B]/35 to-[#0E5A50]/15 blur-3xl pointer-events-none animate-pulse duration-1000" />
          
          {/* Soft Teal Atmospheric Mist at Bottom */}
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#0E5A50]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-10 items-center">
            
            {/* Left Column: Narrative & Primary CTAs */}
            <div className="xl:col-span-7 space-y-5 sm:space-y-6">
              
              {/* Top Pill Announcement Badge (Unclipped & High Contrast) */}
              <div
                style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
                className="inline-flex flex-wrap sm:flex-nowrap items-center gap-x-2 gap-y-1 px-3.5 sm:px-4 py-1.5 rounded-full bg-white border border-slate-200/90 text-xs font-bold text-[#0F172A] shadow-xs max-w-full"
              >
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                <span
                  style={{ color: '#0E5A50' }}
                  className="text-[#0E5A50] font-extrabold uppercase tracking-wider text-[10px] sm:text-[11px] whitespace-nowrap"
                >
                  Pre-Hospital Digital Nervous System
                </span>
                <span className="text-slate-400 hidden sm:inline">•</span>
                <span
                  style={{ color: '#334155' }}
                  className="text-[#334155] text-[11px] hidden sm:inline font-bold whitespace-nowrap"
                >
                  Built on AHA 2020 & AIIMS Guidelines
                </span>
              </div>

              {/* Fluid Editorial Headline with Warm Amber Highlight Box */}
              <h1
                style={{ color: '#12211D' }}
                className="hero-title-text fluid-hero-title font-extrabold tracking-tight !text-[#12211D]"
              >
                Protect Lives in the <br />
                <span className="relative inline-block mt-1 sm:mt-2">
                  <span className="absolute inset-0 bg-gradient-to-r from-[#FDE68A] via-[#FCD34D] to-[#FBBF24]/80 rounded-xl sm:rounded-3xl transform -rotate-1 scale-105 opacity-90 shadow-sm" />
                  <span
                    style={{ color: '#0F172A' }}
                    className="relative !text-[#0F172A] font-black px-2 sm:px-3 py-0.5"
                  >
                    Critical First 300 Seconds.
                  </span>
                </span>
              </h1>

              {/* Clear Value Narrative - Guaranteed High Contrast Dark Slate */}
              <p
                style={{ color: '#0F172A' }}
                className="hero-body-text text-sm sm:text-base lg:text-lg !text-[#0F172A] leading-relaxed max-w-2xl font-bold"
              >
                When someone collapses, sirens are 15 minutes away in traffic. Sanjeevani turns helpless panic into calm, life-saving instincts with instant AI triage, 110 BPM guided CPR, cheap generic medicine savings, and zero-download crowd dispatch.
              </p>

              {/* Dual CTA Buttons - Full width on mobile, inline on sm+ */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1">
                <button
                  onClick={() => onSelectDestination('chat')}
                  className="w-full sm:w-auto justify-center inline-flex items-center space-x-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-primary hover:bg-primary-dark text-white font-black text-sm sm:text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                >
                  <Zap className="w-5 h-5 text-accent animate-pulse shrink-0" />
                  <span style={{ color: '#FFFFFF' }}>Launch AI Guardian</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  onClick={() => onSelectDestination('camera')}
                  style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
                  className="w-full sm:w-auto justify-center inline-flex items-center space-x-2 px-6 sm:px-7 py-3.5 sm:py-4 rounded-full bg-white hover:bg-slate-50 !text-[#0F172A] border-2 border-slate-300 font-black text-sm sm:text-base shadow-md transition-all duration-200 cursor-pointer"
                >
                  <Camera className="w-4.5 h-4.5 text-primary shrink-0" />
                  <span style={{ color: '#0F172A' }} className="hero-body-text !text-[#0F172A] font-black">
                    Open AI Medical Camera
                  </span>
                </button>
              </div>

              {/* Social Trust Line */}
              <div
                style={{ color: '#1E293B' }}
                className="hero-trust-text pt-1 flex items-center space-x-2.5 sm:space-x-3 text-[11px] sm:text-xs !text-[#1E293B]"
              >
                <div className="flex -space-x-1.5 shrink-0">
                  <div className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">S</div>
                  <div className="w-6 h-6 rounded-full bg-accent text-[#0F172A] text-[10px] font-bold flex items-center justify-center ring-2 ring-white">J</div>
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">K</div>
                </div>
                <span
                  style={{ color: '#1E293B' }}
                  className="hero-trust-text font-bold !text-[#1E293B] leading-snug"
                >
                  Built for students, teachers & families across India • Seth M.R. Jaipuria School
                </span>
              </div>

            </div>

            {/* Right Column: Adaptive Quick-Launch Command Cockpit (Visible on xl+ desktops so wide screens feel balanced and never empty) */}
            <div className="hidden xl:block xl:col-span-5">
              <div
                style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
                className="rounded-3xl bg-white/95 backdrop-blur-xl border-2 border-slate-200/90 p-6 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-primary/15 text-primary">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div>
                      <span style={{ color: '#0F172A' }} className="text-xs font-black !text-[#0F172A] block">
                        Rapid Response Cockpit
                      </span>
                      <span style={{ color: '#475569' }} className="text-[10px] font-bold !text-[#475569]">
                        1-Tap Emergency Field Instruments
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 text-[10px] font-mono font-black border border-emerald-500/30">
                    PWA READY
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onStartRespond('unconscious')}
                    style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-primary/50 text-left transition-all cursor-pointer group space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <HeartPulse className="w-4 h-4 text-primary" />
                      <span className="text-[9px] font-mono font-black text-primary">110 BPM</span>
                    </div>
                    <div style={{ color: '#0F172A' }} className="text-xs font-black !text-[#0F172A] group-hover:text-primary">
                      Adult CPR Guide
                    </div>
                    <p style={{ color: '#475569' }} className="text-[10px] !text-[#475569] font-semibold leading-tight">
                      Audio metronome + sternum reticle
                    </p>
                  </button>

                  <button
                    onClick={() => onSelectDestination('camera')}
                    style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50/70 border border-slate-200 hover:border-sky-500/50 text-left transition-all cursor-pointer group space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <Camera className="w-4 h-4 text-sky-600" />
                      <span className="text-[9px] font-mono font-black text-sky-700">VISION AI</span>
                    </div>
                    <div style={{ color: '#0F172A' }} className="text-xs font-black !text-[#0F172A] group-hover:text-sky-700">
                      Wound & Rx Scan
                    </div>
                    <p style={{ color: '#475569' }} className="text-[10px] !text-[#475569] font-semibold leading-tight">
                      Optical triage & strip OCR
                    </p>
                  </button>

                  <button
                    onClick={() => onSelectDestination('medicines')}
                    style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-500/50 text-left transition-all cursor-pointer group space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <Pill className="w-4 h-4 text-amber-700" />
                      <span className="text-[9px] font-mono font-black text-amber-800">-75% MRP</span>
                    </div>
                    <div style={{ color: '#0F172A' }} className="text-xs font-black !text-[#0F172A] group-hover:text-amber-800">
                      Jan Aushadhi Meds
                    </div>
                    <p style={{ color: '#475569' }} className="text-[10px] !text-[#475569] font-semibold leading-tight">
                      Exact generic salt substitutes
                    </p>
                  </button>

                  <button
                    onClick={() => onSelectDestination('handoff')}
                    style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-purple-50/70 border border-slate-200 hover:border-purple-500/50 text-left transition-all cursor-pointer group space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <QrCode className="w-4 h-4 text-purple-700" />
                      <span className="text-[9px] font-mono font-black text-purple-800">0.5s SYNC</span>
                    </div>
                    <div style={{ color: '#0F172A' }} className="text-xs font-black !text-[#0F172A] group-hover:text-purple-700">
                      SBAR Trauma QR
                    </div>
                    <p style={{ color: '#475569' }} className="text-[10px] !text-[#475569] font-semibold leading-tight">
                      Offline 108/112 EMS docket
                    </p>
                  </button>
                </div>

                {onOpenCrowdModal && (
                  <button
                    onClick={onOpenCrowdModal}
                    className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#0E5A50] to-emerald-800 hover:from-[#0A4740] hover:to-emerald-900 text-white text-xs font-black flex items-center justify-between shadow-sm transition-all cursor-pointer"
                  >
                    <span className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-accent" />
                      <span style={{ color: '#FFFFFF' }}>Deploy Bystander Crowd Squad QR</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-accent" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. THE 4-CARD FLOATING METRIC RIBBON                     */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-4 sm:-mt-10 relative z-20">
        <div className="rounded-3xl bg-white dark:bg-surface border border-slate-200 dark:border-border/80 p-3.5 sm:p-7 shadow-lg">
          <div className="scroll-stagger grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:divide-x divide-slate-200 dark:divide-border/60">
            
            {/* Stat 1: 04:00 Mins */}
            <div className="p-3.5 sm:p-4 rounded-2xl lg:rounded-none bg-slate-50/80 lg:bg-transparent dark:bg-slate-900/40 lg:dark:bg-transparent border border-slate-200/70 lg:border-0 dark:border-border/50 space-y-1">
              <div className="flex items-center space-x-1.5 sm:space-x-2 text-rose-700 dark:text-rose-400">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider truncate">Brain Window</span>
              </div>
              <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">04:00 Mins</div>
              <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 font-semibold leading-snug">Permanent cerebral hypoxia begins without blood flow.</p>
            </div>

            {/* Stat 2: 110 BPM */}
            <div className="p-3.5 sm:p-4 rounded-2xl lg:rounded-none bg-slate-50/80 lg:bg-transparent dark:bg-slate-900/40 lg:dark:bg-transparent border border-slate-200/70 lg:border-0 dark:border-border/50 space-y-1 lg:pl-6">
              <div className="flex items-center space-x-1.5 sm:space-x-2 text-primary dark:text-emerald-400">
                <HeartPulse className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider truncate">CPR Cadence</span>
              </div>
              <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">110 BPM</div>
              <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 font-semibold leading-snug">Optimal chest compression rate for cardiac perfusion.</p>
            </div>

            {/* Stat 3: 100% Offline */}
            <div className="p-3.5 sm:p-4 rounded-2xl lg:rounded-none bg-slate-50/80 lg:bg-transparent dark:bg-slate-900/40 lg:dark:bg-transparent border border-slate-200/70 lg:border-0 dark:border-border/50 space-y-1 lg:pl-6">
              <div className="flex items-center space-x-1.5 sm:space-x-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider truncate">Zero Signal</span>
              </div>
              <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">100% Offline</div>
              <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 font-semibold leading-snug">Runs in basements, sports grounds & remote highways.</p>
            </div>

            {/* Stat 4: 70% – 75% Savings */}
            <div className="p-3.5 sm:p-4 rounded-2xl lg:rounded-none bg-slate-50/80 lg:bg-transparent dark:bg-slate-900/40 lg:dark:bg-transparent border border-slate-200/70 lg:border-0 dark:border-border/50 space-y-1 lg:pl-6">
              <div className="flex items-center space-x-1.5 sm:space-x-2 text-amber-800 dark:text-amber-400">
                <Pill className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider truncate">Jan Aushadhi</span>
              </div>
              <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">70% – 75%</div>
              <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 font-semibold leading-snug">Save ~₹155 per strip on generic Augmentin 625.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. ACCREDITATIONS & TRUSTED STANDARDS STRIP */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 py-4 px-6 rounded-2xl bg-white dark:bg-surface/60 border border-slate-200 dark:border-border/70 text-xs font-black shadow-2xs">
          <span className="flex items-center space-x-1.5 text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-primary dark:text-emerald-400" />
            <span>Built on AHA 2020 Guidelines</span>
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-border">•</span>
          <span className="flex items-center space-x-1.5 text-slate-900 dark:text-white">
            <Stethoscope className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>AIIMS Emergency Protocols</span>
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-border">•</span>
          <span className="flex items-center space-x-1.5 text-slate-900 dark:text-white">
            <Building2 className="w-4 h-4 text-amber-800 dark:text-amber-400" />
            <span>PMBJP Jan Aushadhi Verified</span>
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-border">•</span>
          <span className="flex items-center space-x-1.5 text-slate-900 dark:text-white">
            <Award className="w-4 h-4 text-sky-700 dark:text-sky-400" />
            <span>CDSCO Bio-Equivalent Standards</span>
          </span>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. LUMINOUS HERO PHILOSOPHY BANNER (THE RAMAYANA SOUL) */}
      {/* ======================================================== */}
      <section className="scroll-reveal scroll-reveal-scale px-4 sm:px-6 max-w-7xl mx-auto">
        <div
          style={{ backgroundColor: '#FEF3C7', color: '#0F172A' }}
          className="hero-light-surface relative overflow-hidden rounded-[32px] bg-[#FEF3C7] bg-gradient-to-r from-[#FEF3C7] via-[#ECFDF5] to-[#E0F2FE] border-2 border-amber-400/60 p-7 sm:p-10 shadow-md hover-lift-card"
        >
          <div className="max-w-3xl space-y-3.5">
            <div
              style={{ backgroundColor: '#FFFFFF', color: '#0E5A50' }}
              className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white text-xs font-black !text-[#0E5A50] border border-amber-400/50 shadow-xs"
            >
              <Mountain className="w-4 h-4 text-amber-800" />
              <span style={{ color: '#0E5A50' }} className="tracking-wide uppercase text-[11px] font-black !text-[#0E5A50]">
                THE PURPOSE OF SANJEEVANI
              </span>
            </div>
            <h2
              style={{ color: '#0E5A50' }}
              className="text-2xl sm:text-3xl lg:text-4xl font-black !text-[#0E5A50] tracking-tight leading-snug"
            >
              Lifting the Mountain of Medical Panic
            </h2>
            <p
              style={{ color: '#0F172A' }}
              className="hero-body-text text-base sm:text-lg !text-[#0F172A] leading-relaxed font-extrabold"
            >
              "In the Ramayana, Hanuman couldn't decipher thousands of herbs on Mount Dronagiri, so he lifted the entire mountain. Sanjeevani lifts the mountain of medical panic off your shoulders—transforming medical jargon into simple, calm 1-2-3 steps that anyone can execute."
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. THE DEEP MIDNIGHT-TEAL SHOWCASE (THE DARK HUB SECTION) */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-[36px] sm:rounded-[44px] bg-gradient-to-br from-[#051F1A] via-[#09322A] to-[#041915] border border-emerald-500/30 p-8 sm:p-12 lg:p-14 text-white shadow-2xl">
          
          {/* Subtle Ambient Glowing Orbs inside dark hub */}
          <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-accent/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-10">
            
            {/* Header of Dark Section */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold uppercase tracking-widest border border-emerald-500/30">
                CLINICAL RESUSCITATION INTELLIGENCE
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                The 4 Pillars of Instant Life-Saving Action
              </h2>
              <p className="text-sm text-white/75 leading-relaxed">
                Every second from collapse to hospital handoff is deterministically guided with zero guesswork.
              </p>
            </div>

            {/* 4 Distinct Dark Cards with Vivid Color-Coded Icon Squares */}
            <div className="scroll-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: AI Guardian (Amber) */}
              <div 
                onClick={() => onSelectDestination('chat')}
                className="p-6 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 transition-all duration-300 group cursor-pointer space-y-4 shadow-lg hover:-translate-y-1.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    AI Guardian Triage
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed mt-1.5">
                    Hands-free voice STT, red-flag detection, and instant 1-2-3 steps with strict contraindications.
                  </p>
                </div>
                <div className="text-[11px] font-bold text-amber-400 flex items-center space-x-1 pt-1">
                  <span>Start Triage</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: AI Medical Camera (Sky Blue) */}
              <div 
                onClick={() => onSelectDestination('camera')}
                className="p-6 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-400/50 transition-all duration-300 group cursor-pointer space-y-4 shadow-lg hover:-translate-y-1.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                    AI Medical Camera
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed mt-1.5">
                    110 BPM acoustic metronome, sternum reticle, 5–6 cm depth meter, and Demo Patient simulation.
                  </p>
                </div>
                <div className="text-[11px] font-bold text-sky-400 flex items-center space-x-1 pt-1">
                  <span>Open Camera</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: Reality Check Engine (Emerald) */}
              <div 
                onClick={() => onSelectDestination('mythbuster')}
                className="p-6 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/50 transition-all duration-300 group cursor-pointer space-y-4 shadow-lg hover:-translate-y-1.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Reality Check Engine
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed mt-1.5">
                    Tests toothpaste on burns, raw haldi, and seizure keys against rigorous AIIMS & AHA protocols.
                  </p>
                </div>
                <div className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1 pt-1">
                  <span>Bust Myths</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 4: Cheap Medicines (Purple) */}
              <div 
                onClick={() => onSelectDestination('medicines')}
                className="p-6 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 transition-all duration-300 group cursor-pointer space-y-4 shadow-lg hover:-translate-y-1.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-400/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    Cheap Medicines Finder
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed mt-1.5">
                    Live Firecrawl search matching expensive branded drugs to 70%–75% cheaper Jan Aushadhi generic salts.
                  </p>
                </div>
                <div className="text-[11px] font-bold text-purple-400 flex items-center space-x-1 pt-1">
                  <span>Find Generics</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>

            {/* Bottom SBAR & Crowd QR Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-left">
                <QrCode className="w-8 h-8 text-accent shrink-0" />
                <div>
                  <span className="text-sm font-bold text-white block">
                    Zero-Download Bystander Squad QR & Paramedic SBAR
                  </span>
                  <span className="text-xs text-white/70">
                    Passersby scan to divide tasks; arriving 112 paramedics scan in 0.5s without Wi-Fi.
                  </span>
                </div>
              </div>
              {onOpenCrowdModal && (
                <button
                  onClick={onOpenCrowdModal}
                  className="px-5 py-2.5 rounded-full bg-accent text-ink font-extrabold text-xs shadow-md whitespace-nowrap cursor-pointer hover:bg-amber-400 transition-colors"
                >
                  Generate Crowd QR
                </button>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. CATEGORY PILL FILTER TABS */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-primary text-white shadow-md ring-2 ring-primary/30'
                : 'category-pill-inactive bg-white dark:bg-surface text-slate-900 dark:text-white hover:text-primary dark:hover:text-emerald-300 hover:border-primary border-2 border-slate-300 dark:border-slate-700/80 shadow-xs'
            }`}
          >
            All Life-Saving Tools
          </button>
          <button
            onClick={() => setActiveCategory('cardiac')}
            className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeCategory === 'cardiac'
                ? 'bg-primary text-white shadow-md ring-2 ring-primary/30'
                : 'category-pill-inactive bg-white dark:bg-surface text-slate-900 dark:text-white hover:text-primary dark:hover:text-emerald-300 hover:border-primary border-2 border-slate-300 dark:border-slate-700/80 shadow-xs'
            }`}
          >
            Resuscitation & CPR
          </button>
          <button
            onClick={() => setActiveCategory('trauma')}
            className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeCategory === 'trauma'
                ? 'bg-primary text-white shadow-md ring-2 ring-primary/30'
                : 'category-pill-inactive bg-white dark:bg-surface text-slate-900 dark:text-white hover:text-primary dark:hover:text-emerald-300 hover:border-primary border-2 border-slate-300 dark:border-slate-700/80 shadow-xs'
            }`}
          >
            Trauma & Burns
          </button>
          <button
            onClick={() => setActiveCategory('medicines')}
            className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeCategory === 'medicines'
                ? 'bg-primary text-white shadow-md ring-2 ring-primary/30'
                : 'category-pill-inactive bg-white dark:bg-surface text-slate-900 dark:text-white hover:text-primary dark:hover:text-emerald-300 hover:border-primary border-2 border-slate-300 dark:border-slate-700/80 shadow-xs'
            }`}
          >
            Medicines & Savings
          </button>
          <button
            onClick={() => setActiveCategory('crowd')}
            className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeCategory === 'crowd'
                ? 'bg-primary text-white shadow-md ring-2 ring-primary/30'
                : 'category-pill-inactive bg-white dark:bg-surface text-slate-900 dark:text-white hover:text-primary dark:hover:text-emerald-300 hover:border-primary border-2 border-slate-300 dark:border-slate-700/80 shadow-xs'
            }`}
          >
            Crowd Squad QR
          </button>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. "EVERYTHING YOU NEED" FEATURE GRID (MASONRY) */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-4 sm:px-6 max-w-7xl mx-auto space-y-10">
        
        <div className="text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-primary dark:text-emerald-400">
            EVERYTHING YOU NEED
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Complete Pre-Hospital Arsenal
          </h2>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-xl mx-auto font-bold">
            Engineered with zero fluff so rescuers never freeze during critical moments.
          </p>
        </div>

        <div className="scroll-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature Card 1 */}
          {(activeCategory === 'all' || activeCategory === 'trauma') && (
            <div className="hover-lift-card p-6 rounded-3xl bg-white dark:bg-surface border-2 border-slate-200 dark:border-border hover:border-primary/50 shadow-xs hover:shadow-lg transition-all duration-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-300 font-black">
                  <Activity className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                </div>
                <span className="text-[10px] font-mono font-black bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-full text-slate-900 dark:text-slate-200">
                  Wound Scan
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Optical Wound Evaluation</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold">
                Evaluates skin tears, bleeding, and burn depth with a built-in false alarm filter that prevents fake AI injury hallucinations.
              </p>
            </div>
          )}

          {/* Feature Card 2 */}
          {(activeCategory === 'all' || activeCategory === 'cardiac') && (
            <div className="hover-lift-card p-6 rounded-3xl bg-white dark:bg-surface border-2 border-slate-200 dark:border-border hover:border-primary/50 shadow-xs hover:shadow-lg transition-all duration-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-primary/15 text-primary dark:text-emerald-400">
                  <HeartPulse className="w-5 h-5 text-primary dark:text-emerald-400" />
                </div>
                <span className="text-[10px] font-mono font-black bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-full text-slate-900 dark:text-slate-200">
                  110 BPM HUD
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">CPR Visual Metronome</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold">
                Emits an audible 110 BPM metronome while animating concentric shockwaves and a 5–6 cm compression depth meter directly on screen.
              </p>
            </div>
          )}

          {/* Feature Card 3 */}
          {(activeCategory === 'all' || activeCategory === 'medicines') && (
            <div className="hover-lift-card p-6 rounded-3xl bg-white dark:bg-surface border-2 border-slate-200 dark:border-border hover:border-primary/50 shadow-xs hover:shadow-lg transition-all duration-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-900 dark:text-purple-300">
                  <Pill className="w-5 h-5 text-purple-700 dark:text-purple-400" />
                </div>
                <span className="text-[10px] font-mono font-black bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-full text-slate-900 dark:text-slate-200">
                  Prescription OCR
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">OCR Strip & Script Scanner</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold">
                Deciphers unreadable doctor handwriting and matches active chemical salts to government Jan Aushadhi generic equivalents.
              </p>
            </div>
          )}

          {/* Feature Card 4 */}
          {(activeCategory === 'all' || activeCategory === 'crowd') && (
            <div className="hover-lift-card p-6 rounded-3xl bg-white dark:bg-surface border-2 border-slate-200 dark:border-border hover:border-primary/50 shadow-xs hover:shadow-lg transition-all duration-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-900 dark:text-sky-300">
                  <Users className="w-5 h-5 text-sky-700 dark:text-sky-400" />
                </div>
                <span className="text-[10px] font-mono font-black bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-full text-slate-900 dark:text-slate-200">
                  Zero Download
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Bystander Squad QR</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold">
                Breaks crowd paralysis by assigning tasks (112 caller, traffic controller, first-aid runner) to bystanders via an ordinary camera scan.
              </p>
            </div>
          )}

          {/* Feature Card 5 */}
          {(activeCategory === 'all' || activeCategory === 'cardiac') && (
            <div className="hover-lift-card p-6 rounded-3xl bg-white dark:bg-surface border-2 border-slate-200 dark:border-border hover:border-primary/50 shadow-xs hover:shadow-lg transition-all duration-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-900 dark:text-emerald-300">
                  <FileText className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <span className="text-[10px] font-mono font-black bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-full text-slate-900 dark:text-slate-200">
                  0.5s Transfer
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Paramedic SBAR Docket</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold">
                Compiles Situation, Background, Assessment, and vitals into an offline QR docket that 108/112 ambulance staff scan in 0.5 seconds.
              </p>
            </div>
          )}

          {/* Feature Card 6 */}
          {(activeCategory === 'all' || activeCategory === 'medicines') && (
            <div className="hover-lift-card p-6 rounded-3xl bg-white dark:bg-surface border-2 border-slate-200 dark:border-border hover:border-primary/50 shadow-xs hover:shadow-lg transition-all duration-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-900 dark:text-rose-300">
                  <MapPin className="w-5 h-5 text-rose-700 dark:text-rose-400" />
                </div>
                <span className="text-[10px] font-mono font-black bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-full text-slate-900 dark:text-slate-200">
                  Geo-Radar
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Hospital & AED Radar</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold">
                Doorstep GPS mapping showing verified trauma centers, real driving times, and direct 1-tap emergency dialers across Indian cities.
              </p>
            </div>
          )}

        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. COMPARISON CARDS: WHATSAPP FOLKLORE VS AIIMS PROTOCOL */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
            CLINICAL REALITY CHECK
          </span>
          <h2 className="fluid-section-title font-black text-slate-900 dark:text-white tracking-tight">
            Folklore vs. Accredited Medical Protocol
          </h2>
        </div>

        <div className="scroll-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          
          {/* Card 1: WhatsApp Folklore */}
          <div className="hover-lift-card p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/50 space-y-3 shadow-xs">
            <span className="text-[10px] font-mono font-black text-amber-950 dark:text-amber-200 bg-amber-200/90 dark:bg-amber-900/60 px-3 py-1 rounded-full uppercase">
              1. What Folklore Claims
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Toothpaste on Burns</h3>
            <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-200 font-bold leading-relaxed">
              Applying white colgate, butter, or raw haldi on severe burns because the menthol feels cold.
            </p>
          </div>

          {/* Card 2: The Biological Danger */}
          <div className="hover-lift-card p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-300 dark:border-rose-700/50 space-y-3 shadow-xs">
            <span className="text-[10px] font-mono font-black text-rose-950 dark:text-rose-200 bg-rose-200/90 dark:bg-rose-900/60 px-3 py-1 rounded-full uppercase">
              2. The Biological Danger
            </span>
            <h3 className="text-lg font-black text-rose-950 dark:text-rose-200">Heat Trapping & Sepsis</h3>
            <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-200 font-bold leading-relaxed">
              Paste creates an airtight barrier that traps thermal energy deep in tissue, turning a mild burn into a permanent scarred wound.
            </p>
          </div>

          {/* Card 3: The AIIMS Standard */}
          <div className="hover-lift-card sm:col-span-2 lg:col-span-1 p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-700/50 space-y-3 shadow-xs">
            <span className="text-[10px] font-mono font-black text-emerald-950 dark:text-emerald-200 bg-emerald-200/90 dark:bg-emerald-900/60 px-3 py-1 rounded-full uppercase">
              3. The AIIMS Standard
            </span>
            <h3 className="text-lg font-black text-emerald-950 dark:text-emerald-200">Cool Tap Water (15–20 Mins)</h3>
            <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-200 font-bold leading-relaxed">
              Hold under gentle cool running tap water for 15 to 20 minutes. Never use ice. Cover loosely with sterile film and elevate.
            </p>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 9. CONTINUOUS LIFELINE: THE 3-STEP CHAIN OF SURVIVAL     */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-primary dark:text-emerald-400">
            CARE CONTINUUM
          </span>
          <h2 className="fluid-section-title font-black text-slate-900 dark:text-white tracking-tight">
            How Care Flows in the First 5 Minutes
          </h2>
        </div>

        <div className="rounded-3xl bg-white dark:bg-surface border-2 border-slate-200 dark:border-border p-5 sm:p-8 lg:p-10 shadow-lg">
          <div className="scroll-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            
            <div className="hover-lift-card space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-border shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-primary text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                  01
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-primary dark:text-emerald-400">00:00 — RECOGNITION</span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Voice, Text or Optical Triage</h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-bold leading-relaxed">
                Triage airway patency, bleeding, and consciousness in under 2 seconds hands-free.
              </p>
            </div>

            <div className="hover-lift-card space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-border shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-accent text-ink font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                  02
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-400">00:30 — MOBILIZATION</span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">110 BPM CPR & Crowd Tasks</h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-bold leading-relaxed">
                Locked chest compression audio cadence while onlookers scan Crowd QR to fetch AEDs.
              </p>
            </div>

            <div className="hover-lift-card sm:col-span-2 lg:col-span-1 space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-border shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                  03
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-400">04:30 — HANDOVER</span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">0.5s Paramedic SBAR Docket</h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-bold leading-relaxed">
                Ambulance crew scans complete offline vitals telemetry instantly without screaming.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 10. COMMUNITY REVIEWS & STORIES                          */}
      {/* ======================================================== */}
      <CommunityReviewsSection />

      {/* ======================================================== */}
      {/* 11. FAQ ACCORDION SECTION                                */}
      {/* ======================================================== */}
      <section className="scroll-reveal px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-primary dark:text-emerald-400">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="fluid-section-title font-black text-slate-900 dark:text-white tracking-tight">
            Common Inquiries & Guidelines
          </h2>
        </div>

        <div className="scroll-stagger space-y-3">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="rounded-2xl bg-white dark:bg-surface border-2 border-slate-200 dark:border-border overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 font-black text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <span className="faq-question text-slate-900 dark:text-white font-black text-sm sm:text-base leading-snug">
                  {faq.q}
                </span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${openFaq === idx ? 'transform rotate-180 text-primary dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`} />
              </button>
              {openFaq === idx && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-bold leading-relaxed border-t border-slate-200 dark:border-border pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 12. FINAL HIGH-IMPACT COSMIC TEAL CTA BANNER             */}
      {/* ======================================================== */}
      <section className="scroll-reveal scroll-reveal-scale px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-[28px] sm:rounded-[44px] bg-gradient-to-r from-[#06241e] via-[#0b3830] to-[#041a15] p-6 sm:p-14 text-center text-white space-y-5 sm:space-y-6 shadow-2xl border border-emerald-500/25">
          
          <div className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-bold tracking-wider uppercase border border-accent/30">
            Pre-Hospital Safety Network
          </div>
          
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Ready to Protect Your School & Family?
          </h2>
          
          <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed font-medium">
            Open Sanjeevani instantly on any smartphone, tablet, or laptop. 100% free, 100% offline resilient.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 max-w-md sm:max-w-none mx-auto">
            <button
              onClick={() => onSelectDestination('chat')}
              className="w-full sm:w-auto justify-center px-8 py-4 rounded-full bg-accent hover:bg-amber-400 text-ink text-sm sm:text-base font-extrabold shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span>Launch AI Guardian →</span>
            </button>
            <button
              onClick={() => onSelectDestination('camera')}
              className="w-full sm:w-auto justify-center px-7 py-4 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold backdrop-blur-md cursor-pointer transition-colors"
            >
              <span>Open AI Medical Camera</span>
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 13. MODERN HOSPITAL-GRADE FOOTER                         */}
      {/* ======================================================== */}
      <footer className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-8 border-t-2 border-slate-200 dark:border-border">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 mb-8 text-xs">
          
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black text-slate-900 dark:text-white">Sanjeevani</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:text-emerald-400 font-black">v2.0</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-bold leading-relaxed max-w-sm">
              The Pre-Hospital Digital Nervous System designed for Indian schools, teachers, and everyday families. Developed by students of Seth M.R. Jaipuria School for Kaleidoscope 2025–26.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-black text-slate-900 dark:text-white block uppercase tracking-wider text-[11px]">Instruments</span>
            <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 font-bold">
              <li><button onClick={() => onSelectDestination('chat')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">AI Guardian</button></li>
              <li><button onClick={() => onSelectDestination('camera')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer text-primary dark:text-emerald-400 font-black">AI Medical Camera</button></li>
              <li><button onClick={() => onSelectDestination('mythbuster')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">MythBuster</button></li>
              <li><button onClick={() => onSelectDestination('medicines')} className="hover:text-primary cursor-pointer">Cheap Medicines</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-black text-slate-900 dark:text-white block uppercase tracking-wider text-[11px]">Protocols</span>
            <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 font-bold">
              <li><button onClick={() => onStartRespond('unconscious')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">Adult CPR (110 BPM)</button></li>
              <li><button onClick={() => onStartRespond('bleeding')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">Arterial Bleeding</button></li>
              <li><button onClick={() => onStartRespond('burns')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">Thermal Burns</button></li>
              <li><button onClick={() => onStartRespond('choking')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">Choking Thrusts</button></li>
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-2">
            <span className="font-black text-slate-900 dark:text-white block uppercase tracking-wider text-[11px]">Account & SOS</span>
            <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 font-bold">
              <li><button onClick={() => onOpenAuth('signin')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">Sign In</button></li>
              <li><button onClick={() => onOpenAuth('signup')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">Create Account</button></li>
              <li><button onClick={() => onSelectDestination('handoff')} className="hover:text-primary dark:hover:text-emerald-400 cursor-pointer">Paramedic Docket</button></li>
              <li><span className="text-emerald-700 dark:text-emerald-400 font-black">PWA Offline Cache Active</span></li>
            </ul>
          </div>

        </div>

        <div className="pt-6 border-t-2 border-slate-200 dark:border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-[11px] text-slate-700 dark:text-slate-400 font-bold">
          <span>© 2026 Sanjeevani v2.0 • Seth M.R. Jaipuria School Innovation.</span>
          <span>First-aid guidance only. In serious emergencies, always dial 112 immediately.</span>
        </div>
      </footer>

    </div>
  );
};
