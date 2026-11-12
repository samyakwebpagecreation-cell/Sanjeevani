import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Share2,
  Printer,
  Bot,
  PhoneCall,
  XCircle,
  Volume2,
  VolumeX,
  Camera,
  Users,
  MapPin,
  Sun,
  Check,
  ChevronRight,
  AlertTriangle,
  WifiOff,
  CheckCircle2,
} from 'lucide-react';
import {
  ProtocolDocument,
  PROTOCOL_BY_ID,
  ProtocolInlineActionType,
} from '../../data/protocolSchema';
import { InjuryProtocolId } from '../../types';
import { SeverityBadge } from './SeverityBadge';
import { SourcesAndReviewFooter } from '../common/SourcesAndReviewFooter';
import { generateQRCodeSVG } from '../../utils/qr';
import { audioEngine } from '../../utils/audio';
import {
  useAppLanguage,
  UI_TRANSLATIONS,
  LOCALIZED_PINNED_PROTOCOLS,
} from '../../utils/languageStore';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

type TextScale = 'normal' | 'large' | 'xlarge';

interface ProtocolDocumentViewProps {
  protocol: ProtocolDocument;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onBack: () => void;
  onSelectProtocol: (id: string) => void;
  onOpenChat?: (query: string) => void;
  onGuideLive: (protocolId: InjuryProtocolId) => void;
  onTriggerEscalation?: (reason?: string) => void;
  onOpenCrowd?: () => void;
  onOpenRadar?: () => void;
}

const TEXT_SCALE_KEY = 'sanjeevani_protocol_text_scale';

