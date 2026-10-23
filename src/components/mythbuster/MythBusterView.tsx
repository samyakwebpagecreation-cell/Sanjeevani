import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  ArrowRight, 
  Clock, 
  Pill, 
  Flame, 
  Droplet, 
  HeartPulse, 
  ExternalLink, 
  Copy, 
  Check, 
  RotateCcw,
  BookOpen,
  Share2,
  ShieldCheck,
  Building2,
  HelpCircle
} from 'lucide-react';
import { 
  CURATED_MYTHS, 
  CURATED_MEDICATIONS, 
  MedicalMythEntry, 
  MedicationTimingEntry,
  verifyMedicalMythWithAI,
  findMedicationTimingWithAI
} from '../../services/mythBusterService';
import { Destination } from '../../types';

interface MythBusterViewProps {
  onSelectDestination?: (dest: Destination) => void;
  onOpenRadar?: () => void;
}

export const MythBusterView: React.FC<MythBusterViewProps> = ({
  onSelectDestination,
  onOpenRadar
}) => {
  const [activeTab, setActiveTab] = useState<'myths' | 'medications'>('myths');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Active selected or verified entry
  const [selectedMyth, setSelectedMyth] = useState<MedicalMythEntry>(CURATED_MYTHS[0]);
  const [selectedMedication, setSelectedMedication] = useState<MedicationTimingEntry>(CURATED_MEDICATIONS[0]);
  const [copiedChemistScript, setCopiedChemistScript] = useState(false);

  // Reset query on tab change
  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  const handleVerify = async (queryToVerify?: string) => {
    const q = (queryToVerify || searchQuery).trim();
    if (!q) return;

    setIsVerifying(true);

    if (activeTab === 'myths') {
      const result = await verifyMedicalMythWithAI(q);
      setSelectedMyth(result);
    } else {
      const result = await findMedicationTimingWithAI(q);
      setSelectedMedication(result);
    }

    setIsVerifying(false);
  };

  const handleCopyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedChemistScript(true);
    setTimeout(() => setCopiedChemistScript(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1310] text-slate-900 dark:text-white pb-24 transition-colors duration-200">
      
      {/* 1. HERO HEADER (Matches exact reference design from screenshot) */}
      <section className="relative pt-6 sm:pt-12 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        
        {/* Top Centered Pill Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-4 sm:mb-5 shadow-2xs backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>MULTI-SECTOR REALITY ENGINE (EVIDENCE-BASED VS DESI MYTHS)</span>
        </div>

        {/* Big Bold Headline */}
        <h1 className="fluid-hero-title font-black tracking-tight text-slate-900 dark:text-white mb-4">
          Reality Check Engine
        </h1>

        {/* 2-line Subtitle with Color Accents */}
        <p className="max-w-2xl mx-auto text-xs sm:text-base text-slate-900 leading-relaxed mb-6 sm:mb-8 font-bold">
          Validate emergency first-aid assumptions & desi remedies with ground-truth clinical data comparing{' '}
          <span className="font-extrabold text-blue-800">Traditional Beliefs</span>,{' '}
          <span className="font-extrabold text-amber-800">Biological Reality</span>, and{' '}
          <span className="font-extrabold text-emerald-800">Accredited Protocols (AHA, AIIMS & WHO)</span>.
        </p>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center justify-center mb-8 sm:mb-10">
          <div className="fluid-dock elevation-2 inline-flex p-1 sm:p-1.5 rounded-full border border-[#DDD5CA] dark:border-[#223830] shadow-inner">
            <button
              onClick={() => setActiveTab('myths')}
              className={`btn-fluid flex items-center space-x-1.5 sm:space-x-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'myths'
                  ? 'bg-white dark:bg-primary text-slate-900 dark:text-white shadow-md border border-slate-200/80 dark:border-primary/50'
                  : 'text-slate-600 hover:text-slate-900 dark:text-ink-muted hover:dark:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
              <span>First-Aid Myths</span>
            </button>

            <button
              onClick={() => setActiveTab('medications')}
              className={`btn-fluid flex items-center space-x-1.5 sm:space-x-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'medications'
                  ? 'bg-white dark:bg-primary text-slate-900 dark:text-white shadow-md border border-slate-200/80 dark:border-primary/50'
                  : 'text-slate-600 hover:text-slate-900 dark:text-ink-muted hover:dark:text-white'
              }`}
            >
              <Pill className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              <span>Medication Rules</span>
            </button>
          </div>
        </div>

        {/* Floating Search Bar with Glowing Ambient Halo */}
        <div className="relative max-w-3xl mx-auto mb-8 sm:mb-10">
          
          {/* Warm Peach / Amber Ambient Glow */}
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-300/35 via-orange-400/30 to-amber-400/35 blur-2xl opacity-90 pointer-events-none animate-ambient-glow" />

          {/* Actual Input Container */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleVerify(); }}
            className="relative flex items-center w-full fluid-dock elevation-3 border-2 border-[#FED7AA] dark:border-amber-500/30 rounded-2xl sm:rounded-full shadow-[0_16px_45px_rgba(251,146,60,0.25)] p-1.5 sm:p-2.5 transition-all focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-200/40"
          >
            <div className="pl-2.5 sm:pl-4 pr-1.5 sm:pr-2 flex items-center pointer-events-none">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'myths'
                  ? "Ask any medical belief (e.g., 'Toothpaste on burns', 'Haldi on cuts')..."
                  : "Search any medicine (e.g., 'When to take Aspirin', 'Dolo 650', 'ORS')..."
              }
              style={{ color: '#0F172A' }}
              className="flex-1 min-w-0 bg-transparent border-none text-[#0F172A] !text-[#0F172A] text-xs sm:text-base placeholder:text-[#64748B] !placeholder:text-[#64748B] focus:outline-none px-1.5 sm:px-2 font-semibold"
            />

            <button
              type="submit"
              disabled={isVerifying}
              className="btn-fluid btn-fluid-accent flex items-center space-x-1 sm:space-x-1.5 px-4 sm:px-7 py-2 sm:py-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg shrink-0 disabled:opacity-60"
            >
              <span>{isVerifying ? 'CHECKING...' : 'VERIFY'}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </button>
          </form>

        </div>

        {/* Curated Clickable Scenario Pills (Clean, uncluttered top picks) */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto mb-14">
          {activeTab === 'myths' ? (
            CURATED_MYTHS.slice(0, 5).map((m) => {
              const isSelected = selectedMyth?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMyth(m);
                    setSearchQuery(m.claim);
                  }}
                  className={`btn-fluid inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FEF3C7] border-2 border-amber-400 text-[#78350F] shadow-xs ring-2 ring-amber-300/30'
                      : 'bg-white dark:bg-[#13221C] border-[#E2E8F0] dark:border-[#223830] hover:border-amber-300 text-slate-700 dark:text-slate-300 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{m.claim}</span>
                </button>
              );
            })
          ) : (
            CURATED_MEDICATIONS.slice(0, 5).map((med) => {
              const isSelected = selectedMedication?.id === med.id;
              return (
                <button
                  key={med.id}
                  onClick={() => {
                    setSelectedMedication(med);
                    setSearchQuery(med.medicineName);
                  }}
                  className={`btn-fluid inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-xs ring-2 ring-emerald-300/30'
                      : 'bg-white dark:bg-[#13221C] border-[#E2E8F0] dark:border-[#223830] hover:border-emerald-300 text-slate-700 dark:text-slate-300 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  <Pill className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{med.medicineName}</span>
                </button>
              );
            })
          )}
        </div>

      </section>

      {/* 2. MAIN RESULTS DISPLAY CARD */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* A. MYTHBUSTER CARD */}
        {activeTab === 'myths' && selectedMyth && (
          <div className="squircle-card glass-panel elevation-3 bg-white/95 dark:bg-[#13221C]/95 rounded-[36px] border border-slate-200/90 dark:border-[#223830] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
            
            {/* Verdict Header Banner */}
            <div className={`p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 border-b ${
              selectedMyth.verdict === 'BUSTED' 
                ? 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40' 
                : 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40'
            }`}>
              <div className="flex items-center space-x-3.5">
                <div className={`p-2.5 rounded-2xl ${
                  selectedMyth.verdict === 'BUSTED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-emerald-600 text-white shadow-xs'
                }`}>
                  {selectedMyth.verdict === 'BUSTED' ? (
                    <XCircle className="w-6 h-6" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Clinical Reality Verdict
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase ${
                      selectedMyth.verdict === 'BUSTED'
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {selectedMyth.verdict}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedMyth.hazardSeverity}
                  </h2>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1B2C24] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2A4237] shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{selectedMyth.clinicalAuthority}</span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-10 space-y-8">
              
              {/* Claim vs Reality Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Traditional Myth Box */}
                <div className="p-6 rounded-2xl elevation-1 hover:elevation-2 transition-all duration-300 bg-[#FFFBEB] dark:bg-amber-950/20 border border-[#FDE68A] dark:border-amber-500/30 space-y-3">
                  <div className="flex items-center space-x-2 text-[#92400E] dark:text-amber-400 text-xs font-extrabold uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>The Traditional Belief / Myth</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    "{selectedMyth.claim}"
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                    {selectedMyth.mythSummary}
                  </p>
                  <div className="pt-2 text-xs text-amber-950 font-bold">
                    <span className="font-extrabold text-amber-900">Why it persists:</span> {selectedMyth.whyPeopleBelieveIt}
                  </div>
                </div>

                {/* Biological Reality Box */}
                <div className="p-6 rounded-2xl elevation-1 hover:elevation-2 transition-all duration-300 bg-[#F0FDF4] dark:bg-emerald-950/20 border border-[#BBF7D0] dark:border-emerald-500/30 space-y-3">
                  <div className="flex items-center space-x-2 text-[#166534] dark:text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
                    <HeartPulse className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>The Biological Reality (Science)</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    What Actually Happens Inside Tissue
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                    {selectedMyth.biologicalReality}
                  </p>
                </div>

              </div>

              {/* What You MUST Do Instead (Accredited Action Plan) */}
              <div className="p-6 sm:p-8 rounded-3xl elevation-1 border border-[#E2E8F0] dark:border-[#1E332A] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-400 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Accredited First-Aid Protocol (What To Do Instead)</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-[#13221C] px-3 py-1 rounded-lg border border-slate-200 dark:border-[#223830]">
                    AHA & AIIMS Standard
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  {selectedMyth.accreditedProtocol.map((step, idx) => (
                    <div key={idx} className="flex items-start space-x-3 p-4 rounded-2xl bg-white dark:bg-[#13221C] border border-slate-200/90 dark:border-[#223830] shadow-2xs">
                      <div className="flex h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-black text-xs items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Action Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-[#223830]">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Need real-time emergency guidance for this scenario right now?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => onSelectDestination && onSelectDestination('chat')}
                    className="btn-fluid btn-fluid-primary px-5 py-2.5 text-xs font-bold shadow-sm space-x-1.5"
                  >
                    <span>Open AI First-Aid Helper</span>
                  </button>
                  <button
                    onClick={() => onSelectDestination && onSelectDestination('camera')}
                    className="btn-fluid btn-fluid-glass border border-[#0E5A50]/40 text-[#0E5A50] dark:text-emerald-400 px-5 py-2.5 text-xs font-bold"
                  >
                    <span>Scan with AI Camera</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* B. MEDICATION TIMING & CHEAP FINDER CARD */}
        {activeTab === 'medications' && selectedMedication && (
          <div className="squircle-card glass-panel elevation-3 bg-white/95 dark:bg-[#13221C]/95 rounded-[36px] border border-slate-200/90 dark:border-[#223830] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
            
            {/* Medication Header */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-[#13221C] border-b border-emerald-200/80 dark:border-[#223830] flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="px-3 py-1 rounded-full bg-[#0E5A50] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                    {selectedMedication.emergencyRole}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {selectedMedication.drugClass}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {selectedMedication.medicineName}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-400 font-bold mt-0.5">
                  Active Salt: {selectedMedication.genericSalt}
                </p>
              </div>

              {/* Jan Aushadhi Savings Badge */}
              <div className="flex items-center space-x-3 bg-white/90 dark:bg-[#1B2C24]/90 p-3.5 rounded-2xl border border-emerald-200/90 dark:border-[#2A4237] shadow-xs backdrop-blur-md">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Jan Aushadhi Savings</div>
                  <div className="text-base font-black text-emerald-700 dark:text-emerald-400">Save {selectedMedication.savingsPercentage}</div>
                </div>
              </div>
            </div>

            {/* Clinical Guidance Sections: When to Give vs When NOT to Give */}
            <div className="p-6 sm:p-10 space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 🟢 WHEN TO GIVE (Indications) */}
                <div className="p-6 rounded-2xl elevation-1 hover:elevation-2 transition-all duration-300 bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 space-y-4">
                  <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>When to Give (Exact Indications)</span>
                  </div>
                  <div className="space-y-2.5">
                    {selectedMedication.whenToGive.map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold">
                        <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 🔴 WHEN NEVER TO GIVE (Contraindications) */}
                <div className="p-6 rounded-2xl elevation-1 hover:elevation-2 transition-all duration-300 bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 space-y-4">
                  <div className="flex items-center space-x-2 text-rose-800 dark:text-rose-400 text-xs font-extrabold uppercase tracking-wider">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>When NEVER to Give (Red Flags)</span>
                  </div>
                  <div className="space-y-2.5">
                    {selectedMedication.whenNotToGive.map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold">
                        <span className="text-rose-600 font-bold mt-0.5">✕</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Timing, Administration & Safe Dosage */}
              <div className="p-6 rounded-2xl bg-[#F8FAFC] dark:bg-[#0E1A15] border border-[#E2E8F0] dark:border-[#1E332A] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Recommended Dose</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{selectedMedication.timingAndDosage.recommendedDose}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Relation to Food</span>
                  <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5">{selectedMedication.timingAndDosage.foodRelation}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Frequency / Gap</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{selectedMedication.timingAndDosage.frequency}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Max 24-Hr Limit</span>
                  <p className="font-bold text-rose-600 dark:text-rose-400 text-sm mt-0.5">{selectedMedication.timingAndDosage.maxDailyLimit}</p>
                </div>
              </div>

              {/* AI Cheap Medicine Price Radar & Jan Aushadhi Match */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#0E5A50] text-white shadow-xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-amber-300" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Jan Aushadhi Generic Price Radar
                    </span>
                  </div>
                  <span className="text-xs text-white/80 font-medium">PMBJP Jan Aushadhi Indian Generic</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
                    <span className="text-[11px] text-white/75 font-medium">Branded Market MRP</span>
                    <div className="text-xl font-bold line-through text-red-300 mt-1">
                      {selectedMedication.brandedMarketPrice}
                    </div>
                  </div>

                  <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-emerald-300/60 shadow-inner">
                    <span className="text-[11px] text-emerald-200 font-bold">Jan Aushadhi Generic Price</span>
                    <div className="text-2xl font-black text-emerald-200 mt-1">
                      {selectedMedication.genericJanAushadhiPrice}
                    </div>
                  </div>

                  <div className="bg-amber-400/20 backdrop-blur-md p-4 rounded-2xl border border-amber-300/50 flex flex-col justify-center">
                    <span className="text-[11px] text-amber-300 font-bold uppercase">Total Patient Savings</span>
                    <div className="text-2xl font-black text-amber-300 mt-0.5">
                      {selectedMedication.savingsPercentage} OFF
                    </div>
                  </div>
                </div>

                {/* Chemist Handoff Script */}
                <div className="bg-black/35 p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <span className="text-[10px] font-bold uppercase text-white/70 tracking-wide">
                      What to ask your local chemist:
                    </span>
                    <p className="text-xs text-white/95 font-mono mt-0.5">
                      "{selectedMedication.whatToTellChemist}"
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyScript(selectedMedication.whatToTellChemist)}
                    className="btn-fluid btn-fluid-glass border border-white/20 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 space-x-1.5"
                  >
                    {copiedChemistScript ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedChemistScript ? 'Copied!' : 'Copy Script'}</span>
                  </button>
                </div>

                {/* Deep Link to Cheap Medicines Search */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-white/80">
                    Want real-time web pricing and batch availability?
                  </span>
                  <button
                    onClick={() => onSelectDestination && onSelectDestination('medicines')}
                    className="btn-fluid btn-fluid-accent px-5 py-2.5 text-slate-900 text-xs font-bold shadow-md space-x-2"
                  >
                    <span>Open Live Web Medicine Finder</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
};
