import React, { useState, useEffect } from 'react';
import { DrillBanner, DrillTopNav } from './SharedDrillComponents';
import {
  ClassDashboardScreen,
  DrillReportScreen,
  LiveDrillControlScreen,
  TeacherHomeScreen
} from './TeacherDashboards';
import {
  PlatformPilotDashboardScreen,
  SchoolDashboardScreen,
  SchoolMembersScreen
} from './SchoolAndPlatformDashboards';
import {
  CertificateVerifyScreen,
  StudentDrillScreen,
  StudentResultScreen
} from './StudentAndVerifyScreens';
import { PracticeView } from '../practice/PracticeView';
import { drillService } from '../../services/drillService';
import { useAuth } from '../../firebase/authContext';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Lock,
  MailCheck,
  ShieldCheck,
  Smartphone,
  UserCheck
} from 'lucide-react';
import { Button, Card } from '../common/DesignSystem';

export interface DrillModeRouterProps {
  initialPath?: string;
  onPathChange?: (path: string) => void;
  onOpenProtocol: (slug: string) => void;
  onTriggerRealEmergency: (reason?: string) => void;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
}

export function isDrillModeUrlPath(pathname: string): boolean {
  return (
    pathname === '/teach' ||
    pathname.startsWith('/teach/') ||
    pathname === '/school' ||
    pathname.startsWith('/school/') ||
    pathname.startsWith('/join/') ||
    pathname.startsWith('/drill/') ||
    pathname.startsWith('/verify/') ||
    pathname === '/platform' ||
    pathname.startsWith('/platform/')
  );
}

