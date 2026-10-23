import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  PhoneCall, 
  User as UserIcon, 
  LogOut, 
  Award, 
  MapPin,
  Camera,
  Sparkles,
  QrCode
} from 'lucide-react';
import { Destination } from '../../types';
import { useAuth } from '../../firebase/authContext';
import { userService, UserStats } from '../../services/userService';
import { getUserLocationInfo, UserLocationInfo } from '../../services/placesRoutesService';
import { LocationPickerModal } from './LocationPickerModal';

interface HeaderProps {
  currentDestination: Destination;
  onOpenMenu: () => void;
  onSelectDestination: (dest: Destination) => void;
  onTriggerEscalation: (reason?: string) => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onOpenQRScanner?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDestination,
  onOpenMenu,
  onSelectDestination,
  onTriggerEscalation,
  onOpenAuth,
  onOpenQRScanner
}) => {
  const { user, userProfile, logout } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>(() => userService.getStats());
  const [locationInfo, setLocationInfo] = useState<UserLocationInfo | null>(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  const fetchLocation = () => {
    getUserLocationInfo().then(setLocationInfo);
  };

  useEffect(() => {
    fetchLocation();

    window.addEventListener('sanjeevani_location_updated', fetchLocation);
    window.addEventListener('sanjeevani_location_cleared', fetchLocation);

    const unsub = userService.subscribe((updated) => {
      setUserStats(updated);
    });

    return () => {
      unsub();
      window.removeEventListener('sanjeevani_location_updated', fetchLocation);
      window.removeEventListener('sanjeevani_location_cleared', fetchLocation);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full px-2.5 sm:px-6 lg:px-8 pt-2.5 sm:pt-3 pb-1 transition-all duration-300">
      <div className="mx-auto flex h-13 sm:h-16 max-w-7xl items-center justify-between gap-2 lg:gap-3 xl:gap-4 px-3 sm:px-5 lg:px-6 fluid-dock elevation-3 rounded-full">
        
        {/* Left: Brand Mark + Wordmark */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0 min-w-0">
          <button
            onClick={() => onSelectDestination('home')}
            className="group flex items-center space-x-2 sm:space-x-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full transition-transform min-w-0 cursor-pointer"
            aria-label="Sanjeevani Home"
          >
            {/* Official Logo Emblem */}
            <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-white/95 dark:bg-surface/90 border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden transition-all group-hover:scale-105 p-1 shrink-0 backdrop-blur-md">
              <img src="/sanjeevani-logo.png" alt="Sanjeevani Logo" className="h-full w-full object-contain" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-display-italic text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none truncate">
                Sanjeevani
              </span>
              <span className="text-[7.5px] sm:text-[9px] font-black tracking-wider text-amber-800 dark:text-accent uppercase mt-0.5 truncate">
                First-Aid Intelligence
              </span>
            </div>
          </button>
        </div>

        {/* Center: Clean Desktop Navigation Pill Strip (Zero-collision layout) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 min-w-0 overflow-hidden px-1.5 py-1 rounded-full bg-slate-100/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 shrink">
          <button
            onClick={() => onSelectDestination('home')}
            className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              currentDestination === 'home'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-800 dark:text-slate-200 hover:text-primary hover:bg-white/80 dark:hover:bg-base/80'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onSelectDestination('chat')}
            className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              currentDestination === 'chat'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-800 dark:text-slate-200 hover:text-primary hover:bg-white/80 dark:hover:bg-base/80'
            }`}
          >
            AI Guardian
          </button>
          <button
            onClick={() => onSelectDestination('camera')}
            className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              currentDestination === 'camera'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-800 dark:text-slate-200 hover:text-primary hover:bg-white/80 dark:hover:bg-base/80'
            }`}
          >
            AI Camera
          </button>
          <button
            onClick={() => onSelectDestination('mythbuster')}
            className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              currentDestination === 'mythbuster'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-800 dark:text-slate-200 hover:text-primary hover:bg-white/80 dark:hover:bg-base/80'
            }`}
          >
            MythBuster
          </button>
          <button
            onClick={() => onSelectDestination('medicines')}
            className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              currentDestination === 'medicines'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-800 dark:text-slate-200 hover:text-primary hover:bg-white/80 dark:hover:bg-base/80'
            }`}
          >
            <span className="2xl:hidden">Cheap Meds</span>
            <span className="hidden 2xl:inline">Cheap Medicines</span>
          </button>
          <button
            onClick={() => onSelectDestination('library')}
            className={`hidden xl:inline-flex px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              currentDestination === 'library'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-800 dark:text-slate-200 hover:text-primary hover:bg-white/80 dark:hover:bg-base/80'
            }`}
          >
            Protocols
          </button>
        </nav>

        {/* Right: Adaptive Actions (QR + Location + User + 112 SOS + Menu) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* In-App QR Scanner Quick Trigger */}
          <button
            onClick={() => onOpenQRScanner ? onOpenQRScanner() : onSelectDestination('camera')}
            className="flex h-8 w-8 sm:h-9 sm:w-auto items-center justify-center sm:space-x-1.5 sm:px-3 rounded-full bg-emerald-500/12 hover:bg-emerald-500/20 border border-emerald-600/30 text-xs font-extrabold text-emerald-800 dark:text-emerald-300 transition-colors cursor-pointer shrink-0"
            title="Scan Sanjeevani QR Code"
            aria-label="Scan Sanjeevani QR Code"
          >
            <QrCode className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline lg:hidden xl:inline whitespace-nowrap">Scan QR</span>
          </button>

          {/* Subtle Location Pill */}
          <button
            onClick={() => setIsLocationPickerOpen(true)}
            className="hidden md:flex h-9 items-center space-x-1.5 px-2.5 xl:px-3 rounded-full bg-slate-100/90 dark:bg-base/80 hover:bg-slate-200/70 dark:hover:bg-base border border-slate-200/90 dark:border-border/70 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
            title="Doorstep GPS Location"
          >
            <MapPin className="w-3.5 h-3.5 text-primary dark:text-emerald-400 shrink-0" />
            <span className="truncate max-w-[72px] 2xl:max-w-[105px]">
              {locationInfo?.locality || locationInfo?.city || 'Set Location'}
            </span>
          </button>

          {/* User Sign In / Profile */}
          {user ? (
            <div className="hidden sm:flex items-center shrink-0">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-tr from-accent to-[#F9D08B] text-slate-950 flex items-center justify-center font-black text-xs shadow-xs border border-white/60">
                {user.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'U'}
              </div>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('signin')}
              className="hidden md:inline-flex h-9 items-center space-x-1.5 px-2.5 2xl:px-3 rounded-full border border-slate-200/90 dark:border-border bg-white dark:bg-surface hover:bg-slate-50 dark:hover:bg-base text-slate-800 dark:text-slate-200 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Sign In"
            >
              <UserIcon className="w-3.5 h-3.5 text-primary dark:text-emerald-400 shrink-0" />
              <span className="hidden 2xl:inline">Sign In</span>
            </button>
          )}

          {/* Emergency SOS 112 */}
          <button
            onClick={() => onTriggerEscalation('Direct SOS Alert')}
            className="btn-fluid btn-fluid-danger flex h-8 sm:h-9 items-center space-x-1 sm:space-x-1.5 px-3 sm:px-3.5 text-[11px] sm:text-xs font-extrabold rounded-full text-white shadow-md whitespace-nowrap cursor-pointer shrink-0"
            title="Immediate 112 Emergency Dispatch"
          >
            <PhoneCall className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" strokeWidth={2.2} />
            <span>112 SOS</span>
          </button>

          {/* Clean Hamburger Menu Button */}
          <button
            onClick={onOpenMenu}
            className="btn-fluid flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200/90 dark:border-border/80 bg-white dark:bg-surface text-slate-800 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-base focus:outline-none shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Horizontal Quick-Access Navigation Bar (Hidden on lg+ desktop) */}
      <div className="lg:hidden mx-auto max-w-7xl mt-1.5 px-1">
        <div className="flex items-center md:justify-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1">
          {[
            { id: 'home' as Destination, label: 'Home' },
            { id: 'chat' as Destination, label: 'AI Guardian' },
            { id: 'camera' as Destination, label: 'AI Camera' },
            { id: 'mythbuster' as Destination, label: 'MythBuster' },
            { id: 'medicines' as Destination, label: 'Cheap Meds' },
            { id: 'library' as Destination, label: 'Protocols' },
            { id: 'practice' as Destination, label: 'CPR Drills' },
            { id: 'handoff' as Destination, label: 'SBAR QR' }
          ].map((item) => {
            const active = currentDestination === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectDestination(item.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  active
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white/90 dark:bg-surface/90 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-border/80'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onLocationChanged={(fresh) => {
          setLocationInfo(fresh);
        }}
      />
    </header>
  );
};
