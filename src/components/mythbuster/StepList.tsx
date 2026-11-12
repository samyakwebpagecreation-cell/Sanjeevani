import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Chip } from '../common/Chip';

export interface StepListProps {
  title?: string;
  badgeText?: string;
  steps: string[];
}

export const StepList: React.FC<StepListProps> = ({
  title = 'What to do instead',
  badgeText = 'AHA & AIIMS standard',
  steps
}) => {
  return (
    <section
      aria-labelledby="what-to-do-instead-heading"
      className="rounded-[18px] bg-surface border border-border p-5 sm:p-6 shadow-2xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h3
          id="what-to-do-instead-heading"
          className="text-[20px] font-semibold leading-snug text-ink"
        >
          {title}
        </h3>
        <Chip
          variant="primary"
          icon={<ShieldCheck className="w-4 h-4 text-primary" />}
        >
          {badgeText}
        </Chip>
      </div>

      <ol className="divide-y divide-border/70">
        {steps.map((step, idx) => (
          <li
            key={idx}
            className="py-3.5 first:pt-1 last:pb-0 flex items-start gap-3.5"
          >
            <span
              aria-hidden="true"
              className="w-7 h-7 min-w-[28px] min-h-[28px] rounded-full bg-primary text-white text-[14px] font-bold leading-snug flex items-center justify-center shrink-0 mt-0.5 tabular-nums"
            >
              {idx + 1}
            </span>
            <p className="min-w-0 text-[18px] text-ink font-normal leading-snug">
              {step}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
};
