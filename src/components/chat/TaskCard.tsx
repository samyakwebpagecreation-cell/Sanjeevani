import React, { useState } from 'react';
import { CheckCircle2, Clock, UserCheck } from 'lucide-react';
import { SquadTaskRole } from '../../services/bystanderSquadEngine';

export interface TaskCardProps {
  role: SquadTaskRole;
  index: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({ role, index }) => {
  const [isExpandedText, setIsExpandedText] = useState(false);

  const cleanTitle = role.title.replace(/^\d+[\.\)\s]+/, '').trim();
  const stepNumber = role.priority || index + 1;
  const isLongDescription = (role.instruction || '').length > 135;

  const isDone = role.status === 'completed';
  const isClaimed = role.status === 'claimed' || role.status === 'in_progress';
  const isPrimaryResponder =
    (role.assignedTo || '').toLowerCase().includes('primary responder') ||
    (role.assignedTo || '').toLowerCase().includes('you');

  return (
    <div
      className={`p-4 rounded-[16px] border transition-colors ${
        isDone
          ? 'bg-primary-soft/35 border-primary/35'
          : isClaimed
          ? 'bg-surface border-primary/30 shadow-2xs'
          : 'bg-surface border-border shadow-2xs'
      }`}
    >
      {/* Top Row: Numbered Circle + Title + Status Chip (Icon + Text, never colour alone) */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            aria-hidden="true"
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-extrabold tabular-nums shrink-0 mt-0.5 ${
              isDone
                ? 'bg-primary text-white'
                : 'bg-primary-soft text-primary border border-primary/25'
            }`}
          >
            {stepNumber}
          </span>
          <div className="min-w-0">
            <h4 className="text-base font-bold text-ink leading-snug">
              {cleanTitle}
            </h4>
            {role.subtitle && (
              <p className="text-sm font-medium text-primary mt-0.5">
                {role.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Status Chip with Icon + Text */}
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-sm font-semibold leading-none whitespace-nowrap ${
            isDone
              ? 'bg-primary text-white border-primary'
              : isClaimed
              ? 'bg-primary-soft text-primary border-primary/30'
              : 'bg-base text-ink-muted border-border'
          }`}
        >
          {isDone ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Done</span>
            </>
          ) : isClaimed ? (
            <>
              <UserCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Claimed</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Awaiting scan</span>
            </>
          )}
        </span>
      </div>

      {/* Full Description with wrap and optional More/Less toggle */}
      <div className="mt-2.5 pl-10">
        <p
          className={`text-sm sm:text-base text-ink leading-relaxed ${
            isLongDescription && !isExpandedText ? 'line-clamp-3' : ''
          }`}
        >
          {role.instruction}
        </p>
        {isLongDescription && (
          <button
            type="button"
            onClick={() => setIsExpandedText((prev) => !prev)}
            className="mt-1 text-sm font-bold text-primary hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            {isExpandedText ? 'Show less' : 'More'}
          </button>
        )}

        {/* Assigned Line — Make "You (Primary Responder)" clearly visible */}
        <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap text-sm">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-ink-muted font-medium">Assigned:</span>
            {isPrimaryResponder ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-primary-soft text-primary font-bold border border-primary/25">
                {role.assignedTo}
              </span>
            ) : (
              <span className="font-semibold text-ink">
                {role.assignedTo || 'Waiting for scan...'}
              </span>
            )}
          </div>

          {role.completedAt && (
            <span className="text-sm text-ink-muted tabular-nums">
              Completed {role.completedAt}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
