import React, { forwardRef } from 'react';
import { XCircle, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { MythVerdict, HazardSeverity } from '../../services/mythBusterService';

export interface VerdictBannerProps {
  verdict: MythVerdict;
  hazardSeverity: HazardSeverity;
  claim: string;
  clinicalAuthority: string;
}

export const VerdictBanner = forwardRef<HTMLHeadingElement, VerdictBannerProps>(
  ({ verdict, hazardSeverity, claim, clinicalAuthority }, headingRef) => {
    const isConfirmed = verdict === 'CONFIRMED' || hazardSeverity === 'BENEFICIAL';
    const isConditional =
      !isConfirmed &&
      (verdict === 'CONDITIONAL' ||
        verdict === 'PLAUSIBLE' ||
        hazardSeverity === 'CAUTION' ||
        hazardSeverity === 'INEFFECTIVE');

    // Support all 3 verdict states:
    // 1. Busted / Dangerous (red)
    // 2. Partly true / Caution (amber)
    // 3. Confirmed / Safe (green/teal)
    const stateConfig = isConfirmed
      ? {
          containerClass:
            'border-l-[3px] border-l-emerald-600 border-y border-r border-emerald-200/80 bg-emerald-50/75 dark:bg-emerald-950/30 dark:border-emerald-800/50',
          iconColor: 'text-emerald-700 dark:text-emerald-400',
          titleColor: 'text-emerald-950 dark:text-emerald-100',
          Icon: CheckCircle2,
          label:
            hazardSeverity === 'BENEFICIAL'
              ? 'Confirmed · Safe'
              : `Confirmed · ${formatSentenceCase(hazardSeverity)}`
        }
      : isConditional
      ? {
          containerClass:
            'border-l-[3px] border-l-amber-600 border-y border-r border-amber-200/80 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-800/50',
          iconColor: 'text-amber-700 dark:text-amber-400',
          titleColor: 'text-amber-950 dark:text-amber-100',
          Icon: AlertTriangle,
          label: `Partly true · ${formatSentenceCase(hazardSeverity)}`
        }
      : {
          containerClass:
            'border-l-[3px] border-l-red-600 border-y border-r border-red-200/80 bg-red-50/75 dark:bg-red-950/30 dark:border-red-800/50',
          iconColor: 'text-red-600 dark:text-red-400',
          titleColor: 'text-[#7F1D1D] dark:text-red-100',
          Icon: XCircle,
          label: `Busted · ${formatSentenceCase(hazardSeverity)}`
        };

    const { Icon } = stateConfig;

    return (
      <div className="scroll-mt-20 space-y-2">
        <div
          className={`w-full rounded-[16px] px-4 py-3 sm:px-5 sm:py-3.5 ${stateConfig.containerClass}`}
        >
          <div className="flex items-start gap-3">
            <Icon
              className={`w-6 h-6 shrink-0 mt-0.5 ${stateConfig.iconColor}`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className={`text-[20px] font-semibold leading-snug focus:outline-none ${stateConfig.titleColor}`}
              >
                {stateConfig.label}
              </h2>
              <p className="text-[16px] text-ink-muted leading-snug sm:truncate">
                “{claim}”
              </p>
            </div>
          </div>
        </div>

        {/* Source line underneath as a 14px caption with a shield icon, allowed to wrap, never in a fixed-height chip */}
        <p className="flex items-start gap-2 px-1 text-[14px] text-ink-muted leading-snug">
          <ShieldCheck
            className="w-4 h-4 text-primary shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span className="min-w-0">Source: {clinicalAuthority}</span>
        </p>
      </div>
    );
  }
);

VerdictBanner.displayName = 'VerdictBanner';

function formatSentenceCase(raw: string): string {
  if (!raw) return '';
  const lower = raw.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
