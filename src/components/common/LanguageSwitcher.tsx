import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, Volume2 } from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguageCode,
  useAppLanguage,
  UI_TRANSLATIONS
} from '../../utils/languageStore';
import { audioEngine } from '../../utils/audio';

export interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'bar';
  size?: 'sm' | 'md';
  showVoicePreview?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  size = 'md',
  showVoicePreview = false,
  className = ''
}) => {
  const [lang, setLang, activeMeta] = useAppLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelectLanguage = (code: SupportedLanguageCode, speakGreeting = false) => {
    setLang(code);
    setIsOpen(false);
    if (speakGreeting) {
      const target = SUPPORTED_LANGUAGES.find((l) => l.code === code);
      if (target) {
        audioEngine.speak(target.voiceGreeting, undefined, code);
      }
    }
  };

  /* ==========================================================================
   * VARIANT 1: INLINE 5-LANGUAGE BAR (English · हिंदी · বাংলা · தமிழ் · मराठी)
   * ========================================================================== */
  if (variant === 'bar') {
    const copy = UI_TRANSLATIONS[lang];
    return (
      <div
        role="region"
        aria-label={copy.languageBarLabel}
        className={`rounded-2xl bg-base border border-border px-3 py-2 flex flex-wrap items-center justify-between gap-2 min-w-0 w-full ${className}`}
      >
        <div className="flex items-center gap-1.5 text-xs font-bold text-ink-muted shrink-0">
          <Globe className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
          <span>{copy.languageBarLabel}:</span>
        </div>

        <div
          role="radiogroup"
          aria-label="Select emergency language"
          className="flex flex-wrap items-center gap-1.5"
        >
          {SUPPORTED_LANGUAGES.map((item) => {
            const isSelected = item.code === lang;
            return (
              <button
                key={item.code}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectLanguage(item.code, showVoicePreview)}
                title={`${item.nativeName} (${item.englishName}) — Voice & Protocol`}
                className={`min-h-[34px] px-2.5 sm:px-3 py-1 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-surface hover:bg-primary-soft/60 text-ink border border-border hover:border-primary/40'
                }`}
              >
                <span>{item.nativeName}</span>
                {item.code !== 'en' && (
                  <span
                    className={`text-[10px] font-medium ${
                      isSelected ? 'text-white/85' : 'text-ink-muted'
                    }`}
                  >
                    ({item.englishName})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ==========================================================================
   * VARIANT 2: COMPACT HEADER DROPDOWN (Hub & AI Guardian Header)
   * ========================================================================== */
  const btnHeightClass =
    size === 'sm'
      ? 'min-h-[38px] sm:min-h-[40px] px-2 sm:px-2.5 text-[13px]'
      : 'min-h-[40px] px-2.5 sm:px-3 text-[13px] sm:text-[14px]';

  return (
    <div className={`relative shrink-0 ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Language: ${activeMeta.nativeName} (${activeMeta.englishName}). Tap to switch language.`}
        title={`Language: ${activeMeta.nativeName} (${activeMeta.englishName})`}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${btnHeightClass} ${
          lang !== 'en'
            ? 'bg-primary-soft text-primary border-primary/40 font-bold'
            : 'bg-surface hover:bg-base text-ink border-border font-semibold'
        }`}
      >
        <Globe className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
        <span>{activeMeta.shortLabel}</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Choose Voice & Protocol Language"
          className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] rounded-2xl bg-surface border border-border shadow-xl p-2 z-50 space-y-1"
        >
          <div className="px-2.5 py-1.5 border-b border-border flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
              Voice &amp; Protocol Language
            </span>
            <span className="text-[10px] font-mono font-bold text-primary bg-primary-soft px-1.5 py-0.5 rounded">
              5 Languages
            </span>
          </div>

          <div className="pt-1 space-y-1">
            {SUPPORTED_LANGUAGES.map((item) => {
              const active = item.code === lang;
              return (
                <div
                  key={item.code}
                  className={`flex items-center justify-between gap-1 rounded-xl p-1 transition-colors ${
                    active ? 'bg-primary-soft/80' : 'hover:bg-base'
                  }`}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => handleSelectLanguage(item.code, false)}
                    className="flex-1 min-h-[38px] px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left cursor-pointer"
                  >
                    <div>
                      <div className="text-sm font-bold text-ink leading-tight flex items-center gap-1.5">
                        <span>{item.nativeName}</span>
                        {item.code !== 'en' && (
                          <span className="text-xs font-medium text-ink-muted">
                            · {item.englishName}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-muted block mt-0.5">
                        {item.bcp47} · Steps &amp; Voice
                      </span>
                    </div>

                    {active && (
                      <Check
                        className="w-4 h-4 text-primary shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectLanguage(item.code, true);
                    }}
                    title={`Speak sample in ${item.englishName}`}
                    aria-label={`Speak sample in ${item.englishName}`}
                    className="h-8 w-8 rounded-lg hover:bg-surface text-ink-muted hover:text-primary flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
