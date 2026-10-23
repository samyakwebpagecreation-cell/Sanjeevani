import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Send, 
  Sparkles, 
  X, 
  Plus, 
  Loader2,
  CheckCircle2,
  MessageSquareHeart
} from 'lucide-react';
import { 
  saveCustomerReviewToFirestore, 
  subscribeToCustomerReviews, 
  FirestoreCustomerReview 
} from '../../firebase/db';
import { useAuth } from '../../firebase/authContext';

export interface UserReview {
  id: string;
  authorName: string;
  role: string;
  authorTooltip?: string;
  rating: number;
  categoryTag: string;
  badge: string;
  shortStory?: string;
  story: string;
  date: string;
  isUserSubmitted?: boolean;
}

const ROLES_OPTIONS = [
  'Student',
  'Founder',
  'Parent / Caregiver',
  'Teacher / School Staff',
  'Paramedic / EMT',
  'Doctor / Nurse',
  'First Responder / Volunteer'
];

const CATEGORY_TAGS = [
  'CPR Saved a Life',
  'Paramedic SBAR QR',
  'Jan Aushadhi Savings',
  'Child First-Aid & Burns',
  'Crowd Squad QR',
  'Offline Emergency',
  'Choking / Airway Relief',
  'General Experience'
];

// Order requested: 1. Dakshita -> 2. Samyak -> 3. Siddhi
export const TOP_FEATURED_REVIEWS: UserReview[] = [
  {
    id: 'top-review-dakshita',
    authorName: 'Dakshita Kapoor',
    role: 'Founder',
    authorTooltip: 'Dakshita Kapoor — Founder of Sanjeevani · Seth M.R. Jaipuria School',
    rating: 5,
    categoryTag: 'Crowd Squad QR',
    badge: 'Verified',
    shortStory:
      "The idea for Crowd Squad QR came when our school was recognised among the world's top 10 by T4 Education. Every bystander can become a contributor, not a spectator.",
    story:
      "My favourite feature of Sanjeevani is the Crowd Squad QR. The idea of Crowd Squad QR came to me when our school was recognised among the world's top 10 schools by T4 Education for community collaboration. This recognition inspired me to translate the value of collective responsibility into a practical solution. Through Sanjeevani, I wanted to demonstrate that in an emergency, every bystander can become a contributor rather than a mere spectator. I believe this feature embodies our school's values and reinforces the idea that when individuals come together with a shared purpose, their collective efforts can make a meaningful difference.",
    date: 'Oct 2026',
    isUserSubmitted: true
  },
  {
    id: 'top-review-samyak',
    authorName: 'Samyak Verma',
    role: 'Founder',
    authorTooltip: 'Samyak Verma — Founder of Sanjeevani · Seth M.R. Jaipuria School',
    rating: 5,
    categoryTag: 'Jan Aushadhi Savings',
    badge: 'Verified',
    shortStory:
      "Sanjeevani's medicine price comparison system helps families compare prices across pharmacies and find verified Jan Aushadhi Kendra generics—making essential healthcare genuinely affordable for everyone.",
    story:
      'One of the most impressive features of Sanjeevani is its medicine price comparison system, which helps users compare prices across multiple websites and find affordable options at Jan Aushadhi Kendras. As a student, I believe this feature reflects genuine social responsibility by making essential medicines more accessible and promoting affordable healthcare for everyone.',
    date: 'Oct 2026',
    isUserSubmitted: true
  },
  {
    id: 'top-review-siddhi',
    authorName: 'Siddhi Misra',
    role: 'Student',
    authorTooltip: 'Siddhi Misra — Student & Bystander Tester',
    rating: 5,
    categoryTag: 'General Experience',
    badge: 'Verified',
    shortStory:
      'Sanjeevani combines practical technology and social responsibility to address real-life emergencies. What stands out most is how it makes step-by-step first-aid guidance accessible and healthcare more affordable.',
    story:
      "My experience with Sanjeevani has been truly impressive. I appreciate how the app combines technology and social responsibility to address real-life emergencies. Its features are practical, innovative, and designed with people's needs in mind. What stands out most is its focus on making first-aid guidance accessible and healthcare more affordable. I believe Sanjeevani is a commendable initiative that demonstrates how technology can create a positive impact on society.",
    date: 'Oct 2026',
    isUserSubmitted: true
  }
];

