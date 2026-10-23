import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  AlertOctagon, 
  Zap, 
  X, 
  Clock, 
  Droplet, 
  Waves, 
  Flame, 
  Activity, 
  Shield, 
  PhoneCall, 
  Layers, 
  Hand, 
  HeartPulse, 
  Snowflake, 
  ArrowDown, 
  Lock, 
  Package, 
  CreditCard, 
  Home, 
  CupSoda, 
  Wind, 
  Watch, 
  AlertTriangle,
  Bot,
  MessageSquare
} from 'lucide-react';
import { LibraryEntry, InjuryProtocolId } from '../../types';
import { LIBRARY_ENTRIES } from '../../data/libraryData';
import { userService } from '../../services/userService';

interface LibraryViewProps {
  onGuideLive: (protocolId: InjuryProtocolId) => void;
  onOpenChat?: (initialQuery?: string) => void;
}

// Icon mapper for step illustrations
const StepIconMapper: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Droplet,
  Waves,
  Flame,
  Activity,
  Shield,
  PhoneCall,
  Layers,
  Hand,
  HeartPulse,
  Snowflake,
  ArrowDown,
  Lock,
  Package,
  CreditCard,
  Home,
  CupSoda,
  Wind,
  Watch,
  AlertTriangle,
  ShieldAlert
};

