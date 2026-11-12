import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  PhoneCall,
  User as UserIcon,
  MapPin,
  QrCode,
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  MoreHorizontal
} from 'lucide-react';
import { Destination } from '../../types';
import { useAuth } from '../../firebase/authContext';
import { userService } from '../../services/userService';
import { drillService } from '../../services/drillService';
import { getUserLocationInfo, UserLocationInfo } from '../../services/placesRoutesService';
import { LocationPickerModal } from './LocationPickerModal';
import { LanguageSwitcher } from './LanguageSwitcher';

export interface AppHeaderProps {
  mode?: 'hub' | 'guardian';
  currentDestination?: Destination;
  onOpenMenu?: () => void;
  onSelectDestination?: (dest: Destination) => void;
  onTriggerEscalation: (reason?: string) => void;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
  onOpenQRScanner?: () => void;
  onBackToHome?: () => void;
  // Guardian-specific controls
  title?: string;
  subtitle?: string;
  isOfflineEngine?: boolean;
  autoTTS?: boolean;
  onToggleAutoTTS?: () => void;
  onResetConversation?: () => void;
  locationInfoOverride?: UserLocationInfo | null;
  onOpenLocationPicker?: () => void;
  runningTimerText?: string | null;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  mode = 'hub',
  currentDestination = 'home',
  onOpenMenu,
  onSelectDestination,
  onTriggerEscalation,
  onOpenAuth,
  onOpenQRScanner,
  onBackToHome,
  title = 'Sanjeevani AI Guardian',
  isOfflineEngine = false,
  autoTTS = false,
  onToggleAutoTTS,
  onResetConversation,
  locationInfoOverride,
  onOpenLocationPicker,
  runningTimerText
}) => {
  const { user, emailVerified } = useAuth();
  const [, setDrillTick] = useState(0);
  const [locationInfo, setLocationInfo] = useState<UserLocationInfo | null>(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return drillService.subscribe(() => setDrillTick((t) => t + 1));
  }, []);

  const hasRegisteredSchool = Boolean(
    user &&
      !user.isAnonymous &&
      emailVerified &&
      drillService.getUserMemberships(user.uid).length > 0
  );

  const effectiveLocation =
    locationInfoOverride !== undefined ? locationInfoOverride : locationInfo;
  const isOffline = isOfflineEngine || !isBrowserOnline;

  const fetchLocation = () => {
    getUserLocationInfo().then(setLocationInfo);
  };

  useEffect(() => {
    if (mode !== 'guardian') return;
    fetchLocation();

    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('sanjeevani_location_updated', fetchLocation);
    window.addEventListener('sanjeevani_location_cleared', fetchLocation);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsub = userService.subscribe(() => {});

    return () => {
      unsub();
      window.removeEventListener('sanjeevani_location_updated', fetchLocation);
      window.removeEventListener('sanjeevani_location_cleared', fetchLocation);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [mode]);

  // Close "⋯" menu on outside click or Escape
  useEffect(() => {
    if (!isMoreOpen) {
      setConfirmingReset(false);
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
        setConfirmingReset(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreOpen(false);
        setConfirmingReset(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMoreOpen]);

  // Global Power-User Keyboard Shortcut Listener:
  // Cmd/Ctrl + G -> Launch AI Guardian
  // Cmd/Ctrl + E -> Open Emergency Chat
  useEffect(() => {
    if (!onSelectDestination) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'g' || key === 'e') {
        e.preventDefault();
        onSelectDestination('chat');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onSelectDestination]);

  // Hub Desktop Navigation: [AI Guardian · AI Camera · MythBuster · Medicines · Protocols]
  // "School Drills" appears in the top bar only after signing in, verifying email, and registering/linking a school.
  const navItems: { id: Destination; label: string }[] = [
    { id: 'chat', label: 'AI Guardian' },
    { id: 'camera', label: 'AI Camera' },
    { id: 'mythbuster', label: 'MythBuster' },
    { id: 'medicines', label: 'Medicines' },
    { id: 'library', label: 'Protocols' },
    ...(hasRegisteredSchool
      ? ([{ id: 'practice', label: 'School Drills' }] as {
          id: Destination;
          label: string;
        }[])
      : [])
  ];

  const handleBack = () => {
    if (onBackToHome) {
      onBackToHome();
    } else if (onSelectDestination) {
      onSelectDestination('home');
    }
  };

  const handleLocationClick = () => {
    if (onOpenLocationPicker) {
      onOpenLocationPicker();
    } else {
      setIsLocationPickerOpen(true);
    }
  };

  /* ==========================================================================
   * GUARDIAN MODE (AI Guardian Screen — Subtraction Pass)
   * Left: "← Hub", Title with "Online" status dot, and the ONE location chip.
   * Right: Voice on/off icon, "⋯" menu (Reset with confirm popover), red 112 SOS.
   * ========================================================================== */
  if (mode === 'guardian') {
    const locationLabel =
      effectiveLocation?.locality ||
      effectiveLocation?.city ||
      effectiveLocation?.formattedAddress ||
      'Set location';

    return (
      <header className="sticky top-0 z-40 w-full max-w-full min-h-[52px] max-h-[56px] py-1.5 bg-surface border-b border-border shrink-0 flex items-center overflow-x-clip">
        <div className="w-full max-w-full mx-auto px-2.5 sm:px-5 flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
          {/* Left: ← Hub + Single-Line Title + Desktop Status Chip */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
            {(onBackToHome || onSelectDestination) && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex min-h-[38px] sm:min-h-[40px] items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-base hover:bg-primary-soft border border-border text-[13px] sm:text-[14px] font-bold leading-snug text-ink transition-colors duration-150 cursor-pointer shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title="Back to Hub"
                aria-label="Back to Hub"
              >
                <ArrowLeft className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Hub</span>
              </button>
            )}

            <h1 className="text-[14px] sm:text-[16px] font-bold leading-snug tracking-tight text-ink whitespace-nowrap truncate min-w-0">
              <span className="sm:hidden">AI Guardian</span>
              <span className="hidden sm:inline">{title}</span>
            </h1>

            <span
              className="hidden md:inline-flex min-h-[28px] items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-base border border-border text-[13px] font-medium leading-snug text-ink-muted shrink-0 whitespace-nowrap"
              aria-label={isOffline ? 'Status: Offline' : 'Status: Online'}
            >
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full shrink-0 ${
                  isOffline ? 'bg-slate-400' : 'bg-emerald-600'
                }`}
              />
              <span>{isOffline ? 'Offline' : 'Online'}</span>
            </span>

            {runningTimerText && (
              <span className="hidden xs:inline text-[13px] sm:text-[14px] font-mono font-semibold leading-snug text-ink-muted tabular-nums shrink-0 whitespace-nowrap">
                {runningTimerText}
              </span>
            )}
          </div>

          {/* Right: Language Switcher + Location Chip + Voice On/Off Icon + "⋯" Menu + Red 112 SOS */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <LanguageSwitcher variant="dropdown" size="sm" />

            {/* Single GPS Location Chip: Icon-only below 1100px width, label visible >= 1100px */}
            <button
              type="button"
              onClick={handleLocationClick}
              className="inline-flex min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] items-center justify-center gap-1.5 px-2 sm:px-2.5 min-[1100px]:px-3 py-1.5 rounded-xl bg-base hover:bg-primary-soft border border-border text-[14px] font-semibold leading-snug text-ink-muted hover:text-ink transition-colors duration-150 cursor-pointer max-w-[200px] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title={`Emergency location: ${locationLabel}. Tap to update.`}
              aria-label={`Emergency location: ${locationLabel}. Tap to update.`}
            >
              <MapPin className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span className="hidden min-[1100px]:inline truncate">{locationLabel}</span>
            </button>

            {onToggleAutoTTS && (
              <button
                type="button"
                onClick={onToggleAutoTTS}
                aria-pressed={autoTTS}
                aria-label={
                  autoTTS ? 'Voice narration on. Tap to mute.' : 'Voice narration off. Tap to enable.'
                }
                title={
                  autoTTS ? 'Voice narration: On (Tap to mute)' : 'Voice narration: Off (Tap to enable)'
                }
                className={`inline-flex min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] items-center justify-center rounded-xl border transition-colors duration-150 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  autoTTS
                    ? 'bg-primary-soft text-primary border-primary/40'
                    : 'bg-surface hover:bg-base text-ink-muted hover:text-ink border-border'
                }`}
              >
                {autoTTS ? (
                  <Volume2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
              </button>
            )}

            {/* "⋯" Menu with Reset Confirm Popover */}
            <div className="relative shrink-0" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setIsMoreOpen((prev) => !prev)}
                aria-expanded={isMoreOpen}
                aria-haspopup="menu"
                aria-label="More options"
                title="More options"
                className="inline-flex min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] items-center justify-center rounded-xl border border-border bg-surface hover:bg-base text-ink-muted hover:text-ink transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <MoreHorizontal className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>

              {isMoreOpen && (
                <div
                  role="menu"
                  aria-label="Conversation options"
                  className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] rounded-2xl bg-surface border border-border shadow-lg p-2 z-50"
                >
                  {!confirmingReset ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setConfirmingReset(true)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-[15px] font-semibold leading-snug text-ink hover:bg-base transition-colors duration-150 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
                      <span>Reset conversation…</span>
                    </button>
                  ) : (
                    <div className="p-2 space-y-2.5" role="group" aria-label="Confirm reset">
                      <p className="text-[14px] font-semibold text-ink leading-snug">
                        Clear the current emergency conversation and start fresh?
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmingReset(false)}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-base hover:bg-border/40 border border-border text-[14px] font-semibold leading-snug text-ink cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreOpen(false);
                            setConfirmingReset(false);
                            onResetConversation?.();
                          }}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-[14px] font-semibold leading-snug cursor-pointer"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Always-Visible Red 112 SOS Button */}
            <button
              type="button"
              data-action="trigger-112-sos"
              onClick={() =>
                onTriggerEscalation('Direct emergency 112 button from Sanjeevani AI Guardian')
              }
              className="inline-flex min-h-[38px] sm:min-h-[40px] items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-alert hover:bg-alert-dark text-white text-[13px] sm:text-[14px] font-bold leading-snug shadow-xs transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alert focus-visible:ring-offset-2"
              title="Call 112 Emergency SOS"
              aria-label="Call 112 Emergency SOS"
            >
              <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true" />
              <span className="xs:hidden">112</span>
              <span className="hidden xs:inline">112 SOS</span>
            </button>
          </div>
        </div>

        {!onOpenLocationPicker && (
          <LocationPickerModal
            isOpen={isLocationPickerOpen}
            onClose={() => setIsLocationPickerOpen(false)}
            onLocationChanged={(fresh) => {
              setLocationInfo(fresh);
            }}
          />
        )}
      </header>
    );
  }

  /* ==========================================================================
   * HUB MODE (Shared Header Across Landing Page, MythBuster, Medicines, Library)
   * - Desktop (>= 1100px):
   *   Left: [logo] + [AI Guardian · AI Camera · MythBuster · Medicines · Protocols]
   *   Right: [Scan QR (icon button with tooltip)] + [Sign in] + [112 SOS]
   *   No hamburger at >= 1100px.
   * - Below 1100px:
   *   Left: [logo]
   *   Right: [112 SOS] + [menu]
   * - No "Home" nav item or "<- Hub" button (logo links home).
   * - No location chip (location belongs on AI Guardian only).
   * - Height <= 64px, zero overlap from 320px to 1920px.
   * ========================================================================== */
  return (
    <header className="sticky top-0 z-40 w-full min-h-[56px] max-h-[64px] bg-surface/95 backdrop-blur-md border-b border-border transition-colors duration-150 flex items-center">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 lg:px-8 py-2">
        {/* Left: Logo (shrink-0, links home) + Desktop Navigation (>= 1100px) */}
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <button
            type="button"
            onClick={() => onSelectDestination?.('home')}
            className="group flex items-center gap-2 sm:gap-2.5 text-left rounded-xl py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer shrink-0"
            aria-label="Sanjeevani Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-base border border-border p-1 shrink-0">
              <img
                src="/sanjeevani-logo.png"
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-[17px] sm:text-[20px] font-extrabold leading-snug tracking-tight text-ink whitespace-nowrap">
              Sanjeevani
            </span>
          </button>

          {onSelectDestination && (
            <nav
              aria-label="Primary Navigation"
              className="hidden min-[1100px]:flex items-center gap-1 shrink-0"
            >
              {navItems.map((item) => {
                const active = currentDestination === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectDestination(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-[14px] leading-snug transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-primary-soft text-primary font-bold'
                        : 'text-ink-muted font-semibold hover:text-ink hover:bg-base'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right: Language Switcher + Desktop [Scan QR icon] + [Sign in] + [112 SOS], Mobile [112 SOS] + [menu] */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <LanguageSwitcher variant="dropdown" size="md" />

          {/* Scan QR: icon button with tooltip at >= 1100px */}
          {(onOpenQRScanner || onSelectDestination) && (
            <button
              type="button"
              onClick={() => (onOpenQRScanner ? onOpenQRScanner() : onSelectDestination?.('camera'))}
              className="hidden min-[1100px]:inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-base hover:bg-primary-soft border border-border text-ink-muted hover:text-primary transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Scan Sanjeevani QR Code"
              aria-label="Scan Sanjeevani QR Code"
            >
              <QrCode className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            </button>
          )}

          {/* Sign in / User profile & Dashboard Switcher at >= 1100px */}
          {user ? (
            <button
              type="button"
              onClick={() => onOpenAuth?.('signin')}
              className="hidden min-[1100px]:inline-flex min-h-[40px] items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-soft hover:bg-primary-soft/80 text-primary border border-primary/25 font-bold text-[14px] leading-snug cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Account & Dashboard Switcher"
              aria-label="Account & Dashboard Switcher"
            >
              <UserIcon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span>
                {user.displayName
                  ? user.displayName.split(' ')[0]
                  : user.isAnonymous
                  ? 'Student'
                  : 'Dashboards'}
              </span>
            </button>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                onClick={() => onOpenAuth('signin')}
                className="hidden min-[1100px]:inline-flex min-h-[40px] items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-base text-ink text-[14px] font-semibold leading-snug transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <UserIcon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Sign in</span>
              </button>
            )
          )}

          {/* Always-Visible Red 112 SOS Button */}
          <button
            type="button"
            data-action="trigger-112-sos"
            onClick={() => onTriggerEscalation('Direct SOS Alert')}
            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl bg-alert hover:bg-alert-dark text-white text-[14px] font-bold leading-snug shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alert focus-visible:ring-offset-2"
            title="Immediate 112 Emergency Dispatch"
            aria-label="Call 112 Emergency SOS"
          >
            <PhoneCall className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>112 SOS</span>
          </button>

          {/* Hamburger Menu Button: ONLY shown below 1100px */}
          {onOpenMenu && (
            <button
              type="button"
              onClick={onOpenMenu}
              className="inline-flex min-[1100px]:hidden min-h-[42px] min-w-[42px] items-center justify-center rounded-xl border border-border bg-surface hover:bg-base text-ink transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Open navigation menu"
              title="Open menu"
            >
              <Menu className="h-5 w-5 shrink-0" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