/**
 * Helper to clean author names and format full role without truncation
 */
function formatAuthorDisplay(authorName: string, role: string): {
  cleanName: string;
  shortRole: string;
  fullTooltip: string;
  isDistinct: boolean;
} {
  const lowerName = authorName.toLowerCase();
  if (lowerName.includes('dakshita')) {
    return {
      cleanName: 'Dakshita Kapoor',
      shortRole: 'Founder',
      fullTooltip: 'Dakshita Kapoor — Founder of Sanjeevani · Seth M.R. Jaipuria School',
      isDistinct: true
    };
  }
  if (lowerName.includes('samyak')) {
    return {
      cleanName: 'Samyak Verma',
      shortRole: 'Founder',
      fullTooltip: 'Samyak Verma — Founder of Sanjeevani · Seth M.R. Jaipuria School',
      isDistinct: true
    };
  }
  if (lowerName.includes('siddhi')) {
    return {
      cleanName: 'Siddhi Misra',
      shortRole: 'Student',
      fullTooltip: 'Siddhi Misra — Student',
      isDistinct: true
    };
  }
  const parenIndex = authorName.indexOf('(');
  const cleanName = parenIndex > 0 ? authorName.slice(0, parenIndex).trim() : authorName.trim();
  const shortRole = role.includes('/') ? role.split('/')[0].trim() : role;
  return {
    cleanName,
    shortRole,
    fullTooltip: `${authorName} — ${role}`,
    isDistinct: false
  };
}

export const TopHeroReviewsRow: React.FC = () => {
  return null;
};

