import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Image as ImageIcon,
  Video as VideoIcon,
  Mic,
  Plus,
  X,
  ListChecks,
  ChevronRight
} from 'lucide-react';
import { useAppLanguage, UI_TRANSLATIONS } from '../../utils/languageStore';

export interface ComposerScenarioOption {
  label: string;
  prompt: string;
  icon?: React.ReactNode;
}

export interface ComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
  isListening: boolean;
  onToggleSpeech: () => void;
  selectedImage: string | null;
  selectedVideo: { file: File; name: string; previewUrl: string } | null;
  onClearMedia: () => void;
  onTriggerImageSelect: () => void;
  onTriggerVideoSelect: () => void;
  scenarios?: ComposerScenarioOption[];
  onSelectScenario?: (prompt: string) => void;
  onHeightChange?: (heightPx: number) => void;
}

/**
 * Compact Voice-First Composer (Section A & E):
 * - Single row of [+] [auto-grow textarea, 1 row by default, max 5] [Mic 48px] [Send 48px]
 *   inside one 16px-radius container, <= 72px tall when idle.
 * - No divider row, no labelled "Voice Dictate" button (icon-only mic with aria-label).
 * - Shortened placeholder: "Describe the emergency…".
 * - While listening, the textarea is replaced by a static "Listening… tap to stop" bar.
 * - "+" menu includes "Scenarios", "Attach Photo", and "Incident Video".
 */