export const ProtocolDocumentView: React.FC<ProtocolDocumentViewProps> = ({
  protocol,
  isBookmarked,
  onToggleBookmark,
  onBack,
  onSelectProtocol,
  onOpenChat,
  onGuideLive,
  onTriggerEscalation,
  onOpenCrowd,
  onOpenRadar,
}) => {
  const { lang } = useAppLanguage();
  const copy = UI_TRANSLATIONS[lang];
  const locProtocol = LOCALIZED_PINNED_PROTOCOLS[lang]?.[protocol.id];

  const displayTitle = locProtocol?.shortTitle || protocol.title;
  const displayDescription = locProtocol?.fullDescription || protocol.fullDescription;
  const displayRedFlags =
    locProtocol?.redFlags && locProtocol.redFlags.length > 0
      ? locProtocol.redFlags
      : protocol.redFlags;
  const displaySteps =
    locProtocol?.steps && locProtocol.steps.length > 0
      ? locProtocol.steps.map((ls, idx) => ({
          ...protocol.steps[idx],
          title: ls.title,
          text: ls.text,
          action: protocol.steps[idx]?.action,
        }))
      : protocol.steps;
  const displayAvoid =
    locProtocol?.donts && locProtocol.donts.length > 0
      ? locProtocol.donts
      : protocol.avoid;

  const [isSpeakingProtocol, setIsSpeakingProtocol] = useState(false);

  const [textScale, setTextScale] = useState<TextScale>(() => {
    try {
      const saved = localStorage.getItem(TEXT_SCALE_KEY);
      if (saved === 'large' || saved === 'xlarge') return saved;
    } catch {}
    return 'normal';
  });

  const [keepAwake, setKeepAwake] = useState(false);
  const [wakeLockStatus, setWakeLockStatus] = useState<'idle' | 'active' | 'fallback'>('idle');
  const wakeLockSentinelRef = useRef<any>(null);
  const wakeLockVideoFallbackRef = useRef<number | null>(null);

  const [shareCopied, setShareCopied] = useState(false);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  const [metronomeBeat, setMetronomeBeat] = useState(0);
  const metronomeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(TEXT_SCALE_KEY, textScale);
    } catch {}
  }, [textScale]);

  // Stop metronome when switching protocol or unmounting
  useEffect(() => {
    return () => {
      if (metronomeTimerRef.current) {
        window.clearInterval(metronomeTimerRef.current);
        metronomeTimerRef.current = null;
      }
      audioEngine.stopSpeech();
    };
  }, [protocol.id]);

  // Stop voice readout when switching language so user can re-trigger in the new language
  useEffect(() => {
    if (isSpeakingProtocol) {
      audioEngine.stopSpeech();
      setIsSpeakingProtocol(false);
    }
  }, [lang]);

  const handleToggleSpeakProtocol = () => {
    if (isSpeakingProtocol) {
      audioEngine.stopSpeech();
      setIsSpeakingProtocol(false);
      return;
    }

    const stepsText = displaySteps
      .map((s, idx) => `${idx + 1}. ${s.title ? `${s.title}. ` : ''}${s.text}`)
      .join(' ');
    const avoidText =
      displayAvoid.length > 0
        ? `${copy.whatNotToDoHeading}: ${displayAvoid.join('. ')}`
        : '';
    const fullNarration = `${displayTitle}. ${displayDescription}. ${copy.doThisNow}: ${stepsText}. ${avoidText}`;

    setIsSpeakingProtocol(true);
    audioEngine.speak(
      fullNarration,
      () => {
        setIsSpeakingProtocol(false);
      },
      lang
    );
  };

  // Release Wake Lock on unmount
  useEffect(() => {
    return () => {
      if (wakeLockSentinelRef.current) {
        try {
          wakeLockSentinelRef.current.release();
        } catch {}
      }
      if (wakeLockVideoFallbackRef.current) {
        window.clearInterval(wakeLockVideoFallbackRef.current);
      }
    };
  }, []);

  const handleToggleWakeLock = async () => {
    if (keepAwake) {
      setKeepAwake(false);
      setWakeLockStatus('idle');
      if (wakeLockSentinelRef.current) {
        try {
          await wakeLockSentinelRef.current.release();
        } catch {}
        wakeLockSentinelRef.current = null;
      }
      if (wakeLockVideoFallbackRef.current) {
        window.clearInterval(wakeLockVideoFallbackRef.current);
        wakeLockVideoFallbackRef.current = null;
      }
      return;
    }

    setKeepAwake(true);
    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock?.request) {
        const sentinel = await (navigator as any).wakeLock.request('screen');
        wakeLockSentinelRef.current = sentinel;
        setWakeLockStatus('active');
        sentinel.addEventListener?.('release', () => {
          setKeepAwake(false);
          setWakeLockStatus('idle');
        });
      } else {
        setWakeLockStatus('fallback');
      }
    } catch {
      setWakeLockStatus('fallback');
    }
  };

  const toggleMetronome = () => {
    if (isMetronomeRunning) {
      if (metronomeTimerRef.current) {
        window.clearInterval(metronomeTimerRef.current);
        metronomeTimerRef.current = null;
      }
      setIsMetronomeRunning(false);
      setMetronomeBeat(0);
    } else {
      setIsMetronomeRunning(true);
      const intervalMs = Math.round((60 / 110) * 1000); // ~545ms for 110 BPM
      try {
        audioEngine.playClick(true);
      } catch {}
      setMetronomeBeat(1);
      let count = 1;
      metronomeTimerRef.current = window.setInterval(() => {
        count = (count % 30) + 1;
        setMetronomeBeat(count);
        try {
          audioEngine.playClick(count === 1);
        } catch {}
      }, intervalMs);
    }
  };

  const getDeepLinkUrl = () => {
    if (typeof window === 'undefined') return `https://sanjeevani-v2.web.app/protocols/${protocol.slug}`;
    return `${window.location.origin}/protocols/${protocol.slug}`;
  };

  const handleShare = async () => {
    const url = getDeepLinkUrl();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${protocol.title} — Sanjeevani First-Aid Protocol`,
          text: `${protocol.title}: ${protocol.summary}`,
          url,
        });
        return;
      } catch {
        // Fall through to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {}
  };

  const handleCall112 = () => {
    if (onTriggerEscalation) {
      onTriggerEscalation(`112 triggered from protocol: ${protocol.title}`);
    } else if (typeof window !== 'undefined') {
      window.location.href = 'tel:112';
    }
  };

  const handleAskAI = () => {
    if (onOpenChat) {
      onOpenChat(
        `Please guide me through the "${protocol.title}" first-aid protocol step-by-step and answer my questions.`
      );
    } else {
      onGuideLive(protocol.linkedProtocolId);
    }
  };

  const handleStepAction = (type: ProtocolInlineActionType) => {
    switch (type) {
      case 'call112':
        handleCall112();
        break;
      case 'metronome110':
        toggleMetronome();
        break;
      case 'arChestGuide':
        onGuideLive(protocol.linkedProtocolId);
        break;
      case 'crowdSquad':
        if (onOpenCrowd) onOpenCrowd();
        else onGuideLive(protocol.linkedProtocolId);
        break;
      case 'nearestFacility':
        if (onOpenRadar) onOpenRadar();
        break;
    }
  };

  // Text size classes (arm's length defaults: 18px body, 20px step text)
  const bodySizeClass =
    textScale === 'xlarge'
      ? 'text-[22px] leading-[1.65]'
      : textScale === 'large'
      ? 'text-[20px] leading-[1.6]'
      : 'text-[18px] leading-[1.6]';

  const stepSizeClass =
    textScale === 'xlarge'
      ? 'text-[24px] leading-[1.45]'
      : textScale === 'large'
      ? 'text-[22px] leading-[1.45]'
      : 'text-[20px] leading-[1.45]';

  const primarySource = protocol.sources[0];
  const reviewBannerText =
    protocol.review.status === 'reviewed'
      ? `Reviewed ${protocol.review.reviewed_on || protocol.updated_at} · ${primarySource?.publisher || 'AHA'} ${primarySource?.year || ''}`
      : protocol.review.status === 'needs_update'
      ? `Needs clinical update — see review note · Cites ${primarySource?.publisher || 'AHA'} ${primarySource?.year || 2020}`
      : protocol.review.status === 'draft'
      ? 'Draft — not yet clinically reviewed'
      : `Pending clinical review · Cites ${primarySource?.publisher || 'AHA / Red Cross'} (${primarySource?.year || 2024})`;

  const printQrSvg = generateQRCodeSVG(getDeepLinkUrl(), 96, '#0F172A', '#FFFFFF');
  const isEmergencyOrUrgent = protocol.severity === 'Emergency' || protocol.severity === 'Urgent';

  return (
    <article
      aria-labelledby="protocol-doc-title"
      className="mx-auto max-w-2xl px-4 sm:px-6 py-5 sm:py-8 pb-28 sm:pb-12 space-y-6 text-ink print:max-w-none print:p-0 print:space-y-4"
    >
      {/* 5-Language Voice & Protocol Toggle Bar (English · हिंदी · বাংলা · தமிழ் · मराठी) */}
      <div className="print:hidden">
        <LanguageSwitcher variant="bar" showVoicePreview />
      </div>

      {/* Top Navigation & Accessibility Bar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-base text-sm font-semibold text-ink transition-colors cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>{copy.allProtocolsBack}</span>
        </button>

        {/* Text Size (A / A+ / A++) & Keep Screen Awake Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Text size"
            className="inline-flex items-center rounded-lg border border-border bg-surface p-0.5"
          >
            {(
              [
                { id: 'normal', label: 'A', title: 'Standard arm-length text (18px/20px)' },
                { id: 'large', label: 'A+', title: 'Large text (20px/22px)' },
                { id: 'xlarge', label: 'A++', title: 'Extra-large text (22px/24px)' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTextScale(opt.id)}
                title={opt.title}
                aria-pressed={textScale === opt.id}
                className={`min-h-[34px] min-w-[36px] px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  textScale === opt.id
                    ? 'bg-primary text-white'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleToggleWakeLock}
            aria-pressed={keepAwake}
            title="Keep screen awake while following steps hands-free"
            className={`inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              keepAwake
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-surface text-ink-muted hover:text-ink'
            }`}
          >
            <Sun className="w-3.5 h-3.5 shrink-0" />
            <span>{keepAwake ? 'Screen awake ON' : 'Keep screen awake'}</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 1. DOCUMENT HEADER (D1)                                             */}
      {/* =================================================================== */}
      <header className="rounded-2xl border border-border bg-surface p-5 sm:p-6 space-y-4 print:border-b-2 print:border-slate-900 print:rounded-none print:p-0 print:pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2.5 min-w-0 flex-1">
            {/* Metadata Chips Row */}
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={protocol.severity} size="md" />

              <span className="inline-flex items-center min-h-[26px] px-2.5 py-0.5 rounded-md bg-base border border-border text-xs font-semibold text-ink-muted whitespace-nowrap">
                {protocol.category}
              </span>

              {protocol.offlineCached ? (
                <span className="inline-flex items-center gap-1 min-h-[26px] px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800 text-xs font-semibold whitespace-nowrap print:hidden">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>Offline ready</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 min-h-[26px] px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold whitespace-nowrap print:hidden">
                  <WifiOff className="w-3.5 h-3.5 shrink-0" />
                  <span>Online only</span>
                </span>
              )}
            </div>

            {/* Print-Only App Identity Line */}
            <div className="hidden print:block text-[10pt] font-bold uppercase tracking-wider text-slate-700">
              Sanjeevani First-Aid Library · Offline Clinical Protocol (v{protocol.version})
            </div>

            {/* Protocol Title */}
            <h1
              id="protocol-doc-title"
              className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight leading-tight"
            >
              {displayTitle}
            </h1>

            {/* Review & Guideline Line */}
            <div className="flex items-start gap-1.5 text-xs text-ink-muted">
              {protocol.review.status === 'needs_update' && (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <span
                className={
                  protocol.review.status === 'needs_update'
                    ? 'font-semibold text-amber-900 dark:text-amber-300'
                    : ''
                }
              >
                {reviewBannerText}
              </span>
            </div>
          </div>

          {/* Print-Only QR Code linking to /protocols/:slug */}
          <div className="hidden print:flex flex-col items-end shrink-0 text-right">
            <div
              dangerouslySetInnerHTML={{ __html: printQrSvg }}
              className="w-20 h-20 border border-slate-300 p-1 bg-white flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
            />
            <span className="text-[9pt] text-slate-700 mt-1 font-mono">
              /protocols/{protocol.slug}
            </span>
          </div>
        </div>

        {/* Summary / What is it */}
        <p className={`${bodySizeClass} text-ink font-normal`}>
          {displayDescription}
        </p>

        {/* Header Actions: 1-Tap Voice Guide, Save, Share, Print, Ask AI about this */}
        <div className="pt-3 border-t border-border flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handleToggleSpeakProtocol}
            aria-pressed={isSpeakingProtocol}
            className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              isSpeakingProtocol
                ? 'border-alert bg-alert text-white'
                : 'border-primary bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {isSpeakingProtocol ? (
              <>
                <VolumeX className="w-4 h-4 shrink-0" />
                <span>{copy.stopVoiceGuide}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 shrink-0" />
                <span>{copy.listenInLanguage}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onToggleBookmark(protocol.id)}
            className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              isBookmarked
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-base hover:bg-border/40 text-ink'
            }`}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-4 h-4 shrink-0" />
            ) : (
              <Bookmark className="w-4 h-4 shrink-0" />
            )}
            <span>{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-border bg-base hover:bg-border/40 text-xs font-bold text-ink transition-colors cursor-pointer whitespace-nowrap"
          >
            {shareCopied ? (
              <Check className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <Share2 className="w-4 h-4 shrink-0" />
            )}
            <span>{shareCopied ? 'Link copied' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-border bg-base hover:bg-border/40 text-xs font-bold text-ink transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleAskAI}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/15 text-xs font-bold text-primary transition-colors cursor-pointer whitespace-nowrap ml-auto"
          >
            <Bot className="w-4 h-4 shrink-0" />
            <span>{copy.askAiGuardian}</span>
          </button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. "CALL 112 NOW IF…" (D2 — Red Callout at very top, never collapsed) */}
      {/* =================================================================== */}
      {displayRedFlags.length > 0 && (
        <section
          aria-labelledby="protocol-call112-heading"
          className="rounded-2xl border-2 border-[#DC2626] bg-[#FEF2F2] dark:bg-red-950/30 p-5 space-y-4 print:bg-white print:border-l-4 print:border-[#DC2626] print:rounded-none"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2
                id="protocol-call112-heading"
                className="text-lg font-extrabold text-[#991B1B] dark:text-red-200 tracking-tight"
              >
                {copy.call112NowIf}
              </h2>
              <p className="text-xs font-semibold text-[#7F1D1D] dark:text-red-300">
                {copy.call112NowSubtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCall112}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-extrabold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 print:hidden"
            >
              <PhoneCall className="w-4 h-4 shrink-0" />
              <span>112 SOS</span>
            </button>
          </div>

          <ul className={`space-y-2 ${bodySizeClass} text-[#7F1D1D] dark:text-red-100 font-medium`}>
            {displayRedFlags.map((flag, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="font-extrabold text-[#DC2626] shrink-0 select-none">•</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* =================================================================== */}
      {/* 3. "DO THIS NOW" (D3 — Numbered list, max 8 steps, large circles)    */}
      {/* =================================================================== */}
      <section aria-labelledby="protocol-steps-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="protocol-steps-heading"
            className="text-xl font-extrabold text-ink tracking-tight"
          >
            {copy.doThisNow}
          </h2>
          <span className="text-xs font-semibold text-ink-muted">
            {displaySteps.length} {displaySteps.length === 1 ? 'step' : 'steps'}
          </span>
        </div>

        <ol className="space-y-3.5">
          {displaySteps.map((step, idx) => {
            const stepNum = idx + 1;
            const isCall112Step = step.action?.type === 'call112';

            return (
              <li
                key={idx}
                className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3 print:border-slate-300 print:p-3 print:rounded-lg"
              >
                <div className="flex items-start gap-3.5 sm:gap-4">
                  {/* Large Numeral Circle */}
                  <span
                    aria-hidden="true"
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-extrabold select-none ${
                      isCall112Step
                        ? 'bg-[#DC2626] text-white'
                        : 'bg-primary text-white'
                    } print:border-2 print:border-slate-900 print:text-slate-900 print:bg-white`}
                  >
                    {stepNum}
                  </span>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    {step.title && (
                      <h3 className={`${stepSizeClass} font-extrabold text-ink`}>
                        {step.title}
                      </h3>
                    )}
                    <p className={`${stepSizeClass} text-ink font-normal`}>
                      {step.text}
                    </p>

                    {/* Inline Matching Sanjeevani Tool Action (D3) */}
                    {step.action && (
                      <div className="pt-2 print:hidden min-w-0">
                        {step.action.type === 'call112' && (
                          <button
                            type="button"
                            onClick={() => handleStepAction('call112')}
                            className="inline-flex items-center gap-2 min-h-[44px] max-w-full px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-bold text-left leading-snug transition-colors cursor-pointer"
                          >
                            <PhoneCall className="w-4 h-4 shrink-0" />
                            <span>{step.action.label}</span>
                          </button>
                        )}

                        {step.action.type === 'metronome110' && (
                          <div className="flex flex-wrap items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleStepAction('metronome110')}
                              className={`inline-flex items-center gap-2 min-h-[44px] max-w-full px-4 py-2 rounded-xl text-sm font-bold text-left leading-snug transition-colors cursor-pointer ${
                                isMetronomeRunning
                                  ? 'bg-primary text-white'
                                  : 'border border-primary bg-primary/10 hover:bg-primary/15 text-primary'
                              }`}
                            >
                              {isMetronomeRunning ? (
                                <VolumeX className="w-4 h-4 shrink-0" />
                              ) : (
                                <Volume2 className="w-4 h-4 shrink-0" />
                              )}
                              <span>
                                {isMetronomeRunning
                                  ? 'Stop CPR metronome'
                                  : 'Start CPR metronome'}
                              </span>
                            </button>

                            {isMetronomeRunning && (
                              <span
                                aria-live="polite"
                                className="inline-flex items-center gap-2 min-h-[38px] px-3 py-1 rounded-lg bg-base border border-border text-xs font-mono font-bold text-ink"
                              >
                                <span className="h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
                                <span>CPR Metronome · Push {metronomeBeat} / 30</span>
                              </span>
                            )}
                          </div>
                        )}

                        {step.action.type === 'arChestGuide' && (
                          <button
                            type="button"
                            onClick={() => handleStepAction('arChestGuide')}
                            className="inline-flex items-center gap-2 min-h-[44px] max-w-full px-4 py-2 rounded-xl border border-primary bg-primary/10 hover:bg-primary/15 text-primary text-sm font-bold text-left leading-snug transition-colors cursor-pointer"
                          >
                            <Camera className="w-4 h-4 shrink-0" />
                            <span>{step.action.label}</span>
                          </button>
                        )}

                        {step.action.type === 'crowdSquad' && (
                          <button
                            type="button"
                            onClick={() => handleStepAction('crowdSquad')}
                            className="inline-flex items-center gap-2 min-h-[44px] max-w-full px-4 py-2 rounded-xl border border-primary bg-primary/10 hover:bg-primary/15 text-primary text-sm font-bold text-left leading-snug transition-colors cursor-pointer"
                          >
                            <Users className="w-4 h-4 shrink-0" />
                            <span>{step.action.label}</span>
                          </button>
                        )}

                        {step.action.type === 'nearestFacility' && (
                          <button
                            type="button"
                            onClick={() => handleStepAction('nearestFacility')}
                            className="inline-flex items-center gap-2 min-h-[44px] max-w-full px-4 py-2 rounded-xl border border-primary bg-primary/10 hover:bg-primary/15 text-primary text-sm font-bold text-left leading-snug transition-colors cursor-pointer"
                          >
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span>{step.action.label}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* =================================================================== */}
      {/* 4. "DO NOT" (D4 — One red-tinted callout, X icon, bullets)          */}
      {/* =================================================================== */}
      {displayAvoid.length > 0 && (
        <section
          aria-labelledby="protocol-donot-heading"
          className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] dark:bg-red-950/25 dark:border-red-800/60 p-5 space-y-3 print:bg-white print:border-l-4 print:border-[#DC2626] print:rounded-none"
        >
          <div className="flex items-center gap-2 text-[#991B1B] dark:text-red-200">
            <XCircle className="w-5 h-5 text-[#DC2626] shrink-0" aria-hidden="true" />
            <h2 id="protocol-donot-heading" className="text-lg font-extrabold tracking-tight">
              {copy.whatNotToDoHeading}
            </h2>
          </div>

          <ul className={`space-y-2 ${bodySizeClass} text-[#7F1D1D] dark:text-red-100`}>
            {displayAvoid.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="font-bold text-[#DC2626] shrink-0 select-none">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* =================================================================== */}
      {/* 5. "WATCH FOR / GET HELP IF IT GETS WORSE" (D5 — Plain list)        */}
      {/* =================================================================== */}
      {protocol.watchFor.length > 0 && (
        <section
          aria-labelledby="protocol-watchfor-heading"
          className="rounded-2xl border border-border bg-surface p-5 space-y-3 print:border-slate-300"
        >
          <h2
            id="protocol-watchfor-heading"
            className="text-lg font-extrabold text-ink tracking-tight"
          >
            Watch for / get help if it gets worse
          </h2>
          <ul className={`space-y-2 ${bodySizeClass} text-ink`}>
            {protocol.watchFor.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="font-bold text-primary shrink-0 select-none">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* =================================================================== */}
      {/* 6. "WHILE YOU WAIT FOR HELP" (D6 — Optional)                        */}
      {/* =================================================================== */}
      {protocol.whileWaiting.length > 0 && (
        <section
          aria-labelledby="protocol-waiting-heading"
          className="rounded-2xl border border-border bg-surface p-5 space-y-2.5 print:border-slate-300"
        >
          <h2
            id="protocol-waiting-heading"
            className="text-lg font-extrabold text-ink tracking-tight"
          >
            While you wait for help
          </h2>
          <ul className={`space-y-2 ${bodySizeClass} text-ink`}>
            {protocol.whileWaiting.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="font-bold text-primary shrink-0 select-none">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* =================================================================== */}
      {/* 7. "AFTERWARDS / WHEN TO SEE A DOCTOR" (D7 — Closed by default)     */}
      {/* =================================================================== */}
      {protocol.aftercare.length > 0 && (
        <details className="group rounded-2xl border border-border bg-surface print:hidden">
          <summary className="min-h-[52px] px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer list-none font-bold text-base text-ink hover:bg-base/60 rounded-2xl">
            <span>Afterwards / when to see a doctor</span>
            <ChevronRight className="w-4 h-4 text-ink-muted transition-transform group-open:rotate-90 shrink-0" />
          </summary>
          <div className="px-5 pb-5 pt-2 border-t border-border">
            <ul className={`space-y-2 ${bodySizeClass} text-ink`}>
              {protocol.aftercare.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-bold text-primary shrink-0 select-none">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}

      {/* =================================================================== */}
      {/* 8. "IN INDIA" (D8 — 108/112, ASV/ARV availability, nearest facility) */}
      {/* =================================================================== */}
      {protocol.inIndia.length > 0 && (
        <section
          aria-labelledby="protocol-india-heading"
          className="rounded-2xl border border-border bg-surface p-5 space-y-3 print:border-slate-300"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2
              id="protocol-india-heading"
              className="text-lg font-extrabold text-ink tracking-tight"
            >
              In India
            </h2>
            {onOpenRadar && (
              <button
                type="button"
                onClick={onOpenRadar}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/15 text-xs font-bold text-primary transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto print:hidden"
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>Find nearest hospital / ASV / AED</span>
              </button>
            )}
          </div>

          <ul className="space-y-2 text-base text-ink leading-relaxed">
            {protocol.inIndia.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="font-bold text-primary shrink-0 select-none">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* =================================================================== */}
      {/* 9. RELATED PROTOCOLS (D9 — Up to 3 links)                           */}
      {/* =================================================================== */}
      {protocol.related.length > 0 && (
        <section aria-labelledby="protocol-related-heading" className="space-y-3 print:hidden">
          <h2
            id="protocol-related-heading"
            className="text-base font-extrabold text-ink tracking-tight"
          >
            Related protocols
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {protocol.related.slice(0, 3).map((relId) => {
              const rel = PROTOCOL_BY_ID[relId];
              if (!rel) return null;
              return (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onSelectProtocol(rel.id)}
                  className="p-3.5 rounded-xl border border-border bg-surface hover:border-primary/50 hover:bg-base/50 text-left flex flex-col justify-between gap-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <SeverityBadge severity={rel.severity} size="sm" />
                    <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" />
                  </div>
                  <div className="font-bold text-sm text-ink leading-snug">
                    {rel.title}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 10. "SOURCES & REVIEW" (D10 — Always shown, collapsible)            */}
      {/* =================================================================== */}
      <SourcesAndReviewFooter
        sources={protocol.sources}
        review={protocol.review}
        version={protocol.version}
        updatedAt={protocol.updated_at}
        documentTitle={protocol.title}
        documentId={protocol.id}
      />

      {/* =================================================================== */}
      {/* 11. FOOTER (D11 — One calm line)                                    */}
      {/* =================================================================== */}
      <footer className="pt-2 text-center text-xs text-ink-muted print:text-left print:border-t print:border-slate-300 print:pt-2">
        First-aid guidance only. In an emergency, call 112.
      </footer>

      {/* Sticky Mobile Bottom Bar for EMERGENCY / URGENT Protocols */}
      {isEmergencyOrUrgent && (
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-border bg-surface/95 backdrop-blur-xs px-4 py-2.5 flex items-center gap-2.5 shadow-lg print:hidden">
          <button
            type="button"
            onClick={handleCall112}
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-2.5 rounded-xl bg-[#DC2626] text-white text-sm font-extrabold cursor-pointer whitespace-nowrap"
          >
            <PhoneCall className="w-4 h-4 shrink-0" />
            <span>Call 112</span>
          </button>

          <button
            type="button"
            onClick={handleAskAI}
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-2.5 rounded-xl border border-primary bg-primary text-white text-sm font-bold cursor-pointer whitespace-nowrap"
          >
            <Bot className="w-4 h-4 shrink-0" />
            <span>Ask AI</span>
          </button>
        </div>
      )}
    </article>
  );
};
