import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  PhoneCall, 
  AlertTriangle,
  Mic,
  MicOff,
  Copy,
  Check,
  CheckCircle2,
  Search,
  Pill,
  ShieldAlert,
  HeartPulse,
  Leaf,
  ChevronDown,
  ChevronUp,
  Minimize2
} from 'lucide-react';
import { askRakshaSaathiBot, RakshaSaathiBotResult } from '../../services/aiService';
import { getAutomaticEscalationDispatch, EmergencyFacility, RouteComputationResult } from '../../services/placesRoutesService';
import { EmergencyRouteMap } from '../common/EmergencyRouteMap';

interface FloatingChatWidgetProps {
  onOpenFullChat: () => void;
  onTriggerEscalation: (reason?: string) => void;
  onSelectDestination?: (dest: any) => void;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  onOpenFullChat,
  onTriggerEscalation,
  onSelectDestination
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RakshaSaathiBotResult | null>(null);
  const [facility, setFacility] = useState<EmergencyFacility | null>(null);
  const [route, setRoute] = useState<RouteComputationResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeChip, setActiveChip] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Rotating search engine placeholders
  const placeholderSuggestions = [
    'Ask RakshaSaathi Bot: e.g. CPR 1-2-3 steps...',
    'Search medicine: e.g. Dolo 650 Jan Aushadhi generic & savings...',
    'Search home remedies: e.g. burn care, severe cough, acidity...',
    'Emergency decision: e.g. choking baby, snakebite protocol...'
  ];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % placeholderSuggestions.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Global Keyboard Shortcut: Cmd/Ctrl + K or / to focus search prompt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsMinimized(false);
        inputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsMinimized(false);
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-scroll when result arrives
  useEffect(() => {
    if (result) {
      resultEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);

  // Voice Web Speech Recognition initialization
  const toggleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setInput(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => {
        setIsListening(false);
        if (inputRef.current?.value) {
          handleSearch(inputRef.current.value);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Voice search failed to start:', err);
      setIsListening(false);
    }
  };

  // Text-To-Speech SpeechSynthesis
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window) || !result) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    let speakable = `${result.headline}. `;
    if (result.emergencySteps) {
      speakable += result.emergencySteps.map((s) => `Step ${s.stepNumber}, ${s.title}: ${s.instruction}`).join('. ');
    } else if (result.medicineData) {
      speakable += `Generic salt is ${result.medicineData.genericSalt}. Jan Aushadhi alternative is ${result.medicineData.janAushadhiName}, offering ${result.medicineData.savings}. Supportive home remedy: ${result.medicineData.supportiveRemedies.join(', ')}.`;
    } else if (result.homeRemedies) {
      speakable += result.homeRemedies.map((r) => `${r.title}: ${r.preparation}`).join('. ');
    } else {
      speakable += result.fullMarkdown.replace(/[*#_`]/g, '');
    }

    const clean = speakable.replace(/[*#_`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Copy structured output
  const handleCopy = () => {
    if (!result) return;
    let textToCopy = `[RakshaSaathi Bot - Clinical First-Aid Intelligence]\n\n`;
    textToCopy += `${result.headline}\n\n`;
    if (result.emergencySteps) {
      textToCopy += `1-2-3 Emergency Steps:\n`;
      result.emergencySteps.forEach((s) => {
        textToCopy += `${s.stepNumber}. ${s.title}: ${s.instruction}\n`;
      });
      if (result.contraindications?.length) {
        textToCopy += `\nCRITICAL CONTRAINDICATIONS:\n` + result.contraindications.map((c) => `- ${c}`).join('\n') + `\n`;
      }
    } else if (result.medicineData) {
      textToCopy += `Generic Salt: ${result.medicineData.genericSalt}\n`;
      textToCopy += `PMBJP Jan Aushadhi: ${result.medicineData.janAushadhiName} (${result.medicineData.savings})\n`;
      textToCopy += `Chemist Ask: "${result.medicineData.whatToTellChemist}"\n\n`;
      textToCopy += `Supportive Home Remedies:\n` + result.medicineData.supportiveRemedies.map((r) => `- ${r}`).join('\n') + `\n`;
    } else if (result.homeRemedies) {
      textToCopy += `Home Remedies:\n` + result.homeRemedies.map((r) => `- ${r.title}: ${r.preparation} (Caution: ${r.safetyCaution})`).join('\n') + `\n`;
    } else {
      textToCopy += result.fullMarkdown;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Main search action
  const handleSearch = async (queryOverride?: string) => {
    const q = (queryOverride || input).trim();
    if (!q || isLoading) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setIsLoading(true);
    setFacility(null);
    setRoute(null);

    try {
      const res = await askRakshaSaathiBot(q);
      setResult(res);

      // Check if location-based emergency radar / hospital route is relevant
      const isHospitalQuery = /hospital|route|directions|trauma|emergency room|doctor|clinic|er|navigate|ambulance|reach/i.test(q);
      if (res.isEmergencyAlert || isHospitalQuery) {
        try {
          const dispatch = await getAutomaticEscalationDispatch();
          setFacility(dispatch.nearestHospital);
          setRoute(dispatch.route);
        } catch (routeErr) {
          console.warn('Dispatch radar lookup failed:', routeErr);
        }
      }
    } catch (err) {
      console.error('RakshaSaathi Bot search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (chipText: string) => {
    setActiveChip(chipText);
    setInput(chipText);
    handleSearch(chipText);
  };

  const handleClear = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setResult(null);
    setInput('');
    setFacility(null);
    setRoute(null);
  };

  // Minimized discrete pill in the bottom corner (takes almost 0 space)
  if (isMinimized) {
    return (
      <div 
        data-html2canvas-ignore="true" 
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 screenshot-ignore"
      >
        <button
          onClick={() => {
            setIsMinimized(false);
            setTimeout(() => inputRef.current?.focus(), 150);
          }}
          className="group flex items-center space-x-2.5 px-4 py-2.5 rounded-full bg-[#0E5A50] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-emerald-400/30"
          title="Open RakshaSaathi Bot Search"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
          </div>
          <span className="text-xs font-black tracking-wide">RakshaSaathi Bot</span>
          <span className="text-[10px] bg-emerald-700/80 px-2 py-0.5 rounded-full font-bold">AI Clinical</span>
        </button>
      </div>
    );
  }

  return (
    <div 
      data-html2canvas-ignore="true" 
      className="fixed bottom-3 sm:bottom-5 inset-x-0 mx-auto max-w-2xl px-3 sm:px-4 z-40 pointer-events-none screenshot-ignore"
    >
      <div className="pointer-events-auto flex flex-col items-center w-full">

        {/* ======================================================== */}
        {/* EXPANDED RESULT DRAWER / CARD (Above prompt bar)         */}
        {/* ======================================================== */}
        {result && (
          <div className="w-full mb-2.5 max-h-[68vh] overflow-y-auto rounded-3xl bg-white/98 dark:bg-[#0c1a17]/98 backdrop-blur-2xl border border-slate-200/90 dark:border-emerald-900/40 shadow-2xl p-4 sm:p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-200 text-slate-800 dark:text-slate-100">
            
            {/* Result Header Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10 gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${
                  result.category === 'emergency' 
                    ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20' 
                    : result.category === 'medicine'
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}>
                  {result.category === 'emergency' && <ShieldAlert className="w-3.5 h-3.5" />}
                  {result.category === 'medicine' && <Pill className="w-3.5 h-3.5" />}
                  {result.category === 'remedy' && <Leaf className="w-3.5 h-3.5" />}
                  {result.category === 'general' && <Sparkles className="w-3.5 h-3.5" />}
                  <span className="capitalize">{result.category} Intelligence</span>
                </span>

                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {result.modelDisplayName} • ⚡ {result.latencyMs}ms
                </span>
              </div>

              {/* Action Controls */}
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  onClick={toggleSpeech}
                  className={`p-1.5 rounded-full text-xs font-bold transition-all ${
                    isSpeaking 
                      ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300 animate-pulse' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={isSpeaking ? 'Stop Audio' : 'Listen with Audio (TTS)'}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Copy Steps & Data"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleClear();
                    onOpenFullChat();
                  }}
                  className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Open Full AI Guardian Chat"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Close Result"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                {result.headline}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Query: <span className="font-semibold text-slate-700 dark:text-slate-300">"{result.query}"</span>
              </p>
            </div>

            {/* 1. EMERGENCY PROTOCOL BLOCK: DO'S & DON'TS FIRST WITH LARGER FONT */}
            {result.emergencySteps && result.emergencySteps.length > 0 && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <HeartPulse className="w-4.5 h-4.5 text-red-500 animate-pulse" />
                    Immediate Emergency Protocol
                  </span>
                  <a
                    href="tel:112"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black shadow-xs transition-transform active:scale-95"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Dial 112 SOS</span>
                  </a>
                </div>

                {/* Contraindications Warning (Don'ts) First */}
                {result.contraindications && result.contraindications.length > 0 && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500/50 text-[#881337] dark:!text-rose-100 space-y-2 shadow-xs">
                    <div className="font-black flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs sm:text-sm uppercase tracking-wider">
                      <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>🚫 WHAT NOT TO DO • STRICT CONTRAINDICATIONS</span>
                    </div>
                    <ul className="pl-6 space-y-1.5 text-xs sm:text-sm text-[#4C0519] dark:!text-rose-100 font-bold">
                      {result.contraindications.map((c, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="text-rose-600 font-extrabold text-sm leading-none">✖</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 1-2-3 Action Steps (Do's) */}
                <div className="space-y-2">
                  <div className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>✅ WHAT TO DO (DO'S) • IMMEDIATE ACTION STEPS</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {result.emergencySteps.map((step) => {
                      const stepTitle = step.title || (step as any).action || (step as any).instruction || `Step ${step.stepNumber}`;
                      const stepDetail = step.instruction || (step as any).detail || (step as any).description || '';
                      return (
                        <div 
                          key={step.stepNumber}
                          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#13221C] border-2 border-slate-200 dark:border-[#223830] flex items-start gap-3.5 shadow-2xs text-[#0F172A] dark:text-white"
                        >
                          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm sm:text-base shrink-0 font-mono shadow-xs">
                            {step.stepNumber}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 
                              className="text-sm sm:text-base font-black text-[#0F172A] dark:!text-white leading-snug break-words"
                              style={{ color: 'var(--app-ink, #0F172A)' }}
                            >
                              {stepTitle}
                            </h4>
                            {stepDetail && (
                              <p 
                                className="text-sm sm:text-base text-[#334155] dark:!text-slate-200 leading-relaxed font-medium break-words"
                                style={{ color: 'var(--app-ink-muted, #334155)' }}
                              >
                                {stepDetail}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 2. MEDICINE & JAN AUSHADHI RADAR BLOCK */}
            {result.medicineData && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Pill className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      Jan Aushadhi Generic Substitute
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black tracking-wide">
                    {result.medicineData.savings}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-blue-100 dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Chemical Salt (API)</span>
                    <p className="font-black text-slate-800 dark:text-slate-100">{result.medicineData.genericSalt}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-blue-100 dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">PMBJP Kendra Generic</span>
                    <p className="font-black text-emerald-600 dark:text-emerald-400">{result.medicineData.janAushadhiName}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-blue-100 dark:border-white/5 flex items-center justify-between text-xs font-semibold">
                  <span>Branded: <s className="text-slate-400">{result.medicineData.brandPrice}</s></span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">Jan Aushadhi: {result.medicineData.janAushadhiPrice}</span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-black/20 p-2.5 rounded-xl border border-blue-100/50">
                  <span className="font-bold text-slate-800 dark:text-white">Ask Chemist: </span>
                  <span className="italic">"{result.medicineData.whatToTellChemist}"</span>
                </div>

                {/* Supportive Home Remedies for this symptom */}
                {result.medicineData.supportiveRemedies?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                      Complementary Home-Made Remedies:
                    </span>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-4 list-disc font-medium">
                      {result.medicineData.supportiveRemedies.map((rem, i) => (
                        <li key={i}>{rem}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 3. VERIFIED HOME REMEDIES BLOCK */}
            {result.homeRemedies && result.homeRemedies.length > 0 && !result.emergencySteps && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40">
                <div className="flex items-center space-x-2">
                  <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Verified Evidence-Based Home Remedies
                  </span>
                </div>

                <div className="space-y-2">
                  {result.homeRemedies.map((remedy, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-emerald-100 dark:border-white/5 space-y-1 text-xs">
                      <h4 className="font-bold text-slate-900 dark:text-white">{remedy.title}</h4>
                      <p className="text-slate-600 dark:text-slate-300">{remedy.preparation}</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">⚠️ {remedy.safetyCaution}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. GENERAL MARKDOWN ADVICE */}
            {!result.emergencySteps && !result.medicineData && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/70 dark:border-white/5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {result.fullMarkdown}
              </div>
            )}

            {/* 5. LIVE EMERGENCY RADAR / HOSPITAL ROUTE (If applicable) */}
            {facility && route && (
              <div className="pt-2">
                <EmergencyRouteMap
                  facility={facility}
                  route={route}
                  compact
                />
              </div>
            )}

            {/* Footer Summary Button */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-white/10 gap-2">
              <button
                type="button"
                onClick={() => {
                  handleClear();
                  onOpenFullChat();
                }}
                className="text-[#0E5A50] dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Continue in Full AI Guardian</span>
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Done
              </button>
            </div>

            <div ref={resultEndRef} />
          </div>
        )}

        {/* ======================================================== */}
        {/* THE MAIN FLOATING PROMPT & SEARCH ENGINE BAR             */}
        {/* ======================================================== */}
        <div className="w-full relative group">
          
          {/* Quick Discovery Pills (Above Bar on focus or hover) */}
          <div className="mb-2 flex items-center justify-center gap-1.5 overflow-x-auto text-[11px] px-1 py-0.5">
            {[
              { label: '🚨 CPR 1-2-3 Steps', query: 'CPR steps for cardiac arrest' },
              { label: '💊 Dolo 650 Jan Aushadhi', query: 'Dolo 650 generic substitute and home remedies' },
              { label: '🌿 Burn Care & Remedies', query: 'First aid and home remedies for burn' },
              { label: '👶 Choking Emergency', query: 'Choking Heimlich maneuver 1-2-3' }
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(chip.query)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-xs border transition-all shrink-0 cursor-pointer ${
                  activeChip === chip.query
                    ? 'bg-[#0E5A50] text-white border-emerald-400'
                    : 'bg-white/90 dark:bg-[#122420]/90 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10 hover:border-[#0E5A50] dark:hover:border-emerald-500'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Search Engine Bar Shell */}
          <div className="relative flex items-center w-full rounded-full bg-white/95 dark:bg-[#0e1d19]/95 backdrop-blur-xl border border-slate-200/90 dark:border-emerald-900/40 shadow-[0_12px_40px_-5px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_-5px_rgba(0,0,0,0.6)] px-2 sm:px-3 py-1.5 transition-all duration-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/15">
            
            {/* Left AI Bot Avatar / Indicator */}
            <div 
              className="flex items-center space-x-2 pl-1 pr-2 shrink-0 cursor-pointer select-none"
              onClick={() => inputRef.current?.focus()}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0E5A50] via-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xs shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-200" />
              </div>
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-[11px] font-black text-slate-900 dark:text-white">RakshaSaathi Bot</span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Clinical AI Engine</span>
              </div>
            </div>

            {/* Main Search Input Field */}
            <div className="flex-1 min-w-0 px-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder={placeholderSuggestions[placeholderIdx]}
                className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium py-1.5"
                style={{ color: 'inherit' }}
              />
            </div>

            {/* Right Tools: Voice Mic + Search Button + Minimize */}
            <div className="flex items-center space-x-1.5 shrink-0 pr-1">
              {/* Clear button if input exists */}
              {input && (
                <button
                  type="button"
                  onClick={() => setInput('')}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Voice Search Button */}
              <button
                type="button"
                onClick={toggleVoiceSearch}
                className={`p-2 rounded-full transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-slate-500 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isListening ? 'Listening... Speak now' : 'Voice Search (Speech to Text)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Submit / Search Arrow */}
              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={isLoading || !input.trim()}
                className="w-9 h-9 rounded-full bg-[#0E5A50] hover:bg-[#0a443c] text-white flex items-center justify-center shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
                title="Search RakshaSaathi (Enter)"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Minimize to Corner Button */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Minimize prompt bar"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
