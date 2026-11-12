import React, { useState } from 'react';
import { ChevronDown, CheckCircle2, XCircle, Copy, Check, Download } from 'lucide-react';
import { ParamedicHandoutData } from '../../utils/handoutHelper';

export interface HandoverSummaryProps {
  handout: ParamedicHandoutData;
}

export const HandoverSummary: React.FC<HandoverSummaryProps> = ({ handout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopySBAR = async () => {
    try {
      await navigator.clipboard.writeText(handout.sbarText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadMD = () => {
    const blob = new Blob([handout.sbarText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sanjeevani-SBAR-${handout.handoutId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sbarRows = [
    {
      letter: 'S',
      label: 'Situation',
      content: handout.situation
    },
    {
      letter: 'B',
      label: 'Background & Scene',
      content: handout.background
    },
    {
      letter: 'A',
      label: 'Assessment / Priority',
      content: handout.assessment
    }
  ];

  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* Collapsed Accordion Header with One-Line Preview */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full min-h-[56px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-base/60 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-bold text-ink leading-snug">
            Handover summary (SBAR)
          </div>
          {!isOpen && (
            <p className="text-sm text-ink-muted truncate mt-0.5">
              {handout.situation}
            </p>
          )}
        </div>

        <ChevronDown
          className={`w-5 h-5 text-ink-muted shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Expanded 4-Row SBAR Card with One Neutral Letter Style */}
      {isOpen && (
        <div className="border-t border-border divide-y divide-border/70">
          {sbarRows.map((row) => (
            <div key={row.letter} className="p-3.5 flex items-start gap-3">
              {/* Neutral Letter Badge (No Rainbow Colours) */}
              <span
                aria-hidden="true"
                className="w-7 h-7 rounded-lg bg-base border border-border text-ink font-extrabold text-sm flex items-center justify-center shrink-0 mt-0.5"
              >
                {row.letter}
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <span className="text-sm font-bold text-ink-muted block">
                  {row.label}
                </span>
                <p className="text-[15px] text-ink leading-relaxed">
                  {row.content}
                </p>
              </div>
            </div>
          ))}

          {/* R: Recommendations & Contraindications */}
          <div className="p-3.5 flex items-start gap-3">
            <span
              aria-hidden="true"
              className="w-7 h-7 rounded-lg bg-base border border-border text-ink font-extrabold text-sm flex items-center justify-center shrink-0 mt-0.5"
            >
              R
            </span>
            <div className="min-w-0 flex-1 space-y-2.5">
              <span className="text-sm font-bold text-ink-muted block">
                Recommendations & Avoid
              </span>

              {handout.recommendations.length > 0 && (
                <ul className="space-y-1.5">
                  {handout.recommendations.slice(0, 3).map((rec, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[15px] text-ink leading-snug"
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

              {/* Only "Avoid" lines use the red callout */}
              {handout.contraindications.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {handout.contraindications.slice(0, 2).map((contra, i) => (
                    <div
                      key={'contra-' + i}
                      className="p-2.5 rounded-xl bg-alert/8 border-l-4 border-alert text-ink flex items-start gap-2 text-sm font-semibold leading-snug"
                    >
                      <XCircle
                        className="w-4 h-4 text-alert shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>Avoid: {contra}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Copy SBAR & Download .MD Actions */}
          <div className="p-3 bg-base/50 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopySBAR}
              className="min-h-[48px] px-3 py-2 rounded-xl bg-surface hover:bg-base border border-border text-sm font-bold text-ink flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
                  <span>Copy SBAR</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadMD}
              className="min-h-[48px] px-3 py-2 rounded-xl bg-surface hover:bg-base border border-border text-sm font-bold text-ink flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Download className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
              <span>Save .MD</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