export const DrillModeRouter: React.FC<DrillModeRouterProps> = ({
  initialPath,
  onPathChange,
  onOpenProtocol,
  onTriggerRealEmergency,
  onOpenAuth
}) => {
  const { user, emailVerified } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (initialPath && isDrillModeUrlPath(initialPath)) {
      return initialPath;
    }
    if (
      typeof window !== 'undefined' &&
      isDrillModeUrlPath(window.location.pathname)
    ) {
      return window.location.pathname;
    }
    return '/teach';
  });

  const [showSoloPractice, setShowSoloPractice] = useState(false);
  const [, setStoreTick] = useState(0);

  useEffect(() => {
    return drillService.subscribe(() => setStoreTick((t) => t + 1));
  }, []);

  useEffect(() => {
    if (initialPath && isDrillModeUrlPath(initialPath) && initialPath !== currentPath) {
      setCurrentPath(initialPath);
    }
  }, [initialPath]);

  const handleNavigate = (nextPath: string) => {
    setShowSoloPractice(false);
    setCurrentPath(nextPath);
    try {
      if (typeof window !== 'undefined' && window.location.pathname !== nextPath) {
        window.history.pushState({}, document.title, nextPath);
      }
    } catch {}
    onPathChange?.(nextPath);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRealEmergencyExit = () => {
    onTriggerRealEmergency(
      'Exited Practice Drill Mode — User pressed "This is a real emergency" (112 Escalation)'
    );
  };

  const activeSchool = drillService.getActiveSchool();
  const userMemberships =
    user && !user.isAnonymous ? drillService.getUserMemberships(user.uid) : [];
  const isSchoolDrillAuthorized = Boolean(
    user &&
      !user.isAnonymous &&
      emailVerified &&
      userMemberships.length > 0 &&
      activeSchool
  );

  // Student screens (/join/:classCode, /drill/:runToken, /drill/:runToken/result) have their own compact DrillBanner
  const isStudentScreen =
    currentPath.startsWith('/join/') || currentPath.startsWith('/drill/');
  const isPublicVerifyScreen = currentPath.startsWith('/verify/');

  const renderSchoolRegistrationGate = () => {
    const step1Done = Boolean(user && !user.isAnonymous);
    const step2Done = Boolean(step1Done && emailVerified);
    const step3Done = Boolean(step2Done && userMemberships.length > 0 && activeSchool);

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6">
        <Card className="p-6 sm:p-8 space-y-6 border-2 border-primary/35">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-primary-soft border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                Authenticated School Feature
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
                Sign In, Verify Email &amp; Register Your School to Unlock School Drills
              </h1>
              <p className="text-sm text-ink-muted leading-relaxed">
                School Practice Drills, Class Readiness Dashboards, and 10-character HMAC Invite Controls are unlocked only after real account authentication, Firebase email verification, and school registration or invite redemption.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className={`p-4 rounded-xl border ${
                step1Done
                  ? 'bg-primary-soft/45 border-primary/40'
                  : 'bg-base border-border'
              } space-y-1.5`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-primary uppercase">Step 1</span>
                {step1Done ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <UserCheck className="w-4 h-4 text-ink-muted" />
                )}
              </div>
              <p className="text-sm font-bold text-ink">
                Account Sign-Up / Sign-In
              </p>
              <p className="text-xs text-ink-muted">
                {step1Done
                  ? `Signed in as ${user?.email || user?.displayName}`
                  : 'Select Principal, Teacher, or Student in the account modal.'}
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                step2Done
                  ? 'bg-primary-soft/45 border-primary/40'
                  : 'bg-base border-border'
              } space-y-1.5`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-primary uppercase">Step 2</span>
                {step2Done ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <MailCheck className="w-4 h-4 text-ink-muted" />
                )}
              </div>
              <p className="text-sm font-bold text-ink">
                Firebase Email Verification
              </p>
              <p className="text-xs text-ink-muted">
                {step2Done
                  ? 'Email inbox ownership verified.'
                  : 'Click the verification link sent to your email inbox.'}
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                step3Done
                  ? 'bg-primary-soft/45 border-primary/40'
                  : 'bg-base border-border'
              } space-y-1.5`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-primary uppercase">Step 3</span>
                {step3Done ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <Building2 className="w-4 h-4 text-ink-muted" />
                )}
              </div>
              <p className="text-sm font-bold text-ink">
                Register or Link School
              </p>
              <p className="text-xs text-ink-muted">
                {step3Done
                  ? `Linked to ${activeSchool?.name}`
                  : 'Register your school as Principal or redeem a 10-char invite code.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              onClick={() => onOpenAuth?.(step1Done ? 'signin' : 'signup')}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {!step1Done
                  ? 'Sign Up / Sign In to Register School'
                  : !step2Done
                  ? 'Verify Email in Account Modal'
                  : 'Register or Link Your School Now'}
              </span>
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowSoloPractice(true)}
            >
              <Smartphone className="w-4 h-4" />
              <span>Open Individual CPR Practice (No School Required)</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  const renderRouteContent = () => {
    if (showSoloPractice) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            type="button"
            onClick={() => setShowSoloPractice(false)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to School Drills</span>
          </button>
          <PracticeView />
        </div>
      );
    }

    // 1. /join/:classCode (Students joining a live drill created by a registered school teacher)
    if (currentPath.startsWith('/join/')) {
      const code = currentPath.replace('/join/', '').split('/')[0] || '';
      return (
        <StudentDrillScreen
          classCodeOrRunToken={code}
          mode="join"
          onNavigate={handleNavigate}
          onOpenProtocol={onOpenProtocol}
          onRealEmergencyExit={handleRealEmergencyExit}
        />
      );
    }

    // 2. /drill/:runToken/result or /drill/:runToken
    if (currentPath.startsWith('/drill/')) {
      const rest = currentPath.replace('/drill/', '');
      const parts = rest.split('/');
      const token = parts[0] || '';
      if (parts[1] === 'result') {
        return (
          <StudentResultScreen
            runToken={token}
            onNavigate={handleNavigate}
            onOpenProtocol={onOpenProtocol}
            onRealEmergencyExit={handleRealEmergencyExit}
          />
        );
      }
      return (
        <StudentDrillScreen
          classCodeOrRunToken={token}
          mode="drill"
          onNavigate={handleNavigate}
          onOpenProtocol={onOpenProtocol}
          onRealEmergencyExit={handleRealEmergencyExit}
        />
      );
    }

    // 3. /verify/:certId (Public read-only certificate verification)
    if (currentPath.startsWith('/verify/')) {
      const certId = currentPath.replace('/verify/', '').split('/')[0] || '';
      return (
        <CertificateVerifyScreen
          certId={certId}
          onNavigate={handleNavigate}
        />
      );
    }

    // Gate all school & teacher dashboards behind real authentication, email verification, and school registration
    if (!isSchoolDrillAuthorized) {
      return renderSchoolRegistrationGate();
    }

    // 4. /platform
    if (currentPath === '/platform' || currentPath.startsWith('/platform/')) {
      return <PlatformPilotDashboardScreen />;
    }

    // 5. /school/members
    if (currentPath.startsWith('/school/members')) {
      return <SchoolMembersScreen onNavigate={handleNavigate} />;
    }

    // 6. /school/reports/:termId or /school
    if (currentPath === '/school' || currentPath.startsWith('/school/')) {
      let termId: string | null = null;
      if (currentPath.startsWith('/school/reports/')) {
        termId = currentPath.replace('/school/reports/', '').split('/')[0] || null;
      }
      return (
        <SchoolDashboardScreen
          termId={termId}
          onNavigate={handleNavigate}
        />
      );
    }

    // 7. /teach/drills/:drillId/live
    if (currentPath.startsWith('/teach/drills/')) {
      const parts = currentPath.replace('/teach/drills/', '').split('/');
      const drillId = parts[0] || '';
      return (
        <LiveDrillControlScreen
          drillId={drillId}
          onNavigate={handleNavigate}
          onRealEmergencyExit={handleRealEmergencyExit}
        />
      );
    }

    // 8. /teach/classes/:classId/drills/:drillId or /teach/classes/:classId
    if (currentPath.startsWith('/teach/classes/')) {
      const parts = currentPath.replace('/teach/classes/', '').split('/');
      const classId = parts[0] || '';
      if (parts[1] === 'drills' && parts[2]) {
        return (
          <DrillReportScreen
            classId={classId}
            drillId={parts[2]}
            onNavigate={handleNavigate}
          />
        );
      }
      return (
        <ClassDashboardScreen
          classId={classId}
          onNavigate={handleNavigate}
          onOpenProtocol={onOpenProtocol}
        />
      );
    }

    // Default: /teach (Teacher Home)
    return (
      <TeacherHomeScreen
        onNavigate={handleNavigate}
        onOpenSelfPractice={() => setShowSoloPractice(true)}
      />
    );
  };

  return (
    <div className="min-h-screen bg-base text-ink">
      {!isStudentScreen && (
        <DrillBanner
          onRealEmergencyExit={handleRealEmergencyExit}
        />
      )}

      {isSchoolDrillAuthorized && !isPublicVerifyScreen && (
        <DrillTopNav
          activePath={currentPath}
          onNavigate={handleNavigate}
        />
      )}

      {renderRouteContent()}
    </div>
  );
};
