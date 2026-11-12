import React from 'react';
import { Check, Loader2, Minus, X } from 'lucide-react';
import { Card } from '../common/DesignSystem';
import { SearchProgressState } from '../../services/medicines/types';

export interface SearchProgressProps {
  progress: SearchProgressState;
}

export const SearchProgress: React.FC<SearchProgressProps> = ({ progress }) => {
  const steps = [
    {
      id: 'identifying',
      label: progress.identified_medicine
        ? `Identified medicine: ${progress.identified_medicine}`
        : 'Identifying medicine query',
      done: progress.stage !== 'identifying'
    },
    {
      id: 'confirming_composition',
      label: progress.confirmed_composition
        ? `Confirmed composition: ${progress.confirmed_composition}`
        : 'Confirming active salt composition & strength',
      done:
        progress.stage === 'checking_sources' ||
        progress.stage === 'validating_matches' ||
        progress.stage === 'calculating_savings' ||
        progress.stage === 'complete'
    },
    {
      id: 'checking_sources',
      label: 'Checking official & retail pharmacy sources',
      done:
        progress.stage === 'validating_matches' ||
        progress.stage === 'calculating_savings' ||
        progress.stage === 'complete'
    },
    {
      id: 'validating_matches',
      label: 'Validating salt, strength, dosage form & verbatim price snippets',
      done: progress.stage === 'calculating_savings' || progress.stage === 'complete'
    },
    {
      id: 'calculating_savings',
      label: 'Calculating per-unit prices & savings deterministically',
      done: progress.stage === 'complete'
    }
  ];

  return (
    <Card className="p-5 sm:p-6 space-y-4" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-bold text-ink leading-snug">
          Checking medicine sources…
        </h2>
        <span className="text-sm font-semibold text-ink-muted tabular-nums whitespace-nowrap">
          {(progress.elapsed_ms / 1000).toFixed(1)}s
        </span>
      </div>

      <ol className="space-y-2.5">
        {steps.map((step) => (
          <li key={step.id} className="flex items-start gap-3 text-sm sm:text-base">
            <span
              aria-hidden="true"
              className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                step.done
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-primary-soft text-primary'
              }`}
            >
              {step.done ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
            </span>
            <span className={`leading-snug ${step.done ? 'text-ink font-medium' : 'text-ink-muted'}`}>
              {step.label}
            </span>
          </li>
        ))}
      </ol>

      {progress.source_items.length > 0 && (
        <div className="pt-2 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {progress.source_items.map((src) => {
            const statusIcon =
              src.state === 'found' ? (
                <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              ) : src.state === 'no_match' ? (
                <Minus className="w-4 h-4 text-ink-muted shrink-0" />
              ) : src.state === 'failed' ? (
                <X className="w-4 h-4 text-alert shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
              );

            const statusLabel =
              src.state === 'found'
                ? '✓ found'
                : src.state === 'no_match'
                ? '– no match'
                : src.state === 'failed'
                ? `✗ failed${src.reason ? ` (${src.reason})` : ''}`
                : 'checking…';

            return (
              <div
                key={src.source_id}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-base border border-border text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {statusIcon}
                  <span className="font-semibold text-ink truncate">{src.source_name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-ink-muted tabular-nums">
                  <span className="text-sm">{statusLabel}</span>
                  {src.duration_ms !== undefined && (
                    <span className="text-sm font-medium">
                      {(src.duration_ms / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
