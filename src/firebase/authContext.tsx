import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth, googleProvider } from './config';
import { drillService } from '../services/drillService';

// Onboarding intent only — never trusted for school permissions.
// Actual school roles live exclusively in schools/{schoolId}/members/{uid}.
export type AccountRole = 'teacher' | 'school_admin' | 'student' | 'responder' | 'parent';

export interface UserProfileData {
  intendedRole?: 'teacher' | 'school_admin' | 'student';
  role?: AccountRole; // UI hint only; permissions are enforced via schools/{schoolId}/members/{uid}
  fullName?: string;
  schoolId?: string;
  schoolName?: string;
  schoolCity?: string;
  schoolState?: string;
  udiseCode?: string;
  inviteCode?: string;
  assignedClassId?: string;
  defaultDashboardPath?: string;
  username?: string;
  phone?: string;
  source?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileData | null;
  emailVerified: boolean;
  verificationSentAt: number | null;
  resendCooldownSec: number;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, pass: string, roleHint?: AccountRole) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    profile: UserProfileData
  ) => Promise<{ verificationEmailSent: boolean }>;
  signInWithGoogle: (roleHint?: AccountRole) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  reloadAndCheckEmailVerified: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<{ ok: boolean; message: string }>;
  updateUserProfile: (patch: Partial<UserProfileData>) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [verificationSentAt, setVerificationSentAt] = useState<number | null>(null);
  const [resendCooldownUntil, setResendCooldownUntil] = useState<number>(0);
  const [resendCooldownSec, setResendCooldownSec] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tick down resend cooldown timer
  useEffect(() => {
    if (resendCooldownUntil <= Date.now()) {
      setResendCooldownSec(0);
      return;
    }
    const update = () => {
      const remaining = Math.max(0, Math.ceil((resendCooldownUntil - Date.now()) / 1000));
      setResendCooldownSec(remaining);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldownUntil]);

  /**
   * Computes real Firebase email verification status.
   * Returns true ONLY if the user has verified their email via Firebase Auth
   * or authenticated with a verified Google OAuth account.
   */
  const computeEffectiveEmailVerified = useCallback((currentUser: User | null): boolean => {
    if (!currentUser) return false;
    if (currentUser.isAnonymous) return false;
    if (currentUser.emailVerified) return true;
    if (currentUser.providerData?.some((p) => p.providerId === 'google.com')) {
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setEmailVerified(computeEffectiveEmailVerified(currentUser));
      if (currentUser) {
        if (!currentUser.isAnonymous) {
          drillService.hydrateFromFirestore(currentUser.uid).catch(() => {});
        }
        try {
          const saved = localStorage.getItem(`profile_${currentUser.uid}`);
          if (saved) {
            setUserProfile(JSON.parse(saved));
          } else {
            setUserProfile({
              fullName:
                currentUser.displayName ||
                (currentUser.isAnonymous ? 'Anonymous Student' : currentUser.email?.split('@')[0] || 'Educator'),
              intendedRole: currentUser.isAnonymous ? 'student' : 'teacher',
              role: currentUser.isAnonymous ? 'student' : 'teacher',
              defaultDashboardPath: '/teach'
            });
          }
        } catch {
          setUserProfile({
            intendedRole: 'teacher',
            role: 'teacher',
            defaultDashboardPath: '/teach'
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [computeEffectiveEmailVerified]);

  const clearError = () => setError(null);

  const defaultPathForRole = (role?: AccountRole): string => {
    if (role === 'school_admin') return '/school';
    return '/teach';
  };

  const updateUserProfile = (patch: Partial<UserProfileData>) => {
    setUserProfile((prev) => {
      const next: UserProfileData = {
        ...(prev || {}),
        ...patch
      };
      if (auth.currentUser) {
        try {
          localStorage.setItem(`profile_${auth.currentUser.uid}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  /**
   * Reloads the Firebase Auth user and forces an ID token refresh (`getIdToken(true)`)
   * so `request.auth.token.email_verified == true` is immediately reflected in Firestore rules and API calls.
   */
  const reloadAndCheckEmailVerified = useCallback(async (): Promise<boolean> => {
    const current = auth.currentUser;
    if (!current) return false;
    try {
      await current.reload();
      await current.getIdToken(true);
    } catch {
      // ignore network transient errors during background polling
    }
    const refreshed = auth.currentUser;
    setUser(refreshed);
    const verified = computeEffectiveEmailVerified(refreshed);
    setEmailVerified(verified);
    return verified;
  }, [computeEffectiveEmailVerified]);

  const resendVerificationEmail = async (): Promise<{ ok: boolean; message: string }> => {
    clearError();
    const current = auth.currentUser;
    if (!current || current.isAnonymous) {
      return { ok: false, message: 'Please sign in with your educator email first.' };
    }
    if (resendCooldownUntil > Date.now()) {
      const waitSec = Math.ceil((resendCooldownUntil - Date.now()) / 1000);
      return {
        ok: false,
        message: `Please wait ${waitSec}s before requesting another verification email.`
      };
    }
    try {
      await sendEmailVerification(current);
      const now = Date.now();
      setVerificationSentAt(now);
      setResendCooldownUntil(now + 45_000);
      return {
        ok: true,
        message: `Verification link sent to ${current.email}. Check your inbox and spam/junk folder.`
      };
    } catch (err: any) {
      if (err?.code === 'auth/too-many-requests') {
        setResendCooldownUntil(Date.now() + 60_000);
        const msg =
          'Too many verification emails requested recently. Please wait 60 seconds and check your spam folder.';
        setError(msg);
        return { ok: false, message: msg };
      }
      const fallbackMsg =
        err?.message || 'Could not send verification email. Please check your connection.';
      setError(fallbackMsg);
      return { ok: false, message: fallbackMsg };
    }
  };

  const signInWithEmail = async (email: string, pass: string, roleHint?: AccountRole) => {
    clearError();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await cred.user.reload().catch(() => {});
      await cred.user.getIdToken(true).catch(() => {});
      setEmailVerified(computeEffectiveEmailVerified(cred.user));

      if (cred.user) {
        await drillService.hydrateFromFirestore(cred.user.uid).catch(() => {});
        const existingRaw = localStorage.getItem(`profile_${cred.user.uid}`);
        const existing: UserProfileData = existingRaw ? JSON.parse(existingRaw) : {};
        const effectiveRole = roleHint || existing.intendedRole || existing.role || 'teacher';
        const updated: UserProfileData = {
          ...existing,
          fullName: existing.fullName || cred.user.displayName || email.split('@')[0],
          intendedRole:
            effectiveRole === 'school_admin' || effectiveRole === 'student'
              ? effectiveRole
              : 'teacher',
          role: effectiveRole,
          defaultDashboardPath: existing.defaultDashboardPath || defaultPathForRole(effectiveRole)
        };
        localStorage.setItem(`profile_${cred.user.uid}`, JSON.stringify(updated));
        setUserProfile(updated);
      }
    } catch (err: any) {
      console.warn('Firebase sign-in error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed sign-in attempts. Please wait a minute or reset your password.');
      } else {
        setError(err.message || 'Failed to sign in. Please verify your connection.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    profile: UserProfileData
  ): Promise<{ verificationEmailSent: boolean }> => {
    clearError();
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (cred.user && profile.fullName) {
        await updateProfile(cred.user, { displayName: profile.fullName });
      }

      let verificationEmailSent = false;
      if (cred.user) {
        try {
          await sendEmailVerification(cred.user);
          verificationEmailSent = true;
          const now = Date.now();
          setVerificationSentAt(now);
          setResendCooldownUntil(now + 45_000);
        } catch (verifyErr) {
          console.warn('sendEmailVerification notice:', verifyErr);
        }
      }

      const intendedRole =
        profile.intendedRole ||
        (profile.role === 'school_admin' || profile.role === 'student'
          ? profile.role
          : 'teacher');

      const enriched: UserProfileData = {
        ...profile,
        intendedRole,
        role: intendedRole,
        defaultDashboardPath:
          profile.defaultDashboardPath || defaultPathForRole(intendedRole)
      };
      localStorage.setItem(`profile_${cred.user.uid}`, JSON.stringify(enriched));
      setUserProfile(enriched);
      setEmailVerified(computeEffectiveEmailVerified(cred.user));
      return { verificationEmailSent };
    } catch (err: any) {
      console.warn('Firebase registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please switch to Sign In.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Registration failed. Please check your details.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (roleHint: AccountRole = 'teacher') => {
    clearError();
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await cred.user.getIdToken(true).catch(() => {});
      await drillService.hydrateFromFirestore(cred.user.uid).catch(() => {});
      const intendedRole =
        roleHint === 'school_admin' || roleHint === 'student' ? roleHint : 'teacher';
      const profile: UserProfileData = {
        fullName: cred.user.displayName || cred.user.email?.split('@')[0] || 'Educator',
        intendedRole,
        role: intendedRole,
        defaultDashboardPath: defaultPathForRole(intendedRole)
      };
      localStorage.setItem(`profile_${cred.user.uid}`, JSON.stringify(profile));
      setUserProfile(profile);
      setEmailVerified(true);
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in could not be completed.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    clearError();
    if (!email || !email.trim()) {
      setError('Enter your registered email address first to receive a password reset link.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Could not send password reset email.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setEmailVerified(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        emailVerified,
        verificationSentAt,
        resendCooldownSec,
        loading,
        error,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        reloadAndCheckEmailVerified,
        resendVerificationEmail,
        updateUserProfile,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