export const Composer: React.FC<ComposerProps> = ({
  value,
  onChange,
  onSend,
  isLoading,
  isListening,
  onToggleSpeech,
  selectedImage,
  selectedVideo,
  onClearMedia,
  onTriggerImageSelect,
  onTriggerVideoSelect,
  scenarios = [],
  onSelectScenario,
  onHeightChange
}) => {
  const { lang } = useAppLanguage();
  const copy = UI_TRANSLATIONS[lang];
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const [showScenarioSubmenu, setShowScenarioSubmenu] = useState(false);

  // Auto-grow textarea up to 5 rows (~120px)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = value ? Math.min(el.scrollHeight, 120) : 36;
    el.style.height = `${nextHeight}px`;
  }, [value]);

  // Report height changes to ChatView so scroller bottom padding matches composer height + 16px
  useEffect(() => {
    if (!containerRef.current || !onHeightChange) return;
    const measure = () => {
      if (containerRef.current) {
        onHeightChange(Math.round(containerRef.current.getBoundingClientRect().height));
      }
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure);
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    }
  }, [onHeightChange, value, selectedImage, selectedVideo, isListening]);

  // Close "+" menu on outside click or Escape
  useEffect(() => {
    if (!isPlusOpen) {
      setShowScenarioSubmenu(false);
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusOpen(false);
        setShowScenarioSubmenu(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPlusOpen(false);
        setShowScenarioSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isPlusOpen]);

  const canSend = !isLoading && Boolean(value.trim() || selectedImage || selectedVideo);
  const isMultilineOverflow = value.split('\n').length > 4 || value.length > 260;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSend) {
      onSend();
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full max-w-full shrink-0 px-3 sm:px-6 py-1.5 bg-surface z-30"
    >
      <div className="max-w-3xl mx-auto w-full min-w-0 space-y-1.5">
        {/* Attached Media Preview Pill (only when photo or video is selected) */}
        {(selectedImage || selectedVideo) && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-base border border-border min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Attached injury preview"
                  className="w-9 h-9 rounded-lg object-cover border border-border shrink-0"
                />
              )}
              {selectedVideo && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-[14px] text-ink min-w-0">
                  <VideoIcon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span className="truncate max-w-[150px] sm:max-w-xs">
                    {selectedVideo.name}
                  </span>
                </div>
              )}
              <span className="text-[14px] font-semibold text-ink truncate">
                {selectedVideo ? 'Incident video attached' : 'Injury photo attached'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClearMedia}
              className="h-9 w-9 min-h-[36px] min-w-[36px] rounded-lg hover:bg-surface text-ink-muted hover:text-ink flex items-center justify-center transition-colors duration-150 cursor-pointer shrink-0"
              aria-label="Remove attachment"
              title="Remove attachment"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Single-Row 16px-Radius Container (<= 72px tall when idle) */}
        <form
          onSubmit={handleSubmit}
          aria-label="Emergency message composer"
          className="w-full min-w-0 rounded-2xl px-1.5 sm:px-2 py-1.5 bg-base/80 border border-border flex items-center gap-1.5 sm:gap-2 min-h-[52px] sm:min-h-[56px]"
        >
          {/* 1. [+] Menu Button (44px mobile / 48px desktop) with Scenarios, Attach Photo, Incident Video */}
          <div className="relative shrink-0" ref={plusMenuRef}>
            <button
              type="button"
              onClick={() => setIsPlusOpen((prev) => !prev)}
              aria-expanded={isPlusOpen}
              aria-haspopup="menu"
              aria-label="Open attachments and scenarios menu"
              title="Scenarios, photo, or video"
              className="h-11 w-11 sm:h-12 sm:w-12 min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px] rounded-xl bg-surface hover:bg-primary-soft border border-border text-ink hover:text-primary inline-flex items-center justify-center transition-colors duration-150 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
            </button>

            {isPlusOpen && (
              <div
                role="menu"
                aria-label="Composer options"
                className="absolute bottom-full left-0 mb-2 w-64 max-w-[calc(100vw-24px)] rounded-2xl bg-surface border border-border shadow-lg p-1.5 z-50 space-y-1"
              >
                {!showScenarioSubmenu ? (
                  <>
                    {scenarios.length > 0 && onSelectScenario && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => setShowScenarioSubmenu(true)}
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-[15px] font-semibold text-ink hover:bg-base transition-colors duration-150 cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <ListChecks className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                          <span>Scenarios</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
                      </button>
                    )}

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsPlusOpen(false);
                        onTriggerImageSelect();
                      }}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center gap-2.5 text-[15px] font-semibold text-ink hover:bg-base transition-colors duration-150 cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      <span>Attach Photo</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsPlusOpen(false);
                        onTriggerVideoSelect();
                      }}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center gap-2.5 text-[15px] font-semibold text-ink hover:bg-base transition-colors duration-150 cursor-pointer"
                    >
                      <VideoIcon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      <span>Incident Video</span>
                    </button>
                  </>
                ) : (
                  <div className="space-y-1" role="group" aria-label="Emergency scenarios">
                    <div className="px-2.5 py-1 text-[14px] font-semibold text-ink-muted flex items-center justify-between">
                      <span>Select scenario</span>
                      <button
                        type="button"
                        onClick={() => setShowScenarioSubmenu(false)}
                        className="text-[14px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Back
                      </button>
                    </div>
                    {scenarios.map((scen, idx) => (
                      <button
                        key={idx}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsPlusOpen(false);
                          setShowScenarioSubmenu(false);
                          onSelectScenario?.(scen.prompt);
                        }}
                        className="w-full min-h-[42px] px-3 py-1.5 rounded-xl flex items-center gap-2.5 text-[14px] font-semibold text-ink hover:bg-base transition-colors duration-150 cursor-pointer text-left"
                      >
                        {scen.icon}
                        <span className="truncate">{scen.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Auto-grow Textarea (1 row by default, max 5) OR Static Listening Bar */}
          {isListening ? (
            <button
              type="button"
              onClick={onToggleSpeech}
              className="flex-1 min-w-0 h-11 sm:h-12 min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 rounded-xl bg-primary text-white flex items-center justify-between gap-2 sm:gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={copy.listeningTapToStop}
            >
              <span className="text-[15px] sm:text-[16px] font-semibold truncate">
                {copy.listeningTapToStop}
              </span>
              <span
                aria-hidden="true"
                className="w-10 sm:w-14 h-1.5 rounded-full bg-white/30 overflow-hidden shrink-0"
              >
                <span className="block w-2/3 h-full bg-white rounded-full" />
              </span>
            </button>
          ) : (
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) onSend();
                }
              }}
              placeholder={copy.composerPlaceholder}
              aria-label={copy.composerPlaceholder}
              className={`flex-1 min-w-0 w-full bg-transparent focus:outline-none resize-none px-1.5 sm:px-2 py-1.5 text-[16px] sm:text-[17px] text-ink placeholder:text-ink-muted leading-snug border-none font-normal max-h-[120px] ${
                isMultilineOverflow ? 'overflow-y-auto' : 'overflow-hidden'
              }`}
            />
          )}

          {/* 3. Icon-Only Mic Button (44px mobile / 48px desktop) */}
          <button
            type="button"
            onClick={onToggleSpeech}
            aria-pressed={isListening}
            aria-label={isListening ? 'Stop voice dictation' : 'Voice Dictate'}
            title={isListening ? 'Listening… Tap to stop' : 'Voice Dictate'}
            className={`h-11 w-11 sm:h-12 sm:w-12 min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px] rounded-xl border inline-flex items-center justify-center transition-colors duration-150 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isListening
                ? 'bg-primary text-white border-primary'
                : 'bg-surface hover:bg-primary-soft text-ink hover:text-primary border-border'
            }`}
          >
            <Mic
              className={`w-5 h-5 shrink-0 ${
                isListening ? 'text-white' : 'text-primary'
              }`}
              aria-hidden="true"
            />
          </button>

          {/* 4. Send Button (44px mobile / 48px desktop) */}
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            title="Send message (Enter)"
            className={`h-11 w-11 sm:h-12 sm:w-12 min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px] rounded-xl inline-flex items-center justify-center transition-colors duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              canSend
                ? 'bg-primary hover:bg-primary-dark text-white cursor-pointer'
                : 'bg-surface border border-border text-ink-muted/60 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5 shrink-0" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
};
