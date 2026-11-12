import React from 'react';
import { Clock, Hand, Check, ChevronDown } from 'lucide-react';
import { SquadTaskRole } from '../../services/bystanderSquadEngine';

export interface TaskRowProps {
  role: SquadTaskRole;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMarkComplete?: (roleId: string) => void;
}

/**
 * Compact Task Row (Section F):
 * - 48px or more tall
 * - Task titles wrap up to 2 lines (line-clamp-2, no single-line ellipsis that hides meaning)
 * - Only one task expanded at a time
 */
export const TaskRow: React.FC<TaskRowProps> = ({
  role,
  index,
  isExpanded,
  onToggleExpand,
  onMarkComplete
}) => {
  const cleanTitle = role.title.replace(/^\d+[\.\)\s]+/, '').trim();
  const stepNumber = index + 1;

  const isDone = role.status === 'completed';
  const isClaimed = role.status === 'claimed' || role.status === 'in_progress';
  const isPrimaryResponder =
    (role.assignedTo || '').toLowerCase().includes('primary responder') ||
    (role.assignedTo || '').toLowerCase().includes('you') ||
    index === 0;

  const statusLabel = isDone
    ? 'Status: Done'
    : isClaimed
    ? 'Status: Claimed'
    : 'Status: Waiting for bystander';

  return (
    <div
      className={`rounded-xl border transition-colors duration-150 overflow-hidden ${
        isDone
          ? 'bg-primary-soft/35 border-primary/30'
          : isExpanded
          ? 'bg-surface border-primary/40 shadow-2xs'
          : 'bg-surface border-border'
      }`}
    >
      {/* Row Header (>= 48px tall, title wraps up to 2 lines with line-clamp-2) */}
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        className="w-full min-h-[48px] px-3 py-2 flex items-center justify-between gap-2.5 text-left cursor-pointer hover:bg-base/60 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span
            aria-hidden="true"
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[14px] font-bold tabular-nums shrink-0 ${
              isPrimaryResponder || isDone
                ? 'bg-primary text-white'
                : 'bg-base text-ink border border-border'
            }`}
          >
            {stepNumber}
          </span>

          <span
            className={`text-[15px] font-semibold leading-snug line-clamp-2 ${
              isDone ? 'text-ink-muted line-through' : 'text-ink'
            }`}
          >
            {cleanTitle}
          </span>
        </span>

        <span className="flex items-center gap-1.5 shrink-0">
          <span
            role="img"
            aria-label={statusLabel}
            title={statusLabel}
            className={`w-6 h-6 rounded-md flex items-center justify-center ${
              isDone
                ? 'bg-primary text-white'
                : isClaimed
                ? 'bg-primary-soft text-primary'
                : 'bg-base text-ink-muted'
            }`}
          >
            {isDone ? (
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
            ) : isClaimed ? (
              <Hand className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </span>

          <ChevronDown
            className={`w-4 h-4 text-ink-muted transition-transform duration-150 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </span>
      </button>

      {/* Accordion Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border/60 space-y-2 text-left">
          {role.subtitle && (
            <p className="text-[14px] font-semibold text-primary">
              {role.subtitle}
            </p>
          )}

          <p className="text-[15px] text-slate-800 leading-relaxed">
            {role.instruction}
          </p>

          <div className="pt-1.5 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[14px] text-ink-muted">
              Assigned:{' '}
              <strong className="font-semibold text-ink">
                {role.assignedTo || (isPrimaryResponder ? 'You (Primary Responder)' : 'Unassigned')}
              </strong>
            </span>

            {onMarkComplete && !isDone && (
              <button
                type="button"
                onClick={() => onMarkComplete(role.id)}
                className="min-h-[40px] px-3 py-1 rounded-lg bg-primary hover:bg-primary-dark text-white text-[14px] font-semibold transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Mark Complete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
