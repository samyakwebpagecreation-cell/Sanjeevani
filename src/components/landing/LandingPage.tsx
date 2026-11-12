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
  MapPin, 
  Pill, 
  Activity, 
  Camera,
  Stethoscope,
  Building2,
  Award,
  PhoneCall
} from 'lucide-react';
import { Destination } from '../../types';
import { CommunityReviewsSection } from './CommunityReviewsSection';
import {
  Section,
  SectionHeader,
  Card,
  Button,
  Stat,
  Badge,
  Accordion
} from '../common/DesignSystem';
import { ECGLine } from '../common/ECGLine';
import { PhoneMockup } from './PhoneMockup';
import { BentoCard, BentoToolItem } from './BentoCard';
import { MythFactCard, MythFactScenario } from './MythFactCard';
import { Timeline } from './Timeline';

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
  // Category filter state for "Complete Pre-Hospital Arsenal" section
  const [activeCategory, setActiveCategory] = useState<'all' | 'cardiac' | 'trauma' | 'medicines' | 'crowd'>('all');

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Sticky Mobile Bottom Bar visibility after scrolling past Hero
  const [showMobileStickyBar, setShowMobileStickyBar] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setShowMobileStickyBar(y > 500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Global Power-User Keyboard Shortcut Listener:
  // Cmd/Ctrl + G -> Launch AI Guardian
  // Cmd/Ctrl + E -> Open Emergency Chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'g' || key === 'e') {
        e.preventDefault();
        onSelectDestination('chat');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectDestination]);

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const handleTriggerSOS = () => {
    const headerSosBtn = document.querySelector<HTMLButtonElement>('[data-action="trigger-112-sos"]');
    if (headerSosBtn) {
      headerSosBtn.click();
    } else {
      window.location.href = 'tel:112';
    }
  };

  const faqs = [
    {
      q: "Does Sanjeevani work without internet in school basements or remote roads?",
      a: "Yes, 100%. Sanjeevani is architected as an offline-first Progressive Web App (PWA). All 12 accredited clinical protocols, the CPR audio metronome synthesizer, and the paramedic SBAR docket run locally in your browser memory without cell towers or Wi-Fi."
    },
    {
      q: "How does the AI Medical Camera guide CPR hand placement?",
      a: "The AI Medical Camera projects an interactive acoustic reticle directly onto the lower half of the victim's breastbone. It combines a Web Audio CPR metronome beep with a live 5–6 cm compression depth meter. If webcam permissions are unavailable on stage, our instant Demo Patient mode renders an anatomical patient torso simulation."
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

  const categories: { id: 'all' | 'cardiac' | 'trauma' | 'medicines' | 'crowd'; label: string }[] = [
    { id: 'all', label: 'All Life-Saving Tools' },
    { id: 'cardiac', label: 'Resuscitation & CPR' },
    { id: 'trauma', label: 'Trauma & Burns' },
    { id: 'medicines', label: 'Medicines & Savings' },
    { id: 'crowd', label: 'Crowd Squad QR' }
  ];

  const arsenalTools: BentoToolItem[] = [
    {
      id: 'cpr-metronome',
      category: 'cardiac',
      tag: 'CPR Audio HUD',
      title: 'CPR Visual Metronome',
      description:
        'Emits an audible CPR metronome while animating concentric shockwaves and a 5–6 cm compression depth meter directly on screen.',
      stat: 'AHA 2020 CPR cadence lock',
      icon: <HeartPulse className="w-6 h-6" />,
      featured: true,
      onClick: () => onStartRespond('unconscious')
    },
    {
      id: 'crowd-qr',
      category: 'crowd',
      tag: 'Zero Download',
      title: 'Bystander Squad QR',
      description:
        'Breaks crowd paralysis by assigning tasks (112 caller, traffic controller, first-aid runner) to bystanders via an ordinary camera scan.',
      stat: '0 MB app install for onlookers',
      icon: <Users className="w-6 h-6 text-primary" />,
      onClick: () => (onOpenCrowdModal ? onOpenCrowdModal() : onSelectDestination('chat'))
    },
    {
      id: 'sbar-docket',
      category: 'cardiac',
      tag: '0.5s Transfer',
      title: 'Paramedic SBAR Docket',
      description:
        'Compiles Situation, Background, Assessment, and vitals into an offline QR docket that 108/112 ambulance staff scan in 0.5 seconds.',
      stat: '0.5s offline EMS trauma handoff',
      icon: <FileText className="w-6 h-6 text-primary" />,
      onClick: () => onSelectDestination('handoff')
    },
    {
      id: 'optical-wound',
      category: 'trauma',
      tag: 'Wound Scan',
      title: 'Optical Wound Evaluation',
      description:
        'Evaluates skin tears, bleeding, and burn depth with a built-in false alarm filter that prevents fake AI injury hallucinations.',
      stat: 'Optical triage & severity filter',
      icon: <Activity className="w-6 h-6 text-primary" />,
      onClick: () => onSelectDestination('camera')
    },
    {
      id: 'ocr-scanner',
      category: 'medicines',
      tag: 'Prescription OCR',
      title: 'OCR Strip & Script Scanner',
      description:
        'Deciphers unreadable doctor handwriting and matches active chemical salts to government Jan Aushadhi generic equivalents.',
      stat: '70–75% typical generic savings (up to 85%)',
      icon: <Pill className="w-6 h-6 text-primary" />,
      onClick: () => onSelectDestination('medicines')
    },
    {
      id: 'hospital-radar',
      category: 'medicines',
      tag: 'Geo-Radar',
      title: 'Hospital & AED Radar',
      description:
        'Doorstep GPS mapping showing verified trauma centers, real driving times, and direct 1-tap emergency dialers across Indian cities.',
      stat: 'Live GPS route & 1-tap 112 dispatch',
      icon: <MapPin className="w-6 h-6 text-primary" />,
      onClick: () => (onOpenRadar ? onOpenRadar() : onSelectDestination('medicines'))
    }
  ];

  const filteredTools = arsenalTools.filter(
    (t) => activeCategory === 'all' || t.category === activeCategory
  );

  const mythComparisons: MythFactScenario[] = [
    {
      topic: 'Thermal & Kitchen Burns',
      mythTitle: 'Applying Toothpaste, Butter, or Raw Haldi on Burns',
      mythDesc:
        'Applying white toothpaste, butter, or raw haldi on severe burns because the menthol feels cold. Paste creates an airtight barrier that traps thermal energy deep in tissue, turning a mild burn into a permanent scarred wound.',
      factTitle: 'Hold Under Cool Tap Water for 15–20 Minutes',
      factDesc:
        'Hold under gentle cool running tap water for 15 to 20 minutes to draw out residual heat. Never use ice. Cover loosely with sterile film and elevate.'
    },
    {
      topic: 'Epileptic Seizures & Convulsions',
      mythTitle: 'Forcing Iron Keys in Hands or Spoons into the Mouth',
      mythDesc:
        'Pressing iron keys into a convulsing person’s palm or forcing metal spoons between their teeth. Restraining movements or inserting objects fractures teeth and obstructs the airway.',
      factTitle: 'Cushion the Head & Roll to Recovery Position',
      factDesc:
        'Clear sharp objects nearby, place a folded cloth under the head, and time the seizure. Once jerking stops, gently roll the person onto their side (recovery position) to keep the airway clear.'
    },
    {
      topic: 'Severe Bleeding & Snakebites',
      mythTitle: 'Tight Wire Tourniquets or Cutting Wounds',
      mythDesc:
        'Tying thin cords tightly around a limb or slicing a wound with a blade. This accelerates venom spread, severs nerves, and causes irreversible tissue necrosis.',
      factTitle: 'Direct Sterile Pressure & Limb Immobilization',
      factDesc:
        'Apply firm direct pressure with a clean sterile cloth for 10 full minutes. For snakebites, keep the patient calm, immobilize the limb below heart level, and transport immediately to an anti-venom hospital.'
    }
  ];

  const pillars = [
    {
      num: '01',
      title: 'AI Guardian Triage',
      desc: 'Hands-free voice STT, red-flag detection, and instant 1-2-3 steps with strict contraindications.',
      icon: <Zap className="w-7 h-7 text-teal-300" aria-hidden="true" />,
      onClick: () => onSelectDestination('chat')
    },
    {
      num: '02',
      title: 'AI Medical Camera',
      desc: 'Acoustic CPR metronome, sternum reticle, 5–6 cm depth meter, and Demo Patient simulation.',
      icon: <HeartPulse className="w-7 h-7 text-teal-300" aria-hidden="true" />,
      onClick: () => onSelectDestination('camera')
    },
    {
      num: '03',
      title: 'Reality Check Engine',
      desc: 'Tests toothpaste on burns, raw haldi, and seizure keys against rigorous AIIMS & AHA protocols.',
      icon: <Sparkles className="w-7 h-7 text-teal-300" aria-hidden="true" />,
      onClick: () => onSelectDestination('mythbuster')
    },
    {
      num: '04',
      title: 'Cheap Medicines Finder',
      desc: 'Live search matching expensive branded drugs to 70%–75% cheaper Jan Aushadhi generic salts.',
      icon: <Pill className="w-7 h-7 text-teal-300" aria-hidden="true" />,
      onClick: () => onSelectDestination('medicines')
    }
  ];

  return (
    <div className="relative min-h-screen bg-base text-ink pb-24 md:pb-12">
      {onBackToDashboard && (
        <div className="bg-surface border-b border-border py-2.5 px-4 text-center">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline cursor-pointer"
          >
            <span>← Back to your Guardian Dashboard</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* C. HERO SECTION (min-h-[88vh] on desktop, centered)      */}
      {/* ======================================================== */}
      <section
        aria-labelledby="hero-heading"
        className="relative min-h-[88vh] flex items-center py-10 md:py-16 bg-base bg-clinical-grid border-b border-border overflow-hidden"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Eyebrow, H1, 2-Line Subhead, 2 High-Contrast CTAs, Social Proof */}
            <div className="lg:col-span-7 space-y-6">
              <Badge variant="soft">
                Pre-Hospital Digital Nervous System · AHA 2020 &amp; AIIMS
              </Badge>

              <h1
                id="hero-heading"
                className="type-display text-ink tracking-tight text-balance"
              >
                Protect Lives in the Critical First{' '}
                <span className="text-primary underline decoration-primary/40 decoration-4 underline-offset-8">
                  300 Seconds
                </span>
              </h1>

              <p className="text-base sm:text-lg text-ink-muted font-normal leading-relaxed max-w-[60ch]">
                When someone collapses, sirens are 15 minutes away in traffic. Sanjeevani turns helpless panic into calm, life-saving instincts with instant AI triage, guided CPR, cheap generic medicine savings, and zero-download crowd dispatch.
              </p>

              {/* Primary + 2px Outlined Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => onSelectDestination('chat')}
                  title="Shortcut: Cmd/Ctrl + G or Cmd/Ctrl + E"
                >
                  <Zap className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>Launch AI Guardian</span>
                  <kbd className="hidden xl:inline-block ml-1 px-1.5 py-0.5 text-xs font-mono bg-black/20 text-white rounded border border-white/25">
                    ⌘G
                  </kbd>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onSelectDestination('camera')}
                >
                  <Camera className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                  <span>Open AI Medical Camera</span>
                </Button>
              </div>

              {/* Social Proof + ECG Heartbeat Divider Line */}
              <div className="pt-2 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1.5 shrink-0" aria-hidden="true">
                    <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center ring-2 ring-surface">
                      D
                    </span>
                    <span className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center ring-2 ring-surface">
                      S
                    </span>
                    <span className="w-7 h-7 rounded-full bg-success text-white text-xs font-bold flex items-center justify-center ring-2 ring-surface">
                      M
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-ink">
                    Built for students, teachers &amp; families across India · Seth M.R. Jaipuria School
                  </p>
                </div>

                {/* Hero Heartbeat Motif Line */}
                <div className="flex items-center gap-3 max-w-lg" aria-hidden="true">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary shrink-0">
                    04:00 GOLDEN WINDOW
                  </span>
                  <svg viewBox="0 0 240 28" fill="none" className="w-48 h-6 text-primary/60">
                    <path
                      d="M0 14 H50 L62 6 L72 22 L84 2 L96 26 L106 10 L116 14 H240"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-ecg-line"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Right Column: Large CSS/SVG Phone Mockup + Countdown Ring + Floating Chips */}
            <div className="lg:col-span-5">
              <PhoneMockup
                onStartRespond={onStartRespond}
                onSelectDestination={onSelectDestination}
                onOpenCrowdModal={onOpenCrowdModal}
                onTriggerSOS={handleTriggerSOS}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* D. STATS STRIP (3rem+ Count-Up) + TRUST ROW + PURPOSE    */}
      {/* ======================================================== */}
      <Section
        id="stats-and-purpose"
        labelledBy="purpose-heading"
        variant="surface-dots"
      >
        <div className="space-y-12">
          {/* 4 Bold Full-Width Stat Blocks (2x2 on mobile, 4-col on desktop) */}
          <Card className="overflow-hidden border-2 border-border shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <Stat
                icon={<Clock className="w-4 h-4" />}
                label="Brain Window"
                value="04:00 mins"
                countTarget={4}
                formatCount={(n) => `0${n}:00 mins`}
                description="Permanent cerebral hypoxia begins without blood flow."
              />
              <Stat
                icon={<HeartPulse className="w-4 h-4" />}
                label="CPR Depth"
                value="5–6 cm"
                countTarget={6}
                formatCount={(n) => `5–${n} cm`}
                description="Optimal sternum compression depth for cardiac perfusion."
              />
              <Stat
                icon={<CheckCircle2 className="w-4 h-4" />}
                label="Zero Signal"
                value="100% Offline"
                countTarget={100}
                formatCount={(n) => `${n}% Offline`}
                description="Runs in basements, sports grounds & remote highways."
              />
              <Stat
                icon={<Pill className="w-4 h-4" />}
                label="Jan Aushadhi"
                value="70–75%"
                countTarget={75}
                formatCount={(n) => `70–${n}%`}
                description="Save ~₹155 per strip on generic Augmentin 625 (up to 85% max)."
              />
            </div>
          </Card>

          {/* Tidy 2-Column Mobile / 4-Column Desktop Row of 14px Trust Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-surface border border-border shadow-2xs text-sm font-semibold text-ink">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
              <span>Built on AHA 2020 Guidelines</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-surface border border-border shadow-2xs text-sm font-semibold text-ink">
              <Stethoscope className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
              <span>AIIMS Emergency Protocols</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-surface border border-border shadow-2xs text-sm font-semibold text-ink">
              <Building2 className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
              <span>PMBJP Jan Aushadhi Verified</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-surface border border-border shadow-2xs text-sm font-semibold text-ink">
              <Award className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
              <span>CDSCO Bio-Equivalent Standards</span>
            </div>
          </div>

          {/* 5. Purpose / Quote Block (Calm callout with left primary border) */}
          <Card className="p-6 sm:p-10 border-l-4 border-l-primary bg-surface">
            <div className="max-w-4xl space-y-3.5">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                <Mountain className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>THE PURPOSE OF SANJEEVANI</span>
              </div>
              <h2 id="purpose-heading" className="type-h2 text-ink tracking-tight">
                Lifting the Mountain of Medical Panic
              </h2>
              <blockquote className="text-base sm:text-lg text-ink-muted font-normal leading-relaxed max-w-[65ch]">
                &ldquo;In the Ramayana, Hanuman couldn&rsquo;t decipher thousands of herbs on Mount Dronagiri, so he lifted the entire mountain. Sanjeevani lifts the mountain of medical panic off your shoulders—transforming medical jargon into simple, calm 1-2-3 steps that anyone can execute.&rdquo;
              </blockquote>
            </div>
          </Card>
        </div>
      </Section>

      {/* ======================================================== */}
      {/* E. THE 4 PILLARS (Deep Navy Dark Section)                */}
      {/* ======================================================== */}
      <Section id="pillars" labelledBy="pillars-heading" variant="dark">
        <SectionHeader
          id="pillars-heading"
          eyebrow="CLINICAL RESUSCITATION INTELLIGENCE"
          title="The 4 Pillars of Instant Life-Saving Action"
          description="Every second from collapse to hospital handoff is deterministically guided with zero guesswork."
          dark
        />

        {/* 4 Larger Pillar Cards (min-h-[260px], 56px glowing icon square, 20px title, 16px body, 01-04 corner number) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {pillars.map((pillar) => (
            <div
              key={pillar.num}
              onClick={pillar.onClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  pillar.onClick();
                }
              }}
              className="min-h-[268px] p-6 sm:p-7 rounded-[18px] bg-gradient-to-b from-white/[0.08] to-white/[0.03] border border-teal-400/30 hover:border-teal-300/60 hover:bg-white/[0.11] transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer group relative overflow-hidden shadow-md"
            >
              {/* Faint radial glow on hover */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-teal-400/10 group-hover:bg-teal-400/20 blur-2xl transition-colors"
              />

              <div className="space-y-5 relative z-10">
                <div className="flex items-start justify-between gap-3">
                  {/* 56px Glowing Rounded Square Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-primary/40 border border-teal-300/35 shadow-[0_0_20px_rgba(20,184,166,0.2)] flex items-center justify-center shrink-0">
                    {pillar.icon}
                  </div>
                  <span className="font-mono text-sm font-bold text-teal-300/80">
                    {pillar.num}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-base text-white/85 font-normal leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>

              <div className="pt-5 text-sm font-bold text-teal-300 inline-flex items-center gap-1.5 group-hover:text-white transition-colors relative z-10">
                <span>Learn more</span>
                <ArrowRight
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Full-Width Bystander Squad QR & Paramedic SBAR Band with Custom SVG QR Matrix */}
        <div className="mt-8 p-6 sm:p-8 rounded-[18px] bg-gradient-to-r from-white/[0.09] via-white/[0.06] to-primary/30 border border-teal-400/35 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
          <div className="flex items-start sm:items-center gap-5">
            {/* CSS/SVG-Drawn QR Matrix Icon */}
            <div
              aria-hidden="true"
              className="w-16 h-16 rounded-2xl bg-navy border border-teal-300/40 p-2.5 flex items-center justify-center shrink-0 shadow-inner"
            >
              <svg viewBox="0 0 36 36" className="w-full h-full text-teal-300" fill="currentColor">
                <path d="M2 2h12v12H2V2zm3 3v6h6V5H5zm17-3h12v12H22V2zm3 3v6h6V5h-6zM2 22h12v12H2V22zm3 3v6h6v-6H5zm17-3h4v4h-4v-4zm6 4h6v4h-6v-4zm-6 6h6v4h-6v-4zm8 0h4v4h-4v-4z" />
              </svg>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white">
                Zero-Download Bystander Squad QR &amp; Paramedic SBAR
              </h3>
              <p className="text-base text-white/85 max-w-[60ch]">
                Passersby scan to divide tasks; arriving 112 paramedics scan in 0.5s without Wi-Fi.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={() =>
              onOpenCrowdModal ? onOpenCrowdModal() : onSelectDestination('handoff')
            }
            className="shrink-0 w-full md:w-auto border-teal-300/40"
          >
            <span>Generate Crowd QR</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </Section>

      {/* ======================================================== */}
      {/* F. COMPLETE PRE-HOSPITAL ARSENAL (Bento Grid)            */}
      {/* ======================================================== */}
      <Section id="arsenal" labelledBy="arsenal-heading">
        <SectionHeader
          id="arsenal-heading"
          eyebrow="EVERYTHING YOU NEED"
          title="Complete Pre-Hospital Arsenal"
          description="Engineered with zero fluff so rescuers never freeze during critical moments."
        />

        {/* Horizontal Scrollable Pill Tabs (Solid primary active pill with white text) */}
        <div
          role="tablist"
          aria-label="Filter pre-hospital tools by category"
          className="flex items-center sm:justify-center gap-2.5 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {categories.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(cat.id)}
                className={`snap-start shrink-0 whitespace-nowrap min-h-[44px] px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-primary text-white border-2 border-primary shadow-sm'
                    : 'bg-surface text-ink border-2 border-border hover:border-primary/50 hover:bg-primary-soft/40'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Desktop Bento Grid: 1 Large 2x2 CPR Card + Smaller Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredTools.map((tool) => (
            <BentoCard
              key={tool.id}
              tool={tool}
              isFeaturedLayout={Boolean(
                tool.featured && (activeCategory === 'all' || activeCategory === 'cardiac')
              )}
            />
          ))}
        </div>
      </Section>

      {/* Heartbeat Divider */}
      <ECGLine label="ACCREDITED CLINICAL PROTOCOLS" />

      {/* ======================================================== */}
      {/* G. FOLKLORE VS. MEDICAL PROTOCOL (Two-Sided Cards + VS)  */}
      {/* ======================================================== */}
      <Section id="myth-vs-fact" labelledBy="myth-heading" variant="soft-tint">
        <SectionHeader
          id="myth-heading"
          eyebrow="CLINICAL REALITY CHECK"
          title="Folklore vs. Accredited Medical Protocol"
          description="Dangerous household myths worsen trauma during the golden hour. Compare common folklore directly against verified AIIMS and AHA standards."
        />

        <div className="space-y-8">
          {mythComparisons.map((scenario, idx) => (
            <MythFactCard
              key={idx}
              index={idx}
              scenario={scenario}
              onVerify={() => onSelectDestination('mythbuster')}
            />
          ))}
        </div>
      </Section>

      {/* ======================================================== */}
      {/* H. CARE TIMELINE ("How Care Flows in the First 5 Mins")  */}
      {/* ======================================================== */}
      <Section id="care-continuum" labelledBy="continuum-heading" variant="surface-grid">
        <SectionHeader
          id="continuum-heading"
          eyebrow="CARE CONTINUUM"
          title="How Care Flows in the First 5 Minutes"
          description="A deterministic chain of survival connecting bystander recognition, crowd mobilization, and ambulance handover."
        />

        <Timeline />
      </Section>

      {/* ======================================================== */}
      {/* I. COMMUNITY REVIEWS & STORIES                           */}
      {/* ======================================================== */}
      <CommunityReviewsSection />

      {/* ======================================================== */}
      {/* J1. FAQ ACCORDION SECTION                                */}
      {/* ======================================================== */}
      <Section id="faq" labelledBy="faq-heading" variant="soft-tint">
        <SectionHeader
          id="faq-heading"
          eyebrow="FREQUENTLY ASKED QUESTIONS"
          title="Common Inquiries & Clinical Guidelines"
          description="Answers on offline readiness, acoustic CPR guidance, and CDSCO generic medicine verification."
        />

        <div className="max-w-4xl mx-auto">
          <Accordion items={faqs} openIndex={openFaq} onToggle={toggleFaq} />
        </div>
      </Section>

      {/* ======================================================== */}
      {/* J2. FULL-BLEED DARK FINAL CTA BANNER WITH ECG ANIMATION  */}
      {/* ======================================================== */}
      <section
        id="final-cta"
        aria-labelledby="final-cta-heading"
        className="relative overflow-hidden bg-navy text-white py-20 md:py-24 border-y border-white/10"
      >
        {/* Animated Background ECG Line */}
        <ECGLine
          variant="banner"
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-40"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-300">
            PRE-HOSPITAL SAFETY NETWORK
          </p>

          <h2
            id="final-cta-heading"
            className="type-h2 text-white tracking-tight text-balance"
          >
            Ready to Protect Your School &amp; Family?
          </h2>

          <p className="text-base sm:text-lg text-white/85 max-w-[60ch] mx-auto font-normal leading-relaxed">
            Open Sanjeevani instantly on any smartphone, tablet, or laptop. 100% free, 100% offline resilient.
          </p>

          {/* Two High-Contrast Buttons: Solid Primary + Outlined White */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 max-w-md sm:max-w-none mx-auto">
            <Button
              type="button"
              variant="primary"
              onClick={() => onSelectDestination('chat')}
            >
              <Zap className="w-5 h-5" aria-hidden="true" />
              <span>Launch AI Guardian</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>

            <Button
              type="button"
              variant="dark-outline"
              onClick={() => onSelectDestination('camera')}
            >
              <Camera className="w-5 h-5" aria-hidden="true" />
              <span>Open AI Medical Camera</span>
            </Button>
          </div>

          {/* 3 Reassurance Items with Check Icons */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-sm sm:text-base font-semibold text-white/90">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" aria-hidden="true" />
              <span>Free</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" aria-hidden="true" />
              <span>Works offline</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" aria-hidden="true" />
              <span>No login</span>
            </span>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* J3. HOSPITAL-GRADE 4-COLUMN FOOTER (14-15px Typography)  */}
      {/* ======================================================== */}
      <footer className="bg-surface border-t border-border pt-14 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Col 1: Brand */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-base border border-border p-1 flex items-center justify-center shrink-0">
                  <img
                    src="/sanjeevani-logo.png"
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-xl font-extrabold text-ink">Sanjeevani</span>
                <Badge variant="soft">v2.0</Badge>
              </div>
              <p className="text-sm sm:text-[15px] text-ink-muted font-normal leading-relaxed">
                The Pre-Hospital Digital Nervous System designed for Indian schools, teachers, and everyday families. Developed by students of Seth M.R. Jaipuria School for Kaleidoscope 2025–26.
              </p>
            </div>

            {/* Col 2: Instruments */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-ink uppercase tracking-widest">
                Instruments
              </h3>
              <ul className="space-y-2.5 text-sm sm:text-[15px] text-ink-muted font-medium">
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectDestination('chat')}
                    className="hover:text-primary transition-colors cursor-pointer text-left"
                  >
                    AI Guardian Triage (⌘G / ⌘E)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectDestination('camera')}
                    className="hover:text-primary transition-colors cursor-pointer text-left"
                  >
                    AI Medical Camera
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectDestination('mythbuster')}
                    className="hover:text-primary transition-colors cursor-pointer text-left"
                  >
                    MythBuster Engine
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectDestination('medicines')}
                    className="hover:text-primary transition-colors cursor-pointer text-left"
                  >
                    Cheap Medicines Finder
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Protocols */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-ink uppercase tracking-widest">
                Protocols
              </h3>
              <ul className="space-y-2.5 text-sm sm:text-[15px] text-ink-muted font-medium">
                <li>
                  <button
                    type="button"
                    onClick={() => onStartRespond('unconscious')}
                    className="hover:text-primary transition-colors cursor-pointer text-left"
                  >
                    Adult CPR &amp; AED
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onStartRespond('bleeding')}
                    className="hover:text-primary transition-colors cursor-pointer text-left"
                  >
                    Arterial Bleeding
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onStartRespond('burns')}
                    className="hover:text-primary transition-colors cursor-pointer text-left"
                  >
                    Thermal Burns
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onStartRespond('choking')}
                    className="hover:text-primary transition-colors cursor-pointer text-left"
                  >
                    Choking Thrusts
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Account & SOS */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-ink uppercase tracking-widest">
                Account &amp; SOS
              </h3>
              <ul className="space-y-2.5 text-sm sm:text-[15px] text-ink-muted font-medium">
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('signin')}
                    className="hover:text-primary transition-colors cursor-pointer text-left"
                  >
                    Sign In
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('signup')}
                    className="hover:text-primary transition-colors cursor-pointer text-left"
                  >
                    Create Account
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectDestination('handoff')}
                    className="hover:text-primary transition-colors cursor-pointer text-left"
                  >
                    Paramedic SBAR Docket
                  </button>
                </li>
                <li>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-success">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>PWA Offline Cache Active</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Visible Emergency Disclaimer Bar Above Copyright */}
          <div className="p-4 rounded-xl bg-base border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-sm sm:text-[15px]">
            <span className="font-bold text-ink">
              First-aid guidance only. In serious emergencies, always dial 112 immediately.
            </span>
            <button
              type="button"
              onClick={handleTriggerSOS}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-alert text-white text-sm font-bold hover:bg-alert-dark transition-colors cursor-pointer shrink-0"
            >
              <PhoneCall className="w-4 h-4" aria-hidden="true" />
              <span>Dial 112 SOS</span>
            </button>
          </div>

          {/* Copyright Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-ink-muted font-medium">
            <span>© 2026 Sanjeevani v2.0 · Seth M.R. Jaipuria School Innovation.</span>
            <span>Power-user shortcuts: Cmd/Ctrl + G (AI Guardian) · Cmd/Ctrl + E (Emergency Chat)</span>
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* K. MOBILE STICKY BOTTOM ACTION BAR (Appears past Hero)   */}
      {/* ======================================================== */}
      {showMobileStickyBar && (
        <div
          role="region"
          aria-label="Quick emergency actions"
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border px-4 py-2.5 shadow-lg"
        >
          <div className="grid grid-cols-12 gap-2.5 max-w-md mx-auto">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onSelectDestination('chat')}
              className="col-span-8 min-h-[44px]"
            >
              <Zap className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Launch AI Guardian</span>
            </Button>

            <Button
              type="button"
              variant="alert"
              size="sm"
              onClick={handleTriggerSOS}
              className="col-span-4 min-h-[44px]"
            >
              <PhoneCall className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>112 SOS</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
