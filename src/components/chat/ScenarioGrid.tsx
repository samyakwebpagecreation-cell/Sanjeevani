import React from 'react';

export interface ScenarioItem {
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

export interface ScenarioGridProps {
  scenarios: ScenarioItem[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export const ScenarioGrid: React.FC<ScenarioGridProps> = ({
  scenarios,
  onSelect,
  disabled = false
}) => {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full min-w-0"
      role="group"
      aria-label="Common emergency scenarios"
    >
      {scenarios.slice(0, 6).map((item, idx) => (
        <button
          key={idx}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(item.prompt)}
          className="group min-h-[58px] sm:min-h-[64px] w-full min-w-0 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-surface hover:bg-primary-soft/60 border border-border hover:border-primary/40 text-left flex items-center gap-3 sm:gap-3.5 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        >
          <span
            aria-hidden="true"
            className="w-10 h-10 rounded-xl bg-base group-hover:bg-surface border border-border/80 flex items-center justify-center shrink-0 text-primary"
          >
            {item.icon}
          </span>
          <span className="min-w-0 flex-1 text-[16px] sm:text-[17px] font-bold text-ink group-hover:text-primary leading-snug truncate">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};
