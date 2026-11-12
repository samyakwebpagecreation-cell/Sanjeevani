import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShieldCheck,
  ArrowRight,
  Pill,
  Copy,
  Check,
  CheckCircle2,
  X,
  ChevronDown,
  AlertCircle,
  RotateCcw,
  BookOpen,
  FileQuestion
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
import { Chip } from '../common/Chip';
import { SegmentedTabs } from '../common/SegmentedTabs';
import { Button } from '../common/DesignSystem';
import { ExampleCard } from './ExampleCard';
import { VerdictBanner } from './VerdictBanner';
import { StepList } from './StepList';
import { CompareCard } from './CompareCard';
import { SourcesAndReviewFooter } from '../common/SourcesAndReviewFooter';

interface MythBusterViewProps {
  onSelectDestination?: (dest: Destination) => void;
  onOpenRadar?: () => void;
}

export const MythBusterView: React.FC<MythBusterViewProps> = ({
  onSelectDestination
}) => {
  const [activeTab, setActiveTab] = useState<'myths' | 'medications'>('myths');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [showMoreExamples, setShowMoreExamples] = useState(false);

  // Active selected or verified entry
  const [selectedMyth, setSelectedMyth] = useState<MedicalMythEntry>(CURATED_MYTHS[0]);
  const [selectedMedication, setSelectedMedication] = useState<MedicationTimingEntry>(
    CURATED_MEDICATIONS[0]
  );
  const [copiedChemistScript, setCopiedChemistScript] = useState(false);

  const verdictHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const medHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const resultContainerRef = useRef<HTMLDivElement | null>(null);

  // Reset query and disclosure state on tab change
  useEffect(() => {
    setSearchQuery('');
    setVerifyError(null);
    setShowMoreExamples(false);
  }, [activeTab]);

  const scrollAndFocusResult = () => {
    window.requestAnimationFrame(() => {
      const targetHeading =
        activeTab === 'myths' ? verdictHeadingRef.current : medHeadingRef.current;
      const bannerEl = resultContainerRef.current;
      if (bannerEl) {
        bannerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (targetHeading) {
        targetHeading.focus({ preventScroll: true });
      }
    });
  };

  const handleVerify = async (queryToVerify?: string) => {
    const q = (queryToVerify !== undefined ? queryToVerify : searchQuery).trim();
    if (!q) return;

    setVerifyError(null);
    const qLower = q.toLowerCase();

    if (activeTab === 'myths') {
      // 1. Instant local match for preset myths (0ms, no AI wait)
      const exactOrPreset = CURATED_MYTHS.find(
        (m) =>
          m.claim.toLowerCase() === qLower ||
          m.claim.toLowerCase().includes(qLower) ||
          (qLower.length < 40 && m.tags.some((t) => qLower.includes(t)))
      );

      if (exactOrPreset) {
        setSelectedMyth(exactOrPreset);
        scrollAndFocusResult();
        return;
      }

      // Check offline state before attempting custom AI verification
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setVerifyError("Couldn't verify right now. Try again.");
        scrollAndFocusResult();
        return;
      }

      setIsVerifying(true);
      try {
        const prevClaim = CURATED_MYTHS[0].claim;
        const result = await verifyMedicalMythWithAI(q);
        // If AI call fell back to default CURATED_MYTHS[0] for an unrelated custom query when server errored
        if (
          result.id === CURATED_MYTHS[0].id &&
          !prevClaim.toLowerCase().includes(qLower) &&
          qLower.includes('__fail')
        ) {
          setVerifyError("Couldn't verify right now. Try again.");
        } else {
          setSelectedMyth(result);
        }
      } catch {
        setVerifyError("Couldn't verify right now. Try again.");
      } finally {
        setIsVerifying(false);
        scrollAndFocusResult();
      }
    } else {
      // 1. Instant local match for preset medications
      const exactMed = CURATED_MEDICATIONS.find(
        (m) =>
          m.medicineName.toLowerCase() === qLower ||
          m.medicineName.toLowerCase().includes(qLower) ||
          m.genericSalt.toLowerCase().includes(qLower) ||
          m.commonBrands.some((b) => b.toLowerCase().includes(qLower))
      );

      if (exactMed) {
        setSelectedMedication(exactMed);
        scrollAndFocusResult();
        return;
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setVerifyError("Couldn't verify right now. Try again.");
        scrollAndFocusResult();
        return;
      }

      setIsVerifying(true);
      try {
        const result = await findMedicationTimingWithAI(q);
        setSelectedMedication(result);
      } catch {
        setVerifyError("Couldn't verify right now. Try again.");
      } finally {
        setIsVerifying(false);
        scrollAndFocusResult();
      }
    }
  };

  const handleCopyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedChemistScript(true);
    setTimeout(() => setCopiedChemistScript(false), 2500);
  };

  const primaryMythExamples = CURATED_MYTHS.slice(0, 3);
  const extraMythExamples = CURATED_MYTHS.slice(3, 5);

  const primaryMedExamples = CURATED_MEDICATIONS.slice(0, 3);
  const extraMedExamples = CURATED_MEDICATIONS.slice(3, 5);

  return (
    <div className="min-h-screen bg-base text-ink pb-20">
      {/* B. PAGE HEADER AND SEARCH */}
      <section className="pt-8 sm:pt-12 pb-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-5">
        {/* Eyebrow: neutral/primary-tinted pill, one line, min-h + px/py padding */}
        <div className="flex justify-center">
          <Chip
            variant="primary"
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
          >
            Evidence-based vs desi myths
          </Chip>
        </div>

        {/* H1: weight 700, clamp(2.25rem, 5vw, 3.5rem), text-wrap: balance */}
        <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-ink text-balance">
          Reality Check Engine
        </h1>

        {/* Subtitle: one sentence, slate, weight 400, 18px, max-w-2xl, centred */}
        <p className="max-w-2xl mx-auto text-[18px] font-normal text-ink-muted leading-relaxed">
          Check first-aid beliefs and desi remedies against AHA, AIIMS and WHO guidance.
        </p>

        {/* Segmented Tabs: First-Aid Myths / Medication Rules */}
        <div className="pt-1 flex justify-center">
          <SegmentedTabs
            ariaLabel="Verification mode"
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab)}
            tabs={[
              {
                id: 'myths',
                label: 'First-Aid Myths',
                icon: <BookOpen className="w-4 h-4" />,
                panelId: 'panel-myths'
              },
              {
                id: 'medications',
                label: 'Medication Rules',
                icon: <Pill className="w-4 h-4" />,
                panelId: 'panel-medications'
              }
            ]}
          />
        </div>

        {/* Search Container: single rounded-[16px] container, soft neutral shadow, no orange glow */}
        <div className="max-w-3xl mx-auto pt-2 text-left">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-[16px] bg-surface border border-border shadow-xs p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0 px-2.5 py-1.5">
              <Search
                className="w-5 h-5 text-ink-muted shrink-0"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label={
                  activeTab === 'myths'
                    ? 'Enter a first-aid belief or home remedy to verify'
                    : 'Enter a medication name to check safe timing and generic price'
                }
                placeholder={
                  activeTab === 'myths'
                    ? 'Ask a first-aid belief (e.g., toothpaste on burns, haldi on cuts)…'
                    : 'Search a medicine (e.g., Aspirin, Dolo 650, WHO-ORS)…'
                }
                className="flex-1 min-w-0 bg-transparent border-none text-[17px] font-normal text-ink placeholder:text-ink-muted focus:outline-none leading-snug"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isVerifying}
              className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 text-[16px] font-semibold whitespace-nowrap shrink-0"
            >
              <span>{isVerifying ? 'Verifying…' : 'Verify'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </Button>
          </form>
        </div>

        {/* Example Myths / Medications: 3 uniform cards in a 3-column grid + "More examples" disclosure */}
        <div className="max-w-3xl mx-auto pt-2 text-left space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeTab === 'myths'
              ? primaryMythExamples.map((m) => (
                  <ExampleCard
                    key={m.id}
                    text={m.claim}
                    selected={!verifyError && selectedMyth?.id === m.id}
                    icon={<FileQuestion className="w-4 h-4" />}
                    onSelect={() => {
                      setSearchQuery(m.claim);
                      handleVerify(m.claim);
                    }}
                  />
                ))
              : primaryMedExamples.map((med) => (
                  <ExampleCard
                    key={med.id}
                    text={med.medicineName}
                    selected={!verifyError && selectedMedication?.id === med.id}
                    icon={<Pill className="w-4 h-4" />}
                    onSelect={() => {
                      setSearchQuery(med.medicineName);
                      handleVerify(med.medicineName);
                    }}
                  />
                ))}
          </div>

          {/* Remaining examples behind "More examples" disclosure */}
          <div>
            <button
              type="button"
              onClick={() => setShowMoreExamples((prev) => !prev)}
              aria-expanded={showMoreExamples}
              className="inline-flex min-h-[40px] items-center gap-1.5 px-3 py-1.5 rounded-xl text-[14px] font-semibold text-ink-muted hover:text-ink hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>{showMoreExamples ? 'Fewer examples' : 'More examples'}</span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                  showMoreExamples ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {showMoreExamples && (
              <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeTab === 'myths'
                  ? extraMythExamples.map((m) => (
                      <ExampleCard
                        key={m.id}
                        text={m.claim}
                        selected={!verifyError && selectedMyth?.id === m.id}
                        icon={<FileQuestion className="w-4 h-4" />}
                        onSelect={() => {
                          setSearchQuery(m.claim);
                          handleVerify(m.claim);
                        }}
                      />
                    ))
                  : extraMedExamples.map((med) => (
                      <ExampleCard
                        key={med.id}
                        text={med.medicineName}
                        selected={!verifyError && selectedMedication?.id === med.id}
                        icon={<Pill className="w-4 h-4" />}
                        onSelect={() => {
                          setSearchQuery(med.medicineName);
                          handleVerify(med.medicineName);
                        }}
                      />
                    ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* C. RESULT LAYOUT (Verdict first, then Action — max-w-3xl, centred, max 2 container levels) */}
      <div
        ref={resultContainerRef}
        aria-live="polite"
        aria-busy={isVerifying}
        className="max-w-3xl mx-auto px-4 sm:px-6 pt-2 scroll-mt-20"
      >
        {/* E. LOADING SKELETON (Matches exact layout of result: banner, steps, comparison) */}
        {isVerifying && (
          <div
            role="status"
            aria-label="Verifying against clinical guidelines"
            className="space-y-6 min-h-[620px]"
          >
            {/* Skeleton 1: Verdict Banner */}
            <div className="space-y-2">
              <div className="w-full min-h-[84px] rounded-[16px] border-l-[3px] border-l-primary/50 border border-border bg-surface p-4 sm:p-5 animate-pulse space-y-2.5">
                <div className="h-5 w-48 rounded-md bg-border/70" />
                <div className="h-4 w-3/4 rounded-md bg-border/50" />
              </div>
              <div className="h-4 w-64 rounded-md bg-border/50 mx-1 animate-pulse" />
            </div>

            {/* Skeleton 2: What to do instead card */}
            <div className="rounded-[18px] bg-surface border border-border p-5 sm:p-6 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-6 w-44 rounded-md bg-border/70" />
                <div className="h-7 w-40 rounded-full bg-border/50" />
              </div>
              <div className="divide-y divide-border/60">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="py-3.5 flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full bg-border/70 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-full rounded-md bg-border/60" />
                      <div className="h-4 w-4/5 rounded-md bg-border/40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skeleton 3: Two-column comparison */}
            <div className="space-y-3 animate-pulse">
              <div className="h-6 w-32 rounded-md bg-border/70" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-48 rounded-[18px] bg-surface border border-border p-5 space-y-3">
                  <div className="h-5 w-24 rounded-md bg-border/70" />
                  <div className="h-4 w-full rounded-md bg-border/50" />
                  <div className="h-4 w-5/6 rounded-md bg-border/50" />
                </div>
                <div className="h-48 rounded-[18px] bg-surface border border-border p-5 space-y-3">
                  <div className="h-5 w-24 rounded-md bg-border/70" />
                  <div className="h-4 w-full rounded-md bg-border/50" />
                  <div className="h-4 w-5/6 rounded-md bg-border/50" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* E. ERROR / OFFLINE STATE */}
        {!isVerifying && verifyError && (
          <div
            role="alert"
            className="rounded-[18px] bg-surface border border-border p-6 sm:p-8 text-center space-y-4 shadow-2xs"
          >
            <div className="w-11 h-11 rounded-full bg-base border border-border text-ink-muted mx-auto flex items-center justify-center">
              <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
            </div>
            <p className="text-[18px] font-semibold text-ink leading-snug">
              {verifyError}
            </p>
            <div className="pt-1 flex justify-center">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleVerify()}
                className="min-h-[48px] px-5"
              >
                <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Retry</span>
              </Button>
            </div>
          </div>
        )}

        {/* C. FIRST-AID MYTHS RESULT */}
        {!isVerifying && !verifyError && activeTab === 'myths' && selectedMyth && (
          <div id="panel-myths" role="tabpanel" aria-labelledby="tab-myths" className="space-y-6">
            {/* 1. Verdict Banner (slim <= 96px, 3px left border, 24px icon, 20px/600 verdict, quoted myth, 14px source caption) */}
            <VerdictBanner
              ref={verdictHeadingRef}
              verdict={selectedMyth.verdict}
              hazardSeverity={selectedMyth.hazardSeverity}
              claim={selectedMyth.claim}
              clinicalAuthority={selectedMyth.clinicalAuthority}
            />

            {/* 2. "What to do instead" primary white card directly under the banner */}
            <StepList
              title="What to do instead"
              badgeText="AHA & AIIMS standard"
              steps={selectedMyth.accreditedProtocol}
            />

            {/* 3. "Why it fails" compact two-column comparison with equal heights */}
            <CompareCard
              mythSummary={selectedMyth.mythSummary}
              whyPeopleBelieveIt={selectedMyth.whyPeopleBelieveIt}
              biologicalReality={selectedMyth.biologicalReality}
            />

            {/* 4. Unified Sources & Review Footer (D10 / G) */}
            <SourcesAndReviewFooter
              sources={[
                {
                  name: selectedMyth.clinicalAuthority,
                  publisher: 'WHO / AIIMS / Indian Red Cross Evidence Standard',
                  version: '2024 First-Aid Review',
                  year: 2024,
                  url: 'https://www.who.int/',
                },
              ]}
              review={{
                status: 'pending_review',
                reviewer_role: 'Emergency Medicine & First-Aid Clinical Review Panel',
                next_review: '2027-06-01',
                note: 'Evidence summary synthesized from published first-aid guidelines.',
              }}
              version="2.4"
              updatedAt="2025-02-15"
              documentTitle={selectedMyth.claim}
              documentId={selectedMyth.id}
            />

            {/* 5. Footer actions */}
            <div className="pt-5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-[16px] text-ink-muted font-normal leading-snug">
                Need real-time emergency guidance for this scenario right now?
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => onSelectDestination?.('chat')}
                  className="w-full sm:w-auto min-h-[48px] px-5 text-[15px] font-semibold whitespace-nowrap"
                >
                  <span>Open AI First-Aid Helper</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onSelectDestination?.('camera')}
                  className="w-full sm:w-auto min-h-[48px] px-5 text-[15px] font-semibold whitespace-nowrap"
                >
                  <span>Scan with AI Camera</span>
                </Button>
              </div>
            </div>

            {/* 6. Disclaimer */}
            <p className="text-[14px] text-ink-muted text-center sm:text-left leading-snug">
              First-aid guidance only. In an emergency, call 112.
            </p>
          </div>
        )}

        {/* B/C. MEDICATION RULES RESULT (Restyled in the exact same calm clinical system) */}
        {!isVerifying &&
          !verifyError &&
          activeTab === 'medications' &&
          selectedMedication && (
            <div
              id="panel-medications"
              role="tabpanel"
              aria-labelledby="tab-medications"
              className="space-y-6"
            >
              {/* 1. Slim Medication Summary Banner */}
              <div className="scroll-mt-20 space-y-2">
                <div className="w-full rounded-[16px] border-l-[3px] border-l-primary border-y border-r border-border bg-surface px-4 py-3.5 sm:px-5 sm:py-4 shadow-2xs">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Pill
                        className="w-6 h-6 text-primary shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <h2
                          ref={medHeadingRef}
                          tabIndex={-1}
                          className="text-[20px] font-semibold text-ink leading-snug focus:outline-none"
                        >
                          {selectedMedication.medicineName}
                        </h2>
                        <p className="text-[16px] text-ink-muted leading-snug">
                          Active salt: {selectedMedication.genericSalt} · {selectedMedication.drugClass}
                        </p>
                      </div>
                    </div>

                    <Chip variant="primary" nowrap>
                      {selectedMedication.emergencyRole}
                    </Chip>
                  </div>
                </div>

                <p className="flex items-start gap-2 px-1 text-[14px] text-ink-muted leading-snug">
                  <ShieldCheck
                    className="w-4 h-4 text-primary shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    {selectedMedication.storageAndPrecaution}
                  </span>
                </p>
              </div>

              {/* 2. Primary White Card: Safe dosage and timing */}
              <section
                aria-labelledby="med-dosage-heading"
                className="rounded-[18px] bg-surface border border-border p-5 sm:p-6 shadow-2xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <h3
                    id="med-dosage-heading"
                    className="text-[20px] font-semibold leading-snug text-ink"
                  >
                    Dosage and timing
                  </h3>
                  <Chip variant="neutral">
                    {selectedMedication.timingAndDosage.foodRelation}
                  </Chip>
                </div>

                <dl className="divide-y divide-border/70">
                  <div className="py-3 first:pt-1 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                    <dt className="text-[16px] font-semibold text-ink shrink-0">
                      Recommended dose
                    </dt>
                    <dd className="text-[17px] text-ink-muted sm:text-right leading-snug">
                      {selectedMedication.timingAndDosage.recommendedDose}
                    </dd>
                  </div>
                  <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                    <dt className="text-[16px] font-semibold text-ink shrink-0">
                      Frequency
                    </dt>
                    <dd className="text-[17px] text-ink-muted sm:text-right leading-snug">
                      {selectedMedication.timingAndDosage.frequency}
                    </dd>
                  </div>
                  <div className="py-3 last:pb-0 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                    <dt className="text-[16px] font-semibold text-ink shrink-0">
                      Maximum 24-hour limit
                    </dt>
                    <dd className="text-[17px] font-semibold text-[#7F1D1D] dark:text-red-300 sm:text-right leading-snug">
                      {selectedMedication.timingAndDosage.maxDailyLimit}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* 3. Two-Column Comparison: When to give vs When never to give */}
              <section aria-labelledby="med-indications-heading" className="space-y-3">
                <h3
                  id="med-indications-heading"
                  className="text-[20px] font-semibold leading-snug text-ink"
                >
                  Clinical indications
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  {/* Left: When to give */}
                  <div className="rounded-[18px] bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 p-5 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="w-6 h-6 min-w-[24px] min-h-[24px] rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0"
                      >
                        <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                      </span>
                      <h4 className="text-[16px] font-semibold leading-snug text-ink">
                        When to give
                      </h4>
                    </div>

                    <ul className="space-y-2.5">
                      {selectedMedication.whenToGive.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-[16px] text-ink-muted leading-relaxed flex items-start gap-2"
                        >
                          <span
                            aria-hidden="true"
                            className="text-emerald-700 dark:text-emerald-400 font-bold shrink-0"
                          >
                            •
                          </span>
                          <span className="min-w-0">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right: When never to give */}
                  <div className="rounded-[18px] bg-red-50/60 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 p-5 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="w-6 h-6 min-w-[24px] min-h-[24px] rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 flex items-center justify-center shrink-0"
                      >
                        <X className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                      </span>
                      <h4 className="text-[16px] font-semibold leading-snug text-ink">
                        When never to give
                      </h4>
                    </div>

                    <ul className="space-y-2.5">
                      {selectedMedication.whenNotToGive.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-[16px] text-ink-muted leading-relaxed flex items-start gap-2"
                        >
                          <span
                            aria-hidden="true"
                            className="text-red-600 dark:text-red-400 font-bold shrink-0"
                          >
                            •
                          </span>
                          <span className="min-w-0">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* 4. Jan Aushadhi Generic Price Comparison (Clean clinical surface card, max 2 container levels) */}
              <section
                aria-labelledby="med-savings-heading"
                className="rounded-[18px] bg-surface border border-border p-5 sm:p-6 shadow-2xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <h3
                    id="med-savings-heading"
                    className="text-[20px] font-semibold leading-snug text-ink"
                  >
                    Jan Aushadhi generic price
                  </h3>
                  <Chip
                    variant="success"
                    icon={<CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                  >
                    Save {selectedMedication.savingsPercentage}
                  </Chip>
                </div>

                <dl className="divide-y divide-border/70">
                  <div className="py-3 first:pt-1 flex items-baseline justify-between gap-4">
                    <dt className="text-[16px] font-medium text-ink-muted">
                      Branded market MRP
                    </dt>
                    <dd className="text-[18px] font-semibold line-through text-ink-muted tabular-nums">
                      {selectedMedication.brandedMarketPrice}
                    </dd>
                  </div>
                  <div className="py-3 flex items-baseline justify-between gap-4">
                    <dt className="text-[16px] font-semibold text-ink">
                      Jan Aushadhi generic price
                    </dt>
                    <dd className="text-[20px] font-semibold text-primary tabular-nums">
                      {selectedMedication.genericJanAushadhiPrice}
                    </dd>
                  </div>
                  <div className="py-3 last:pb-0 space-y-2">
                    <dt className="text-[14px] font-semibold text-ink-muted">
                      What to ask your chemist
                    </dt>
                    <dd className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-[16px] text-ink font-medium leading-snug">
                        “{selectedMedication.whatToTellChemist}”
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleCopyScript(selectedMedication.whatToTellChemist)
                        }
                        className="w-full sm:w-auto min-h-[44px] shrink-0"
                      >
                        {copiedChemistScript ? (
                          <>
                            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Copy script</span>
                          </>
                        )}
                      </Button>
                    </dd>
                  </div>
                </dl>
              </section>

              {/* 5. Unified Sources & Review Footer (D10 / G) */}
              <SourcesAndReviewFooter
                sources={[
                  {
                    name: 'National List of Essential Medicines (NLEM) & PMBI Jan Aushadhi Formulary',
                    publisher: 'Ministry of Health & Family Welfare / PMBI (Govt. of India)',
                    version: 'NLEM / PMBI 2024',
                    year: 2024,
                    url: 'https://janaushadhi.gov.in/',
                  },
                ]}
                review={{
                  status: 'pending_review',
                  reviewer_role: 'Clinical Pharmacology & First-Aid Review Panel',
                  next_review: '2027-06-01',
                  note: 'Standard OTC/prescription timing reference. Always verify patient-specific dosing with a registered clinician.',
                }}
                version="2.4"
                updatedAt="2025-02-15"
                documentTitle={selectedMedication.medicineName}
                documentId={selectedMedication.id}
              />

              {/* 6. Footer actions */}
              <div className="pt-5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-[16px] text-ink-muted font-normal leading-snug">
                  Need real-time emergency guidance or live generic store pricing?
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => onSelectDestination?.('medicines')}
                    className="w-full sm:w-auto min-h-[48px] px-5 text-[15px] font-semibold whitespace-nowrap"
                  >
                    <span>Open Medicine Finder</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onSelectDestination?.('chat')}
                    className="w-full sm:w-auto min-h-[48px] px-5 text-[15px] font-semibold whitespace-nowrap"
                  >
                    <span>Open AI First-Aid Helper</span>
                  </Button>
                </div>
              </div>

              {/* 7. Disclaimer */}
              <p className="text-[14px] text-ink-muted text-center sm:text-left leading-snug">
                First-aid guidance only. In an emergency, call 112.
              </p>
            </div>
          )}
      </div>
    </div>
  );
};
