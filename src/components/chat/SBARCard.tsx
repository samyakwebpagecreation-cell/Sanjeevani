import React from 'react';
import { XCircle, Building2, CheckCircle2 } from 'lucide-react';
import { ParamedicHandoutData } from '../../utils/handoutHelper';
import { Card } from '../common/DesignSystem';

export interface SBARCardProps {
  handout: ParamedicHandoutData;
}

export const SBARCard: React.FC<SBARCardProps> = ({ handout }) => {
  const sbarRows = [
    {
      letter: 'S',
      label: 'SITUATION',
      content: handout.situation
    },
    {
      letter: 'B',
      label: 'BACKGROUND & SCENE',
      content: `${handout.background}${
        handout.locationAddress ? ` · Scene Doorstep: ${handout.locationAddress}` : ''
      }`
    },
    {
      letter: 'A',
      label: 'ASSESSMENT / PRIORITY',
      content: handout.assessment
    }
  ];

  return (
    <Card className="divide-y divide-border overflow-hidden">
      {sbarRows.map((row) => (
        <div key={row.letter} className="p-4 flex items-start gap-3.5">
          {/* Consistent primary-tinted square badge for S, B, A, R */}
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-lg bg-primary-soft text-primary border border-primary/25 font-extrabold text-sm flex items-center justify-center shrink-0 mt-0.5"
          >
            {row.letter}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary block">
              {row.label}
            </span>
            <p className="text-sm sm:text-base text-ink font-medium leading-relaxed">
              {row.content}
            </p>
          </div>
        </div>
      ))}

      {/* R: Recommendations & Contraindications */}
      <div className="p-4 flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className="w-8 h-8 rounded-lg bg-primary-soft text-primary border border-primary/25 font-extrabold text-sm flex items-center justify-center shrink-0 mt-0.5"
        >
          R
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary block">
            RECOMMENDATIONS & CONTRAINDICATIONS
          </span>

          {/* Recommended Steps */}
          {handout.recommendations.length > 0 && (
            <ul className="space-y-2">
              {handout.recommendations.slice(0, 3).map((rec, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm sm:text-base text-ink font-medium leading-snug"
                >
                  <CheckCircle2
                    className="w-4 h-4 text-primary shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Contraindications ("Avoid:") in red-tinted callout with X icon */}
          {handout.contraindications.length > 0 && (
            <div className="space-y-2 pt-1">
              {handout.contraindications.slice(0, 2).map((contra, i) => (
                <div
                  key={'contra-' + i}
                  className="p-3 rounded-xl bg-alert/8 border border-alert/25 text-alert flex items-start gap-2.5 text-sm font-semibold leading-snug"
                >
                  <XCircle className="w-4 h-4 text-alert shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Avoid: {contra}</span>
                </div>
              ))}
            </div>
          )}

          {handout.nearestHospitalName && (
            <div className="pt-2 border-t border-border/60 flex items-center gap-2 text-sm text-primary font-semibold">
              <Building2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                Nearest Trauma Center: {handout.nearestHospitalName}
                {handout.nearestHospitalDistance ? ` (${handout.nearestHospitalDistance})` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
