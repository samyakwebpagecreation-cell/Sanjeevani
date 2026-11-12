import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card } from '../common/DesignSystem';
import { formatINR } from '../../services/medicines/compute';
import { SearchPipelineResult } from '../../services/medicines/types';

export interface MethodPanelProps {
  result: SearchPipelineResult;
}

export const MethodPanel: React.FC<MethodPanelProps> = ({ result }) => {
  const [showTechDetails, setShowTechDetails] = useState(false);
  const sav = result.savings;
  const id = result.identity;

  const exactMatchesCount = result.source_ledger.filter(
    (r) =>
      r.status === 'used' &&
      r.checks.salt === true &&
      r.checks.strength === true &&
      r.checks.form === true
  ).length;

  return (
    <Card id="how-this-works-section" className="p-5 sm:p-6 space-y-5">
      <div className="space-y-1">
        <h3 className="text-lg sm:text-xl font-bold text-ink leading-snug">
          How we checked this
        </h3>
        <p className="text-sm text-ink-muted">
          Every price and percentage on this page is computed deterministically in code from the source ledger above.
        </p>
      </div>

      {/* 5-step plain-language summary with real counts and timings */}
      <ol className="space-y-2.5 text-sm sm:text-base text-ink">
        <li className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
            1
          </span>
          <span className="leading-relaxed">
            <strong>Normalised query:</strong> Matched{' '}
            <q className="font-semibold">{result.query}</q> to{' '}
            <strong>{id?.brand_name || result.normalised_query}</strong>.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
            2
          </span>
          <span className="leading-relaxed">
            <strong>Confirmed composition:</strong> Verified active salt{' '}
            <strong>{id?.composition_display || '—'}</strong> ({id?.dosage_form || '—'}) from{' '}
            {id?.identity_source_name || 'official reference'}.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
            3
          </span>
          <span className="leading-relaxed tabular-nums">
            <strong>Checked allowlisted sources:</strong> Queried{' '}
            <strong>{result.sources_checked_count}</strong> allowlisted government and retail domains in{' '}
            <strong>{(result.total_duration_ms / 1000).toFixed(2)}s</strong>;{' '}
            <strong>{result.sources_succeeded_count}</strong> returned verifiable listings.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
            4
          </span>
          <span className="leading-relaxed tabular-nums">
            <strong>Verified verbatim &amp; matched attributes:</strong> Confirmed that product names and prices appear literally in the fetched page text, yielding{' '}
            <strong>{exactMatchesCount}</strong> exact salt + strength + dosage-form records.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="w-6 h-6 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
            5
          </span>
          <span className="leading-relaxed">
            <strong>Calculated per-unit savings:</strong> Divided strip price by pack unit count so 6-tablet, 10-tablet, and 15-tablet strips compare fairly.
          </span>
        </li>
      </ol>

      {/* Exact formula box with numbers from this query */}
      <div className="p-4 rounded-xl bg-base border border-border space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          Exact savings formula used for this query
        </p>
        <p className="text-sm sm:text-base font-semibold text-ink tabular-nums leading-relaxed">
          Savings % = (brand per-unit price − generic per-unit price) ÷ brand per-unit price × 100
        </p>
        {sav && sav.brand_per_unit_inr !== null && sav.generic_per_unit_inr !== null ? (
          <p className="text-sm text-ink-muted tabular-nums leading-relaxed">
            = ({formatINR(sav.brand_per_unit_inr)} − {formatINR(sav.generic_per_unit_inr)}) ÷{' '}
            {formatINR(sav.brand_per_unit_inr)} × 100 ={' '}
            <strong className="text-ink font-bold">
              {sav.savings_pct !== null ? `${sav.savings_pct}%` : '—'}
            </strong>{' '}
            ({formatINR(sav.savings_per_unit_inr)} saved per unit ·{' '}
            {formatINR(sav.savings_per_pack_inr)} per {sav.comparison_pack_units}-unit pack)
          </p>
        ) : (
          <p className="text-sm text-ink-muted">
            Withheld for this query because both a verified branded price and a verified same-salt generic price are required.
          </p>
        )}
      </div>

      {/* What the confidence levels mean */}
      <div className="space-y-2 pt-1">
        <h4 className="text-sm font-bold text-ink">What the confidence levels mean</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-ink-muted">
          <div className="p-3 rounded-xl bg-base border border-border">
            <strong className="text-ink font-semibold">High confidence:</strong> Official government catalogue (PMBJP / NPPA) plus at least 1 retail pharmacy source in price agreement.
          </div>
          <div className="p-3 rounded-xl bg-base border border-border">
            <strong className="text-ink font-semibold">Medium confidence:</strong> At least 2 independent retail sources in agreement (within ±10%), or 1 official government source.
          </div>
          <div className="p-3 rounded-xl bg-base border border-border">
            <strong className="text-ink font-semibold">Low confidence:</strong> Only 1 retail source verified so far; headline percentage savings are withheld.
          </div>
          <div className="p-3 rounded-xl bg-base border border-border">
            <strong className="text-ink font-semibold">Unverified:</strong> 0 sources confirmed an identical active salt, strength, and dosage form.
          </div>
        </div>
      </div>

      {/* Collapsible Technical Details disclosure */}
      <div className="pt-2 border-t border-border/70">
        <button
          type="button"
          onClick={() => setShowTechDetails((prev) => !prev)}
          aria-expanded={showTechDetails}
          className="inline-flex min-h-[38px] items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink cursor-pointer"
        >
          <span>Technical details</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showTechDetails ? 'rotate-180' : ''}`}
          />
        </button>

        {showTechDetails && (
          <div className="mt-2 p-3.5 rounded-xl bg-base border border-border text-xs sm:text-sm text-ink-muted space-y-1.5 leading-relaxed">
            <p>
              • <strong>Allowlisted domains only:</strong> Queries are restricted to{' '}
              <code>janaushadhi.gov.in</code>, <code>nppaindia.nic.in</code>, <code>1mg.com</code>,{' '}
              <code>pharmeasy.in</code>, <code>netmeds.com</code>, and{' '}
              <code>apollopharmacy.in</code>.
            </p>
            <p>
              • <strong>Extraction &amp; hallucination guard:</strong> Server-side extraction (Firecrawl / Gemini schema parser) only parses fetched page text into a strict JSON schema. Deterministic verification in <code>verify.ts</code> discards any price or product name that does not appear verbatim in the fetched text.
            </p>
            <p>
              • <strong>Outlier &amp; cache policy:</strong> Prices exceeding 5× or below 0.1× the multi-source median are excluded automatically. Verified results are cached for up to 24 hours with on-demand re-check.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
