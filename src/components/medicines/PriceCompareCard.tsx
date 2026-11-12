import React from 'react';
import { AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Card } from '../common/DesignSystem';
import { formatINR } from '../../services/medicines/compute';
import { MedicineIdentity, SavingsComputation } from '../../services/medicines/types';

export interface PriceCompareCardProps {
  identity: MedicineIdentity;
  savings: SavingsComputation;
  onInspectSource: (sourceId: string) => void;
}

export const PriceCompareCard: React.FC<PriceCompareCardProps> = ({
  identity,
  savings,
  onInspectSource
}) => {
  const isCriticalNeverSwitch = identity.never_switch_warning.is_critical;

  const renderBrandPrice = () => {
    if (savings.brand_price_range_inr) {
      return `${formatINR(savings.brand_price_range_inr[0])}–${formatINR(
        savings.brand_price_range_inr[1]
      )}`;
    }
    return formatINR(savings.brand_price_inr);
  };

  const renderGenericPrice = () => {
    if (savings.generic_price_range_inr) {
      return `${formatINR(savings.generic_price_range_inr[0])}–${formatINR(
        savings.generic_price_range_inr[1]
      )}`;
    }
    return formatINR(savings.generic_price_inr);
  };

  return (
    <Card className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-ink leading-snug">
            Verified price comparison
          </h3>
          <p className="text-sm text-ink-muted mt-0.5">
            All prices normalised per unit ({identity.dosage_form.toLowerCase()}) on a like-for-like{' '}
            {savings.price_basis === 'selling_price' ? 'selling price' : 'MRP'} basis.
          </p>
        </div>

        {/* Headline badge: only shown if savings.can_show_headline && !isCriticalNeverSwitch */}
        {savings.can_show_headline && !isCriticalNeverSwitch && savings.savings_pct !== null && (
          <div className="inline-flex min-h-[40px] items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-200 font-bold text-base tabular-nums whitespace-nowrap">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>
              {savings.savings_pct_range
                ? `${savings.savings_pct_range[0]}%–${savings.savings_pct_range[1]}% lower`
                : `${savings.savings_pct}% lower`}{' '}
              ({formatINR(savings.savings_per_unit_inr)} saved / unit)
            </span>
          </div>
        )}
      </div>

      {/* Side-by-side Branded vs Cheapest Verified Generic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Column 1: Branded Reference */}
        <div className="p-4 sm:p-5 rounded-2xl bg-base border border-border flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-ink-muted">
              Branded reference ({identity.brand_name})
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-ink tabular-nums leading-tight">
              {savings.brand_price_inr !== null ? (
                <>
                  Branded: {renderBrandPrice()}{' '}
                  <span className="text-xs font-semibold uppercase text-ink-muted">
                    {savings.price_basis || 'MRP'}
                  </span>
                </>
              ) : (
                <span className="text-lg font-semibold text-ink-muted">
                  Price not verified
                </span>
              )}
            </div>
            {savings.brand_per_unit_inr !== null && (
              <p className="text-sm font-semibold text-ink-muted tabular-nums">
                {formatINR(savings.brand_per_unit_inr)} per unit ·{' '}
                {savings.brand_pack_label || identity.standard_pack_label}
              </p>
            )}
          </div>

          {/* Traceable source chips */}
          {savings.brand_source_records.length > 0 && (
            <div className="pt-2 border-t border-border/70 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-ink-muted">Source:</span>
              {savings.brand_source_records.map((rec, i) => (
                <button
                  key={`${rec.source_id}-${i}`}
                  type="button"
                  onClick={() => onInspectSource(rec.source_id)}
                  className="inline-flex min-h-[32px] items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-primary/50 text-xs font-semibold text-primary transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>{rec.source_name}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Cheapest Verified Generic */}
        <div className="p-4 sm:p-5 rounded-2xl bg-primary-soft/35 border border-primary/25 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-primary">
              Cheapest verified same-salt generic
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-ink tabular-nums leading-tight">
              {savings.generic_price_inr !== null ? (
                <>
                  Cheapest verified generic: {renderGenericPrice()}{' '}
                  <span className="text-xs font-semibold uppercase text-ink-muted">
                    {savings.price_basis || 'MRP'}
                  </span>
                </>
              ) : (
                <span className="text-lg font-semibold text-ink-muted">
                  No verified generic price
                </span>
              )}
            </div>
            {savings.generic_per_unit_inr !== null && (
              <p className="text-sm font-semibold text-ink tabular-nums">
                {formatINR(savings.generic_per_unit_inr)} per unit ·{' '}
                {savings.generic_pack_label}
              </p>
            )}
            {savings.generic_product_name && (
              <p className="text-sm text-ink-muted leading-snug">
                Listed as: <strong className="font-semibold text-ink">{savings.generic_product_name}</strong>{' '}
                ({savings.generic_maker})
              </p>
            )}
          </div>

          {/* Traceable source chips */}
          {savings.generic_source_records.length > 0 && (
            <div className="pt-2 border-t border-primary/15 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-ink-muted">Source:</span>
              {savings.generic_source_records.map((rec, i) => (
                <button
                  key={`${rec.source_id}-${i}`}
                  type="button"
                  onClick={() => onInspectSource(rec.source_id)}
                  className="inline-flex min-h-[32px] items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-primary/30 hover:border-primary text-xs font-semibold text-primary transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>{rec.source_name}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Explicit message when headline savings is withheld */}
      {!savings.can_show_headline && (
        <div className="p-4 rounded-xl bg-base border border-border flex items-start gap-3 text-sm text-ink">
          <AlertCircle className="w-5 h-5 text-ink-muted shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-ink">Not enough verified prices to compare yet.</p>
            {savings.reason_if_withheld && (
              <p className="text-ink-muted leading-relaxed">{savings.reason_if_withheld}</p>
            )}
          </div>
        </div>
      )}

      {/* Pack normalization explanation when pack sizes differ */}
      {savings.can_show_headline &&
        savings.brand_pack_units &&
        savings.generic_pack_units &&
        savings.brand_pack_units !== savings.generic_pack_units && (
          <p className="text-sm text-ink-muted leading-relaxed bg-base px-4 py-3 rounded-xl border border-border tabular-nums">
            <strong className="font-semibold text-ink">Pack size normalised:</strong> The branded
            strip has {savings.brand_pack_units} units ({formatINR(savings.brand_per_unit_inr)}/unit)
            while the cheapest generic strip has {savings.generic_pack_units} units (
            {formatINR(savings.generic_per_unit_inr)}/unit). For an equivalent{' '}
            {savings.comparison_pack_units}-unit quantity, the difference is{' '}
            <strong className="font-semibold text-ink">
              {formatINR(savings.savings_per_pack_inr)}
            </strong>
            .
          </p>
        )}
    </Card>
  );
};
