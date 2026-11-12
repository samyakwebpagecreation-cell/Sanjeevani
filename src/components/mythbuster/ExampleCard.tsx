import React from 'react';
import { FileQuestion } from 'lucide-react';

export interface ExampleCardProps {
  text: string;
  selected?: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
}

export const ExampleCard: React.FC<ExampleCardProps> = ({
  text,
  selected = false,
  onSelect,
  icon
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full min-h-[64px] rounded-[16px] px-4 py-3 text-left flex items-start gap-3 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        selected
          ? 'border-2 border-primary bg-primary-soft/35 text-ink'
          : 'border border-border bg-surface hover:border-primary/45 hover:bg-base/60 text-ink'
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 shrink-0 flex items-center justify-center ${
          selected ? 'text-primary' : 'text-ink-muted'
        }`}
      >
        {icon || <FileQuestion className="w-4 h-4 shrink-0" />}
      </span>
      <span className="min-w-0 text-[16px] font-medium leading-snug text-ink">
        {text}
      </span>
    </button>
  );
};
