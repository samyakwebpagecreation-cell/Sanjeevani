import React, { useRef } from 'react';

export interface SegmentedTabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  panelId?: string;
}

export interface SegmentedTabsProps<T extends string = string> {
  tabs: SegmentedTabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  className?: string;
}

export function SegmentedTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel,
  className = ''
}: SegmentedTabsProps<T>) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (tabs.length === 0) return;
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const targetTab = tabs[nextIndex];
      onChange(targetTab.id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex flex-wrap min-[360px]:flex-nowrap items-center justify-center gap-1 rounded-2xl bg-surface p-1.5 border border-border shadow-2xs max-w-full ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isSelected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={tab.panelId}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-5 py-2 text-[14px] sm:text-[16px] font-semibold leading-snug whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
              isSelected
                ? 'bg-primary text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-base/70'
            }`}
          >
            {tab.icon && (
              <span
                aria-hidden="true"
                className={`shrink-0 flex items-center justify-center ${
                  isSelected ? 'text-white' : 'text-primary'
                }`}
              >
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
