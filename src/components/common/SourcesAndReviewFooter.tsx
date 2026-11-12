import React, { useState } from 'react';
import {
  ChevronDown,
  ExternalLink,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
} from 'lucide-react';
import { ProtocolReview, ProtocolSource } from '../../data/protocolSchema';

interface SourcesAndReviewFooterProps {
  sources: ProtocolSource[];
  review: ProtocolReview;
  version: string;
  updatedAt: string;
  documentTitle: string;
  documentId: string;
  defaultOpen?: boolean;
}

export const SourcesAndReviewFooter: React.FC<SourcesAndReviewFooterProps> = ({
  sources,
  review,
  version,
  updatedAt,
  documentTitle,
  documentId,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showReportForm, setShowReportForm] = useState(false);
  const [issueText, setIssueText] = useState('');
  const [issueSubmitted, setIssueSubmitted] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  const handleSubmitIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueText.trim()) return;
    try {
      const existing = JSON.parse(localStorage.getItem('sanjeevani_protocol_feedback') || '[]');
      existing.push({
        documentId,
        documentTitle,
        version,
        feedback: issueText.trim(),
        submittedAt: new Date().toISOString(),
      });
      localStorage.setItem('sanjeevani_protocol_feedback', JSON.stringify(existing));
    } catch {}
    setIssueSubmitted(true);
    setIssueText('');
    setTimeout(() => {
      setShowReportForm(false);
      setIssueSubmitted(false);
    }, 2500);
  };

  const statusLabel =
    review.status === 'reviewed'
      ? `Reviewed ${review.reviewed_on || updatedAt}`
      : review.status === 'needs_update'
      ? 'Needs clinical update — see review note'
      : review.status === 'draft'
      ? 'Draft — not yet clinically reviewed'
      : 'Pending clinical review';

  return (
    <section
      aria-label="Sources and clinical review information"
      className="rounded-xl border border-border bg-surface print:border-slate-300 print:bg-white"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-base/60 transition-colors cursor-pointer print:hidden"
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <BookOpen className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-bold text-ink">
            Sources &amp; review
          </span>
          <span className="text-xs text-ink-muted">
            · {sources.length} {sources.length === 1 ? 'guideline' : 'guidelines'} · v{version}
          </span>
          {review.status === 'needs_update' && (
            <span className="inline-flex items-center gap-1 min-h-[22px] px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-950 border border-amber-300 whitespace-nowrap">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>Needs clinical update</span>
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-ink-muted shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div className={`${isOpen ? 'block' : 'hidden'} print:block border-t border-border px-4 py-4 space-y-4 text-sm`}>
        {/* Review Status Callout if needs_update or pending */}
        {review.note && (
          <div
            className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 ${
              review.status === 'needs_update'
                ? 'bg-amber-50/90 border-amber-300 text-amber-950 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-100'
                : 'bg-base border-border text-ink-muted'
            }`}
          >
            {review.status === 'needs_update' ? (
              <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block text-ink">{statusLabel}</span>
              <p className="mt-0.5">{review.note}</p>
            </div>
          </div>
        )}

        {/* Primary Clinical Sources */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Primary Clinical Guidelines Cited
          </h4>
          <ul className="space-y-2">
            {sources.map((src, i) => (
              <li
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-lg bg-base/70 border border-border/80 text-xs"
              >
                <div>
                  <span className="font-semibold text-ink">{src.name}</span>
                  <span className="text-ink-muted">
                    {' '}
                    · {src.publisher} ({src.version}, {src.year})
                  </span>
                </div>
                {src.url && (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline whitespace-nowrap shrink-0 print:text-slate-800"
                  >
                    <span>Open source</span>
                    <ExternalLink className="w-3 h-3 print:hidden" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Review Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-ink-muted pt-1 border-t border-border/70">
          <div>
            <span className="font-semibold text-ink">Review status:</span> {statusLabel}
          </div>
          <div>
            <span className="font-semibold text-ink">Reviewer role:</span>{' '}
            {review.reviewer_role || 'Emergency Medicine Review Panel'}
          </div>
          <div>
            <span className="font-semibold text-ink">Last updated:</span> {updatedAt} · Next review due:{' '}
            {review.next_review || '2026-10-01'}
          </div>
          <div className="flex items-center gap-2">
            <span>
              <strong className="font-semibold text-ink">Protocol version:</strong> v{version}
            </span>
            <button
              type="button"
              onClick={() => setShowChangelog(!showChangelog)}
              className="text-primary font-semibold hover:underline cursor-pointer print:hidden"
            >
              {showChangelog ? 'Hide changelog' : 'View changelog'}
            </button>
          </div>
        </div>

        {showChangelog && (
          <div className="p-3 rounded-lg bg-base border border-border text-xs text-ink-muted space-y-1 print:hidden">
            <div className="font-semibold text-ink">Changelog (v{version})</div>
            <p>• v2.4 ({updatedAt}): Standardized document structure, added AHA Oct 2025 / IRC review flags, enforced Emergency Call-112 Step-1 rule.</p>
            <p>• v2.0 (2024-11-10): Initial offline-cached first-aid protocol dataset.</p>
          </div>
        )}

        {/* Report an Issue */}
        <div className="pt-2 border-t border-border/70 flex flex-col gap-2 print:hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">
              Spot an outdated guideline or regional clinical discrepancy?
            </span>
            <button
              type="button"
              onClick={() => setShowReportForm(!showReportForm)}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg border border-border bg-base hover:bg-border/40 text-xs font-semibold text-ink transition-colors cursor-pointer whitespace-nowrap"
            >
              <Flag className="w-3.5 h-3.5 text-ink-muted" />
              <span>Report an issue</span>
            </button>
          </div>

          {showReportForm && (
            <form onSubmit={handleSubmitIssue} className="mt-2 p-3 rounded-lg bg-base border border-border space-y-2.5">
              {issueSubmitted ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Thank you. Your issue report has been saved for the clinical review queue.</span>
                </div>
              ) : (
                <>
                  <label className="block text-xs font-semibold text-ink">
                    Describe the issue for &ldquo;{documentTitle}&rdquo; (saved offline if disconnected):
                  </label>
                  <textarea
                    rows={2}
                    value={issueText}
                    onChange={(e) => setIssueText(e.target.value)}
                    placeholder="e.g., Step 2 compression depth or local ambulance guidance note..."
                    className="w-full rounded-lg border border-border bg-surface p-2 text-xs text-ink focus:outline-none focus:border-primary"
                    required
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReportForm(false)}
                      className="min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="min-h-[34px] px-3.5 py-1 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark cursor-pointer"
                    >
                      Submit report
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
