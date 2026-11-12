import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Bot,
  ChevronRight,
  ChevronDown,
  X,
  HeartPulse,
  Wind,
  Droplets,
  Brain,
  ShieldAlert,
  Activity,
  Waves,
  AlertTriangle,
  Filter,
  Clock,
  CheckCircle2,
  WifiOff,
  PhoneCall,
} from 'lucide-react';
import { InjuryProtocolId } from '../../types';
import {
  PROTOCOLS,
  PROTOCOL_BY_ID,
  PINNED_IDS,
  PINNED_SHORT_LABELS,
  PROTOCOL_DATASET_VERSION,
  ProtocolDocument,
  ProtocolSeverity,
} from '../../data/protocolSchema';
import {
  searchProtocols,
  getClosestProtocolSuggestions,
  getHighlightSegments,
} from '../../utils/protocolSearch';
import { userService } from '../../services/userService';
import { SeverityBadge } from './SeverityBadge';
import { ProtocolDocumentView } from './ProtocolDocumentView';
import {
  useAppLanguage,
  UI_TRANSLATIONS,
  LOCALIZED_PINNED_PROTOCOLS,
} from '../../utils/languageStore';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

interface LibraryViewProps {
  onGuideLive: (protocolId: InjuryProtocolId) => void;
  onOpenChat?: (query?: string) => void;
  onTriggerEscalation?: (reason?: string) => void;
  onOpenCrowd?: () => void;
  onOpenRadar?: () => void;
  initialProtocolSlug?: string | null;
  onProtocolSlugChange?: (slug: string | null) => void;
}

const SEVERITY_ORDER: Record<ProtocolSeverity, number> = {
  Emergency: 0,
  Urgent: 1,
  Moderate: 2,
  Mild: 3,
};

const ALL_SEVERITIES: ProtocolSeverity[] = ['Emergency', 'Urgent', 'Moderate', 'Mild'];

const PINNED_ICONS: Record<string, React.ElementType> = {
  'cardiac-arrest-aed': HeartPulse,
  'child-choking': Wind,
  'amputation': Droplets,
  'suspected-stroke-fast': Brain,
  'anaphylaxis-full': ShieldAlert,
  'first-time-seizure': Activity,
  'drowning': Waves,
  'snake-bite': AlertTriangle,
};

