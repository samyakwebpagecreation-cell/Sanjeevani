import React, { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { Card } from '../common/DesignSystem';
import { Chip } from '../common/Chip';
import { formatINR } from '../../services/medicines/compute';
import { SourceRecord, SourceStatus } from '../../services/medicines/types';
import { formatRelativeTime } from './MedicineIdentityCard';

export interface SourceLedgerProps {
  records: SourceRecord[];
  highlightedSourceId?: string | null;
}

function middleTruncatePath(urlStr: string, maxPathLen = 28): { domain: string; pathSnippet: string } {
  try {
    const u = new URL(urlStr);
    const domain = u.hostname.replace(/^www\./, '');
    const fullPath = `${u.pathname}${u.search}`;
    if (!fullPath || fullPath === '/') {
      return { domain, pathSnippet: '' };
    }
    if (fullPath.length <= maxPathLen) {
      return { domain, pathSnippet: fullPath };
    }
    const half = Math.floor((maxPathLen - 3) / 2);
    return {
      domain,
      pathSnippet: `${fullPath.slice(0, half)}…${fullPath.slice(fullPath.length - half)}`
    };
  } catch {
    return { domain: urlStr.slice(0, 24), pathSnippet: '' };
  }
}

function renderStatusBadge(status: SourceStatus, checks: SourceRecord['checks']) {
  const isExactUsed =
    status === 'used' && checks.salt === true && checks.strength === true && checks.form === true;

  if (isExactUsed) {
    return (
      <Chip variant="success" nowrap>
        ✓ Verified match
      </Chip>
    );
  }
  if (status === 'used') {
    return (
      <Chip variant="warning" nowrap>
        Similar · not identical
      </Chip>
    );
  }
  if (status === 'no_match') {
    return (
      <Chip variant="neutral" nowrap>
        – No match
      </Chip>
    );
  }
  if (status === 'excluded_outlier') {
    return (
      <Chip variant="warning" nowrap>
        Excluded outlier
      </Chip>
    );
  }
  if (status === 'failed_verification') {
    return (
      <Chip variant="danger" nowrap>
        ✗ Failed verification
      </Chip>
    );
  }
  if (status === 'timeout') {
    return (
      <Chip variant="danger" nowrap>
        ✗ Timed out (8s)
      </Chip>
    );
  }
  if (status === 'blocked') {
    return (
      <Chip variant="danger" nowrap>
        ✗ Blocked
      </Chip>
    );
  }
  if (status === 'unparseable') {
    return (
      <Chip variant="danger" nowrap>
        ✗ Unparseable
      </Chip>
    );
  }
  return (
    <Chip variant="danger" nowrap>
      ✗ Error
    </Chip>
  );
}

export const SourceLedger: React.FC<SourceLedgerProps> = ({
  records,
  highlightedSourceId
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>(() => {
    // Expand the first record by default so users see how verbatim snippets work
    const init: Record<number, boolean> = {};
    if (records.length > 0) {
      init[0] = true;
    }
    return init;
  });

  const toggleRow = (idx: number) => {
    setExpandedRows((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <Card id="source-ledger-section" className="p-5 sm:p-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg sm:text-xl font-bold text-ink leading-snug">
          Source ledger (every record checked)
        </h3>
        <p className="text-sm text-ink-muted">
          Click any row to inspect the verbatim text snippet or failure reason returned by that source.
        </p>
      </div>

      {/* Desktop Table (fits cleanly inside max-w-3xl without horizontal overflow) */}
      <div className="hidden md:block">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-ink-muted">
              <th className="py-2.5 pr-3 font-semibold w-[28%]">Source &amp; page link</th>
              <th className="py-2.5 px-3 font-semibold w-[32%]">Product as listed</th>
              <th className="py-2.5 px-3 font-semibold w-[18%]">Price &amp; pack</th>
              <th className="py-2.5 pl-3 font-semibold text-right w-[22%]">Status &amp; retrieved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {records.map((rec, idx) => {
              const isExpanded =
                Boolean(expandedRows[idx]) || highlightedSourceId === rec.source_id;
              const { domain, pathSnippet } = middleTruncatePath(rec.url, 22);

              return (
                <React.Fragment key={`${rec.source_id}-${idx}`}>
                  <tr
                    onClick={() => toggleRow(idx)}
                    className={`cursor-pointer transition-colors hover:bg-primary-soft/20 ${
                      highlightedSourceId === rec.source_id ? 'bg-primary-soft/30' : ''
                    }`}
                  >
                    <td className="py-3 pr-3 align-top">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-ink">{rec.source_name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-base border border-border text-xs font-semibold text-ink-muted">
                          {rec.source_type === 'government' ? 'Government' : 'Retail'}
                        </span>
                      </div>
                      <div
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={rec.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline break-all"
                        >
                          <span>
                            <strong className="font-bold text-ink">{domain}</strong>
                            <span className="text-ink-muted">{pathSnippet}</span>
                          </span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top text-ink font-medium leading-snug">
                      {rec.product_name || (
                        <span className="text-ink-muted">
                          {rec.failure_reason || 'No matching record'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 align-top tabular-nums">
                      {rec.price_inr !== null ? (
                        <div>
                          <span className="font-bold text-ink">{formatINR(rec.price_inr)}</span>{' '}
                          <span className="text-xs font-semibold uppercase text-ink-muted">
                            {rec.price_type || 'MRP'}
                          </span>
                          <div className="text-xs text-ink-muted mt-0.5">
                            {rec.pack_label || '—'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td
                      className="py-3 pl-3 align-top text-right"
                      title={`Retrieved at ${rec.retrieved_at} (${rec.duration_ms}ms)`}
                    >
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {renderStatusBadge(rec.status, rec.checks)}
                        <ChevronDown
                          className={`w-4 h-4 text-ink-muted transition-transform shrink-0 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                      <div className="text-xs text-ink-muted tabular-nums mt-1">
                        {formatRelativeTime(rec.retrieved_at)} · {(rec.duration_ms / 1000).toFixed(2)}s
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-base/70">
                      <td colSpan={4} className="p-3.5 text-sm text-ink-muted space-y-1.5">
                        {rec.snippet ? (
                          <div>
                            <strong className="font-semibold text-ink">
                              Verbatim source snippet:
                            </strong>{' '}
                            <q className="text-ink">{rec.snippet}</q>
                          </div>
                        ) : null}
                        {rec.failure_reason ? (
                          <div className="text-alert font-medium">
                            <strong>Reason:</strong> {rec.failure_reason}
                          </div>
                        ) : null}
                        {rec.mismatch_reasons && rec.mismatch_reasons.length > 0 ? (
                          <div className="text-[#7F1D1D] dark:text-red-300 font-medium">
                            <strong>Difference note:</strong> {rec.mismatch_reasons.join('; ')}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards */}
      <div className="md:hidden space-y-3">
        {records.map((rec, idx) => {
          const isExpanded =
            Boolean(expandedRows[idx]) || highlightedSourceId === rec.source_id;
          const { domain, pathSnippet } = middleTruncatePath(rec.url, 22);

          return (
            <div
              key={`mob-${rec.source_id}-${idx}`}
              className="p-4 rounded-xl bg-base border border-border space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-ink text-base">{rec.source_name}</div>
                  <div className="text-xs font-semibold text-ink-muted">
                    {rec.source_type === 'government' ? 'Government' : 'Retail'} ·{' '}
                    <span title={rec.retrieved_at}>{formatRelativeTime(rec.retrieved_at)}</span> ·{' '}
                    <span className="tabular-nums">{(rec.duration_ms / 1000).toFixed(2)}s</span>
                  </div>
                </div>
                {renderStatusBadge(rec.status, rec.checks)}
              </div>

              <div className="text-sm text-ink font-medium">
                {rec.product_name || rec.failure_reason || 'No matching record'}
              </div>

              {rec.price_inr !== null && (
                <div className="flex items-center justify-between text-sm tabular-nums">
                  <span className="text-ink-muted">{rec.pack_label || '—'}</span>
                  <span className="font-bold text-ink">
                    {formatINR(rec.price_inr)}{' '}
                    <span className="text-xs font-semibold uppercase text-ink-muted">
                      {rec.price_type || 'MRP'}
                    </span>
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-border/70 flex items-center justify-between gap-2 text-xs">
                <a
                  href={rec.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary font-semibold hover:underline truncate"
                >
                  <span>
                    <strong className="text-ink">{domain}</strong>
                    {pathSnippet}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>

                <button
                  type="button"
                  onClick={() => toggleRow(idx)}
                  className="inline-flex min-h-[34px] items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-border font-semibold text-ink cursor-pointer whitespace-nowrap"
                >
                  <span>{isExpanded ? 'Hide snippet' : 'Snippet'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {isExpanded && (
                <div className="p-3 rounded-lg bg-surface border border-border text-xs text-ink-muted space-y-1">
                  {rec.snippet && (
                    <div>
                      <strong className="text-ink">Verbatim snippet:</strong>{' '}
                      <q className="text-ink">{rec.snippet}</q>
                    </div>
                  )}
                  {rec.failure_reason && (
                    <div className="text-alert font-medium">
                      <strong>Reason:</strong> {rec.failure_reason}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
