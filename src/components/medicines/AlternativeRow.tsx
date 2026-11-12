import React from 'react';
import { AlertTriangle, Building2, Check, ExternalLink, Info, X } from 'lucide-react';
import { Chip } from '../common/Chip';
import { formatINR } from '../../services/medicines/compute';
import { ValidatedAlternative } from '../../services/medicines/types';

export interface AlternativeRowProps {
  alternative: ValidatedAlternative;
  isCriticalNeverSwitch?: boolean;
  onInspectSource?: (sourceId: string) => void;
}

export const AlternativeRow: React.FC<AlternativeRowProps> = ({
  alternative,
  isCriticalNeverSwitch = false,
  onInspectSource
}) => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base sm:text-lg font-bold text-ink leading-snug">
              {alternative.product_name}
            </h4>
            <Chip
              variant={alternative.source_type === 'government' ? 'primary' : 'neutral'}
              nowrap
            >
              {alternative.source_type === 'government' ? 'Government catalogue' : 'Retail pharmacy'} ·{' '}
              {alternative.source_name}
            </Chip>
          </div>

          <p className="text-sm text-ink-muted flex items-center gap-1.5">
            <Building2 className="w-4 h-4 shrink-0 text-ink-muted" />
            <span>{alternative.maker}</span>
            <span>·</span>
            <span className="tabular-nums">{alternative.pack_label}</span>
          </p>
        </div>

        {/* Right price block */}
        <div className="sm:text-right shrink-0 space-y-0.5 tabular-nums">
          <div className="text-xl sm:text-2xl font-extrabold text-ink">
            {formatINR(alternative.price_inr)}{' '}
            <span className="text-xs font-semibold uppercase text-ink-muted">
              {alternative.price_type}
            </span>
          </div>
          <div className="text-sm font-semibold text-ink-muted">
            {formatINR(alternative.per_unit_price_inr)} / unit
          </div>
          {alternative.is_exact_match &&
            !isCriticalNeverSwitch &&
            alternative.savings_pct_vs_brand !== null &&
            alternative.savings_pct_vs_brand > 0 && (
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {alternative.savings_pct_vs_brand}% lower per unit vs branded
              </div>
            )}
        </div>
      </div>

      {/* Regulatory label ONLY if literally present in the fetched source record, with plain-language explanation */}
      {alternative.regulatory_label && (
        <div className="p-3 rounded-xl bg-base border border-border flex items-start gap-2.5 text-xs sm:text-sm text-ink-muted">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-ink">{alternative.regulatory_label}:</strong>{' '}
            {alternative.regulatory_explanation}
          </div>
        </div>
      )}

      {/* Mismatch reasons when placed in "Similar but not identical" */}
      {!alternative.is_exact_match && alternative.mismatch_reasons.length > 0 && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#7F1D1D] dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-200 space-y-1 text-sm">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Not an exact substitute — excluded from headline savings:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5">
            {alternative.mismatch_reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom row: checks summary + View source link */}
      <div className="pt-2 border-t border-border/70 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center gap-3 text-ink-muted">
          <span className="inline-flex items-center gap-1">
            {alternative.checks.salt ? (
              <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 text-alert" />
            )}
            <span>Salt</span>
          </span>
          <span className="inline-flex items-center gap-1">
            {alternative.checks.strength ? (
              <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 text-alert" />
            )}
            <span>Strength ({alternative.strength})</span>
          </span>
          <span className="inline-flex items-center gap-1">
            {alternative.checks.form ? (
              <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 text-alert" />
            )}
            <span>Form ({alternative.dosage_form})</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {onInspectSource && (
            <button
              type="button"
              onClick={() => onInspectSource(alternative.source_id)}
              className="text-sm font-semibold text-ink-muted hover:text-ink underline cursor-pointer whitespace-nowrap"
            >
              Show snippet in ledger
            </button>
          )}
          <a
            href={alternative.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[36px] items-center gap-1.5 px-3 py-1.5 rounded-xl bg-base hover:bg-primary-soft/50 border border-border hover:border-primary/40 text-sm font-semibold text-primary transition-colors whitespace-nowrap"
          >
            <span>View source</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};
