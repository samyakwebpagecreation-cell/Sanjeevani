import React from 'react';
import { X, Check, ChevronDown } from 'lucide-react';

export interface CompareCardProps {
  mythSummary: string;
  whyPeopleBelieveIt?: string;
  biologicalReality: string;
}

export const CompareCard: React.FC<CompareCardProps> = ({
  mythSummary,
  whyPeopleBelieveIt,
  biologicalReality
}) => {
  return (
    <section aria-labelledby="why-it-fails-heading" className="space-y-3">
      <h3
        id="why-it-fails-heading"
        className="text-[20px] font-semibold leading-snug text-ink"
      >
        Why it fails
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {/* Left: Myth */}
        <div className="rounded-[18px] bg-red-50/60 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="w-6 h-6 min-w-[24px] min-h-[24px] rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              </span>
              <h4 className="text-[16px] font-semibold leading-snug text-ink">
                Myth
              </h4>
            </div>

            <p className="text-[16px] text-ink-muted leading-relaxed">
              {mythSummary}
            </p>
          </div>

          {whyPeopleBelieveIt && (
            <details className="group border-t border-red-200/70 dark:border-red-900/40 pt-3">
              <summary className="list-none flex items-center justify-between gap-2 text-[14px] font-semibold text-ink cursor-pointer select-none leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
                <span>Why people believe it</span>
                <ChevronDown
                  className="w-4 h-4 text-ink-muted shrink-0 transition-transform duration-150 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-2 text-[16px] text-ink-muted leading-relaxed">
                {whyPeopleBelieveIt}
              </p>
            </details>
          )}
        </div>

        {/* Right: Science */}
        <div className="rounded-[18px] bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="w-6 h-6 min-w-[24px] min-h-[24px] rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0"
              >
                <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              </span>
              <h4 className="text-[16px] font-semibold leading-snug text-ink">
                Science
              </h4>
            </div>

            <p className="text-[16px] text-ink-muted leading-relaxed">
              {biologicalReality}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
