import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  User as UserIcon, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  GraduationCap, 
  Users, 
  Stethoscope, 
  Phone, 
  Sparkles, 
  Star, 
  Scan, 
  GitBranch, 
  Layers, 
  BookOpen, 
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useAuth, UserProfileData } from '../../firebase/authContext';
import { LeafBorder } from '../common/LeafBorder';
import { Tilt3D } from '../common/Tilt3D';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'signin',
  onClose,
  onSuccess
}) => {
  const { 
    user, 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    loading, 
    error, 
    clearError 
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [role, setRole] = useState<'student' | 'parent' | 'responder'>('student');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('School First-Aid Club');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleMode = (newMode: 'signin' | 'signup') => {
    clearError();
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        setAuthSuccessMsg('Signed in successfully!');
      } else {
        const profile: UserProfileData = {
          role,
          fullName,
          username,
          phone,
          source
        };
        await signUpWithEmail(email, password, profile);
        setAuthSuccessMsg('Account created successfully!');
      }
      setTimeout(() => {
        setAuthSuccessMsg(null);
        onSuccess();
        onClose();
      }, 1000);
    } catch {
      // Error handled by AuthContext
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await signInWithGoogle();
      setAuthSuccessMsg('Connected with Google!');
      setTimeout(() => {
        setAuthSuccessMsg(null);
        onSuccess();
        onClose();
      }, 1000);
    } catch {
      // Handled by context
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[92vh]">
        <LeafBorder side="left" className="opacity-50" />
        
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/90 text-ink-muted hover:text-ink hover:bg-base btn-press shadow-xs"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ========================================== */}
        {/* LEFT COLUMN: AUTHENTICATION FORM */}
        {/* ========================================== */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 overflow-y-auto border-b md:border-b-0 md:border-r border-border flex flex-col justify-between">
          <div>
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6 text-primary">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  <line x1="12" y1="8" x2="12" y2="16" stroke="#F0A85B" strokeWidth="2.5" />
                  <line x1="8" y1="12" x2="16" y2="12" stroke="#F0A85B" strokeWidth="2.5" />
                </svg>
              </div>
              <div>
                <span className="font-display-italic text-2xl font-bold text-ink leading-none block">
                  Sanjeevani
                </span>
                <span className="text-[10px] font-bold tracking-widest text-accent uppercase">
                  INDIA'S AI FIRST-AID INTELLIGENCE
                </span>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1 mb-6">
              <h2 className="text-2xl font-bold text-ink">
                {mode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
              </h2>
              <p className="text-xs text-ink-muted">
                {mode === 'signin' 
                  ? 'Access your saved incident logs, practice badges & offline emergency guides.' 
                  : 'Join thousands of students and parents taking charge of classroom and home safety.'}
              </p>
            </div>

            {/* Segmented Sign In / Create Account Toggle */}
            <div className="flex p-1 rounded-2xl bg-base border border-border mb-5">
              <button
                type="button"
                onClick={() => handleToggleMode('signin')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold btn-press transition-all ${
                  mode === 'signin' 
                    ? 'bg-surface text-ink shadow-xs border border-border' 
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode('signup')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold btn-press transition-all ${
                  mode === 'signup' 
                    ? 'bg-surface text-ink shadow-xs border border-border' 
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Role Selector (Sign Up only) */}
            {mode === 'signup' && (
              <div className="space-y-2 mb-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
                  I AM JOINING AS A
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'student', label: 'Student', icon: GraduationCap },
                    { id: 'parent', label: 'Parent', icon: Users },
                    { id: 'responder', label: 'Counselor', icon: Stethoscope }
                  ].map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id as typeof role)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold btn-press transition-all ${
                          isSelected 
                            ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs' 
                            : 'bg-surface border-border text-ink hover:bg-base'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2.5 py-2.5 px-4 rounded-xl border border-border bg-surface text-xs font-bold text-ink hover:bg-base btn-press transition-all mb-4"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center mb-4">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold tracking-widest text-ink-muted uppercase">
                OR WITH EMAIL
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            {/* Feedback Banners */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-alert/10 border border-alert/30 text-xs text-alert flex items-start space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {authSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-success/10 border border-success/30 text-xs text-success flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-ink-muted" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Shaurya Verma"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-surface text-xs text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <Sparkles className="absolute left-3 top-3 h-4 w-4 text-ink-muted" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. LifeSaver01"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-surface text-xs text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-ink-muted" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-surface text-xs text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                      How did you hear about Sanjeevani?
                    </label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option>School First-Aid Club</option>
                      <option>Parent Recommendation</option>
                      <option>Teacher / School Nurse</option>
                      <option>Social Media & News</option>
                      <option>Community Health Event</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-ink-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-surface text-xs text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-ink-muted">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => alert('Password reset email feature: Please contact your school administrator or enter your registered email.')}
                      className="text-[11px] font-bold text-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-ink-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-border bg-surface text-xs text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-ink-muted hover:text-ink"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-accent to-[#E08A35] text-ink font-bold text-xs shadow-md shadow-accent/20 hover:brightness-105 btn-press transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === 'signin' ? 'Sign In to Dashboard' : 'Complete Registration'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: VALUE PROPOSITION & REVIEWS */}
        {/* ========================================== */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 bg-base/50 overflow-y-auto space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>FREE FOR EVERYONE</span>
            </div>

            {/* Headline & Sub-copy */}
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold text-ink leading-tight">
                Everything You Need When Someone Gets Hurt
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Get free access to our phone camera helper, step-by-step instructions, steady CPR beat counter, and practice quizzes.
              </p>
            </div>

            {/* Feature Cards Grid (matching Image 2 & 3) */}
            <div className="space-y-2.5">
              {[
                {
                  icon: Scan,
                  title: 'Camera First-Aid Helper',
                  desc: 'Uses your phone camera to help you position your hands for CPR and check wounds — private and offline.'
                },
                {
                  icon: GitBranch,
                  title: 'Doctor-Approved Safe Steps',
                  desc: 'Clear, step-by-step instructions tested and verified by healthcare professionals.'
                },
                {
                  icon: Layers,
                  title: 'Screen Guides & Steady Beat',
                  desc: 'Shows where to push on your camera screen and counts a steady 110 beats per minute.'
                },
                {
                  icon: BookOpen,
                  title: 'Offline First-Aid Guide',
                  desc: '100+ easy guides you can read anywhere with zero cell service or Wi-Fi.'
                },
                {
                  icon: FileText,
                  title: 'Instant Incident Notes',
                  desc: 'Quick summary of what you did that you can easily share with parents or school nurses.'
                }
              ].map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <Tilt3D key={idx} maxTilt={6} className="w-full">
                    <div className="p-3 rounded-2xl bg-surface border border-border flex items-start space-x-3 shadow-2xs hover:border-primary/40 transition-colors">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                        <Icon className="w-4 h-4" strokeWidth={1.75} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink">{feat.title}</h4>
                        <p className="text-[11px] text-ink-muted leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  </Tilt3D>
                );
              })}
            </div>

            {/* Student & Parent Reviews (matching Image 3 & 4) */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-accent uppercase tracking-wider flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  STUDENT & PARENT REVIEWS
                </span>
                <span className="text-[11px] font-semibold text-ink-muted">Verified Feedback</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-surface border border-border space-y-2 shadow-2xs">
                  <div className="flex text-accent space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-accent" />
                    ))}
                  </div>
                  <p className="text-[11px] italic text-ink leading-relaxed">
                    "Sanjeevani's CPR metronome and AR placement gave our high school first-aid club immense confidence. Truly lifesaving."
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      SS
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-ink block leading-none">Suryansh Singh</span>
                      <span className="text-[9px] text-ink-muted">Grade 12, Seth M.R Jaipuria School</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface border border-border space-y-2 shadow-2xs">
                  <div className="flex text-accent space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-accent" />
                    ))}
                  </div>
                  <p className="text-[11px] italic text-ink leading-relaxed">
                    "As a parent, having an app that doesn't panic and guides my kids through burns and cuts with zero confusion is priceless."
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-ink">
                      SV
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-ink block leading-none">Satendra Verma</span>
                      <span className="text-[9px] text-ink-muted">Working Parent & PTA Lead</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-[10px] text-ink-muted">
            <span>Sanjeevani V.2.0.0</span>
            <span>Firebase Connected (sanjeevani-v2)</span>
          </div>
        </div>

      </div>
    </div>
  );
};