export const LibraryView: React.FC<LibraryViewProps> = ({ onGuideLive, onOpenChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedEntry, setSelectedEntry] = useState<LibraryEntry | null>(null);

  // Bookmarks & Recently Viewed backed by userService
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => userService.getBookmarks());
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => userService.getRecents());

  useEffect(() => {
    const unsub = userService.subscribe(() => {
      setBookmarkedIds(userService.getBookmarks());
      setRecentlyViewedIds(userService.getRecents());
    });
    return unsub;
  }, []);

  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks' | 'recent'>('all');

  const handleToggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    userService.toggleBookmark(id);
    setBookmarkedIds(userService.getBookmarks());
  };

  const handleOpenEntry = (entry: LibraryEntry) => {
    setSelectedEntry(entry);
    userService.addRecentView(entry.id);
    setRecentlyViewedIds(userService.getRecents());
  };

  // Filter entries - All 12 First-Aid Categories
  const categories = [
    'All',
    'Bleeding & Wounds',
    'Burns',
    'Breathing & Airway',
    'Cardiac',
    'Trauma & Musculoskeletal',
    'Environmental',
    'Poisoning & Ingestion',
    'Allergic Reactions',
    'Neurological',
    'Metabolic / Diabetic',
    'Dental',
    'Pediatric-Specific'
  ];

  const filteredEntries = LIBRARY_ENTRIES.filter((entry) => {
    if (activeTab === 'bookmarks' && !bookmarkedIds.includes(entry.id)) return false;
    if (activeTab === 'recent' && !recentlyViewedIds.includes(entry.id)) return false;

    if (selectedCategory !== 'All') {
      const matchExact = entry.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchPrefix = entry.category.toLowerCase().includes(selectedCategory.toLowerCase());
      if (!matchExact && !matchPrefix) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = entry.title.toLowerCase().includes(q);
      const matchWhat = entry.whatIsIt.toLowerCase().includes(q);
      const matchCategory = entry.category.toLowerCase().includes(q);
      const matchQuick = entry.quickReminder.toLowerCase().includes(q);
      return matchTitle || matchWhat || matchCategory || matchQuick;
    }

    return true;
  });

  const getSeverityBadgeClass = (severity: LibraryEntry['severityBadge']) => {
    switch (severity) {
      case 'Emergency':
        return 'bg-alert text-white';
      case 'Urgent':
        return 'bg-accent text-ink';
      case 'Moderate':
        return 'bg-info/20 text-info font-bold';
      case 'Mild':
      default:
        return 'bg-success/15 text-success font-bold';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header & Offline Sync Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-ink">
              First-Aid Library
            </h1>
            <span className="inline-flex items-center text-[11px] font-semibold text-success bg-success/10 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Available Offline
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Simple first-aid guides you can read anytime, even with no internet connection.
          </p>
        </div>

        {/* Tab Filters: All / Bookmarked / Recent */}
        <div className="grid grid-cols-3 sm:inline-flex p-1 rounded-xl bg-surface border border-border w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold btn-press transition-all text-center ${
              activeTab === 'all' ? 'bg-primary text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            All Entries
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold btn-press transition-all ${
              activeTab === 'bookmarks' ? 'bg-primary text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Bookmark className="w-3 h-3 shrink-0" />
            <span>Saved ({bookmarkedIds.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold btn-press transition-all ${
              activeTab === 'recent' ? 'bg-primary text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Clock className="w-3 h-3 shrink-0" />
            <span>Recent</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar + AI Prompt Action */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-ink-muted" strokeWidth={1.75} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 100+ conditions (e.g. burn, cut, fracture, asthma, CPR)..."
            style={{ color: 'var(--app-ink)' }}
            className="w-full pl-11 pr-16 py-3 rounded-xl border border-border bg-surface text-ink text-[#12211D] dark:text-white text-sm placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-xs font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-xs text-ink-muted hover:text-ink font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {onOpenChat && (
          <button
            onClick={() => onOpenChat(searchQuery || 'Tell me about first-aid treatment for common injuries')}
            className="inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-accent to-[#E08A35] text-ink font-bold text-xs shadow-xs hover:brightness-105 btn-press shrink-0"
            title="Ask Sanjeevani AI Guardian"
          >
            <Bot className="w-4 h-4 text-ink" />
            <span>Ask AI Guardian</span>
          </button>
        )}
      </div>

      {/* Category Pills with counts and smooth horizontal scroll */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 text-xs no-scrollbar">
        {categories.map((cat) => {
          const count = cat === 'All' 
            ? LIBRARY_ENTRIES.length 
            : LIBRARY_ENTRIES.filter((e) => e.category.toLowerCase() === cat.toLowerCase() || e.category.toLowerCase().includes(cat.toLowerCase())).length;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap btn-press transition-all flex items-center space-x-1.5 ${
                selectedCategory === cat
                  ? 'bg-ink text-surface font-bold shadow-xs'
                  : 'bg-surface border border-border text-ink-muted hover:text-ink'
              }`}
            >
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-base text-ink-muted'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Library Cards (Adaptive 1 -> 2 -> 3 -> 4 columns) */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-ink">No library entries found.</p>
          <p className="text-xs text-ink-muted">Try clearing your search or switching categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEntries.map((entry) => {
            const isBookmarked = bookmarkedIds.includes(entry.id);
            return (
              <div
                key={entry.id}
                onClick={() => handleOpenEntry(entry)}
                className="group cursor-pointer rounded-xl border border-border bg-surface p-5 hover:border-primary/40 hover:shadow-md transition-all btn-press flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold ${getSeverityBadgeClass(entry.severityBadge)}`}>
                        {entry.severityBadge}
                      </span>
                      <span className="text-[11px] font-medium text-ink-muted">
                        {entry.category}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Offline sync indicator */}
                      <span className="h-2 w-2 rounded-full bg-success" title="Available offline" />
                      {/* Bookmark button */}
                      <button
                        onClick={(e) => handleToggleBookmark(entry.id, e)}
                        className="p-1 rounded-md text-ink-muted hover:text-primary transition-colors"
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark entry'}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="h-4 w-4 text-accent fill-accent/20" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-ink group-hover:text-primary transition-colors">
                    {entry.title}
                  </h3>
                  <p className="mt-1 text-xs text-ink-muted line-clamp-2 leading-relaxed">
                    {entry.whatIsIt}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border/70 flex items-center justify-between text-xs font-bold text-primary">
                  <span>View full protocol</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================== */}
      {/* DETAILED ENTRY MODAL / SHEET */}
      {/* ========================================== */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-surface border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${getSeverityBadgeClass(selectedEntry.severityBadge)}`}>
                    {selectedEntry.severityBadge}
                  </span>
                  <span className="text-xs font-semibold text-ink-muted">
                    {selectedEntry.category}
                  </span>
                  <span className="flex items-center text-xs text-success font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-success mr-1" />
                    Offline Ready
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-ink">
                  {selectedEntry.title}
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleBookmark(selectedEntry.id)}
                  className="p-2 rounded-xl border border-border hover:bg-base text-ink btn-press"
                  title="Bookmark"
                >
                  {bookmarkedIds.includes(selectedEntry.id) ? (
                    <BookmarkCheck className="h-5 w-5 text-accent fill-accent/20" />
                  ) : (
                    <Bookmark className="h-5 w-5 text-ink-muted" />
                  )}
                </button>

                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-2 rounded-xl border border-border hover:bg-base text-ink btn-press"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-left">
              {/* What is it */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  What is it
                </span>
                <p className="text-sm text-ink leading-relaxed">
                  {selectedEntry.whatIsIt}
                </p>
              </div>

              {/* Steps (Icon + Text, not text alone as required by spec) */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Action Steps
                </span>
                <div className="space-y-2.5">
                  {selectedEntry.steps.map((step, idx) => {
                    const IconComp = StepIconMapper[step.icon] || CheckCircle2;
                    return (
                      <div
                        key={idx}
                        className="flex items-start space-x-3.5 p-3.5 rounded-xl bg-base border border-border"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <IconComp className="h-5 w-5" strokeWidth={1.75} />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-ink">
                            {idx + 1}. {step.action}
                          </h4>
                          <p className="text-xs text-ink-muted leading-relaxed">
                            {step.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* What NOT to Do */}
              <div className="rounded-2xl bg-alert/5 border border-alert/20 p-4 space-y-2">
                <div className="flex items-center space-x-2 text-alert">
                  <ShieldAlert className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">What NOT to Do</span>
                </div>
                <ul className="space-y-1 text-xs text-ink">
                  {selectedEntry.whatNotToDo.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-alert font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* When to Get Help */}
              <div className="rounded-2xl bg-base border border-border p-4 space-y-2">
                <div className="flex items-center space-x-2 text-ink">
                  <AlertOctagon className="h-4 w-4 text-alert" />
                  <span className="text-xs font-bold uppercase tracking-wider">When to Get Help</span>
                </div>
                <ul className="space-y-1 text-xs text-ink-muted">
                  {selectedEntry.whenToGetHelp.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Reminder Box */}
              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-primary block mb-1">
                  Quick Reminder
                </span>
                <p className="text-xs font-semibold text-ink leading-relaxed">
                  "{selectedEntry.quickReminder}"
                </p>
              </div>
            </div>

            {/* Modal Bottom CTA: "Ask AI Guardian" + "Guide me live instead" */}
            <div className="p-4 sm:p-6 border-t border-border bg-surface flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-ink-muted">
                Need immediate clinical advice or AI triage?
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                {onOpenChat && (
                  <button
                    onClick={() => {
                      const topic = selectedEntry.title;
                      setSelectedEntry(null);
                      onOpenChat(`Please provide practical first-aid advice for "${topic}", including what to do step-by-step and what mistakes to avoid.`);
                    }}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 btn-press"
                  >
                    <Bot className="h-4 w-4" />
                    <span>Ask AI Guardian</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    const protocolId = selectedEntry.linkedProtocolId;
                    setSelectedEntry(null);
                    onGuideLive(protocolId);
                  }}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-dark btn-press"
                >
                  <Zap className="h-4 w-4 text-accent" />
                  <span>Start Live Guide</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