export const LibraryView: React.FC<LibraryViewProps> = ({
  onGuideLive,
  onOpenChat,
  onTriggerEscalation,
  onOpenCrowd,
  onOpenRadar,
  initialProtocolSlug,
  onProtocolSlugChange,
}) => {
  const { lang } = useAppLanguage();
  const copy = UI_TRANSLATIONS[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'saved' | 'recent'>('all');
  const [selectedSeverities, setSelectedSeverities] = useState<ProtocolSeverity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [severityPopoverOpen, setSeverityPopoverOpen] = useState(false);

  const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(() => {
    if (initialProtocolSlug && PROTOCOL_BY_ID[initialProtocolSlug]) {
      return initialProtocolSlug;
    }
    return null;
  });

  const [activeRowIndex, setActiveRowIndex] = useState<number>(-1);

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() =>
    userService.getBookmarks()
  );
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    userService.getRecents()
  );

  const searchInputRef = useRef<HTMLInputElement>(null);
  const severityMenuRef = useRef<HTMLDivElement>(null);

  // Sync with external initialProtocolSlug changes (e.g., browser back/forward on /protocols/:slug)
  useEffect(() => {
    if (initialProtocolSlug && PROTOCOL_BY_ID[initialProtocolSlug]) {
      setSelectedProtocolId(initialProtocolSlug);
      userService.addRecentView(initialProtocolSlug);
      setRecentIds(userService.getRecents());
    } else if (initialProtocolSlug === null) {
      setSelectedProtocolId(null);
    }
  }, [initialProtocolSlug]);

  // Close severity popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (severityMenuRef.current && !severityMenuRef.current.contains(e.target as Node)) {
        setSeverityPopoverOpen(false);
      }
    };
    if (severityPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [severityPopoverOpen]);

  // Global "/" shortcut to focus search when on Library list view
  useEffect(() => {
    if (selectedProtocolId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.key === '/' && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProtocolId]);

  const handleOpenProtocol = (protocolId: string) => {
    const proto = PROTOCOL_BY_ID[protocolId];
    if (!proto) return;
    setSelectedProtocolId(proto.id);
    userService.addRecentView(proto.id);
    setRecentIds(userService.getRecents());
    if (onProtocolSlugChange) {
      onProtocolSlugChange(proto.slug);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseProtocol = () => {
    setSelectedProtocolId(null);
    if (onProtocolSlugChange) {
      onProtocolSlugChange(null);
    }
  };

  const handleToggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    userService.toggleBookmark(id);
    setBookmarkedIds(userService.getBookmarks());
  };

  const toggleSeverityFilter = (sev: ProtocolSeverity) => {
    setSelectedSeverities((prev) =>
      prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSeverities([]);
    setSelectedCategory('All');
    setActiveTab('all');
    setActiveRowIndex(-1);
  };

  // Distinct categories sorted with highest emergency count first
  const categoriesWithCounts = useMemo(() => {
    const map = new Map<string, { total: number; emergencyCount: number }>();
    for (const p of PROTOCOLS) {
      const cur = map.get(p.category) || { total: 0, emergencyCount: 0 };
      cur.total += 1;
      if (p.severity === 'Emergency') cur.emergencyCount += 1;
      map.set(p.category, cur);
    }
    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => {
        if (b.emergencyCount !== a.emergencyCount) return b.emergencyCount - a.emergencyCount;
        return a.name.localeCompare(b.name);
      });
  }, []);

  // Base subset from All / Saved / Recent tab + severity + category filter
  const filteredBaseProtocols = useMemo(() => {
    return PROTOCOLS.filter((p) => {
      if (activeTab === 'saved' && !bookmarkedIds.includes(p.id)) return false;
      if (activeTab === 'recent' && !recentIds.includes(p.id)) return false;
      if (selectedSeverities.length > 0 && !selectedSeverities.includes(p.severity)) return false;
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      return true;
    });
  }, [activeTab, bookmarkedIds, recentIds, selectedSeverities, selectedCategory]);

  // Search results (instant <= 50ms local index)
  const searchResults = useMemo(() => {
    return searchProtocols(searchQuery, filteredBaseProtocols);
  }, [searchQuery, filteredBaseProtocols]);

  // Flat list of protocols for keyboard arrow navigation
  const flatVisibleProtocols = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults.map((r) => r.protocol);
    }
    if (activeTab === 'recent') {
      // Preserve recent order when browsing recent tab without search
      return recentIds
        .map((id) => filteredBaseProtocols.find((p) => p.id === id))
        .filter((p): p is ProtocolDocument => Boolean(p));
    }
    // Grouped by category order, then severity (Emergency -> Urgent -> Moderate -> Mild), then alphabetical
    const list: ProtocolDocument[] = [];
    for (const cat of categoriesWithCounts) {
      const inCat = filteredBaseProtocols
        .filter((p) => p.category === cat.name)
        .sort((a, b) => {
          const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
          if (sevDiff !== 0) return sevDiff;
          return a.title.localeCompare(b.title);
        });
      list.push(...inCat);
    }
    return list;
  }, [searchQuery, searchResults, activeTab, recentIds, filteredBaseProtocols, categoriesWithCounts]);

  // Grouped categories for browse view
  const groupedCategories = useMemo(() => {
    return categoriesWithCounts
      .map((cat) => {
        const items = filteredBaseProtocols
          .filter((p) => p.category === cat.name)
          .sort((a, b) => {
            const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
            if (sevDiff !== 0) return sevDiff;
            return a.title.localeCompare(b.title);
          });
        return {
          category: cat.name,
          items,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [categoriesWithCounts, filteredBaseProtocols]);

  const pinnedProtocols = useMemo(() => {
    return PINNED_IDS.map((id) => PROTOCOL_BY_ID[id]).filter(
      (p): p is ProtocolDocument => Boolean(p)
    );
  }, []);

  const closestSuggestions = useMemo(() => {
    if (flatVisibleProtocols.length > 0 || !searchQuery.trim()) return [];
    return getClosestProtocolSuggestions(searchQuery, 4);
  }, [flatVisibleProtocols.length, searchQuery]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedSeverities.length > 0 ||
    selectedCategory !== 'All' ||
    activeTab !== 'all';

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (searchQuery) {
        e.preventDefault();
        setSearchQuery('');
        setActiveRowIndex(-1);
      } else {
        searchInputRef.current?.blur();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatVisibleProtocols.length > 0) {
        setActiveRowIndex((prev) =>
          prev < flatVisibleProtocols.length - 1 ? prev + 1 : 0
        );
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatVisibleProtocols.length > 0) {
        setActiveRowIndex((prev) =>
          prev > 0 ? prev - 1 : flatVisibleProtocols.length - 1
        );
      }
      return;
    }

    if (e.key === 'Enter' && flatVisibleProtocols.length > 0) {
      e.preventDefault();
      const targetIdx = activeRowIndex >= 0 ? activeRowIndex : 0;
      const targetProto = flatVisibleProtocols[targetIdx];
      if (targetProto) {
        handleOpenProtocol(targetProto.id);
      }
    }
  };

  const renderHighlightedText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const segments = getHighlightSegments(text, searchQuery);
    return segments.map((seg, idx) =>
      seg.matched ? (
        <mark
          key={idx}
          className="bg-amber-200/80 dark:bg-amber-500/40 text-ink rounded-xs px-0.5 font-semibold"
        >
          {seg.text}
        </mark>
      ) : (
        <React.Fragment key={idx}>{seg.text}</React.Fragment>
      )
    );
  };

  // Render full Protocol Document View when a protocol is selected
  if (selectedProtocolId && PROTOCOL_BY_ID[selectedProtocolId]) {
    const activeProtocol = PROTOCOL_BY_ID[selectedProtocolId];
    return (
      <ProtocolDocumentView
        protocol={activeProtocol}
        isBookmarked={bookmarkedIds.includes(activeProtocol.id)}
        onToggleBookmark={(id) => handleToggleBookmark(id)}
        onBack={handleCloseProtocol}
        onSelectProtocol={handleOpenProtocol}
        onOpenChat={onOpenChat}
        onGuideLive={onGuideLive}
        onTriggerEscalation={onTriggerEscalation}
        onOpenCrowd={onOpenCrowd}
        onOpenRadar={onOpenRadar}
      />
    );
  }

  const renderProtocolRow = (proto: ProtocolDocument, flatIdx: number) => {
    const isBookmarked = bookmarkedIds.includes(proto.id);
    const isKeyboardSelected = activeRowIndex === flatIdx;

    return (
      <div
        key={proto.id}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 64px' }}
        className={`group relative flex items-center justify-between min-h-[60px] rounded-xl border transition-colors ${
          isKeyboardSelected
            ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
            : 'border-border bg-surface hover:border-primary/40 hover:bg-base/40'
        }`}
      >
        {/* Main Row Link */}
        <button
          type="button"
          onClick={() => handleOpenProtocol(proto.id)}
          className="flex-1 min-w-0 min-h-[60px] py-2.5 pl-3.5 pr-2 flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={proto.severity} size="sm" />
              <span className="text-[15px] font-bold text-ink group-hover:text-primary transition-colors leading-snug">
                {renderHighlightedText(
                  LOCALIZED_PINNED_PROTOCOLS[lang]?.[proto.id]?.shortTitle || proto.title
                )}
              </span>
              {!proto.offlineCached && (
                <span className="inline-flex items-center gap-1 min-h-[20px] px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 whitespace-nowrap">
                  <WifiOff className="w-3 h-3 shrink-0" />
                  <span>Online only</span>
                </span>
              )}
            </div>
            <p className="text-xs text-ink-muted leading-snug">
              {renderHighlightedText(
                LOCALIZED_PINNED_PROTOCOLS[lang]?.[proto.id]?.subtitle || proto.summary
              )}
            </p>
          </div>

          <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>

        {/* Separate 44px Bookmark Target on Right */}
        <button
          type="button"
          onClick={(e) => handleToggleBookmark(proto.id, e)}
          aria-label={
            isBookmarked
              ? `Remove ${proto.title} from saved protocols`
              : `Save ${proto.title} protocol`
          }
          title={isBookmarked ? 'Saved' : 'Save protocol'}
          className="min-w-[44px] min-h-[44px] mr-1 flex items-center justify-center rounded-lg text-ink-muted hover:text-primary hover:bg-base transition-colors cursor-pointer shrink-0"
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-4 h-4 text-primary fill-primary/15" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 overflow-x-hidden">
      {/* =================================================================== */}
      {/* B1. COMPACT HEADER + SINGLE STATUS CHIP + SEARCH BAR                */}
      {/* =================================================================== */}
      <header className="space-y-3 min-w-0">
        {/* 5-Language Voice & Protocol Toggle Bar (English · हिंदी · বাংলা · தமிழ் · मराठी) */}
        <LanguageSwitcher variant="bar" showVoicePreview />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              {copy.libraryTitle}
            </h1>

            {/* Single Offline Status Chip (B1 & B6) */}
            <span className="inline-flex items-center gap-1.5 min-h-[28px] max-w-full px-2.5 sm:px-3 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800 text-xs font-semibold truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span className="truncate">
                {copy.libraryOfflineBadge}
              </span>
            </span>
          </div>

          {/* B7: "Ask AI Guardian" as a teal secondary button in the header area */}
          {onOpenChat && (
            <button
              type="button"
              onClick={() => onOpenChat()}
              className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl border border-primary bg-primary/10 hover:bg-primary/15 text-primary text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Bot className="w-4 h-4 shrink-0" />
              <span>{copy.askAiGuardian}</span>
            </button>
          )}
        </div>

        {/* C. Search Bar (role="search", "/" focus, Esc clear, Arrow keys + Enter) */}
        <div role="search" aria-label="First-aid protocols search" className="relative">
          <Search
            className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveRowIndex(0);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder={copy.searchProtocolsPlaceholder}
            aria-label={copy.searchProtocolsPlaceholder}
            className="w-full min-h-[46px] pl-10 pr-10 sm:pr-20 py-2.5 rounded-xl bg-surface border border-border text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveRowIndex(-1);
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="min-h-[30px] px-2 py-1 rounded-md text-xs font-semibold text-ink-muted hover:text-ink hover:bg-base cursor-pointer"
              >
                Clear
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded border border-border bg-base text-[11px] font-mono text-ink-muted select-none">
                /
              </kbd>
            )}
          </div>
          {/* Screen-reader live result count */}
          <div aria-live="polite" className="sr-only">
            {flatVisibleProtocols.length}{' '}
            {flatVisibleProtocols.length === 1 ? 'protocol' : 'protocols'} shown
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* B2. "START HERE" ROW (8 Critical Emergency Tiles, min-h-[88px])     */}
      {/* =================================================================== */}
      {!searchQuery.trim() && activeTab === 'all' && selectedSeverities.length === 0 && selectedCategory === 'All' && (
        <section aria-labelledby="start-here-heading" className="space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="start-here-heading"
              className="text-xs font-extrabold uppercase tracking-wider text-ink-muted"
            >
              {copy.startHereLifeThreatening}
            </h2>
            <span className="text-xs text-ink-muted hidden sm:inline">
              {copy.doThisNow}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 w-full min-w-0">
            {pinnedProtocols.map((proto) => {
              const IconComp = PINNED_ICONS[proto.id] || AlertTriangle;
              const locPinned = LOCALIZED_PINNED_PROTOCOLS[lang]?.[proto.id];
              const baseLabels = PINNED_SHORT_LABELS[proto.id] || {
                shortTitle: proto.title,
                subtitle: proto.summary,
              };
              const shortTitle = locPinned?.shortTitle || baseLabels.shortTitle;
              const subtitle = locPinned?.subtitle || baseLabels.subtitle;

              return (
                <button
                  key={proto.id}
                  type="button"
                  onClick={() => handleOpenProtocol(proto.id)}
                  className="group min-h-[92px] w-full min-w-0 overflow-hidden p-2.5 sm:p-3 rounded-xl border border-border bg-surface hover:border-primary/50 hover:bg-base/50 text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <IconComp className="w-4 h-4" />
                    </span>

                    {proto.call112 && (
                      <span className="inline-flex items-center gap-1 min-h-[20px] sm:min-h-[22px] px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold uppercase tracking-tight sm:tracking-wider bg-[#DC2626] text-white whitespace-nowrap shrink-0 max-w-full truncate">
                        <PhoneCall className="w-2.5 h-2.5 shrink-0" />
                        <span className="sm:hidden">112</span>
                        <span className="hidden sm:inline">{copy.call112First}</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 w-full min-w-0">
                    <div className="text-[13px] sm:text-sm font-extrabold text-ink group-hover:text-primary transition-colors leading-snug break-words">
                      {shortTitle}
                    </div>
                    <div className="text-[11px] text-ink-muted leading-snug line-clamp-2 break-words">
                      {subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* B4. SINGLE FILTER ROW (Segmented All/Saved/Recent + Severity + Cat) */}
      {/* =================================================================== */}
      <div className="space-y-2.5 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-border/80 min-w-0">
          {/* Segmented Control: All / Saved / Recent */}
          <div
            role="tablist"
            aria-label="Protocol view filter"
            className="inline-flex items-center rounded-xl bg-surface border border-border p-1 max-w-full overflow-x-auto no-scrollbar"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
              className={`min-h-[36px] px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-primary text-white'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              All ({PROTOCOLS.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'saved'}
              onClick={() => setActiveTab('saved')}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'saved'
                  ? 'bg-primary text-white'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 shrink-0" />
              <span>Saved ({bookmarkedIds.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'recent'}
              onClick={() => setActiveTab('recent')}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'recent'
                  ? 'bg-primary text-white'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Recent ({recentIds.length})</span>
            </button>
          </div>

          {/* Right Controls: Multi-Select Severity Popover + Category Jump Menu */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
            {/* Multi-select Severity Popover */}
            <div ref={severityMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setSeverityPopoverOpen(!severityPopoverOpen)}
                aria-expanded={severityPopoverOpen}
                className={`inline-flex items-center gap-1.5 min-h-[38px] px-3 sm:px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedSeverities.length > 0
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface text-ink hover:bg-base'
                }`}
              >
                <Filter className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Severity
                  {selectedSeverities.length > 0 ? ` (${selectedSeverities.length})` : ''}
                </span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              </button>

              {severityPopoverOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-56 max-w-[calc(100vw-28px)] rounded-xl border border-border bg-surface shadow-lg p-2 z-30 space-y-1">
                  <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    Filter by severity
                  </div>
                  {ALL_SEVERITIES.map((sev) => {
                    const checked = selectedSeverities.includes(sev);
                    return (
                      <label
                        key={sev}
                        className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg hover:bg-base cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSeverityFilter(sev)}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          <SeverityBadge severity={sev} size="sm" />
                        </div>
                        <span className="text-ink-muted font-mono text-[11px]">
                          {PROTOCOLS.filter((p) => p.severity === sev).length}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category Jump / Filter Select Menu */}
            <div className="relative flex-1 sm:flex-initial min-w-0">
              <select
                aria-label="Jump to category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto max-w-full min-h-[38px] pl-3 pr-8 py-1.5 rounded-xl border border-border bg-surface text-xs font-bold text-ink focus:outline-none focus:border-primary cursor-pointer truncate"
              >
                <option value="All">All categories (12)</option>
                {categoriesWithCounts.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name} ({cat.total})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters Removable Chips + "Clear all" */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-xs font-semibold text-ink-muted">
              Showing {flatVisibleProtocols.length} of {PROTOCOLS.length}:
            </span>

            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1.5 min-h-[28px] px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-semibold text-ink hover:bg-base cursor-pointer whitespace-nowrap"
              >
                <span>Search: &ldquo;{searchQuery.trim()}&rdquo;</span>
                <X className="w-3.5 h-3.5 text-ink-muted" />
              </button>
            )}

            {selectedCategory !== 'All' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className="inline-flex items-center gap-1.5 min-h-[28px] px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-semibold text-ink hover:bg-base cursor-pointer whitespace-nowrap"
              >
                <span>Category: {selectedCategory}</span>
                <X className="w-3.5 h-3.5 text-ink-muted" />
              </button>
            )}

            {selectedSeverities.map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => toggleSeverityFilter(sev)}
                className="inline-flex items-center gap-1.5 min-h-[28px] px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-semibold text-ink hover:bg-base cursor-pointer whitespace-nowrap"
              >
                <span>Severity: {sev}</span>
                <X className="w-3.5 h-3.5 text-ink-muted" />
              </button>
            ))}

            <button
              type="button"
              onClick={clearAllFilters}
              className="min-h-[28px] px-2.5 py-1 text-xs font-bold text-primary hover:underline cursor-pointer whitespace-nowrap"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* B3 & B8. BROWSE LIST / SEARCH RESULTS / EMPTY STATES                */}
      {/* =================================================================== */}
      {flatVisibleProtocols.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-4">
          {activeTab === 'saved' && bookmarkedIds.length === 0 ? (
            <>
              <div className="mx-auto w-10 h-10 rounded-xl bg-base border border-border flex items-center justify-center text-ink-muted">
                <Bookmark className="w-5 h-5" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h2 className="text-base font-bold text-ink">No saved protocols yet</h2>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Tap the bookmark icon on the right side of any protocol row to pin it here for instant access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer"
              >
                Browse all {PROTOCOLS.length} protocols
              </button>
            </>
          ) : activeTab === 'recent' && recentIds.length === 0 ? (
            <>
              <div className="mx-auto w-10 h-10 rounded-xl bg-base border border-border flex items-center justify-center text-ink-muted">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h2 className="text-base font-bold text-ink">No recently viewed protocols</h2>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Protocols you open will appear here automatically so you can return to them in one tap.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer"
              >
                Browse all {PROTOCOLS.length} protocols
              </button>
            </>
          ) : (
            <>
              <div className="space-y-1 max-w-md mx-auto">
                <h2 className="text-base font-bold text-ink">
                  No exact match for &ldquo;{searchQuery || 'selected filters'}&rdquo;
                </h2>
                <p className="text-xs text-ink-muted">
                  Try a broader symptom or open one of the closest matching protocols below:
                </p>
              </div>

              {closestSuggestions.length > 0 && (
                <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-1">
                  {closestSuggestions.map((sug, idx) => renderProtocolRow(sug, idx))}
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-xl border border-border bg-base hover:bg-border/40 text-xs font-bold text-ink cursor-pointer"
                >
                  Clear filters
                </button>

                {onOpenChat && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenChat(
                        searchQuery.trim()
                          ? `Emergency first-aid guidance needed for: ${searchQuery.trim()}`
                          : undefined
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl border border-primary bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold cursor-pointer"
                  >
                    <Bot className="w-4 h-4 shrink-0" />
                    <span>Ask AI Guardian</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ) : searchQuery.trim() ? (
        /* Ranked Search Results List */
        <section aria-label="Search results" className="space-y-2.5">
          <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 gap-2.5">
            {searchResults.map((res, idx) => renderProtocolRow(res.protocol, idx))}
          </div>
        </section>
      ) : (
        /* Categorized Compact List with Sticky Headings (B3) */
        <div className="space-y-6">
          {groupedCategories.map((group) => {
            return (
              <section
                key={group.category}
                aria-labelledby={`cat-heading-${group.category}`}
                className="space-y-2"
              >
                <div className="sticky top-16 z-10 bg-base/95 backdrop-blur-xs py-2 border-b border-border flex items-center justify-between">
                  <h2
                    id={`cat-heading-${group.category}`}
                    className="text-sm font-extrabold text-ink tracking-tight"
                  >
                    {group.category}
                  </h2>
                  <span className="text-xs font-semibold text-ink-muted">
                    {group.items.length}{' '}
                    {group.items.length === 1 ? 'protocol' : 'protocols'}
                  </span>
                </div>

                <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 gap-2">
                  {group.items.map((proto) => {
                    const flatIdx = flatVisibleProtocols.findIndex((p) => p.id === proto.id);
                    return renderProtocolRow(proto, flatIdx);
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
