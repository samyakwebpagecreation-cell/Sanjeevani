import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  Check,
  Copy,
  Flag,
  HelpCircle,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  X
} from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Destination } from '../../types';
import { Button, Card } from '../common/DesignSystem';
import { runTransparentMedicineSearch } from '../../services/cheapMedicinesService';
import { POPULAR_MEDICINE_CHIPS } from '../../services/medicines/referenceData';
import { SimulatedFailureType } from '../../services/medicines/fetchSources';
import {
  SearchPipelineResult,
  SearchProgressState
} from '../../services/medicines/types';
import { AlternativeRow } from './AlternativeRow';
import { MatchTable } from './MatchTable';
import { MedicineIdentityCard } from './MedicineIdentityCard';
import { MethodPanel } from './MethodPanel';
import { PrescriptionScannerModal } from './PrescriptionScannerModal';
import { PriceCompareCard } from './PriceCompareCard';
import { SearchProgress } from './SearchProgress';
import { SourceLedger } from './SourceLedger';
import { SourcesAndReviewFooter } from '../common/SourcesAndReviewFooter';

export interface CheapMedicinesViewProps {
  onNavigate?: (destination: Destination) => void;
  onLaunchGuardianWithQuery?: (query: string) => void;
  onBackToHome?: () => void;
  onOpenRadar?: () => void;
}

