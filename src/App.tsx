import React, { useState, useEffect } from 'react';
import { Destination, InjuryProtocolId } from './types';
import { AuthProvider, useAuth } from './firebase/authContext';
import { Header } from './components/common/Header';
import { HamburgerMenu } from './components/common/HamburgerMenu';
import { ScreenshotFab } from './components/common/ScreenshotFab';
import { EscalationModal } from './components/common/EscalationModal';
import { AuthModal } from './components/auth/AuthModal';
import { SplashScreen } from './components/common/SplashScreen';

// Breakthrough Modals
import { CrowdCommanderModal } from './components/crowd/CrowdCommanderModal';
import { EmergencyRadarModal } from './components/radar/EmergencyRadarModal';
import { ParamedicHandoverModal } from './components/respond/ParamedicHandoverModal';
import { AcousticGaspDetector } from './components/diagnostics/AcousticGaspDetector';

// Views
import { LandingPage } from './components/landing/LandingPage';
import { ParamedicHandoffView } from './components/handoff/ParamedicHandoffView';
import { LibraryView } from './components/library/LibraryView';
import { PracticeView } from './components/practice/PracticeView';
import { ChatView } from './components/chat/ChatView';
import { FloatingChatWidget } from './components/chat/FloatingChatWidget';
import { SquadJoinView } from './components/crowd/SquadJoinView';
import { CheapMedicinesView } from './components/medicines/CheapMedicinesView';
import { AIMedicalCameraView } from './components/camera/AIMedicalCameraView';
import { MythBusterView } from './components/mythbuster/MythBusterView';
import { DocketMarkdownView } from './components/handoff/DocketMarkdownView';
import { InAppQRScannerModal } from './components/camera/InAppQRScannerModal';

