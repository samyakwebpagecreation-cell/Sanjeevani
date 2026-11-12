import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  User as UserIcon,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  Building2,
  Smartphone,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  LogOut,
  Search,
  RefreshCw,
  FileText,
  Clock
} from 'lucide-react';
import {
  useAuth,
  UserProfileData
} from '../../firebase/authContext';
import { Badge, Button, Card } from '../common/DesignSystem';
import { drillService } from '../../services/drillService';

export interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
  onSuccess: (targetDashboardPath?: string) => void;
}

type OnboardingIntentRole = 'teacher' | 'school_admin' | 'student';

const INTENT_ROLE_OPTIONS: Array<{
  id: OnboardingIntentRole;
  label: string;
  shortDesc: string;
  targetPath: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'teacher',
    label: 'Teacher',
    shortDesc: 'Join a school via 10-char invite or directory request (/teach)',
    targetPath: '/teach',
    icon: GraduationCap
  },
  {
    id: 'school_admin',
    label: 'Principal / School Admin',
    shortDesc: 'Register school after email verification & manage staff (/school)',
    targetPath: '/school',
    icon: Building2
  },
  {
    id: 'student',
    label: 'Invited Student',
    shortDesc: 'Redeem teacher-issued student invite code (Optional)',
    targetPath: '/teach',
    icon: Smartphone
  }
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'signin',
  onClose,
  onSuccess
}) => {
  const {
    user,
    userProfile,
    emailVerified,
    resendCooldownSec,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordReset,
    reloadAndCheckEmailVerified,
    resendVerificationEmail,
    updateUserProfile,
    logout,
    loading,
    error,
    clearError
  } = useAuth();

  // Top-level tab: 'quick_student' (Default anonymous student path) vs 'educator_account' (Sign In / Sign Up)
  const [topTab, setTopTab] = useState<'quick_student' | 'educator_account'>('educator_account');
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [intendedRole, setIntendedRole] = useState<OnboardingIntentRole>('teacher');
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Account fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 3A: Principal Post-Verification School Registration fields
  const [schoolName, setSchoolName] = useState('');
  const [schoolCity, setSchoolCity] = useState('');
  const [schoolState, setSchoolState] = useState('');
  const [udiseCode, setUdiseCode] = useState('');
  const [officialDomain, setOfficialDomain] = useState('');

  // Step 3B: Teacher / Invited Student Linking ('invite' vs 'directory')
  const [linkMethod, setLinkMethod] = useState<'invite' | 'directory'>('invite');
  const [inviteCode, setInviteCode] = useState('');
  const [directoryQuery, setDirectoryQuery] = useState('');
  const [directoryResults, setDirectoryResults] = useState<
    Array<{ id: string; name: string; city: string; state: string }>
  >([]);
  const [directorySearched, setDirectorySearched] = useState(false);
  const [selectedDirectorySchoolId, setSelectedDirectorySchoolId] = useState<string>('');
  const [selectedTargetClassId, setSelectedTargetClassId] = useState<string>('');

  // Student Quick Join fields (Tab A)
  const [studentJoinCode, setStudentJoinCode] = useState('');
  const [studentRosterCode, setStudentRosterCode] = useState('S-01');
  const [showInvitedStudentNotice, setShowInvitedStudentNotice] = useState(false);

  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [checkingVerify, setCheckingVerify] = useState(false);
  const [, setStoreTick] = useState(0);

  useEffect(() => {
    return drillService.subscribe(() => setStoreTick((t) => t + 1));
  }, []);

  useEffect(() => {
    setMode(initialMode);
    setLocalError(null);
    setAuthSuccessMsg(null);
  }, [initialMode, isOpen]);

  // Restore saved onboarding draft when user signs in
  useEffect(() => {
    if (user && !user.isAnonymous) {
      const draft = drillService.getOnboardingDraft(user.uid);
      if (draft?.intendedRole) {
        setIntendedRole(draft.intendedRole);
      } else if (
        userProfile?.intendedRole &&
        (userProfile.intendedRole === 'teacher' ||
          userProfile.intendedRole === 'school_admin' ||
          userProfile.intendedRole === 'student')
      ) {
        setIntendedRole(userProfile.intendedRole);
      }
      if (draft?.draftSchoolName && !schoolName) setSchoolName(draft.draftSchoolName);
      if (draft?.draftCity && !schoolCity) setSchoolCity(draft.draftCity);
      if (draft?.draftState && !schoolState) setSchoolState(draft.draftState);
      if (draft?.draftUdise && !udiseCode) setUdiseCode(draft.draftUdise);
      if (draft?.draftInviteCode && !inviteCode) setInviteCode(draft.draftInviteCode);
    }
  }, [user, userProfile]);

  // Auto-detect email verification on window focus and 4-second interval while unverified
  useEffect(() => {
    if (!isOpen || !user || user.isAnonymous || emailVerified) return;

    const handleFocus = () => {
      reloadAndCheckEmailVerified();
    };
    window.addEventListener('focus', handleFocus);
    const interval = window.setInterval(() => {
      reloadAndCheckEmailVerified();
    }, 4000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.clearInterval(interval);
    };
  }, [isOpen, user, emailVerified, reloadAndCheckEmailVerified]);

  if (!isOpen) return null;

  const store = drillService.getStore();
  const userMemberships =
    user && !user.isAnonymous ? drillService.getUserMemberships(user.uid) : [];
  const hasSchoolMembership = userMemberships.length > 0;

  // Determine current onboarding step for signed-in non-anonymous educators
  const currentOnboardingStep: 1 | 2 | 3 =
    !user || user.isAnonymous ? 1 : !emailVerified ? 2 : 3;

  const handleToggleMode = (newMode: 'signin' | 'signup') => {
    clearError();
    setLocalError(null);
    setAuthSuccessMsg(null);
    setMode(newMode);
  };

  const handleSelectIntendedRole = (newRole: OnboardingIntentRole) => {
    setIntendedRole(newRole);
    setLocalError(null);
    clearError();
    if (user && !user.isAnonymous) {
      drillService.saveOnboardingDraft(user.uid, { intendedRole: newRole });
      updateUserProfile({ intendedRole: newRole, role: newRole });
    }
  };

  // Step 1 Submit: Create Account or Sign In
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setAuthSuccessMsg(null);
    clearError();

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password, intendedRole);
        const isVerifiedNow = await reloadAndCheckEmailVerified();
        if (isVerifiedNow) {
          setAuthSuccessMsg(
            'Signed in and email verified. Proceed to Step 3 to register or link your school.'
          );
        } else {
          setAuthSuccessMsg(
            'Signed in. Please complete Step 2 (Email Verification) via the link sent to your inbox to unlock school registration.'
          );
        }
      } else {
        const profile: UserProfileData = {
          intendedRole,
          role: intendedRole,
          fullName: fullName.trim() || email.split('@')[0],
          defaultDashboardPath: intendedRole === 'school_admin' ? '/school' : '/teach'
        };
        const { verificationEmailSent } = await signUpWithEmail(email, password, profile);
        if (user?.uid) {
          drillService.saveOnboardingDraft(user.uid, { intendedRole });
        }
        setAuthSuccessMsg(
          verificationEmailSent
            ? `Verification link sent to ${email.trim()}. Click the link in your inbox to unlock Step 3.`
            : 'Account created. Proceed to Step 2 to verify your email address.'
        );
      }
    } catch (err: any) {
      if (err?.message && !error) {
        setLocalError(err.message);
      }
    }
  };

  const handleGoogleAuth = async () => {
    setLocalError(null);
    setAuthSuccessMsg(null);
    clearError();
    try {
      await signInWithGoogle(intendedRole);
      setAuthSuccessMsg(
        'Signed in with Google (Email Verified). Complete Step 3 to register or link your school.'
      );
    } catch (err: any) {
      if (err?.message && !error) {
        setLocalError(err.message);
      }
    }
  };

  const handleManualVerifyCheck = async () => {
    setCheckingVerify(true);
    setLocalError(null);
    const ok = await reloadAndCheckEmailVerified();
    setCheckingVerify(false);
    if (ok) {
      setAuthSuccessMsg(
        'Email Verified! Step 3 (School Registration & Linking) is now unlocked.'
      );
    } else {
      setLocalError(
        'Email verification not detected yet. Please click the verification link sent to your email inbox, then click Refresh Token again.'
      );
    }
  };

  const handleResendVerification = async () => {
    setLocalError(null);
    const res = await resendVerificationEmail();
    if (res.ok) {
      setAuthSuccessMsg(res.message);
    } else {
      setLocalError(res.message);
    }
  };

  // Step 3A: Principal School Registration (post-email-verification only)
  const handleRegisterSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setAuthSuccessMsg(null);

    if (!user || user.isAnonymous) {
      setLocalError('Please sign in first.');
      return;
    }
    if (!emailVerified) {
      setLocalError('Email verification is required before registering a school.');
      return;
    }

    try {
      await fetch('/api/drill-auth/create-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          emailVerified: true,
          name: schoolName.trim(),
          city: schoolCity.trim(),
          state: schoolState.trim(),
          udiseCode: udiseCode.trim()
        })
      }).catch(() => {});
    } catch {}

    const res = drillService.registerSchoolAfterVerification({
      uid: user.uid,
      emailVerified: true,
      displayName:
        userProfile?.fullName || user.displayName || fullName.trim() || 'School Principal',
      email: user.email || email.trim(),
      name: schoolName,
      city: schoolCity,
      state: schoolState,
      udiseCode: udiseCode.trim() || undefined,
      officialEmailDomain: officialDomain.trim() || undefined
    });

    if (!res.ok || !res.school) {
      setLocalError(res.error || 'Could not register school.');
      return;
    }

    updateUserProfile({
      intendedRole: 'school_admin',
      role: 'school_admin',
      schoolId: res.school.id,
      schoolName: res.school.name,
      schoolCity: res.school.city,
      schoolState: res.school.state,
      udiseCode: res.school.udiseCode,
      defaultDashboardPath: '/school'
    });

    setAuthSuccessMsg(
      `Registered "${res.school.name}" (Status: Unverified — Invite-Only). Opening School Admin Dashboard…`
    );
    setTimeout(() => {
      onSuccess('/school');
      onClose();
    }, 500);
  };

  // Step 3B-1: Redeem 10-char HMAC-SHA256 Invite Code
  const handleRedeemInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setAuthSuccessMsg(null);

    if (!user || user.isAnonymous) {
      setLocalError('Please sign in first.');
      return;
    }
    if (!emailVerified) {
      setLocalError('Please verify your email address before redeeming an invite code.');
      return;
    }

    const res = await drillService.redeemInviteCode({
      schoolId: 'any',
      plaintextCode: inviteCode,
      uid: user.uid,
      displayName:
        userProfile?.fullName || user.displayName || fullName.trim() || 'School Educator',
      email: user.email || email.trim(),
      emailVerified: true
    });

    if (!res.ok || !res.member) {
      setLocalError(res.error || 'Invalid or expired invite code.');
      return;
    }

    const assignedClass = res.member.classIds[0]
      ? store.classes[res.member.classIds[0]]
      : null;

    const targetPath =
      res.member.role === 'admin'
        ? '/school'
        : res.member.role === 'student' && assignedClass
        ? `/join/${assignedClass.joinCode}`
        : '/teach';

    updateUserProfile({
      role: res.member.role === 'admin' ? 'school_admin' : res.member.role,
      schoolId: res.school?.id,
      schoolName: res.school?.name,
      defaultDashboardPath: targetPath
    });

    setAuthSuccessMsg(
      `Invite code redeemed! Granted ${res.member.role.toUpperCase()} membership at ${
        res.school?.name || 'school'
      }. Opening dashboard…`
    );
    setTimeout(() => {
      onSuccess(targetPath);
      onClose();
    }, 500);
  };

  // Step 3B-2: Server-Side Verified School Directory Search
  const handleSearchDirectory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!emailVerified) {
      setLocalError('Verified email required to search the verified school directory.');
      return;
    }
    const localSearch = drillService.searchVerifiedSchools({
      query: directoryQuery,
      emailVerified: true
    });
    if (!localSearch.ok) {
      setLocalError(localSearch.error || 'Directory search failed.');
      return;
    }
    setDirectoryResults(localSearch.results);
    setDirectorySearched(true);
    if (localSearch.results.length > 0 && !selectedDirectorySchoolId) {
      setSelectedDirectorySchoolId(localSearch.results[0].id);
    }
  };

  const handleSubmitJoinRequest = (schoolId: string) => {
    setLocalError(null);
    setAuthSuccessMsg(null);
    if (!user || !emailVerified) {
      setLocalError('Verified email required to request school membership.');
      return;
    }
    const res = drillService.submitSchoolJoinRequest({
      schoolId,
      uid: user.uid,
      displayName:
        userProfile?.fullName || user.displayName || fullName.trim() || 'Educator Applicant',
      email: user.email || email.trim(),
      requestedRole: intendedRole === 'student' ? 'student' : 'teacher',
      targetClassId: selectedTargetClassId || undefined
    });
    if (!res.ok) {
      setLocalError(res.error || 'Could not submit join request.');
      return;
    }
    setAuthSuccessMsg(
      intendedRole === 'student'
        ? 'Join request submitted! Your class teacher must approve your request before you can join.'
        : 'Teacher join request submitted! Only the School Principal (Admin) can approve teacher requests.'
    );
  };

  // Student Quick Class Code Join (Tab A — Default Path, Anonymous Auth, Teacher-Assigned Slot)
  const handleStudentZeroAccountJoin = async () => {
    setLocalError(null);
    setAuthSuccessMsg(null);
    clearError();
    const cleanCode = studentJoinCode.trim().toUpperCase();
    if (!cleanCode) {
      setLocalError('Please enter the active Practice Drill or Class Code provided by your teacher.');
      return;
    }

    const matchedRun = drillService.findRunByTokenOrId(cleanCode);
    const matchedClass = drillService.findClassByJoinCodeOrId(cleanCode);
    if (!matchedRun && !matchedClass) {
      setLocalError(
        `No active practice drill or class found for code "${cleanCode}". Ask your teacher for the active 10-character code.`
      );
      return;
    }

    try {
      if (matchedRun) {
        const joined = await drillService.joinDrillRunAsStudent({
          runTokenOrId: cleanCode,
          studentCode: studentRosterCode
        });
        if (joined?.slotLockedError) {
          setLocalError(joined.slotLockedError);
          return;
        }
        setAuthSuccessMsg(
          `Joined anonymously as ${studentRosterCode} — opening Practice Drill…`
        );
        setTimeout(() => {
          setAuthSuccessMsg(null);
          onSuccess(`/drill/${cleanCode}`);
          onClose();
        }, 400);
      } else if (matchedClass) {
        setAuthSuccessMsg(
          `Connected to Class ${matchedClass.name} as ${studentRosterCode} — opening Class Drill View…`
        );
        setTimeout(() => {
          setAuthSuccessMsg(null);
          onSuccess(`/join/${matchedClass.joinCode}`);
          onClose();
        }, 400);
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Could not join practice drill.');
    }
  };

  const handleDownloadParentPrivacyNotice = () => {
    const noticeText = [
      'SANJEEVANI SCHOOL READINESS — PARENT & GUARDIAN PRIVACY NOTICE (DPDP ACT)',
      '=========================================================================',
      '1. Default Mode (Quick Class Code Join):',
      '   Students join classroom practice drills using a session code and a teacher-assigned',
      '   pseudonymous slot code (e.g., S-01 to S-16). No student email, phone number, or',
      '   personal account is required on student devices.',
      '',
      '2. Teacher-Held Roster Mapping:',
      '   If a school teacher maintains a paper or local classroom mapping between S-01..S-16',
      '   and student names, that roster is school-managed educational data.',
      '',
      '3. Data Retention & Minimisation:',
      '   Raw practice drill event logs are automatically purged after 90 days by default.',
      '   Students see only their own role timing and team result — never individual rankings.',
      '',
      '4. Emergency Safety Boundary:',
      '   All school sessions run strictly as Practice Drills with a simulated 112 console.',
      '   For any real medical emergency, tap "This is a real emergency" to exit immediately.'
    ].join('\n');

    const blob = new Blob([noticeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Sanjeevani-Parent-Privacy-Notice-DPDP.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleForgotPassword = async () => {
    setLocalError(null);
    clearError();
    if (!email.trim()) {
      setLocalError(
        'Enter your school email address in the Email field first, then click "Forgot password?".'
      );
      return;
    }
    try {
      await sendPasswordReset(email);
      setAuthSuccessMsg(
        `Password reset link sent to ${email.trim()}. Check your inbox and spam folder.`
      );
    } catch {
      // Handled by AuthContext
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-ink/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-5xl rounded-[22px] bg-surface border border-border shadow-2xl overflow-hidden my-auto flex flex-col lg:flex-row max-h-[92vh]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-border bg-surface text-ink-muted hover:text-ink hover:bg-base cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Close authentication modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ================================================================= */}
        {/* LEFT COLUMN: PRIMARY ONBOARDING & VERIFICATION WORKFLOW           */}
        {/* ================================================================= */}
        <div className="w-full lg:w-7/12 p-5 sm:p-8 overflow-y-auto border-b lg:border-b-0 lg:border-r border-border space-y-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between pr-10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-base border border-border p-1.5 shrink-0">
                <img
                  src="/sanjeevani-logo.png"
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <span className="text-lg font-extrabold text-ink leading-tight block">
                  Sanjeevani School Readiness
                </span>
                <span className="text-xs font-semibold text-primary">
                  Verified School Registration, Teacher Invites &amp; Student Practice Drills
                </span>
              </div>
            </div>
          </div>

          {/* Primary Top-Level Segmented Switcher: Student Quick Join vs Educator Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1 rounded-xl bg-base border border-border">
            <button
              type="button"
              onClick={() => {
                setTopTab('quick_student');
                setLocalError(null);
                clearError();
              }}
              className={`min-h-[42px] px-3 py-2 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                topTab === 'quick_student'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>Student Quick Join (No Account)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTopTab('educator_account');
                setLocalError(null);
                clearError();
              }}
              className={`min-h-[42px] px-3 py-2 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                topTab === 'educator_account'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Teacher &amp; Principal Sign In / Up</span>
            </button>
          </div>

          {/* Feedback Banners */}
          {(error || localError) && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-alert/10 border border-alert/30 text-xs sm:text-sm text-alert font-semibold flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{localError || error}</span>
            </div>
          )}

          {authSuccessMsg && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-primary-soft border border-primary/30 text-xs sm:text-sm text-ink font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB A: STUDENT QUICK CLASS CODE JOIN (DEFAULT CHILD-SAFE PATH)  */}
          {/* =============================================================== */}
          {topTab === 'quick_student' ? (
            <div className="space-y-4">
              <div>
                <h2
                  id="auth-modal-title"
                  className="text-xl sm:text-2xl font-extrabold text-ink"
                >
                  Quick Class Code Join (Default Student Path)
                </h2>
                <p className="text-xs sm:text-sm text-ink-muted mt-1">
                  Enter the active 10-character Practice Drill Code shown on your teacher&apos;s screen and select the roster slot code (<span className="font-mono font-bold text-ink">S-01</span>–<span className="font-mono font-bold text-ink">S-16</span>) assigned to you by your teacher.
                </p>
              </div>

              <Card className="p-5 space-y-4 bg-base border-border">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs sm:text-sm">
                    <span className="font-bold text-ink block">
                      Pseudonymous Student Codes — No Email or Phone Collected
                    </span>
                    <p className="text-ink-muted leading-relaxed">
                      Your device connects via a temporary anonymous session bound to your teacher-assigned slot. Once joined, practice drills continue to work even if classroom Wi-Fi drops.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                      Active Practice Drill / Class Code
                    </label>
                    <input
                      type="text"
                      value={studentJoinCode}
                      onChange={(e) => setStudentJoinCode(e.target.value)}
                      placeholder="Enter teacher's 10-char drill code"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-border bg-surface font-mono font-bold text-sm text-ink uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                      Teacher-Assigned Roster Slot
                    </label>
                    <select
                      value={studentRosterCode}
                      onChange={(e) => setStudentRosterCode(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-border bg-surface font-mono font-bold text-sm text-ink"
                    >
                      {Array.from({ length: 16 }, (_, i) =>
                        `S-${String(i + 1).padStart(2, '0')}`
                      ).map((code) => (
                        <option key={code} value={code}>
                          {code} (Assigned by Teacher)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleStudentZeroAccountJoin}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Join Active Practice Drill</span>
                  </Button>
                </div>
              </Card>

              {/* Parent Privacy Notice + Optional Teacher-Invited Student Account Info */}
              <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-bold text-ink">
                      Parent &amp; Guardian DPDP Privacy Notice (90-Day Default Retention)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadParentPrivacyNotice}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    Download Notice (.txt)
                  </button>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  We never collect parent email addresses on sign-up forms. Have a teacher-issued 10-character student account invite code?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setShowInvitedStudentNotice(!showInvitedStudentNotice);
                      setTopTab('educator_account');
                      setIntendedRole('student');
                    }}
                    className="font-bold text-primary hover:underline cursor-pointer"
                  >
                    Redeem Invited Student Code →
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* =============================================================== */
            /* TAB B: EDUCATOR & INVITED ACCOUNT 3-STEP VERIFIED WORKFLOW      */
            /* =============================================================== */
            <div className="space-y-5">
              {/* 3-Step Progress Bar */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-base border border-border">
                {[
                  {
                    step: 1,
                    title: '1. Account & Role Intent',
                    done: Boolean(user && !user.isAnonymous)
                  },
                  {
                    step: 2,
                    title: '2. Email Verification',
                    done: Boolean(user && !user.isAnonymous && emailVerified)
                  },
                  {
                    step: 3,
                    title: '3. Register / Link School',
                    done: hasSchoolMembership
                  }
                ].map((s) => {
                  const isCurrent = currentOnboardingStep === s.step;
                  return (
                    <div
                      key={s.step}
                      className={`p-2 rounded-lg border text-xs transition-colors ${
                        s.done
                          ? 'bg-primary-soft/60 border-primary/40 text-ink font-bold'
                          : isCurrent
                          ? 'bg-surface border-primary text-ink font-bold'
                          : 'bg-surface/50 border-border text-ink-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{s.title}</span>
                        {s.done && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Signed-In Educator Session Summary */}
              {user && !user.isAnonymous && (
                <Card className="p-4 bg-base border-border space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-ink">
                          {userProfile?.fullName || user.displayName || user.email}
                        </span>
                        {emailVerified ? (
                          <span className="px-2 py-0.5 rounded-md bg-primary-soft border border-primary/30 text-[11px] font-bold text-primary">
                            Email Verified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] border border-[#F59E0B]/40 text-[11px] font-bold text-[#B45309]">
                            Email Unverified
                          </span>
                        )}
                      </div>
                      {user.email && (
                        <span className="text-xs text-ink-muted font-mono block mt-0.5">
                          {user.email}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {emailVerified && hasSchoolMembership && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            const primaryRole = userMemberships[0]?.role;
                            const target =
                              primaryRole === 'admin' ? '/school' : '/teach';
                            onSuccess(target);
                            onClose();
                          }}
                        >
                          <span>Open School Drills</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="neutral"
                        size="sm"
                        onClick={async () => {
                          await logout();
                          setAuthSuccessMsg('Signed out.');
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Onboarding Role Intent Selector (Teacher / Principal / Invited Student — NO platform role) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Select Your Role Intent (Server-Granted Membership Required)
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    Saved to <span className="font-mono">onboardingDrafts</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {INTENT_ROLE_OPTIONS.map((r) => {
                    const Icon = r.icon;
                    const active = intendedRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelectIntendedRole(r.id)}
                        className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                          active
                            ? 'bg-primary-soft border-2 border-primary text-ink'
                            : 'bg-base border-border text-ink-muted hover:text-ink hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              active ? 'text-primary' : 'text-ink-muted'
                            }`}
                          />
                          <span className="text-[10px] font-mono text-ink-muted">
                            {r.targetPath}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-ink block mt-1.5">
                          {r.label}
                        </span>
                        <span className="text-[11px] text-ink-muted leading-snug mt-0.5">
                          {r.shortDesc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* =========================================================== */}
              {/* STEP 1: SIGN IN OR CREATE ACCOUNT                           */}
              {/* =========================================================== */}
              {(!user || user.isAnonymous) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-base border border-border">
                    <button
                      type="button"
                      onClick={() => handleToggleMode('signin')}
                      className={`min-h-[38px] rounded-lg text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        mode === 'signin'
                          ? 'bg-primary text-white shadow-2xs'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleMode('signup')}
                      className={`min-h-[38px] rounded-lg text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        mode === 'signup'
                          ? 'bg-primary text-white shadow-2xs'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Create Account</span>
                    </button>
                  </div>

                  <form onSubmit={handleAccountSubmit} className="space-y-3.5">
                    {mode === 'signup' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-ink-muted" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-border bg-base text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                        School or Institutional Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-ink-muted" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="educator@school.edu.in"
                          className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-border bg-base text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
                          Password
                        </label>
                        {mode === 'signin' && (
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-xs font-bold text-primary hover:underline cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-ink-muted" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-xl border border-border bg-base text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-ink-muted hover:text-ink cursor-pointer"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        fullWidth
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>
                              {mode === 'signin'
                                ? 'Sign In & Check Verification'
                                : 'Create Account & Send Verification Link'}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleGoogleAuth}
                        disabled={loading}
                      >
                        <span>Continue with Google</span>
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* =========================================================== */}
              {/* STEP 2: EMAIL VERIFICATION CHECKPOINT                       */}
              {/* =========================================================== */}
              {user && !user.isAnonymous && !emailVerified && (
                <Card className="p-5 space-y-4 bg-[#FEF3C7]/45 border-[#F59E0B]/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FEF3C7] border border-[#F59E0B]/40 text-xs font-bold text-[#B45309]">
                        <Clock className="w-3.5 h-3.5" />
                        Step 2: Firebase Email Verification Required
                      </span>
                      <h3 className="text-base font-extrabold text-ink mt-1">
                        Verify <span className="font-mono">{user.email}</span> to Unlock School Registration &amp; Linking
                      </h3>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        We sent a Firebase verification link to your email address. Open your email inbox, click the verification link, and then click <strong>Refresh Token</strong> below.{' '}
                        <strong className="text-ink">
                          Note: Email verification confirms inbox ownership only and does not automatically verify a school.
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-border text-xs text-ink-muted space-y-1">
                    <span className="font-bold text-ink block">
                      Using a school domain (.edu.in / .ac.in)?
                    </span>
                    <p>
                      School mail gateways sometimes delay external links by 1–2 minutes or place them in Junk/Quarantine. This screen automatically checks every 4 seconds and whenever you switch back to this tab.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleManualVerifyCheck}
                      disabled={checkingVerify}
                    >
                      {checkingVerify ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span>I&apos;ve Clicked the Link — Refresh Token</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleResendVerification}
                      disabled={resendCooldownSec > 0}
                    >
                      <Mail className="w-4 h-4" />
                      <span>
                        {resendCooldownSec > 0
                          ? `Resend Link (${resendCooldownSec}s)`
                          : 'Resend Verification Email'}
                      </span>
                    </Button>
                  </div>
                </Card>
              )}

              {/* =========================================================== */}
              {/* STEP 3: POST-VERIFICATION SCHOOL REGISTRATION OR LINKING    */}
              {/* =========================================================== */}
              {user && !user.isAnonymous && emailVerified && (
                <Card className="p-5 space-y-4 bg-base border-border">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                        Step 3 • Unlocked After Email Verification
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-ink">
                        {intendedRole === 'school_admin'
                          ? 'Register Your School (Unverified / Invite-Only Initially)'
                          : intendedRole === 'student'
                          ? 'Redeem Teacher-Issued Student Invite Code'
                          : 'Link to Your School (10-Char Invite or Verified Directory)'}
                      </h3>
                    </div>
                  </div>

                  {intendedRole === 'school_admin' ? (
                    <form onSubmit={handleRegisterSchool} className="space-y-3">
                      <div className="p-3 rounded-xl bg-surface border border-border text-xs text-ink-muted leading-relaxed">
                        <strong className="text-ink">School Verification Policy:</strong> Newly registered schools start as{' '}
                        <span className="font-mono font-bold text-[#B45309]">unverified</span> (invite-only and hidden from public directory search). Entering a UDISE code records the identifier for review but does not automatically grant a Verified School badge. Max 2 unverified schools per account.
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                          Official School Name
                        </label>
                        <input
                          type="text"
                          required
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          placeholder="Enter official school name"
                          className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-border bg-surface text-sm text-ink"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                            City / District
                          </label>
                          <input
                            type="text"
                            required
                            value={schoolCity}
                            onChange={(e) => setSchoolCity(e.target.value)}
                            placeholder="City"
                            className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-border bg-surface text-sm text-ink"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            required
                            value={schoolState}
                            onChange={(e) => setSchoolState(e.target.value)}
                            placeholder="State"
                            className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-border bg-surface text-sm text-ink"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                            UDISE Code (11 Digits)
                          </label>
                          <input
                            type="text"
                            value={udiseCode}
                            onChange={(e) => setUdiseCode(e.target.value)}
                            placeholder="Optional 11-digit UDISE"
                            className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-border bg-surface font-mono text-sm text-ink"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                          Official School Email Domain (Optional — For Verification Review)
                        </label>
                        <input
                          type="text"
                          value={officialDomain}
                          onChange={(e) => setOfficialDomain(e.target.value)}
                          placeholder="e.g. school.edu.in"
                          className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-border bg-surface font-mono text-sm text-ink"
                        />
                      </div>

                      <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-ink-muted">
                          Default retention: <strong className="text-ink">90 days</strong> • Student accounts: <strong className="text-ink">Off</strong>
                        </span>
                        <Button type="submit" variant="primary" size="sm">
                          <Building2 className="w-4 h-4" />
                          <span>Register School &amp; Unlock Drills</span>
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      {/* Sub-navigation: Redeem 10-Char Invite Code vs Search Verified School Directory */}
                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface border border-border">
                        <button
                          type="button"
                          onClick={() => setLinkMethod('invite')}
                          className={`min-h-[36px] rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                            linkMethod === 'invite'
                              ? 'bg-primary text-white'
                              : 'text-ink-muted hover:text-ink'
                          }`}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Redeem 10-Char Invite Code</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLinkMethod('directory')}
                          className={`min-h-[36px] rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                            linkMethod === 'directory'
                              ? 'bg-primary text-white'
                              : 'text-ink-muted hover:text-ink'
                          }`}
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Search Verified Directory</span>
                        </button>
                      </div>

                      {linkMethod === 'invite' ? (
                        <form onSubmit={handleRedeemInvite} className="space-y-3">
                          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
                            Single-Use 10-Character Invite Code (HMAC-SHA256)
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              required
                              value={inviteCode}
                              onChange={(e) => setInviteCode(e.target.value)}
                              placeholder="Enter 10-char invite code (XXXX-XXXX-XX)"
                              className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-border bg-surface font-mono font-bold text-sm text-ink uppercase"
                            />
                            <Button type="submit" variant="primary" size="sm">
                              <KeyRound className="w-4 h-4" />
                              <span>Redeem &amp; Join School</span>
                            </Button>
                          </div>
                          <p className="text-xs text-ink-muted">
                            Rate-limited by code (max 5 failed attempts/minute) so classroom Wi-Fi is never blocked.
                          </p>
                        </form>
                      ) : (
                        <div className="space-y-3">
                          <form onSubmit={handleSearchDirectory} className="flex gap-2">
                            <input
                              type="text"
                              value={directoryQuery}
                              onChange={(e) => setDirectoryQuery(e.target.value)}
                              placeholder="Search verified schools by name or city…"
                              className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl border border-border bg-surface text-sm text-ink"
                            />
                            <Button type="submit" variant="secondary" size="sm">
                              <Search className="w-4 h-4" />
                              <span>Search</span>
                            </Button>
                          </form>

                          <p className="text-[11px] text-ink-muted">
                            Only verified schools (<span className="font-mono">verificationStatus == &apos;verified&apos;</span>) appear in directory search. Unverified schools are invite-only.
                          </p>

                          {directorySearched && (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {directoryResults.length === 0 ? (
                                <div className="p-3 rounded-xl bg-surface border border-border text-xs text-ink-muted">
                                  No verified schools matched your search. Ask your Principal for a 10-character invite code.
                                </div>
                              ) : (
                                directoryResults.map((sch) => {
                                  const schoolClasses = Object.values(store.classes).filter(
                                    (c) => c.schoolId === sch.id && !c.archived
                                  );
                                  return (
                                    <div
                                      key={sch.id}
                                      className="p-3 rounded-xl bg-surface border border-border flex flex-wrap items-center justify-between gap-2"
                                    >
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs sm:text-sm font-bold text-ink">
                                            {sch.name}
                                          </span>
                                          <span className="px-1.5 py-0.5 rounded bg-primary-soft text-primary text-[10px] font-bold">
                                            Verified School
                                          </span>
                                        </div>
                                        <span className="text-xs text-ink-muted block">
                                          {sch.city}, {sch.state}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {schoolClasses.length > 0 && (
                                          <select
                                            value={selectedTargetClassId}
                                            onChange={(e) => setSelectedTargetClassId(e.target.value)}
                                            className="px-2 py-1 rounded-lg border border-border bg-base text-xs font-mono text-ink"
                                            aria-label="Target class"
                                          >
                                            <option value="">Select Class</option>
                                            {schoolClasses.map((c) => (
                                              <option key={c.id} value={c.id}>
                                                Class {c.name}
                                              </option>
                                            ))}
                                          </select>
                                        )}
                                        <Button
                                          variant="primary"
                                          size="sm"
                                          onClick={() => handleSubmitJoinRequest(sch.id)}
                                        >
                                          <span>
                                            Request {intendedRole === 'student' ? 'Class' : 'Teacher'} Join
                                          </span>
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: REAL ACCOUNT & SCHOOL MEMBERSHIP STATUS             */}
        {/* ================================================================= */}
        <div className="hidden lg:flex lg:w-5/12 p-8 bg-base overflow-y-auto flex-col justify-between gap-6">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Badge variant="soft">Server-Granted Roles &amp; DPDP Privacy</Badge>
              <h3 className="text-xl font-extrabold text-ink">
                How Verified School Onboarding Works
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                School Drills are unlocked strictly after real account authentication, Firebase email verification, and school registration or invite redemption:
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
                <span className="font-bold text-ink block">
                  1. Email Verified ≠ School Verified
                </span>
                <p className="text-ink-muted leading-snug">
                  Verifying your inbox unlocks school creation, but new schools start as <span className="font-mono font-bold text-[#B45309]">unverified</span> (invite-only) until institutional verification completes.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
                <span className="font-bold text-ink block">
                  2. Scoped Approvals &amp; HMAC-SHA256 Invites
                </span>
                <p className="text-ink-muted leading-snug">
                  Teacher join requests require Principal (<span className="font-mono">admin</span>) approval. Teachers can approve students only into their own assigned classes.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
                <span className="font-bold text-ink block">
                  3. Teacher-Assigned Slots + Mid-Drill Release
                </span>
                <p className="text-ink-muted leading-snug">
                  Students quick-join active drills with anonymous slots (<span className="font-mono">S-01..S-16</span>). If a phone refreshes mid-drill, the teacher can click <strong>Release Slot</strong>.
                </p>
              </div>
            </div>

            {/* Real User Onboarding & Linked Schools Status */}
            <div className="space-y-2.5 pt-3 border-t border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block">
                Your Linked Schools &amp; Access Status
              </span>

              {!user || user.isAnonymous ? (
                <div className="p-3.5 rounded-xl bg-surface border border-border text-xs text-ink-muted">
                  Sign in or create an educator account on the left to verify your email and register or join a school.
                </div>
              ) : !emailVerified ? (
                <div className="p-3.5 rounded-xl bg-[#FEF3C7]/45 border border-[#F59E0B]/40 text-xs text-[#B45309] font-semibold">
                  Pending Step 2: Click the Firebase verification link sent to <span className="font-mono">{user.email}</span> to unlock school registration.
                </div>
              ) : userMemberships.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-surface border border-border text-xs text-ink-muted">
                  Email verified. Complete Step 3 on the left to register your school or redeem a 10-character school invite code.
                </div>
              ) : (
                <div className="space-y-2">
                  {userMemberships.map((mem) => (
                    <button
                      key={mem.schoolId}
                      type="button"
                      onClick={() => {
                        drillService.setActiveSchool(mem.schoolId);
                        const targetPath = mem.role === 'admin' ? '/school' : '/teach';
                        onSuccess(targetPath);
                        onClose();
                      }}
                      className="w-full p-3 rounded-xl bg-surface border border-border hover:border-primary text-left transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-ink group-hover:text-primary block truncate">
                            {mem.schoolName}
                          </span>
                          <span className="text-[11px] font-mono text-ink-muted uppercase">
                            Role: {mem.role} • Open {mem.role === 'admin' ? '/school' : '/teach'}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-primary shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border text-xs text-ink-muted flex flex-wrap items-center justify-between gap-2">
            <span>Pseudonymous Student Slots • 90-Day Default Retention</span>
            <span className="font-mono">HMAC-SHA256 • v2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