export const CheapMedicinesView: React.FC<CheapMedicinesViewProps> = () => {
  const [searchQuery, setSearchQuery] = useState('Augmentin 625');
  const [activeChipQuery, setActiveChipQuery] = useState('Augmentin 625');
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<SearchProgressState | null>(null);
  const [result, setResult] = useState<SearchPipelineResult | null>(null);
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // "Report a wrong price or source" modal state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportIssueType, setReportIssueType] = useState('Price differs at pharmacy');
  const [reportNote, setReportNote] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const executeLookup = async (
    queryToRun: string,
    opts?: {
      forceRefresh?: boolean;
      simulate_failures?: Record<string, SimulatedFailureType>;
    }
  ) => {
    const trimmed = queryToRun.trim();
    if (!trimmed) return;

    setSearchQuery(trimmed);
    setActiveChipQuery(trimmed);
    setIsLoading(true);
    setCopiedScript(false);
    setHighlightedSourceId(null);

    try {
      const pipelineRes = await runTransparentMedicineSearch(trimmed, {
        forceRefresh: opts?.forceRefresh,
        simulate_failures: opts?.simulate_failures,
        onProgress: (pState) => {
          setProgress({ ...pState });
        }
      });
      setResult(pipelineRes);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Support optional URL query params for automated testing of states/failures (?med=Pan or ?med=Augmentin+625&sim=partial)
    try {
      const params = new URLSearchParams(window.location.search);
      const medParam = params.get('med');
      const simParam = params.get('sim');
      let simMap: Record<string, SimulatedFailureType> | undefined;
      if (simParam === 'all_fail') {
        simMap = { '*': 'timeout' };
      } else if (simParam === 'partial') {
        simMap = { pmbjp: 'timeout', nppa: 'blocked', pharmeasy: 'timeout' };
      } else if (simParam === 'outlier') {
        simMap = { pharmeasy: 'outlier' };
      }
      if (medParam) {
        executeLookup(medParam, { simulate_failures: simMap });
        return;
      }
    } catch {
      // Ignore URL parsing errors
    }
    executeLookup('Augmentin 625');
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    executeLookup(searchQuery.trim());
  };

  const handleCopyCounterScript = () => {
    if (!result?.counter_script) return;
    navigator.clipboard?.writeText(result.counter_script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleInspectSource = (sourceId: string) => {
    setHighlightedSourceId(sourceId);
    const ledgerEl = document.getElementById('source-ledger-section');
    if (ledgerEl) {
      ledgerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScrollToMethodology = () => {
    const methodEl = document.getElementById('how-this-works-section');
    if (methodEl) {
      methodEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    const payload = {
      medicine_query: result?.identity?.brand_name || searchQuery,
      issue_type: reportIssueType,
      note: reportNote.trim().slice(0, 500),
      reported_at_iso: new Date().toISOString()
    };

    try {
      // Save locally first so offline reports never get lost
      const existingRaw = localStorage.getItem('sanjeevani_price_reports') || '[]';
      const existing = JSON.parse(existingRaw);
      existing.push(payload);
      localStorage.setItem('sanjeevani_price_reports', JSON.stringify(existing.slice(-50)));

      // Also persist to Firestore if online
      if (typeof navigator === 'undefined' || navigator.onLine !== false) {
        await Promise.race([
          addDoc(collection(db, 'price_reports'), {
            ...payload,
            createdAt: serverTimestamp()
          }),
          new Promise((resolve) => setTimeout(resolve, 1500))
        ]);
      }
    } catch {
      // Local storage copy already saved
    } finally {
      setIsSubmittingReport(false);
      setReportSubmitted(true);
    }
  };

  // Determine if partial source failures happened on a successful lookup
  const failedSourcesCount = result
    ? Math.max(0, result.sources_checked_count - result.sources_succeeded_count)
    : 0;

  const cheapestVerifiedGeneric =
    result && result.verified_alternatives.length > 0
      ? result.verified_alternatives.find(
          (alt) =>
            alt.product_name.toLowerCase() !==
            (result.identity?.brand_name || '').toLowerCase()
        ) || result.verified_alternatives[0]
      : null;

  return (
    <div className="min-h-screen bg-base text-ink pb-20">
      {/* ====================================================================
       * COMPACT HERO (<= 220px tall on desktop, neutral clinical surface)
       * ==================================================================== */}
      <section
        aria-labelledby="cheap-medicines-heading"
        className="bg-surface border-b border-border py-5 sm:py-6"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="space-y-1">
              <h1
                id="cheap-medicines-heading"
                className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight leading-snug text-balance"
              >
                Find cheaper generic medicines in India
              </h1>
              <p className="text-sm sm:text-base text-ink-muted leading-snug">
                Compare branded strip prices with same-salt Jan Aushadhi and retail generics from verifiable public catalogues.
              </p>
            </div>

            <button
              type="button"
              onClick={handleScrollToMethodology}
              className="inline-flex min-h-[34px] items-center gap-1 text-sm font-semibold text-primary hover:underline cursor-pointer whitespace-nowrap"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>How this works</span>
            </button>
          </div>

          {/* Search Bar + Scan Rx Button */}
          <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 min-w-0">
              <Search
                aria-hidden="true"
                className="w-5 h-5 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={100}
                aria-label="Search medicine brand or salt name"
                placeholder="Search brand or salt (e.g., Augmentin 625, Dolo 650, Pan-D, Telma 40)…"
                className="w-full min-h-[46px] pl-11 pr-9 py-2 rounded-xl bg-base border border-border text-base font-medium text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button type="submit" size="sm" variant="primary" className="min-h-[46px] px-5">
                <Search className="w-4 h-4" />
                <span>Check prices</span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setIsScannerOpen(true)}
                className="min-h-[46px] px-4 whitespace-nowrap"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Rx</span>
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* ====================================================================
       * MAIN CONTENT CONTAINER (max-w-3xl, clean 2-level hierarchy)
       * ==================================================================== */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Popular Medicine Chips (Fixed selected state + single-line layout) */}
        <section aria-label="Popular medicines">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Commonly checked medicines
            </span>
            <button
              type="button"
              onClick={() => executeLookup('Pan')}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Test ambiguous query (&ldquo;Pan&rdquo;)
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {POPULAR_MEDICINE_CHIPS.map((chip) => {
              const isSelected =
                activeChipQuery.toLowerCase() === chip.query.toLowerCase();
              return (
                <button
                  key={chip.query}
                  type="button"
                  onClick={() => executeLookup(chip.query)}
                  aria-pressed={isSelected}
                  className={`inline-flex min-h-[40px] items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm leading-snug transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-2xs'
                      : 'bg-surface hover:bg-primary-soft/40 text-ink border-border hover:border-primary/40'
                  }`}
                >
                  <span className="font-bold">{chip.label}</span>
                  <span
                    className={`text-[14px] font-normal ${
                      isSelected ? 'text-white/90' : 'text-ink-muted'
                    }`}
                  >
                    · {chip.condition}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Live Search Progress Checklist */}
        {isLoading && progress && <SearchProgress progress={progress} />}

        {/* ====================================================================
         * EDGE STATE 1: AMBIGUOUS QUERY DISAMBIGUATION PICKER ("Pan", "Dolo")
         * ==================================================================== */}
        {!isLoading &&
          result &&
          result.outcome === 'disambiguation_needed' &&
          result.disambiguation_options && (
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-ink leading-snug">
                  Which &ldquo;{result.query}&rdquo; medicine do you mean?
                </h2>
                <p className="text-sm text-ink-muted">
                  Several distinct strengths or salt combinations share this prefix. Pick the exact medicine on your strip or prescription before we compare prices:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.disambiguation_options.map((opt) => (
                  <button
                    key={opt.query}
                    type="button"
                    onClick={() => executeLookup(opt.query)}
                    className="p-4 rounded-2xl bg-base hover:bg-primary-soft/35 border border-border hover:border-primary text-left transition-colors cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-bold text-ink">{opt.brand_name}</span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface border border-border text-ink-muted whitespace-nowrap">
                        {opt.dosage_form}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-primary leading-snug">
                      {opt.composition_display}
                    </p>
                    <p className="text-xs text-ink-muted">{opt.condition_tag}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}

        {/* ====================================================================
         * EDGE STATE 2: UNKNOWN MEDICINE / UNCONFIRMED COMPOSITION ("Xyzzy 100")
         * ==================================================================== */}
        {!isLoading &&
          result &&
          (result.outcome === 'unknown_medicine' ||
            result.outcome === 'composition_unconfirmed') && (
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-ink-muted shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-bold text-ink leading-snug">
                    We couldn&apos;t confirm what&apos;s in this medicine
                  </h2>
                  <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
                    We could not verify an active salt composition and strength for{' '}
                    <q className="font-semibold text-ink">{result.query}</q> from our allowlisted official or retail sources. Because we never guess or invent prices, no price comparison is shown.
                  </p>
                </div>
              </div>

              {result.did_you_mean && result.did_you_mean.length > 0 ? (
                <div className="pt-2 space-y-2">
                  <p className="text-sm font-bold text-ink">Did you mean one of these?</p>
                  <div className="flex flex-wrap gap-2">
                    {result.did_you_mean.map((sug) => (
                      <button
                        key={sug.query}
                        type="button"
                        onClick={() => executeLookup(sug.query)}
                        className="inline-flex min-h-[40px] items-center gap-2 px-3.5 py-2 rounded-xl bg-base hover:bg-primary-soft/40 border border-border hover:border-primary text-sm font-semibold text-ink cursor-pointer"
                      >
                        <span className="font-bold text-primary">{sug.brand_name}</span>
                        <span className="text-ink-muted">· {sug.composition_display}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-base border border-border text-sm text-ink-muted">
                  No match. Try searching by the exact active salt name and strength printed on your medicine strip (for example, <button type="button" onClick={() => executeLookup('Paracetamol 650mg')} className="font-semibold text-primary underline cursor-pointer">Paracetamol 650mg</button> or <button type="button" onClick={() => executeLookup('Telmisartan 40mg')} className="font-semibold text-primary underline cursor-pointer">Telmisartan 40mg</button>).
                </div>
              )}
            </Card>
          )}

        {/* ====================================================================
         * EDGE STATE 3: ALL SOURCES FAILED / UNREACHABLE
         * ==================================================================== */}
        {!isLoading &&
          result &&
          result.outcome === 'no_sources_reachable' &&
          result.identity && (
            <div className="space-y-5">
              <MedicineIdentityCard
                identity={result.identity}
                confidenceTier={result.confidence_tier}
                confidenceReason={result.confidence_reason}
                retrievedAt={result.retrieved_at}
                sourcesSucceededCount={result.sources_succeeded_count}
                sourcesCheckedCount={result.sources_checked_count}
                fromCache={result.from_cache}
                isOfflineFallback={result.is_offline_fallback}
                onRecheckNow={() => executeLookup(result.query, { forceRefresh: true })}
              />

              <Card className="p-5 sm:p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-alert shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-ink leading-snug">
                      We couldn&apos;t reach price sources right now
                    </h3>
                    <p className="text-sm text-ink-muted leading-relaxed">
                      All {result.sources_checked_count} checked sources timed out or were unreachable, and no cached price record was available. See the source ledger below for individual failure details.
                    </p>
                  </div>
                </div>
                <div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => executeLookup(result.query, { forceRefresh: true })}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry price check</span>
                  </Button>
                </div>
              </Card>

              <SourceLedger
                records={result.source_ledger}
                highlightedSourceId={highlightedSourceId}
              />
              <MethodPanel result={result} />
            </div>
          )}

        {/* ====================================================================
         * MAIN VERIFIED RESULT FLOW (Sections B1 - B8)
         * ==================================================================== */}
        {!isLoading &&
          result &&
          result.outcome === 'success' &&
          result.identity &&
          result.savings && (
            <div className="space-y-5">
              {/* Partial source failure notice banner */}
              {failedSourcesCount > 0 && (
                <div
                  role="status"
                  className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 dark:bg-amber-950/40 dark:border-amber-800/50 dark:text-amber-200 flex items-start gap-3 text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">
                      {failedSourcesCount} of {result.sources_checked_count} sources couldn&apos;t be reached or returned no match
                    </strong>{' '}
                    — results below are computed from the remaining{' '}
                    {result.sources_succeeded_count} verified source(s), and every failed or unmatched check is listed in the source ledger.
                  </div>
                </div>
              )}

              {/* B1. MedicineIdentityCard */}
              <MedicineIdentityCard
                identity={result.identity}
                confidenceTier={result.confidence_tier}
                confidenceReason={result.confidence_reason}
                retrievedAt={result.retrieved_at}
                sourcesSucceededCount={result.sources_succeeded_count}
                sourcesCheckedCount={result.sources_checked_count}
                fromCache={result.from_cache}
                isOfflineFallback={result.is_offline_fallback}
                onRecheckNow={() => executeLookup(result.query, { forceRefresh: true })}
              />

              {/* B2. PriceCompareCard */}
              <PriceCompareCard
                identity={result.identity}
                savings={result.savings}
                onInspectSource={handleInspectSource}
              />

              {/* B3. MatchTable ("Same medicine?") */}
              <MatchTable
                identity={result.identity}
                cheapestGeneric={cheapestVerifiedGeneric}
              />

              {/* B4a. Verified Alternatives (sorted by per-unit price) */}
              <section aria-labelledby="verified-alternatives-heading" className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3
                      id="verified-alternatives-heading"
                      className="text-lg sm:text-xl font-bold text-ink leading-snug"
                    >
                      Verified listings ({result.verified_alternatives.length})
                    </h3>
                    <p className="text-sm text-ink-muted">
                      Identical active salt, strength, and dosage form — sorted by lowest per-unit price.
                    </p>
                  </div>
                </div>

                {result.verified_alternatives.length > 0 ? (
                  <div className="space-y-3">
                    {result.verified_alternatives.map((alt) => (
                      <AlternativeRow
                        key={alt.id}
                        alternative={alt}
                        isCriticalNeverSwitch={result.identity?.never_switch_warning.is_critical}
                        onInspectSource={handleInspectSource}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-5 text-sm text-ink-muted">
                    No verified same-salt, same-strength listings were returned for this query.
                  </Card>
                )}
              </section>

              {/* B4b. Similar but not identical (when any check is ✗ on salt, strength, or form) */}
              {result.similar_alternatives.length > 0 && (
                <section aria-labelledby="similar-alternatives-heading" className="space-y-3">
                  <div>
                    <h3
                      id="similar-alternatives-heading"
                      className="text-lg sm:text-xl font-bold text-ink leading-snug"
                    >
                      Similar but not identical ({result.similar_alternatives.length})
                    </h3>
                    <p className="text-sm text-ink-muted">
                      Returned by sources during search, but excluded from price comparison because active salt, strength, or dosage form differs.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {result.similar_alternatives.map((alt) => (
                      <AlternativeRow
                        key={alt.id}
                        alternative={alt}
                        isCriticalNeverSwitch={result.identity?.never_switch_warning.is_critical}
                        onInspectSource={handleInspectSource}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* B5. "What to ask at the counter" */}
              <Card className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-5 h-5 text-primary shrink-0" />
                    <h3 className="text-lg sm:text-xl font-bold text-ink leading-snug">
                      What to ask at the counter
                    </h3>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant={copiedScript ? 'primary' : 'secondary'}
                    onClick={handleCopyCounterScript}
                    className="whitespace-nowrap"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy script</span>
                      </>
                    )}
                  </Button>
                </div>

                <blockquote className="p-4 rounded-xl bg-base border border-border text-base font-medium text-ink leading-relaxed">
                  {result.counter_script}
                </blockquote>

                <p className="text-sm text-ink-muted leading-relaxed">
                  You can ask your pharmacist whether a same-salt generic is suitable. For prescription medicines, check with your doctor first.
                </p>
              </Card>

              {/* B6. Sources & Methodology (open by default) */}
              <section aria-label="Sources and methodology" className="space-y-5">
                <SourceLedger
                  records={result.source_ledger}
                  highlightedSourceId={highlightedSourceId}
                />
                <MethodPanel result={result} />
                <SourcesAndReviewFooter
                  sources={result.source_ledger.map((rec) => ({
                    name: `${rec.source_name} (${rec.status.toUpperCase()})`,
                    publisher:
                      rec.source_type === 'government'
                        ? 'PMBI / NPPA Govt. of India'
                        : rec.domain || 'Public Pharmacy Index',
                    version: rec.retrieved_at ? rec.retrieved_at.slice(0, 10) : '2025-02',
                    year: 2025,
                    url: rec.url,
                  }))}
                  review={{
                    status: 'pending_review',
                    reviewer_role: 'Deterministic Price & Salt Verification Pipeline',
                    next_review: '2027-06-01',
                    note: 'Every price, salt, strength, and pack size is extracted from the cited source records above.',
                  }}
                  version="2.4"
                  updatedAt="2025-02-15"
                  documentTitle={result.identity?.brand_name || searchQuery}
                  documentId={`med-${(result.identity?.brand_name || searchQuery).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                />
              </section>
            </div>
          )}

        {/* ====================================================================
         * B7. SAFETY NOTICE (Always visible, calm neutral colours, never collapsed)
         * ==================================================================== */}
        <Card className="p-5 sm:p-6 bg-surface border border-border space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h3 className="text-base font-bold text-ink leading-snug">
              Important price &amp; prescription safety notice
            </h3>

            {/* B8. "Report a wrong price or source" button */}
            <button
              type="button"
              onClick={() => {
                setReportSubmitted(false);
                setReportNote('');
                setIsReportOpen(true);
              }}
              className="inline-flex min-h-[38px] items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-base hover:bg-primary-soft/40 border border-border hover:border-primary/40 text-sm font-semibold text-ink cursor-pointer whitespace-nowrap"
            >
              <Flag className="w-4 h-4 text-primary shrink-0" />
              <span>Report a wrong price or source</span>
            </button>
          </div>

          <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
            Prices change and can differ by city and store. Confirm with your pharmacist. For prescription medicines, check with your doctor before switching. Never change or stop critical long-term medicines (heart, epilepsy, diabetes/insulin, thyroid, blood thinners, psychiatric) without your doctor&apos;s advice.
          </p>
        </Card>
      </main>

      {/* ====================================================================
       * REPORT A WRONG PRICE OR SOURCE MODAL (B8)
       * ==================================================================== */}
      {isReportOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-price-modal-title"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-navy/70 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md bg-surface rounded-[20px] border border-border shadow-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2
                id="report-price-modal-title"
                className="text-lg font-bold text-ink leading-snug"
              >
                Report a wrong price or source
              </h2>
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                aria-label="Close report form"
                className="w-9 h-9 rounded-xl bg-base border border-border flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-200 text-sm leading-relaxed">
                  <strong>Thank you.</strong> Your report for{' '}
                  <strong>{result?.identity?.brand_name || searchQuery}</strong> has been logged for source verification.
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => setIsReportOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">
                    Medicine
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={result?.identity?.brand_name || searchQuery}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-base border border-border text-sm font-semibold text-ink"
                  />
                </div>

                <div>
                  <label
                    htmlFor="report-issue-select"
                    className="block text-xs font-semibold text-ink-muted mb-1"
                  >
                    What&apos;s wrong?
                  </label>
                  <select
                    id="report-issue-select"
                    value={reportIssueType}
                    onChange={(e) => setReportIssueType(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-base border border-border text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Price differs at pharmacy">Price differs at pharmacy</option>
                    <option value="Broken or outdated source link">
                      Broken or outdated source link
                    </option>
                    <option value="Salt composition or strength mismatch">
                      Salt composition or strength mismatch
                    </option>
                    <option value="Pack size mismatch">Pack size mismatch</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="report-note-input"
                    className="block text-xs font-semibold text-ink-muted mb-1"
                  >
                    Optional note (e.g., MRP printed on your strip)
                  </label>
                  <textarea
                    id="report-note-input"
                    rows={3}
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    placeholder="Share the MRP, pack size, or URL you observed…"
                    className="w-full p-3 rounded-xl bg-base border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="neutral"
                    onClick={() => setIsReportOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    variant="primary"
                    disabled={isSubmittingReport}
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmittingReport ? 'Saving…' : 'Submit report'}</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
       * PRESCRIPTION SCANNER MODAL (With editable confirmation list)
       * ==================================================================== */}
      <PrescriptionScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectMedicineForDetail={(medName) => {
          executeLookup(medName);
        }}
      />
    </div>
  );
};