function AppContent() {
  const { user } = useAuth();
  const [currentDestination, setCurrentDestination] = useState<Destination>('home');
  const [chatInitialQuery, setChatInitialQuery] = useState<string | undefined>(undefined);
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Bystander Squad Join PWA Route Check (?squad=SQUAD-XXXX or /squad/SQUAD-XXXX)
  const [activeSquadJoinId, setActiveSquadJoinId] = useState<string | null>(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const squadParam = searchParams.get('squad');
      if (squadParam) return squadParam;

      if (window.location.pathname.startsWith('/squad/')) {
        const parts = window.location.pathname.split('/squad/');
        if (parts[1]) return parts[1].replace(/\/$/, '');
      }
      return null;
    } catch {
      return null;
    }
  });

  // Paramedic Docket Direct Route Check (?docket=TRAUMA-XXXX or /docket/TRAUMA-XXXX)
  const [activeDocketId, setActiveDocketId] = useState<string | null>(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const docketParam = searchParams.get('docket');
      if (docketParam) return docketParam;

      if (window.location.pathname.startsWith('/docket/')) {
        const parts = window.location.pathname.split('/docket/');
        if (parts[1]) return parts[1].replace(/\/$/, '');
      }
      return null;
    } catch {
      return null;
    }
  });

  // In-App QR Scanner Modal State
  const [showQRScannerModal, setShowQRScannerModal] = useState<boolean>(false);

  // Clean Hamburger Menu Drawer State
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Firebase Auth Modal State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Breakthrough Field Tool Modals
  const [showRadarModal, setShowRadarModal] = useState(false);
  const [showCrowdModal, setShowCrowdModal] = useState(false);
  const [showDocketModal, setShowDocketModal] = useState(false);
  const [showGaspModal, setShowGaspModal] = useState(false);

  // STRICT LIGHT MODE AS DEFAULT
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sanjeevani_theme');
      return saved === 'dark';
    } catch {
      return false; // Default: Light mode
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sanjeevani_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sanjeevani_theme', 'light');
    }
  }, [isDarkMode]);

  // Global Scroll Progress Bar State (0 to 100)
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) {
        setScrollProgress(0);
      } else {
        setScrollProgress(Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentDestination]);

  // Site-Wide Scroll Reveal Engine across LandingPage & all Website Views
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -36px 0px'
      }
    );

    const scanAndObserve = () => {
      // 1. Explicitly marked .scroll-reveal and .scroll-stagger elements
      const explicitTargets = document.querySelectorAll('.scroll-reveal, .scroll-stagger');
      explicitTargets.forEach((el) => {
        if (!el.classList.contains('is-visible')) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.92) {
            el.classList.add('is-visible');
          } else {
            observer.observe(el);
          }
        }
      });

      // 2. Automatically enhance sections and cards across other website views
      const autoSections = document.querySelectorAll('main section, main .grid > div');
      autoSections.forEach((el) => {
        if (
          !el.classList.contains('scroll-reveal') &&
          !el.parentElement?.classList.contains('scroll-stagger') &&
          !el.hasAttribute('data-scroll-bound')
        ) {
          el.setAttribute('data-scroll-bound', 'true');
          const rect = el.getBoundingClientRect();
          // Only animate elements that start below the initial viewport fold
          if (rect.top > window.innerHeight * 0.92) {
            el.classList.add('scroll-reveal');
            observer.observe(el);
          }
        }
      });
    };

    const timer = window.setTimeout(scanAndObserve, 60);

    const mutationObserver = new MutationObserver(() => {
      scanAndObserve();
    });
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mutationObserver.observe(mainEl, { childList: true, subtree: true });
    }

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [currentDestination, showSplash]);

  // Escalation Hard-Stop Override State
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [escalationReason, setEscalationReason] = useState<string | undefined>(undefined);

  const handleTriggerEscalation = (reason?: string) => {
    setEscalationReason(reason || 'Emergency override triggered');
    setEscalationOpen(true);
  };

  const handleDismissEscalation = () => {
    setEscalationOpen(false);
    setEscalationReason(undefined);
  };

  const handleStartRespond = (protocolId?: string) => {
    const query = protocolId 
      ? `Emergency: Guide me immediately through the ${protocolId} first-aid protocol step-by-step.`
      : 'Emergency: I need immediate first-aid instructions.';
    handleOpenChat(query);
  };

  const handleGuideLive = (protocolId: InjuryProtocolId) => {
    handleStartRespond(protocolId);
  };

  const handleOpenChat = (query?: string) => {
    setChatInitialQuery(query);
    setCurrentDestination('chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  if (activeSquadJoinId) {
    return (
      <SquadJoinView
        squadId={activeSquadJoinId}
        onExit={() => {
          setActiveSquadJoinId(null);
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch {}
        }}
      />
    );
  }

  if (activeDocketId) {
    return (
      <DocketMarkdownView
        docketId={activeDocketId}
        onExit={() => {
          setActiveDocketId(null);
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch {}
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-base text-ink transition-colors duration-200">
      {/* Top Site-Wide Smooth Scroll Progress Indicator */}
      {currentDestination !== 'chat' && currentDestination !== 'camera' && (
        <div className="fixed top-0 left-0 right-0 h-[3px] z-[60] pointer-events-none bg-transparent">
          <div
            style={{ width: `${scrollProgress}%` }}
            className="h-full bg-gradient-to-r from-[#0E5A50] via-[#10B981] to-[#F0A85B] transition-[width] duration-150 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          />
        </div>
      )}

      {/* 3-Second Animated Medical Splash Screen */}
      {showSplash && (
        <SplashScreen
          durationMs={3000}
          onFinish={() => setShowSplash(false)}
        />
      )}

      {/* Streamlined Emergency Status Header (Hidden in full-screen Chat & Camera) */}
      {currentDestination !== 'chat' && currentDestination !== 'camera' && (
        <Header
          currentDestination={currentDestination}
          onOpenMenu={() => setIsMenuOpen(true)}
          onSelectDestination={(dest) => {
            setCurrentDestination(dest);
            if (dest !== 'chat') setChatInitialQuery(undefined);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onTriggerEscalation={handleTriggerEscalation}
          onOpenAuth={handleOpenAuth}
          onOpenQRScanner={() => setShowQRScannerModal(true)}
        />
      )}

      {/* Unified Command Drawer (Hamburger Menu) */}
      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentDestination={currentDestination}
        onSelectDestination={(dest) => {
          setCurrentDestination(dest);
          if (dest !== 'chat') setChatInitialQuery(undefined);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onOpenAuth={handleOpenAuth}
        onOpenCrowd={() => setShowCrowdModal(true)}
        onOpenRadar={() => setShowRadarModal(true)}
        onOpenQRScanner={() => setShowQRScannerModal(true)}
      />

      {/* Main Content Area with Smooth View Transitions */}
      <main key={currentDestination} className="flex-1 page-view-enter">
        {currentDestination === 'home' && (
          <LandingPage
            onStartRespond={handleStartRespond}
            onSelectDestination={(dest) => {
              setCurrentDestination(dest);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAuth={handleOpenAuth}
            onOpenCrowdModal={() => setShowCrowdModal(true)}
            onOpenRadar={() => setShowRadarModal(true)}
          />
        )}

        {currentDestination === 'camera' && (
          <AIMedicalCameraView
            onBackToHome={() => {
              setCurrentDestination('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenChat={handleOpenChat}
            onTriggerEscalation={handleTriggerEscalation}
            onSelectDestination={(dest) => {
              setCurrentDestination(dest);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentDestination === 'handoff' && (
          <ParamedicHandoffView
            onTriggerEscalation={handleTriggerEscalation}
            onSelectDestination={(dest) => {
              setCurrentDestination(dest);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentDestination === 'library' && (
          <LibraryView 
            onGuideLive={handleGuideLive} 
            onOpenChat={handleOpenChat}
          />
        )}

        {currentDestination === 'practice' && <PracticeView />}

        {currentDestination === 'medicines' && (
          <CheapMedicinesView
            onBackToHome={() => {
              setCurrentDestination('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenRadar={() => setShowRadarModal(true)}
          />
        )}

        {currentDestination === 'mythbuster' && (
          <MythBusterView
            onSelectDestination={(dest) => {
              setCurrentDestination(dest);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenRadar={() => setShowRadarModal(true)}
          />
        )}

        {currentDestination === 'chat' && (
          <ChatView
            initialQuery={chatInitialQuery}
            onTriggerEscalation={handleTriggerEscalation}
            onLaunchProtocol={(protocolId) => handleStartRespond(protocolId)}
            onBackToHome={() => {
              setCurrentDestination('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Floating Action Button: Screen Capture (hidden in chat & camera) */}
      {currentDestination !== 'chat' && currentDestination !== 'camera' && (
        <ScreenshotFab />
      )}

      {/* Persistent Floating AI Guardian Widget (Hidden in Chat & Camera) */}
      {currentDestination !== 'chat' && currentDestination !== 'camera' && (
        <FloatingChatWidget
          onOpenFullChat={() => handleOpenChat()}
          onTriggerEscalation={handleTriggerEscalation}
        />
      )}

      {/* Deterministic Hard-Stop Escalation Modal */}
      <EscalationModal
        isOpen={escalationOpen}
        reason={escalationReason}
        onDismiss={handleDismissEscalation}
      />

      {/* Firebase Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />

      {/* Breakthrough Field Tool Modals */}
      <CrowdCommanderModal
        isOpen={showCrowdModal}
        onClose={() => setShowCrowdModal(false)}
      />

      <EmergencyRadarModal
        isOpen={showRadarModal}
        onClose={() => setShowRadarModal(false)}
      />

      <ParamedicHandoverModal
        isOpen={showDocketModal}
        onClose={() => setShowDocketModal(false)}
        incidentLog={null}
      />

      <AcousticGaspDetector
        isOpen={showGaspModal}
        onClose={() => setShowGaspModal(false)}
        onStartCPR={() => {
          setShowGaspModal(false);
          handleStartRespond('unconscious');
        }}
      />

      <InAppQRScannerModal
        isOpen={showQRScannerModal}
        onClose={() => setShowQRScannerModal(false)}
        onJoinSquad={(squadId) => {
          setShowQRScannerModal(false);
          setActiveSquadJoinId(squadId);
        }}
        onViewDocket={(docketId) => {
          setShowQRScannerModal(false);
          setActiveDocketId(docketId);
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
