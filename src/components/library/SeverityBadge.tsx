import React from 'react';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { ProtocolSeverity } from '../../data/protocolSchema';

interface SeverityBadgeProps {
  severity: ProtocolSeverity;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * B5: Severity badge with icon + text (never colour alone):
 * - Emergency = red filled (#DC2626)
 * - Urgent = amber
 * - Moderate = slate outline
 * - Mild = quiet grey
 */
export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'sm',
  className = '',
}) => {
  const sizeClasses =
    size === 'md'
      ? 'min-h-[28px] px-3 py-1 text-xs gap-1.5'
      : 'min-h-[24px] px-2.5 py-0.5 text-[11px] gap-1';

  const iconSize = size === 'md' ? 'w-3.5 h-3.5 shrink-0' : 'w-3 h-3 shrink-0';

  if (severity === 'Emergency') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-md font-bold uppercase tracking-wider whitespace-nowrap bg-[#DC2626] text-white border border-[#DC2626] leading-snug ${sizeClasses} ${className}`}
      >
        <AlertOctagon className={iconSize} aria-hidden="true" />
        <span>Emergency</span>
      </span>
    );
  }

  if (severity === 'Urgent') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-md font-bold uppercase tracking-wider whitespace-nowrap bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60 leading-snug ${sizeClasses} ${className}`}
      >
        <AlertTriangle className={iconSize} aria-hidden="true" />
        <span>Urgent</span>
      </span>
    );
  }

  if (severity === 'Moderate') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-md font-semibold uppercase tracking-wider whitespace-nowrap bg-transparent text-slate-700 border border-slate-400 dark:text-slate-200 dark:border-slate-600 leading-snug ${sizeClasses} ${className}`}
      >
        <Info className={iconSize} aria-hidden="true" />
        <span>Moderate</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md font-semibold uppercase tracking-wider whitespace-nowrap bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 leading-snug ${sizeClasses} ${className}`}
    >
      <CheckCircle2 className={iconSize} aria-hidden="true" />
      <span>Mild</span>
    </span>
  );
};
