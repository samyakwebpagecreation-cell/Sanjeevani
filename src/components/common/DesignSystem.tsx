import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

/* ============================================================================
 * 1. SECTION WRAPPER
 * Widened to max-w-7xl, py-16 md:py-20, alternating clinical rhythm backgrounds
 * ============================================================================ */
export interface SectionProps {
  id?: string;
  labelledBy?: string;
  variant?: 'default' | 'surface' | 'surface-dots' | 'surface-grid' | 'soft-tint' | 'dark';
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  id,
  labelledBy,
  variant = 'default',
  className = '',
  containerClassName = '',
  children
}) => {
  const variantStyles = {
    default: 'bg-base text-ink',
    surface: 'bg-surface border-y border-border text-ink',
    'surface-dots': 'bg-surface bg-clinical-dots border-y border-border text-ink',
    'surface-grid': 'bg-surface bg-clinical-grid border-y border-border text-ink',
    'soft-tint': 'bg-primary-soft/55 border-y border-primary/15 text-ink',
    dark: 'bg-navy text-white'
  }[variant];

  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`scroll-reveal py-16 md:py-20 relative ${variantStyles} ${className}`}
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${containerClassName}`}>
        {children}
      </div>
    </section>
  );
};

/* ============================================================================
 * 2. SECTION HEADER
 * Consistent 12px uppercase eyebrow label with wide tracking + bold H2 + 16-18px body
 * ============================================================================ */
export interface SectionHeaderProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  dark?: boolean;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  id,
  eyebrow,
  title,
  description,
  align = 'center',
  dark = false,
  action
}) => {
  const isCentered = align === 'center' && !action;

  return (
    <div
      className={`mb-10 md:mb-12 ${
        action
          ? 'flex flex-col lg:flex-row lg:items-end justify-between gap-6'
          : isCentered
          ? 'text-center max-w-3xl mx-auto'
          : 'max-w-3xl'
      }`}
    >
      <div className="space-y-3">
        <p
          className={`text-xs font-bold uppercase tracking-[0.14em] ${
            dark ? 'text-teal-300' : 'text-primary'
          }`}
        >
          {eyebrow}
        </p>
        <h2
          id={id}
          className={`type-h2 tracking-tight text-balance ${
            dark ? 'text-white' : 'text-ink'
          }`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`text-base sm:text-lg font-normal leading-relaxed max-w-[65ch] ${
              isCentered ? 'mx-auto' : ''
            } ${dark ? 'text-white/85' : 'text-ink-muted'}`}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

/* ============================================================================
 * 3. CARD COMPONENT
 * 18px radius, 1px border, soft shadow, 2px hover lift
 * ============================================================================ */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark';
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  interactive = false,
  className = '',
  children,
  ...props
}) => {
  const baseStyles =
    variant === 'dark'
      ? 'rounded-[18px] bg-white/[0.06] border border-teal-400/25 text-white shadow-sm'
      : 'rounded-[18px] bg-surface border border-border text-ink shadow-xs';

  const hoverStyles = interactive
    ? variant === 'dark'
      ? 'transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/[0.1] hover:border-teal-300/50 hover:shadow-lg'
      : 'transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md'
    : '';

  return (
    <div className={`${baseStyles} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

/* ============================================================================
 * 4. BUTTON COMPONENT
 * Secondary buttons have 2px primary border, primary text, surface fill,
 * visible hover and focus ring. Alert red is reserved for 112/SOS only.
 * ============================================================================ */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'alert' | 'dark-outline' | 'neutral';
  size?: 'md' | 'sm';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const sizeStyles =
    size === 'sm'
      ? 'min-h-[44px] px-4 py-2 text-sm leading-snug'
      : 'min-h-[48px] px-6 py-2.5 text-base leading-snug';

  const variantStyles = {
    primary:
      'bg-primary hover:bg-primary-dark text-white border-2 border-primary hover:border-primary-dark shadow-sm hover:shadow-md',
    secondary:
      'bg-surface hover:bg-primary-soft text-primary border-2 border-primary shadow-xs hover:shadow-sm',
    alert:
      'bg-alert hover:bg-alert-dark text-white border-2 border-alert hover:border-alert-dark shadow-sm hover:shadow-md',
    'dark-outline':
      'bg-white/10 hover:bg-white/20 text-white border-2 border-white/80 hover:border-white shadow-xs',
    neutral:
      'bg-surface hover:bg-base text-ink border border-border shadow-2xs hover:border-primary/40'
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold tracking-tight transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap ${sizeStyles} ${variantStyles} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/* ============================================================================
 * 5. STAT BLOCK COMPONENT (3rem+ heavy weight with count-up on viewport entry)
 * ============================================================================ */
export interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  countTarget?: number;
  formatCount?: (n: number) => string;
  description: string;
}

