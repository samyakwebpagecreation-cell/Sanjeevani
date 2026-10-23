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
  QrCode
} from 'lucide-react';
import { Destination } from '../../types';
import { useAuth } from '../../firebase/authContext';

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
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
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

  const { user } = useAuth();

  if (!isOpen) return null;

  const destinations: { id: Destination; label: string; desc: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; badge?: string }[] = [
    {
      id: 'home',
      label: user ? 'Dashboard' : 'Home',
      desc: user ? 'Your progress, daily quests & guardian profile' : 'Overview & story of Sanjeevani',
      icon: user ? LayoutDashboard : Home
    },
    {
      id: 'chat',
      label: 'AI First-Aid Helper',
      desc: 'Instant step-by-step guidance & voice triage',
      icon: Bot,
      badge: 'AI Guardian'
    },
    {
      id: 'camera',
      label: 'AI Medical Camera',
      desc: 'Wound scan, CPR chest guide & pill scanner',
      icon: Camera,
      badge: '3 Roles'
    },
    {
      id: 'handoff',
      label: 'Ambulance Report',
      desc: 'Emergency vitals, notes & audio report for paramedics',
      icon: FileText,
      badge: 'QR Handoff'
    },
    {
      id: 'medicines',
      label: 'Cheap Medicines',
      desc: 'Save 50%-90% on generic & Jan Aushadhi medicines',
      icon: Pill,
      badge: 'Save 90%'
    },
    {
      id: 'mythbuster',
      label: 'Reality Check Engine',
      desc: 'First-aid mythbuster, when to give meds & cheap generic finder',
      icon: Sparkles,
      badge: 'New'
    },
    {
      id: 'practice',
      label: 'Practice & Quizzes',
      desc: 'Emergency practice & CPR rhythm drills',
      icon: GraduationCap
    },
    {
      id: 'library',
      label: 'Offline First-Aid Guide',
      desc: 'Emergency steps for all injuries without internet',
      icon: BookOpen
    }
  ];

  const handleNavigate = (dest: Destination) => {
    onSelectDestination(dest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden transition-opacity">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-ink/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Slide-over Drawer (Right Side) */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-sm border-l border-border bg-surface/95 backdrop-blur-xl p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
          {/* Top: Header & Close */}
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-border">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <span className="font-display-italic text-lg font-bold text-ink">
                    Sanjeevani
                  </span>
                  <p className="text-[11px] text-ink-muted leading-tight">Navigation & Controls</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-ink-muted hover:text-ink hover:bg-base btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            {/* Main Navigation Links */}
            <div className="mt-6 space-y-1.5">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted/80">
                Destinations
              </p>
              {destinations.map((item) => {
                const Icon = item.icon;
                const isActive = currentDestination === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all btn-press ${
                      isActive 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-ink hover:bg-base'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary'}`}>
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-ink'}`}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${
                              isActive ? 'bg-white/20 text-white' : 'bg-accent/20 text-ink'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${isActive ? 'text-white/80' : 'text-ink-muted'}`}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Field Incident Breakthrough Tools */}
            <div className="mt-6 px-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2 px-1">
                Emergency Incident Tools
              </div>
              <div className="space-y-2">
                {onOpenQRScanner && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenQRScanner();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-ink transition-colors btn-press text-xs font-semibold group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-ink group-hover:text-emerald-600 transition-colors">
                          Scan QR Docket / Squad
                        </div>
                        <div className="text-[10px] text-ink-muted">
                          Optical camera scanner & calling data
                        </div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                      Scan
                    </span>
                  </button>
                )}

                {onOpenCrowd && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCrowd();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-ink transition-colors btn-press text-xs font-semibold group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-ink group-hover:text-primary transition-colors">
                          Crowd Help QR
                        </div>
                        <div className="text-[10px] text-ink-muted">
                          Organize bystanders with instant task QR
                        </div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-primary/20 text-primary">
                      QR Tasks
                    </span>
                  </button>
                )}

                {onOpenRadar && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenRadar();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-accent/20 bg-accent/5 hover:bg-accent/10 text-ink transition-colors btn-press text-xs font-semibold group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                          Nearby Hospitals & AEDs
                        </div>
                        <div className="text-[10px] text-ink-muted">
                          Find closest ER & defibrillator with ETA
                        </div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-accent/20 text-accent">
                      Hospital ER
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Account / Sign In Button */}
            <div className="mt-4 px-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth('signin');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-base text-ink hover:border-primary/40 btn-press text-xs font-semibold"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 text-ink">
                    <ShieldCheck className="w-4 h-4 text-accent" />
                  </div>
                  <span>Account & Cloud Sync</span>
                </div>
                <span className="text-[10px] font-bold text-primary">Sign In / Join</span>
              </button>
            </div>

            {/* Quick Emergency Contacts */}
            <div className="mt-8 rounded-2xl border border-alert/20 bg-alert/5 p-4">
              <div className="flex items-center space-x-2 text-alert">
                <Phone className="h-4 w-4" strokeWidth={2} />
                <span className="text-xs font-bold uppercase tracking-wider">Direct Emergency Line</span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                If someone is unconscious, bleeding profusely, or having trouble breathing:
              </p>
              <div className="mt-3 flex gap-2">
                <a
                  href="tel:112"
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-alert text-white text-xs font-bold btn-press shadow-xs hover:bg-alert/90"
                >
                  <span>Call 112</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="tel:911"
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border border-alert text-alert text-xs font-bold btn-press hover:bg-alert/10"
                >
                  <span>Call 911</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Controls: Theme Toggle & Version */}
          <div className="pt-6 border-t border-border mt-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-ink">Appearance</span>
                <p className="text-[11px] text-ink-muted">Light Mode is Default</p>
              </div>

              <button
                onClick={onToggleTheme}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-border bg-base text-ink text-xs font-medium btn-press hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary"
                title="Toggle Theme"
              >
                {isDarkMode ? (
                  <>
                    <Moon className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
                    <span>Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
                    <span>Light (Default)</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-ink-muted">
              <span>Sanjeevani v2.0.0</span>
              <span>Calm Authority</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
