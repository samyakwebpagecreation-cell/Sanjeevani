import React, { useEffect } from 'react';
import {
  X,
  Home,
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Sun,
  Moon,
  Phone,
  ShieldCheck,
  ExternalLink,
  Bot,
  FileText,
  Users,
  MapPin,
  Pill,
  Camera,
  Sparkles,
  QrCode,
  User as UserIcon
} from 'lucide-react';
import { Destination } from '../../types';
import { useAuth } from '../../firebase/authContext';
import { drillService } from '../../services/drillService';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentDestination: Destination;
  onSelectDestination: (dest: Destination) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onOpenCrowd?: () => void;
  onOpenRadar?: () => void;
  onOpenQRScanner?: () => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onClose,
  currentDestination,
  onSelectDestination,
  isDarkMode,
  onToggleTheme,
  onOpenAuth,
  onOpenCrowd,
  onOpenRadar,
  onOpenQRScanner
}) => {
  const [, setDrillTick] = React.useState(0);

  useEffect(() => {
    return drillService.subscribe(() => setDrillTick((t) => t + 1));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const { user, emailVerified } = useAuth();
  const hasRegisteredSchool = Boolean(
    user &&
      !user.isAnonymous &&
      emailVerified &&
      drillService.getUserMemberships(user.uid).length > 0
  );

  if (!isOpen) return null;

  const destinations: {
    id: Destination;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }[] = [
    {
      id: 'home',
      label: user ? 'Dashboard' : 'Home',
      desc: 'Overview and Sanjeevani tools',
      icon: user ? LayoutDashboard : Home
    },
    {
      id: 'chat',
      label: 'AI Guardian',
      desc: 'Step-by-step emergency triage and voice guide',
      icon: Bot
    },
    {
      id: 'camera',
      label: 'AI Camera',
      desc: 'Wound scan, CPR chest guide, and pill scanner',
      icon: Camera
    },
    {
      id: 'mythbuster',
      label: 'MythBuster',
      desc: 'Verify first-aid beliefs and medication rules',
      icon: Sparkles
    },
    {
      id: 'medicines',
      label: 'Medicines',
      desc: 'Find Jan Aushadhi generic equivalents',
      icon: Pill
    },
    {
      id: 'library',
      label: 'Protocols',
      desc: 'Offline first-aid protocols for common injuries',
      icon: BookOpen
    },
    {
      id: 'handoff',
      label: 'Ambulance Report',
      desc: 'SBAR handover docket and QR for paramedics',
      icon: FileText
    },
    ...(hasRegisteredSchool
      ? [
          {
            id: 'practice' as Destination,
            label: 'School Drills',
            desc: 'Classroom CPR rhythm and school readiness drills',
            icon: GraduationCap
          }
        ]
      : [])
  ];

  const handleNavigate = (dest: Destination) => {
    onSelectDestination(dest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/35 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-over Drawer (Right Side) */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-sm border-l border-border bg-surface p-5 sm:p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Top Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-xl bg-primary-soft text-primary shrink-0">
                  <ShieldCheck className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <span className="text-[18px] font-bold text-ink leading-snug block truncate">
                    Sanjeevani
                  </span>
                  <p className="text-[14px] text-ink-muted leading-snug">Menu & tools</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-border bg-surface text-ink-muted hover:text-ink hover:bg-base cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close menu"
              >
                <X className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            {/* Primary Navigation Links */}
            <div className="mt-5 space-y-1.5">
              <p className="px-2 text-[14px] font-semibold text-ink-muted leading-snug">
                Navigation
              </p>
              {destinations.map((item) => {
                const Icon = item.icon;
                const isActive = currentDestination === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full min-h-[52px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-primary-soft text-primary font-bold'
                        : 'text-ink hover:bg-base'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg shrink-0 ${
                          isActive ? 'bg-primary text-white' : 'bg-base text-primary border border-border'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold leading-snug text-ink">
                          {item.label}
                        </div>
                        <p className="text-[14px] text-ink-muted leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions (Scan QR, Crowd Squad, Nearby ER, Sign In) */}
            <div className="mt-6 pt-5 border-t border-border space-y-2">
              <p className="px-2 text-[14px] font-semibold text-ink-muted leading-snug">
                Quick actions
              </p>

              {onOpenQRScanner && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQRScanner();
                  }}
                  className="w-full min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border bg-base hover:bg-primary-soft/50 text-ink transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <QrCode className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    <span className="text-[15px] font-semibold leading-snug">Scan QR code</span>
                  </div>
                </button>
              )}

              {onOpenCrowd && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCrowd();
                  }}
                  className="w-full min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border bg-base hover:bg-primary-soft/50 text-ink transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Users className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    <span className="text-[15px] font-semibold leading-snug">Bystander squad QR</span>
                  </div>
                </button>
              )}

              {onOpenRadar && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRadar();
                  }}
                  className="w-full min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border bg-base hover:bg-primary-soft/50 text-ink transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MapPin className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    <span className="text-[15px] font-semibold leading-snug">Nearby hospitals & AEDs</span>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth('signin');
                }}
                className="w-full min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border bg-surface hover:bg-base text-ink transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserIcon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span className="text-[15px] font-semibold leading-snug">
                    {user ? user.displayName || 'Signed in' : 'Sign in'}
                  </span>
                </div>
              </button>
            </div>

            {/* Emergency Dispatch Line */}
            <div className="mt-6 rounded-2xl border border-alert/30 bg-red-50/70 dark:bg-red-950/30 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-alert">
                <Phone className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                <span className="text-[14px] font-bold leading-snug">Emergency dispatch</span>
              </div>
              <p className="text-[14px] text-ink-muted leading-snug">
                If someone is unconscious, not breathing, or bleeding heavily:
              </p>
              <div className="pt-1 flex gap-2">
                <a
                  href="tel:112"
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-alert hover:bg-alert-dark text-white text-[14px] font-bold leading-snug whitespace-nowrap"
                >
                  <span>Call 112</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Controls: Theme Toggle */}
          <div className="pt-5 border-t border-border mt-6">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[14px] font-semibold text-ink leading-snug">Appearance</span>
              <button
                type="button"
                onClick={onToggleTheme}
                className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border bg-base text-ink text-[14px] font-semibold leading-snug hover:border-primary/40 cursor-pointer"
                title="Toggle theme"
              >
                {isDarkMode ? (
                  <>
                    <Moon className="h-4 w-4 text-primary shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    <span>Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 text-primary shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    <span>Light</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
