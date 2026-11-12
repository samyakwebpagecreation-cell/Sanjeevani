import React from 'react';
import { CheckCircle2, AlertCircle, HelpCircle, ShieldCheck } from 'lucide-react';
import { ConfidenceTier } from '../../services/medicines/types';

export interface ConfidenceBadgeProps {
  tier: ConfidenceTier;
  reason?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ tier, reason }) => {
  const config = {
    high: {
      label: 'High confidence',
      icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
      classes:
        'bg-emerald-50 text-emerald-950 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/50'
    },
    medium: {
      label: 'Medium confidence',
      icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
      classes: 'bg-primary-soft text-primary border-primary/25'
    },
    low: {
      label: 'Low confidence · 1 source',
      icon: <AlertCircle className="w-4 h-4 shrink-0" />,
      classes: 'bg-surface text-ink-muted border-border'
    },
    none: {
      label: 'Unverified',
      icon: <HelpCircle className="w-4 h-4 shrink-0" />,
      classes: 'bg-surface text-ink-muted border-border'
    }
  }[tier];

  return (
    <span
      title={reason}
      className={`inline-flex min-h-[34px] items-center gap-2 rounded-full border px-3.5 py-1.5 text-[14px] font-semibold leading-snug whitespace-nowrap ${config.classes}`}
    >
      <span aria-hidden="true" className="shrink-0 flex items-center">
        {config.icon}
      </span>
      <span>{config.label}</span>
    </span>
  );
};
