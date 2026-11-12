import React from 'react';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon?: React.ReactNode;
  variant?: 'neutral' | 'primary' | 'danger' | 'warning' | 'success';
  nowrap?: boolean;
  children: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  icon,
  variant = 'neutral',
  nowrap = false,
  className = '',
  children,
  ...props
}) => {
  const variantClasses = {
    neutral: 'bg-surface text-ink-muted border-border',
    primary: 'bg-primary-soft text-primary border-primary/25',
    danger: 'bg-red-50 text-[#7F1D1D] border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800/50',
    warning: 'bg-amber-50 text-amber-950 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800/50',
    success: 'bg-emerald-50 text-emerald-950 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/50'
  }[variant];

  return (
    <span
      className={`inline-flex min-h-[34px] items-center gap-2 rounded-full border px-3.5 py-1.5 text-[14px] font-semibold leading-snug ${
        nowrap ? 'whitespace-nowrap' : ''
      } ${variantClasses} ${className}`}
      {...props}
    >
      {icon && (
        <span aria-hidden="true" className="shrink-0 flex items-center justify-center">
          {icon}
        </span>
      )}
      <span className="min-w-0">{children}</span>
    </span>
  );
};