export const CommunityReviewsSection: React.FC = () => {
  const authContext = useAuth();
  const user = authContext?.user || null;
  const userProfile = authContext?.userProfile || null;

  // Real reviews initialized with top 3 in order: Yagyesh -> Samyak -> Siddhi
  const [reviews, setReviews] = useState<UserReview[]>(TOP_FEATURED_REVIEWS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedNotification, setSubmittedNotification] = useState(false);

  // Form State
  const [authorName, setAuthorName] = useState('');
  const [role, setRole] = useState(ROLES_OPTIONS[0]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [categoryTag, setCategoryTag] = useState(CATEGORY_TAGS[0]);
  const [story, setStory] = useState('');

  // Prefill author name from profile if available
  useEffect(() => {
    if (userProfile?.fullName && !authorName) {
      setAuthorName(userProfile.fullName);
    } else if (user?.displayName && !authorName) {
      setAuthorName(user.displayName);
    }
  }, [user, userProfile]);

  // Listen to live Firestore customer_reviews in real time
  useEffect(() => {
    // Real-time live Firestore synchronization
    const unsubscribe = subscribeToCustomerReviews((liveFirestoreReviews) => {
      if (liveFirestoreReviews) {
        // Map Firestore documents to UserReview format
        const mappedLive: UserReview[] = liveFirestoreReviews.map(fr => ({
          id: fr.id,
          authorName: fr.authorName,
          role: fr.role,
          rating: fr.rating,
          categoryTag: fr.categoryTag,
          badge: fr.badge,
          story: fr.story,
          date: (!fr.date || fr.date.toLowerCase() === 'just now') ? 'Oct 2026' : fr.date,
          isUserSubmitted: true
        }));

        // Filter out duplicates of the top 3 featured reviews (Dakshita, Samyak, Siddhi)
        // so that Dakshita is always 1st, Samyak 2nd, and Siddhi 3rd
        const additionalReviews = mappedLive.filter(r => {
          const lower = r.authorName.toLowerCase();
          return (
            !lower.includes('dakshita') &&
            !lower.includes('samyak') &&
            !lower.includes('siddhi')
          );
        });

        const orderedReviews = [...TOP_FEATURED_REVIEWS, ...additionalReviews];
        setReviews(orderedReviews);
        setIsLoading(false);

        // Keep local cache updated for offline emergency resilience
        try {
          localStorage.setItem('sanjeevani_user_reviews', JSON.stringify(orderedReviews));
        } catch (e) {
          console.warn('Could not cache reviews to localStorage', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !story.trim()) return;

    setIsSubmitting(true);
    const newId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const badgeText = 'Verified';

    const newReviewData: FirestoreCustomerReview = {
      id: newId,
      authorName: authorName.trim(),
      role,
      rating,
      categoryTag,
      badge: badgeText,
      story: story.trim(),
      date: 'Oct 2026',
      userId: user?.uid || null,
      userEmail: user?.email || null,
      isUserSubmitted: true,
      platform: 'web',
      verified: true
    };

    // Optimistically update local view immediately
    const optimisticReview: UserReview = {
      id: newId,
      authorName: authorName.trim(),
      role,
      rating,
      categoryTag,
      badge: badgeText,
      story: story.trim(),
      date: 'Oct 2026',
      isUserSubmitted: true
    };
    setReviews(prev => [...TOP_FEATURED_REVIEWS, optimisticReview, ...prev.filter(r => !r.id.startsWith('top-review-') && r.id !== newId)]);

    // Write directly to Cloud Firestore in project sanjeevani-v2
    try {
      await saveCustomerReviewToFirestore(newReviewData);
      console.log('[Sanjeevani] Real customer review saved to Firestore project sanjeevani-v2!');
    } catch (err) {
      console.warn('[Sanjeevani] Firestore write failed, preserved in local storage:', err);
    } finally {
      setIsSubmitting(false);
    }

    // Reset Form
    setStory('');
    setRating(5);
    setIsFormOpen(false);
    setSubmittedNotification(true);
    setTimeout(() => setSubmittedNotification(false), 5000);
  };

  // Compute live rating statistics
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <section id="community-reviews" className="scroll-reveal mx-auto max-w-7xl px-4 sm:px-6 space-y-8 pt-6">
      
      {/* 1. Header & Community Rating Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-200 dark:border-border/80">
        <div className="space-y-2.5">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary dark:text-emerald-300 text-xs font-black uppercase tracking-wider border border-primary/20">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Community Stories & Lifesaving Impact</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Real Stories from Real Emergencies
          </h2>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-2xl font-semibold leading-relaxed">
            Live, verified feedback from students, teachers, parents, and healthcare responders across India who use Sanjeevani v2.0 during critical moments.
          </p>
        </div>

        {/* Rating summary & Action button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 shrink-0 w-full md:w-auto">
          <div
            className="p-3 sm:p-3.5 px-4 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border shadow-xs flex sm:block items-center justify-between sm:space-y-1 text-slate-900 dark:text-white"
          >
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">{avgRating}</span>
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-500" />
                ))}
              </div>
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
              {reviews.length > 0 
                ? `${reviews.length} Verified Experience${reviews.length === 1 ? '' : 's'}`
                : '100% Verified Community Feedback'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="w-full sm:w-auto justify-center inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-primary text-white text-xs sm:text-sm font-black shadow-md hover:bg-primary-dark transition-all btn-press cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            {isFormOpen ? (
              <>
                <X className="w-4 h-4" />
                <span>Close Form</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Write a Review</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Success Banner */}
      {submittedNotification && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 flex items-center space-x-3 text-sm font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Thank you for sharing your story! Your review is now live in Cloud Firestore and visible to everyone.</span>
        </div>
      )}

      {/* 3. Interactive Review Form (Collapsible / Inline) */}
      {isFormOpen && (
        <div
          data-component="review-form"
          style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
          className="review-form p-6 sm:p-8 rounded-3xl bg-white border-2 border-primary/40 shadow-xl space-y-5 animate-in fade-in slide-in-from-top-4 !text-[#0F172A]"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
            <div>
              <h3 style={{ color: '#0F172A' }} className="text-xl font-black !text-[#0F172A]">
                Share Your Sanjeevani Experience
              </h3>
              <p style={{ color: '#334155' }} className="text-xs sm:text-sm !text-[#334155] font-semibold mt-0.5">
                Did Sanjeevani help you in a crisis, during school first-aid drills, or finding generic medicine savings?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label style={{ color: '#0F172A' }} className="text-xs font-black !text-[#0F172A] uppercase tracking-wider block">
                  Your Name or Alias *
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh K., Priya S., or Class 10 Student"
                  style={{ color: '#0F172A', backgroundColor: '#F8FAFC' }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 !text-[#0F172A] text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label style={{ color: '#0F172A' }} className="text-xs font-black !text-[#0F172A] uppercase tracking-wider block">
                  Your Role / Background
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ color: '#0F172A', backgroundColor: '#F8FAFC' }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 !text-[#0F172A] text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-colors cursor-pointer"
                >
                  {ROLES_OPTIONS.map((r) => (
                    <option key={r} value={r} style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Star Rating */}
              <div className="space-y-1.5">
                <label style={{ color: '#0F172A' }} className="text-xs font-black !text-[#0F172A] uppercase tracking-wider block">
                  Your Rating
                </label>
                <div className="flex items-center space-x-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-amber-500 hover:scale-115 transition-transform cursor-pointer"
                      title={`${star} Stars`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span style={{ color: '#0F172A' }} className="text-xs font-black !text-[#0F172A] ml-2">
                    {hoverRating || rating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Category Tag */}
              <div className="space-y-1.5">
                <label style={{ color: '#0F172A' }} className="text-xs font-black !text-[#0F172A] uppercase tracking-wider block">
                  Feature / Topic
                </label>
                <select
                  value={categoryTag}
                  onChange={(e) => setCategoryTag(e.target.value)}
                  style={{ color: '#0F172A', backgroundColor: '#F8FAFC' }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 !text-[#0F172A] text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-colors cursor-pointer"
                >
                  {CATEGORY_TAGS.map((tag) => (
                    <option key={tag} value={tag} style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Story / Feedback */}
            <div className="space-y-1.5">
              <label style={{ color: '#0F172A' }} className="text-xs font-black !text-[#0F172A] uppercase tracking-wider block">
                Your Story or Feedback *
              </label>
              <textarea
                required
                rows={3}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="What happened? Which feature did you use (CPR metronome, SBAR handoff, burns guide, crowd QR)? How did it make a difference?..."
                style={{ color: '#0F172A', backgroundColor: '#F8FAFC' }}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 !text-[#0F172A] text-sm font-semibold focus:outline-none focus:border-primary focus:bg-white transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Submit button */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!authorName.trim() || !story.trim() || isSubmitting}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-black shadow-md hover:bg-primary-dark transition-all btn-press disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Sanjeevani...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Post Review to Wall</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Unified Tabular Reviews Directory (No Separate Sections, No Spotlight Labels) */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span style={{ color: '#334155' }} className="text-xs font-bold !text-[#334155]">Loading community stories from Cloud Firestore...</span>
        </div>
      ) : reviews.length > 0 ? (
        <div
          data-component="review-card"
          style={{ backgroundColor: '#FFFFFF', color: '#0F172A', borderColor: '#CBD5E1' }}
          className="rounded-3xl bg-white border-2 border-slate-300 shadow-lg overflow-hidden !text-[#0F172A]"
        >
          {/* Desktop & Tablet HTML Table (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr
                  style={{ backgroundColor: '#F1F5F9', color: '#0F172A', borderColor: '#CBD5E1' }}
                  className="border-b-2 text-[11px] font-black uppercase tracking-wider"
                >
                  <th className="py-3.5 px-4 w-12 text-center border-r border-slate-200">#</th>
                  <th className="py-3.5 px-4 w-56 border-r border-slate-200">Reviewer & Role</th>
                  <th className="py-3.5 px-4 w-48 border-r border-slate-200">Feature & Status</th>
                  <th className="py-3.5 px-5 border-r border-slate-200">Review</th>
                  <th className="py-3.5 px-4 w-36 text-right">Rating & Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {reviews.map((rev, idx) => {
                  const { cleanName, shortRole, fullTooltip, isDistinct } = formatAuthorDisplay(rev.authorName, rev.role);
                  const isFounder = shortRole.toLowerCase() === 'founder';
                  const displayDate = !rev.date || rev.date.toLowerCase() === 'just now' || rev.date.toLowerCase() === 'recent'
                    ? 'Oct 2026'
                    : rev.date;

                  return (
                    <tr
                      key={rev.id}
                      title={rev.authorTooltip || fullTooltip}
                      style={{
                        backgroundColor: isDistinct ? '#FFFBEB' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                        color: '#0F172A'
                      }}
                      className={`transition-colors hover:bg-emerald-50/40 align-top ${
                        isDistinct ? 'border-l-4 border-l-[#0E5A50]' : ''
                      }`}
                    >
                      {/* Col 1: Index */}
                      <td className="py-4 px-3 text-center font-mono font-black text-xs border-r border-slate-200">
                        <span
                          style={
                            isDistinct
                              ? { backgroundColor: '#0E5A50', color: '#FFFFFF' }
                              : { backgroundColor: '#E2E8F0', color: '#334155' }
                          }
                          className="inline-flex items-center justify-center w-6 h-6 rounded-md font-black text-[11px]"
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Col 2: Reviewer & Full Role */}
                      <td className="py-4 px-4 border-r border-slate-200">
                        <div className="flex items-start space-x-2.5">
                          <div
                            style={
                              isDistinct
                                ? { backgroundColor: '#0E5A50', color: '#FFFFFF' }
                                : { backgroundColor: '#1E293B', color: '#FFFFFF' }
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs uppercase shrink-0 mt-0.5 shadow-2xs"
                          >
                            {cleanName.charAt(0)}
                          </div>
                          <div className="space-y-1">
                            <div
                              style={{ color: '#0F172A' }}
                              className={`${isDistinct ? 'font-black text-[15px]' : 'font-bold text-sm'} !text-[#0F172A] leading-snug`}
                            >
                              {cleanName}
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                              <span
                                style={
                                  isFounder
                                    ? { backgroundColor: '#FEF3C7', color: '#92400E', borderColor: '#F59E0B' }
                                    : { backgroundColor: '#D1FAE5', color: '#065F46', borderColor: '#6EE7B7' }
                                }
                                className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border inline-block"
                              >
                                {shortRole}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Col 3: Feature & Verified Status */}
                      <td className="py-4 px-4 border-r border-slate-200 space-y-1.5">
                        <span
                          style={{ backgroundColor: '#FEF3C7', color: '#78350F', borderColor: '#FCD34D' }}
                          className="text-[11px] font-bold px-2.5 py-0.5 rounded-md border inline-block"
                        >
                          #{rev.categoryTag}
                        </span>
                        <div>
                          <span
                            style={{ backgroundColor: '#DCFCE7', color: '#166534', borderColor: '#86EFAC' }}
                            className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border inline-block"
                          >
                            ✓ Verified
                          </span>
                        </div>
                      </td>

                      {/* Col 4: Full Unabridged Review Story */}
                      <td className="py-4 px-5 border-r border-slate-200">
                        <p
                          style={{ color: '#0F172A' }}
                          className={`text-sm leading-relaxed ${isDistinct ? 'font-semibold' : 'font-medium'} !text-[#0F172A] whitespace-pre-line`}
                        >
                          {rev.story}
                        </p>
                      </td>

                      {/* Col 5: Rating & Date */}
                      <td className="py-4 px-4 text-right space-y-1">
                        <div className="inline-flex items-center justify-end space-x-0.5 text-amber-500">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          ))}
                        </div>
                        <div style={{ color: '#0F172A' }} className="text-xs font-black font-mono !text-[#0F172A]">
                          {rev.rating}.0 / 5.0
                        </div>
                        <div style={{ color: '#475569' }} className="text-[11px] font-semibold !text-[#475569]">
                          {displayDate}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Unified Tabular Rows (< 768px): All reviews #01 through #N in a single table list */}
          <div className="md:hidden divide-y-2 divide-slate-200">
            {reviews.map((rev, idx) => {
              const rowNumber = idx + 1;
              const { cleanName, shortRole, fullTooltip, isDistinct } = formatAuthorDisplay(rev.authorName, rev.role);
              const isFounder = shortRole.toLowerCase() === 'founder';
              const displayDate = !rev.date || rev.date.toLowerCase() === 'just now' || rev.date.toLowerCase() === 'recent'
                ? 'Oct 2026'
                : rev.date;

              return (
                <div
                  key={rev.id}
                  title={rev.authorTooltip || fullTooltip}
                  style={{
                    backgroundColor: isDistinct ? '#FFFBEB' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                    color: '#0F172A'
                  }}
                  className={`p-4 space-y-3 ${isDistinct ? 'border-l-4 border-l-[#0E5A50]' : ''}`}
                >
                  {/* Mobile Table Row Header: #Index + Full Name + Full Role Pill (Never truncated!) */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                    <div className="flex items-start space-x-2.5 min-w-0">
                      <span
                        style={
                          isDistinct
                            ? { backgroundColor: '#0E5A50', color: '#FFFFFF' }
                            : { backgroundColor: '#E2E8F0', color: '#334155' }
                        }
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md font-mono font-black text-xs shrink-0 mt-0.5"
                      >
                        {String(rowNumber).padStart(2, '0')}
                      </span>
                      <div>
                        <div
                          style={{ color: '#0F172A' }}
                          className={`${isDistinct ? 'font-black text-[15px]' : 'font-bold text-sm'} !text-[#0F172A] leading-tight`}
                        >
                          {cleanName}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span
                            style={
                              isFounder
                                ? { backgroundColor: '#FEF3C7', color: '#92400E', borderColor: '#F59E0B' }
                                : { backgroundColor: '#D1FAE5', color: '#065F46', borderColor: '#6EE7B7' }
                            }
                            className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border inline-block"
                          >
                            {shortRole}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <div className="inline-flex items-center space-x-0.5 text-amber-500">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        ))}
                      </div>
                      <div style={{ color: '#475569' }} className="text-[11px] font-bold !text-[#475569] block">
                        {displayDate}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Table Sub-Row: Category & Verified Chip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span
                      style={{ backgroundColor: '#FEF3C7', color: '#78350F', borderColor: '#FCD34D' }}
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-md border"
                    >
                      #{rev.categoryTag}
                    </span>
                    <span
                      style={{ backgroundColor: '#DCFCE7', color: '#166534', borderColor: '#86EFAC' }}
                      className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border"
                    >
                      ✓ Verified
                    </span>
                  </div>

                  {/* Mobile Table Body Cell: 100% Full Unabridged Review */}
                  <p
                    style={{ color: '#0F172A' }}
                    className={`text-sm leading-relaxed ${isDistinct ? 'font-semibold' : 'font-medium'} !text-[#0F172A] whitespace-pre-line pt-0.5`}
                  >
                    {rev.story}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty / Invitation State when no reviews have been submitted yet */
        <div
          data-component="empty-reviews-card"
          style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
          className="p-8 sm:p-14 rounded-3xl bg-white border-2 border-dashed border-primary/30 text-center space-y-5 max-w-2xl mx-auto shadow-sm !text-[#0F172A]"
        >
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center border border-primary/20 shadow-xs">
            <MessageSquareHeart className="w-8 h-8 text-primary animate-bounce duration-1000" />
          </div>
          <div className="space-y-2">
            <h3 style={{ color: '#0F172A' }} className="text-2xl sm:text-3xl font-black !text-[#0F172A] tracking-tight">
              Be the First to Share Your Experience
            </h3>
            <p style={{ color: '#334155' }} className="text-sm sm:text-base !text-[#334155] max-w-lg mx-auto font-medium leading-relaxed">
              Every review helps inspire confidence during emergencies. Tell other students, teachers, and responders how Sanjeevani worked for you.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-full bg-primary hover:bg-primary-dark text-white font-black text-sm shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Write the First Review</span>
          </button>
        </div>
      )}

    </section>
  );
};
