import React from 'react';
import { Check, Info, X } from 'lucide-react';
import { Card } from '../common/DesignSystem';
import { MedicineIdentity, ValidatedAlternative } from '../../services/medicines/types';

export interface MatchTableProps {
  identity: MedicineIdentity;
  cheapestGeneric: ValidatedAlternative | null;
}

export const MatchTable: React.FC<MatchTableProps> = ({ identity, cheapestGeneric }) => {
  if (!cheapestGeneric) {
    return null;
  }

  const rows = [
    {
      attribute: 'Active salt',
      brandValue: identity.composition.join(' + '),
      genericValue: cheapestGeneric.composition.join(' + '),
      matched: cheapestGeneric.checks.salt,
      note: 'Synonyms normalised (e.g., Amoxycillin = Amoxicillin)'
    },
    {
      attribute: 'Strength',
      brandValue: identity.strength,
      genericValue: cheapestGeneric.strength,
      matched: cheapestGeneric.checks.strength,
      note: 'Exact dose per unit'
    },
    {
      attribute: 'Dosage form',
      brandValue: identity.dosage_form,
      genericValue: cheapestGeneric.dosage_form,
      matched: cheapestGeneric.checks.form,
      note: 'Release profile & form matched'
    },
    {
      attribute: 'Pack size',
      brandValue: identity.standard_pack_label,
      genericValue: cheapestGeneric.pack_label,
      matched: cheapestGeneric.checks.pack,
      isPackRow: true,
      note: cheapestGeneric.checks.pack
        ? 'Identical unit count'
        : 'Normalised to per-unit price in code'
    }
  ];

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg sm:text-xl font-bold text-ink leading-snug">
          Same medicine? Side-by-side check
        </h3>
        <p className="text-sm text-ink-muted">
          Comparing <strong className="font-semibold text-ink">{identity.brand_name}</strong> with{' '}
          <strong className="font-semibold text-ink">{cheapestGeneric.product_name}</strong> (computed deterministically in code).
        </p>
      </div>

      {/* Desktop / Tablet Table */}
      <div className="hidden sm:block">
        <table className="w-full text-left border-collapse text-sm sm:text-base">
          <thead>
            <tr className="border-b border-border text-ink-muted">
              <th className="py-2.5 pr-3 font-semibold">Check</th>
              <th className="py-2.5 px-3 font-semibold">Branded ({identity.brand_name})</th>
              <th className="py-2.5 px-3 font-semibold">Generic ({cheapestGeneric.product_name})</th>
              <th className="py-2.5 pl-3 font-semibold text-right">Match</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rows.map((row) => (
              <tr key={row.attribute}>
                <td className="py-3 pr-3 font-semibold text-ink align-top">
                  <div>{row.attribute}</div>
                  <div className="text-xs font-normal text-ink-muted mt-0.5">{row.note}</div>
                </td>
                <td className="py-3 px-3 text-ink tabular-nums align-top">{row.brandValue}</td>
                <td className="py-3 px-3 text-ink tabular-nums align-top">{row.genericValue}</td>
                <td className="py-3 pl-3 text-right align-top whitespace-nowrap">
                  {row.matched ? (
                    <span className="inline-flex min-h-[30px] items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-950 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/50 text-xs font-bold">
                      <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span>✓ Match</span>
                    </span>
                  ) : row.isPackRow ? (
                    <span className="inline-flex min-h-[30px] items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-soft text-primary border border-primary/25 text-xs font-bold">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>Per-unit normalised</span>
                    </span>
                  ) : (
                    <span className="inline-flex min-h-[30px] items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-[#7F1D1D] border border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800/50 text-xs font-bold">
                      <X className="w-3.5 h-3.5 shrink-0" />
                      <span>✗ Differs</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Rows (<640px) */}
      <div className="sm:hidden space-y-2.5">
        {rows.map((row) => (
          <div
            key={`mob-${row.attribute}`}
            className="p-3.5 rounded-xl bg-base border border-border space-y-1.5 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-ink">{row.attribute}</span>
              {row.matched ? (
                <span className="inline-flex min-h-[28px] items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-950 border border-emerald-200 text-xs font-bold whitespace-nowrap">
                  <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>✓ Match</span>
                </span>
              ) : row.isPackRow ? (
                <span className="inline-flex min-h-[28px] items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-soft text-primary border border-primary/25 text-xs font-bold whitespace-nowrap">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Per-unit normalised</span>
                </span>
              ) : (
                <span className="inline-flex min-h-[28px] items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-[#7F1D1D] border border-red-200 text-xs font-bold whitespace-nowrap">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>✗ Differs</span>
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div>
                <span className="text-ink-muted block">Branded:</span>
                <span className="font-semibold text-ink tabular-nums">{row.brandValue}</span>
              </div>
              <div>
                <span className="text-ink-muted block">Generic:</span>
                <span className="font-semibold text-ink tabular-nums">{row.genericValue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
