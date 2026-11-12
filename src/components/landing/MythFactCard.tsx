import React from 'react';
import { XCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '../common/DesignSystem';

export interface MythFactScenario {
  topic: string;
  mythTitle: string;
  mythDesc: string;
  factTitle: string;
  factDesc: string;
}

interface MythFactCardProps {
  index: number;
  scenario: MythFactScenario;
  onVerify: () => void;
}

export const MythFactCard: React.FC<MythFactCardProps> = ({
  index,
  scenario,
  onVerify
}) => {
  return (
    <div className="space-y-3">
      {/* Scenario Heading Above Card */}
      <div className="flex items-center justify-between gap-2 px-1">
        <h3 className="text-lg sm:text-xl font-bold text-ink">
          Scenario {index + 1}: {scenario.topic}
        </h3>
      </div>

      <Card className="overflow-hidden border-2 border-border">
        <div className="relative grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Circular "VS" Badge on the Seam */}
          <div
            aria-hidden="true"
            className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-navy text-white font-mono font-extrabold text-xs items-center justify-center border-4 border-surface shadow-md"
          >
            VS
          </div>

          {/* Left Half: Tinted Red-50 Background + ✕ MYTH Badge + 20px+ Myth Text */}
          <div className="p-6 sm:p-8 bg-red-50/85 dark:bg-red-950/25 space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-alert text-white text-sm font-bold uppercase tracking-wider shadow-2xs">
              <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>✕ MYTH · Contraindicated</span>
            </div>

            <h4 className="text-xl sm:text-[22px] font-semibold text-slate-700 dark:text-slate-200 line-through decoration-alert/70 decoration-2 leading-snug">
              {scenario.mythTitle}
            </h4>

            <p className="text-base text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
              {scenario.mythDesc}
            </p>
          </div>

          {/* Right Half: Tinted Green-50 Background + ✓ FACT Badge + 20px+ Bold Fact */}
          <div className="p-6 sm:p-8 bg-emerald-50/85 dark:bg-emerald-950/25 space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success text-white text-sm font-bold uppercase tracking-wider shadow-2xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>✓ FACT · AIIMS &amp; AHA Standard</span>
            </div>

            <h4 className="text-xl sm:text-[22px] font-extrabold text-ink leading-snug">
              {scenario.factTitle}
            </h4>

            <p className="text-base text-ink-muted font-normal leading-relaxed">
              {scenario.factDesc}
            </p>
          </div>
        </div>

        {/* Card Footer with Visible "Verify in MythBuster" Action Button */}
        <div className="px-6 py-3.5 bg-surface border-t border-border flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-ink-muted">
            Source: Accredited AIIMS &amp; AHA 2020 First-Aid Guidelines
          </span>
          <button
            type="button"
            onClick={onVerify}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold text-primary hover:bg-primary-soft inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <span>Verify in MythBuster</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </Card>
    </div>
  );
};
