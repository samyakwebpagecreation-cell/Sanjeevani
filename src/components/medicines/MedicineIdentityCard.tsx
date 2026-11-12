import React from 'react';
import {
  AlertTriangle,
  ExternalLink,
  FileCheck2,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { Card } from '../common/DesignSystem';
import { Chip } from '../common/Chip';
import { ConfidenceBadge } from './ConfidenceBadge';
import { ConfidenceTier, MedicineIdentity } from '../../services/medicines/types';

export interface MedicineIdentityCardProps {
  identity: MedicineIdentity;
  confidenceTier: ConfidenceTier;
  confidenceReason: string;
  retrievedAt: string;
  sourcesSucceededCount: number;
  sourcesCheckedCount: number;
  fromCache: boolean;
  isOfflineFallback?: boolean;
  onRecheckNow: () => void;
  isRechecking?: boolean;
}

export function formatRelativeTime(isoDate: string): string {
  try {
    const dt = new Date(isoDate).getTime();
    if (Number.isNaN(dt)) return isoDate;
    const diffSec = Math.max(0, Math.round((Date.now() - dt) / 1000));
    if (diffSec < 60) return 'just now';
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(isoDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return isoDate;
  }
}

export const MedicineIdentityCard: React.FC<MedicineIdentityCardProps> = ({
  identity,
  confidenceTier,
  confidenceReason,
  retrievedAt,
  sourcesSucceededCount,
  sourcesCheckedCount,
  fromCache,
  isOfflineFallback,
  onRecheckNow,
  isRechecking = false
}) => {
  return (
    <Card className="p-5 sm:p-6 space-y-4">
      {/* Top badges row: Rx status (from sources only) + Confidence tier */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {identity.rx_status === 'rx_required' ? (
            <Chip
              variant="danger"
              nowrap
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
            >
              Rx Prescription Required
            </Chip>
          ) : identity.rx_status === 'otc' ? (
            <Chip
              variant="neutral"
              nowrap
              icon={<FileCheck2 className="w-3.5 h-3.5" />}
            >
              OTC · No Prescription Required
            </Chip>
          ) : (
            <Chip
              variant="neutral"
              nowrap
              icon={<HelpCircle className="w-3.5 h-3.5" />}
            >
              Prescription status not confirmed
            </Chip>
          )}
          <ConfidenceBadge tier={confidenceTier} reason={confidenceReason} />
        </div>

        <div className="flex items-center gap-2.5 text-sm text-ink-muted tabular-nums">
          <span title={`Retrieved at ${retrievedAt}`}>
            Last checked {formatRelativeTime(retrievedAt)} · {sourcesSucceededCount} of{' '}
            {sourcesCheckedCount} sources
            {fromCache ? ' (cached)' : ''}
            {isOfflineFallback ? ' (offline reference)' : ''}
          </span>
          <button
            type="button"
            onClick={onRecheckNow}
            disabled={isRechecking}
            className="inline-flex min-h-[36px] items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-base hover:bg-primary-soft/40 hover:border-primary/40 text-sm font-semibold text-primary transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRechecking ? 'animate-spin' : ''}`} />
            <span>Re-check now</span>
          </button>
        </div>
      </div>

      {/* Main Medicine Title & Salt Composition */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight leading-snug text-balance">
          {identity.brand_name}
        </h2>
        <p className="text-base sm:text-lg font-semibold text-primary leading-snug">
          Active salt: {identity.composition_display}
        </p>
      </div>

      {/* Structured attributes grid: Strength, Dosage form, Standard pack, Composition source */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="p-3.5 rounded-xl bg-base border border-border">
          <p className="text-sm font-medium text-ink-muted">Strength</p>
          <p className="text-base font-bold text-ink mt-0.5 tabular-nums leading-snug">
            {identity.strength}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-base border border-border">
          <p className="text-sm font-medium text-ink-muted">Dosage form</p>
          <p className="text-base font-bold text-ink mt-0.5 leading-snug">
            {identity.dosage_form}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-base border border-border">
          <p className="text-sm font-medium text-ink-muted">Reference pack size</p>
          <p className="text-base font-bold text-ink mt-0.5 tabular-nums leading-snug">
            {identity.standard_pack_label}
          </p>
        </div>
      </div>

      {/* Traceable source link for composition & Rx status */}
      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
        <span>
          Composition confirmed from:{' '}
          <strong className="font-semibold text-ink">{identity.identity_source_name}</strong>
        </span>
        <a
          href={identity.identity_source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline whitespace-nowrap"
        >
          <span>Open composition source</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>
      </div>

      {/* Prominent Clinical Warning if Narrow-Therapeutic-Index / Critical / Controlled */}
      {identity.never_switch_warning.is_critical && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-[#7F1D1D] dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-200 space-y-1.5"
        >
          <div className="flex items-center gap-2 font-bold text-base leading-snug">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>
              Do not switch brands without your prescribing doctor ({identity.never_switch_warning.category_label})
            </span>
          </div>
          <p className="text-sm leading-relaxed">
            {identity.never_switch_warning.reason} Price records below are shown for public transparency only — talk to your doctor first before making any change.
          </p>
        </div>
      )}
    </Card>
  );
};