export const Stat: React.FC<StatProps> = ({
  icon,
  label,
  value,
  countTarget,
  formatCount,
  description
}) => {
  const [displayValue, setDisplayValue] = useState<string>(value);
  const ref = useRef<HTMLDivElement | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!countTarget || !formatCount || typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReduced) {
      setDisplayValue(value);
      return;
    }

    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            const duration = 900;
            const start = performance.now();
            const tick = (now: number) => {
              const progress = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - progress, 3);
              const current = Math.round(eased * countTarget);
              setDisplayValue(progress < 1 ? formatCount(current) : value);
              if (progress < 1) {
                requestAnimationFrame(tick);
              }
            };
            requestAnimationFrame(tick);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [countTarget, formatCount, value]);

  return (
    <div ref={ref} className="p-6 sm:p-7 flex flex-col justify-between space-y-3">
      <div className="text-[2.75rem] sm:text-[3.25rem] leading-tight font-extrabold tracking-tight text-ink tabular-nums">
        {displayValue}
      </div>
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-2 text-primary">
          <span aria-hidden="true" className="shrink-0">
            {icon}
          </span>
          <span className="text-sm font-bold uppercase tracking-wider text-primary leading-snug">
            {label}
          </span>
        </div>
        <p className="text-sm sm:text-base text-ink-muted font-normal leading-snug">
          {description}
        </p>
      </div>
    </div>
  );
};

/* ============================================================================
 * 6. BADGE COMPONENT
 * Raised minimum text size to 14px (text-sm) for all tags, chips and captions
 * ============================================================================ */
export interface BadgeProps {
  icon?: React.ReactNode;
  variant?: 'neutral' | 'soft' | 'dark' | 'alert';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  icon,
  variant = 'neutral',
  children,
  className = ''
}) => {
  const variantStyles =
    variant === 'soft'
      ? 'bg-primary-soft text-primary border-primary/25'
      : variant === 'dark'
      ? 'bg-white/10 text-teal-200 border-white/20'
      : variant === 'alert'
      ? 'bg-alert/10 text-alert border-alert/30'
      : 'bg-surface text-ink border-border shadow-2xs';

  return (
    <span
      className={`inline-flex min-h-[36px] items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-semibold leading-snug ${variantStyles} ${className}`}
    >
      {icon && (
        <span
          aria-hidden="true"
          className={`shrink-0 ${variant === 'alert' ? 'text-alert' : 'text-primary'}`}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0">{children}</span>
    </span>
  );
};

/* ============================================================================
 * 7. ACCORDION COMPONENT
 * ============================================================================ */
export interface AccordionItem {
  q: string;
  a: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  openIndex: number | null;
  onToggle: (index: number) => void;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  openIndex,
  onToggle
}) => {
  return (
    <div className="space-y-3.5">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        const buttonId = `faq-button-${idx}`;
        const panelId = `faq-panel-${idx}`;

        return (
          <Card
            key={idx}
            className={`overflow-hidden transition-colors duration-150 ${
              isOpen
                ? 'bg-primary-soft/35 border-primary/40'
                : 'hover:border-primary/30'
            }`}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => onToggle(idx)}
                className="w-full min-h-[60px] px-5 py-4 sm:px-6 sm:py-5 text-left flex items-center justify-between gap-4 text-lg font-semibold text-ink hover:bg-primary-soft/20 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              >
                <span className="leading-snug">{item.q}</span>
                <span
                  aria-hidden="true"
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200 ${
                    isOpen
                      ? 'bg-primary text-white border-primary rotate-180'
                      : 'bg-surface text-ink border-border'
                  }`}
                >
                  <ChevronDown className="w-5 h-5" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-2 text-base sm:text-lg text-ink-muted font-normal leading-relaxed border-t border-border/60 max-w-[65ch]">
                  {item.a}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
