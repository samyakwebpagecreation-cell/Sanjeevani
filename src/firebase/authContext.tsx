import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from './config';

export interface UserProfileData {
  role?: 'student' | 'parent' | 'responder';
  fullName?: string;
  username?: string;
  phone?: string;
  source?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, profile: UserProfileData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Load stored profile from localStorage if present
        try {
          const saved = localStorage.getItem(`profile_${currentUser.uid}`);
          if (saved) {
            setUserProfile(JSON.parse(saved));
          } else {
            setUserProfile({
              fullName: currentUser.displayName || 'Sanjeevani Responder',
              role: 'student'
            });
          }
        } catch {
          setUserProfile({ role: 'student' });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const signInWithEmail = async (email: string, pass: string) => {
    clearError();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.warn('Firebase sign-in error:', err);
      // Clean up common Firebase error codes into human messages
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Failed to sign in. Please verify your connection.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, profile: UserProfileData) => {
    clearError();
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user && profile.fullName) {
        await updateProfile(cred.user, { displayName: profile.fullName });
      }
      // Save profile metadata
      localStorage.setItem(`profile_${cred.user.uid}`, JSON.stringify(profile));
      setUserProfile(profile);
    } catch (err: any) {
      console.warn('Firebase registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Registration failed. Please check details.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    clearError();
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const profile: UserProfileData = {
        fullName: cred.user.displayName || 'Google User',
        role: 'student'
      };
      localStorage.setItem(`profile_${cred.user.uid}`, JSON.stringify(profile));
      setUserProfile(profile);
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

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
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
