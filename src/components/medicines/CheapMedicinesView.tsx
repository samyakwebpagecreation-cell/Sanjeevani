import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Pill, 
  Sparkles, 
  Zap, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingDown, 
  MapPin, 
  Building2, 
  ArrowRight, 
  RotateCcw,
  Globe,
  Info,
  DollarSign,
  HeartPulse,
  Share2,
  Camera,
  Upload
} from 'lucide-react';
import { searchCheapMedicine, MedicineSavingsReport, MedicineWebSource } from '../../services/cheapMedicinesService';
import { CURATED_MEDICATIONS } from '../../services/mythBusterService';
import { Tilt3D } from '../common/Tilt3D';
import { PrescriptionScannerModal } from './PrescriptionScannerModal';

interface CheapMedicinesViewProps {
  onBackToHome?: () => void;
  onOpenRadar?: () => void;
}

export const CheapMedicinesView: React.FC<CheapMedicinesViewProps> = ({
  onBackToHome,
  onOpenRadar
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('Augmentin 625');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [report, setReport] = useState<MedicineSavingsReport | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // Popular everyday medicines in India
  const popularMedicines = [
    { name: 'Augmentin 625', category: 'Antibiotic' },
    { name: 'Dolo 650', category: 'Fever & Pain' },
    { name: 'Pan-D', category: 'Acidity & Gas' },
    { name: 'Telma 40', category: 'Blood Pressure' },
    { name: 'Glycomet 500', category: 'Diabetes' },
    { name: 'Montair-LC', category: 'Allergy & Cough' },
    { name: 'Azithral 500', category: 'Throat & Infection' },
    { name: 'Atorva 10', category: 'Cholesterol' }
  ];

  // Initial load
  useEffect(() => {
    executeSearch('Augmentin 625');
  }, []);

  const executeSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) return;

    setIsLoading(true);
    setStatusText(`Searching real web via Firecrawl for "${q}"...`);
    setReport(null);

    try {
      const res = await searchCheapMedicine(q, (status) => setStatusText(status));
      setReport(res);
    } catch (err) {
      console.error('Medicine search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleCopyScript = () => {
    if (!report?.whatToTellChemist) return;
    navigator.clipboard.writeText(report.whatToTellChemist);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="min-h-screen pb-24 space-y-10 sm:space-y-14 animate-in fade-in duration-300">
      
      {/* 1. HERO HEADER (Calm, Airy, Uncluttered) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="relative overflow-hidden rounded-3xl sm:rounded-[36px] bg-gradient-to-br from-[#0F3D36] via-[#0E5A50] to-[#176256] p-6 sm:p-10 lg:p-14 text-white shadow-xl border border-white/15">
          
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-accent border border-white/15">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Live Web Search: Firecrawl Search API Active</span>
            </div>

            <h1 className="fluid-section-title font-bold tracking-tight text-white leading-tight font-display-italic">
              Find Cheap Medicines & Generic Substitutes in India
            </h1>

            <p className="text-sm sm:text-base text-white/85 leading-relaxed font-normal">
              Stop overpaying for brand marketing. Search any branded medicine to discover verified <strong>Jan Aushadhi (PMBJP)</strong> and generic chemical equivalents with real web pricing from 1mg, PharmEasy, and government generic drug lists.
            </p>

            {/* Streamlined Airy Telemetry Capsule */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-white/80 font-medium">
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                ⚡ 60% – 90% Savings
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                🏛️ 10,000+ Jan Aushadhi Stores
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                🧬 100% Same Active Salt
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                🛡️ WHO-GMP Standards
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. UNIFIED SEARCH BAR WITH INTEGRATED CAMERA OCR */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-5">
        
        <form onSubmit={handleFormSubmit} className="relative flex items-center fluid-dock elevation-3 rounded-2xl border-2 border-border/80 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 transition-all p-1.5 gap-1.5 sm:gap-2">
          <div className="pl-2.5 sm:pl-3 text-ink-muted pointer-events-none shrink-0">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type any medicine (e.g. Augmentin 625, Dolo 650, Pan-D, Telma 40)..."
            style={{ color: '#0F172A' }}
            className="flex-1 min-w-0 bg-transparent text-[#0F172A] !text-[#0F172A] text-xs sm:text-base font-semibold focus:outline-none placeholder:text-[#64748B] !placeholder:text-[#64748B] border-none px-1.5 sm:px-2"
          />

          {/* Integrated Camera OCR Button - visible on mobile & desktop */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-base hover:bg-border/60 text-ink text-[11px] sm:text-xs font-bold border border-border transition-colors cursor-pointer shrink-0"
            title="Scan paper prescription with camera OCR"
          >
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span>Scan Rx</span>
          </button>

          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="btn-fluid btn-fluid-primary px-3.5 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer shrink-0 flex items-center space-x-1 sm:space-x-1.5"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Search</span>
              </>
            )}
          </button>
        </form>


        {/* Quick Suggestion Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
            Popular Essential Medicines in India:
          </span>
          <div className="flex flex-wrap gap-2">
            {popularMedicines.map((m) => (
              <button
                key={m.name}
                type="button"
                onClick={() => {
                  setSearchQuery(m.name);
                  executeSearch(m.name);
                }}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer elevation-1 hover:elevation-2 btn-fluid-interactive ${
                  searchQuery.toLowerCase().includes(m.name.toLowerCase())
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface border-border text-ink hover:border-primary/40 hover:bg-base'
                }`}
              >
                <Pill className="w-3.5 h-3.5 opacity-70" />
                <span>{m.name}</span>
                <span className="text-[10px] opacity-75 font-normal">({m.category})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. LOADING STATE */}
      {isLoading && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="p-10 rounded-3xl bg-surface border border-border text-center space-y-4 shadow-sm">
            <div className="relative mx-auto w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
              <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-ink">Searching Real Web & Auditing Drug Prices</h3>
              <p className="text-xs text-primary font-mono font-semibold animate-pulse">
                {statusText}
              </p>
              <p className="text-[11px] text-ink-muted leading-relaxed pt-1">
                Querying Firecrawl Search API across 1mg, PharmEasy, and PMBJP Jan Aushadhi catalogs...
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 4. RESULTS DISPLAY */}
      {report && !isLoading && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* A. Hero Savings Card */}
          <Tilt3D maxTilt={4} scale={1.01}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white shadow-xl space-y-4 border border-emerald-400/20">
              
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/15 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">
                    Price Audit for: {report.searchedName}
                  </span>
                  {report.isLiveWebResult && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-mono font-bold flex items-center space-x-1">
                      <Globe className="w-3 h-3" />
                      <span>Live Firecrawl Web Result</span>
                    </span>
                  )}
                </div>

                {report.firecrawlSearchLatencyMs > 0 && (
                  <span className="text-[10px] text-white/70 font-mono">
                    ⚡ Web Search: {(report.firecrawlSearchLatencyMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>

              {/* Huge Savings Headline */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-2">
                  <div className="flex items-center space-x-2 text-accent">
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Massive Generic Savings</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Save {report.savingsPercentage} on this medicine
                  </h2>
                  <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                    {report.savingsRupees}. Jan Aushadhi and generic equivalents contain the identical active chemical salt with matching therapeutic bioequivalence.
                  </p>
                </div>

                {/* Side-by-Side Price Comparison Pill */}
                <div className="md:col-span-5 p-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/15 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/75">Branded Market Price:</span>
                    <span className="font-bold line-through text-red-300 font-mono text-sm">
                      {report.brandedMarketPrice}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                    <span className="text-white font-bold">Jan Aushadhi / Generic:</span>
                    <span className="font-extrabold text-accent font-mono text-lg sm:text-xl">
                      {report.genericJanAushadhiPrice}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </Tilt3D>

          {/* B. Chemical Salt & Therapeutic Indication */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-border shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                  Active Pharmaceutical Ingredient (API)
                </span>
                <h3 className="text-base sm:text-lg font-bold text-ink">
                  {report.genericSaltName}
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {report.uses}
                </p>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {report.isPrescriptionRequired ? 'Rx Prescription Required' : 'OTC Available'}
                </span>
              </div>
            </div>
          </div>

          {/* B2. CLINICAL GUIDANCE: WHEN TO GIVE & WHEN NOT TO GIVE */}
          {(() => {
            const med = CURATED_MEDICATIONS.find(m => 
              report.searchedName.toLowerCase().includes(m.medicineName.toLowerCase()) ||
              report.genericSaltName.toLowerCase().includes(m.genericSalt.toLowerCase()) ||
              m.commonBrands.some(b => report.searchedName.toLowerCase().includes(b.toLowerCase()) || report.genericSaltName.toLowerCase().includes(b.toLowerCase()))
            );

            return (
              <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-border shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <div className="flex items-center space-x-2">
                    <HeartPulse className="w-5 h-5 text-primary" />
                    <h3 className="text-sm sm:text-base font-bold text-ink">
                      Clinical Administration: When to Give & Safety Rules
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {med ? med.emergencyRole : 'Clinical Guidance'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* When to Give */}
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>When to Give (Indications)</span>
                    </span>
                    <ul className="text-xs text-ink space-y-1.5 font-medium">
                      {med ? (
                        med.whenToGive.map((item, idx) => (
                          <li key={idx} className="flex items-start space-x-1.5">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <>
                          <li className="flex items-start space-x-1.5">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>Take strictly for the clinical symptoms and diagnosis prescribed by your physician.</span>
                          </li>
                          <li className="flex items-start space-x-1.5">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>Complete the entire prescribed dosage course even if symptoms improve early.</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  {/* When NOT to Give */}
                  <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-2">
                    <span className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>When NEVER to Give (Red Flags)</span>
                    </span>
                    <ul className="text-xs text-ink space-y-1.5 font-medium">
                      {med ? (
                        med.whenNotToGive.map((item, idx) => (
                          <li key={idx} className="flex items-start space-x-1.5">
                            <span className="text-red-600 font-bold">✕</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <>
                          <li className="flex items-start space-x-1.5">
                            <span className="text-red-600 font-bold">✕</span>
                            <span>NEVER give oral medicine to an unconscious, drowsy, or violently vomiting patient.</span>
                          </li>
                          <li className="flex items-start space-x-1.5">
                            <span className="text-red-600 font-bold">✕</span>
                            <span>DO NOT take if you have a documented allergy to this pharmaceutical class.</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {med && (
                  <div className="pt-2 border-t border-border/80 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                    <span><strong>Timing:</strong> {med.timingAndDosage.foodRelation} • {med.timingAndDosage.frequency}</span>
                    <span><strong>Max Safe Limit:</strong> {med.timingAndDosage.maxDailyLimit}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* C. Top Generic Alternatives Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Top Verified Generic Alternatives in India
                </h3>
              </div>
              <span className="text-[11px] text-ink-muted">CDSCO Approved</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {report.topGenericAlternatives.map((alt, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-surface border border-border hover:border-primary/40 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mb-1.5">
                      {alt.savingsNote || 'Generic Alternative'}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-ink leading-tight">{alt.name}</h4>
                    <p className="text-[11px] text-ink-muted mt-0.5">{alt.manufacturer}</p>
                  </div>

                  <div className="pt-2 border-t border-border/80 flex items-center justify-between">
                    <span className="text-[10px] text-ink-muted">Approx MRP:</span>
                    <span className="text-xs font-mono font-bold text-primary">{alt.approxPrice}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* D. "What to Tell Your Chemist" Script Card */}
          <div className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  What to Tell Your Chemist at the Counter
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyScript}
                className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-surface border border-amber-500/40 text-xs font-semibold text-ink hover:bg-amber-500/20 cursor-pointer transition-colors"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-600" />
                    <span>Copy Script</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs sm:text-sm text-ink font-medium italic leading-relaxed bg-surface/80 p-3 rounded-2xl border border-amber-500/20">
              "{report.whatToTellChemist}"
            </p>

            <p className="text-[11px] text-ink-muted leading-relaxed">
              💡 <em>Pharmacist tip: Under Indian drug guidelines, chemists are legally permitted to dispense generic salt equivalents of prescribed brands if requested by the patient.</em>
            </p>
          </div>

          {/* E. Real Web Sources & Verified Links (from Firecrawl) */}
          {report.sources && report.sources.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                    Verified Web Sources & Pharmacy Listings
                  </h3>
                </div>
                <span className="text-[10px] text-ink-muted font-mono">Live Crawl</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {report.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl bg-surface border border-border hover:border-primary/40 shadow-2xs space-y-1.5 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-primary font-bold mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10">{src.sourceName}</span>
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <h4 className="text-xs font-bold text-ink group-hover:text-primary transition-colors line-clamp-1">
                        {src.title}
                      </h4>
                      {src.snippet && (
                        <p className="text-[11px] text-ink-muted line-clamp-2 mt-1 leading-snug">
                          {src.snippet}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 text-[10px] text-ink-muted truncate font-mono">
                      {src.url.replace('https://', '')}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* F. Jan Aushadhi Kendra Locator & Action Bar */}
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 rounded-2xl bg-accent/20 text-accent shrink-0">
                <Building2 className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">Find Your Nearest Jan Aushadhi Kendra</h4>
                <p className="text-xs text-ink-muted leading-tight mt-0.5">
                  Over 10,000 government-subsidized generic pharmacy centers operating across India.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto">
              {onOpenRadar && (
                <button
                  type="button"
                  onClick={onOpenRadar}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 btn-press cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Open ER & Pharmacy Radar</span>
                </button>
              )}

              <a
                href="http://janaushadhi.gov.in/KendraDetails.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark btn-press cursor-pointer shadow-xs"
              >
                <span>Jan Aushadhi Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* G. Mandatory Clinical Safety Notice */}
          <div className="p-4 rounded-2xl bg-base border border-border text-[11px] text-ink-muted space-y-1">
            <div className="flex items-center space-x-1.5 text-alert font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Clinical Safety & CDSCO Compliance Notice</span>
            </div>
            <p className="leading-relaxed">
              Generic medicines share identical chemical salts, strength, dosage form, and bioavailability with branded counterparts according to the CDSCO and WHO guidelines. However, never change critical chronic medications (e.g. cardiac, anti-epileptic, psychiatric, or insulin) without consulting your prescribing physician.
            </p>
          </div>

        </section>
      )}

      {/* Prescription Camera OCR & Multi-Drug Savings Modal */}
      <PrescriptionScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectMedicineForRadar={(med) => {
          setSearchQuery(med);
          executeSearch(med);
        }}
      />

    </div>
  );
};
