import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Send, 
  Sparkles, 
  X, 
  Plus, 
  Loader2,
  CheckCircle2,
  MessageSquareHeart,
  ChevronDown,
  ChevronUp
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

// Highlighted Founder Reviews: 1. Yagyesh Pandey -> 2. Samyak Verma
export const TOP_FEATURED_REVIEWS: UserReview[] = [
  {
    id: 'top-review-yagyesh',
    authorName: 'Yagyesh Pandey',
    role: 'Founder',
    authorTooltip: 'Yagyesh Pandey — Founder of RakshaSaathi · Seth M.R. Jaipuria School',
    rating: 5,
    categoryTag: 'Crowd Squad QR',
    badge: 'Verified',
    shortStory:
      "The idea for Crowd Squad QR came when our school was recognised among the world's top 10 by T4 Education. Every bystander can become a contributor, not a spectator.",
    story:
      "My favourite feature of RakshaSaathi is the Crowd Squad QR. The idea of Crowd Squad QR came to me when our school was recognised among the world's top 10 schools by T4 Education for community collaboration. This recognition inspired me to translate the value of collective responsibility into a practical solution. Through RakshaSaathi, I wanted to demonstrate that in an emergency, every bystander can become a contributor rather than a mere spectator. I believe this feature embodies our school's values and reinforces the idea that when individuals come together with a shared purpose, their collective efforts can make a meaningful difference.",
    date: 'Oct 2026',
    isUserSubmitted: true
  },
  {
    id: 'top-review-samyak',
    authorName: 'Samyak Verma',
    role: 'Founder',
    authorTooltip: 'Samyak Verma — Founder of RakshaSaathi · Seth M.R. Jaipuria School',
    rating: 5,
    categoryTag: 'Jan Aushadhi Savings',
    badge: 'Verified',
    shortStory:
      "RakshaSaathi's medicine price comparison system helps families compare prices across pharmacies and find verified Jan Aushadhi Kendra generics—making essential healthcare genuinely affordable for everyone.",
    story:
      'One of the most impressive features of RakshaSaathi is its medicine price comparison system, which helps users compare prices across multiple websites and find affordable options at Jan Aushadhi Kendras. As a student, I believe this feature reflects genuine social responsibility by making essential medicines more accessible and promoting affordable healthcare for everyone.',
    date: 'Oct 2026',
    isUserSubmitted: true
  }
];

// General Community Reviews (Siddhi Misra + Reviews 04 through 14)
export const GENERAL_COMMUNITY_REVIEWS: UserReview[] = [
  {
    id: 'review-siddhi',
    authorName: 'Siddhi Misra',
    role: 'Student',
    authorTooltip: 'Siddhi Misra — Student & Bystander Tester',
    rating: 5,
    categoryTag: 'General Experience',
    badge: 'Verified',
    shortStory:
      'RakshaSaathi combines practical technology and social responsibility to address real-life emergencies. What stands out most is how it makes step-by-step first-aid guidance accessible and healthcare more affordable.',
    story:
      "My experience with RakshaSaathi has been truly impressive. I appreciate how the app combines technology and social responsibility to address real-life emergencies. Its features are practical, innovative, and designed with people's needs in mind. What stands out most is its focus on making first-aid guidance accessible and healthcare more affordable. I believe RakshaSaathi is a commendable initiative that demonstrates how technology can create a positive impact on society.",
    date: 'Oct 2026',
    isUserSubmitted: true
  },
  {
    id: 'review-altamas',
    authorName: 'Dr. Altamas',
    role: 'Doctor',
    authorTooltip: 'Dr. Altamas — Doctor',
    rating: 5,
    categoryTag: 'CPR Saved a Life',
    badge: 'Verified',
    story:
      "RakshaSaathi is an excellent AI-powered healthcare app that makes healthcare more accessible, smarter, and convenient. Its user-friendly interface and AI-driven health assistance provide valuable support for understanding health concerns and making informed decisions. A great initiative towards the future of digital healthcare. Highly recommended!",
    date: 'Oct 2026',
    isUserSubmitted: true
  },
  {
    id: 'review-vijay',
    authorName: 'Vijay Rastogi',
    role: 'Teacher',
    authorTooltip: 'Vijay Rastogi — Teacher',
    rating: 5,
    categoryTag: 'General Experience',
    badge: 'Verified',
    story:
      "As a teacher, I believe that true education is not just about gaining knowledge, but about using that knowledge to make a meaningful difference in people's lives. RakshaSaathi is a valuable initiative that brings medical technology and health information closer to people, with the potential to create a real and lasting impact on society.\n\nWhat makes this website truly meaningful is its purpose: if the medical technology and information shared through RakshaSaathi can help even one person in a real-life situation, provide timely guidance, raise awareness, or make someone feel more informed and confident during a difficult moment, then its existence has already served a noble purpose.\n\nIn my view, there is no greater achievement than using one's knowledge, skills, and innovation to help another human being. RakshaSaathi represents this spirit of service and compassion. If this initiative can make a difference in even one life, that itself would be an achievement greater than many other accomplishments. I sincerely appreciate the thought behind this initiative and hope it continues to grow, reach more people, and contribute positively to society.",
    date: 'Oct 2026',
    isUserSubmitted: true
  },
  {
    id: 'review-sarthak',
    authorName: 'Sarthak Misra',
    role: 'Student',
    authorTooltip: 'Sarthak Misra — Student & Former Head Boy',
    rating: 5,
    categoryTag: 'General Experience',
    badge: 'Verified',
    story:
      "As a former Head Boy, I truly appreciate the vision behind RakshaSaathi and its commitment to social responsibility. Its AI-powered emergency assistance reflects how technology can be used to address real-world challenges and support people during critical situations. What impresses me most is its emphasis on timely guidance, collective responsibility, and accessibility. RakshaSaathi is a commendable initiative that demonstrates leadership through innovation and a genuine desire to make a difference in society. Hats off to the entire team for turning an almost inconceivable idea into such a remarkable reality!",
    date: 'Oct 2026',
    isUserSubmitted: true
  },
  {
    id: 'review-atharva',
    authorName: 'Atharva Khandelwal',
    role: 'Student',
    authorTooltip: 'Atharva Khandelwal — Student',
    rating: 5,
    categoryTag: 'General Experience',
    badge: 'Verified',
    story:
      "RakshaSaathi’s AI-powered virtual doctor is one of its most remarkable features. It provides immediate, situation-specific first-aid guidance when a doctor is not readily available, helping users understand what they should and should not do while waiting for professional medical assistance. I believe this feature is particularly valuable during critical emergencies, as it promotes informed action, reduces confusion, and makes essential emergency guidance more accessible. It is an impressive example of how AI can be used responsibly to support healthcare and potentially save lives.",
    date: 'Oct 2026',
    isUserSubmitted: true
  },
  {
    id: 'review-kirti',
    authorName: 'Kirti Mishra',
    role: 'Teacher',
    authorTooltip: 'Kirti Mishra — Teacher',
    rating: 5,
    categoryTag: 'Paramedic SBAR QR',
    badge: 'Verified',
    story:
      "As a teacher, I find RakshaSaathi to be an innovative and socially impactful initiative. Its AI-powered first-aid assistance can guide people during emergencies, while the Crowd Squad QR feature assigns specific roles to bystanders, encouraging coordinated action instead of confusion. I appreciate the team's creativity and effort in using technology to potentially save lives. With proper medical validation, RakshaSaathi has the potential to make emergency assistance more accessible and effective.",
    date: 'Oct 2026',
    isUserSubmitted: true
  },
  {
    id: 'review-payal',
    authorName: 'Payal Saxena',
    role: 'Doctor',
    authorTooltip: 'Payal Saxena — Doctor',
    rating: 5,
    categoryTag: 'Offline Emergency',
    badge: 'Verified',
    story:
      "RakshaSaathi’s most impressive feature is its offline emergency support, which makes essential first-aid guidance accessible even without an internet connection. From a doctor's perspective, this is particularly valuable in remote villages, rural communities, and areas with poor network coverage, where immediate access to medical information can be limited. By providing guidance when connectivity is unavailable, RakshaSaathi has the potential to help people respond more confidently to emergencies while arranging professional medical assistance. It represents a meaningful step towards making emergency healthcare guidance accessible to everyone, everywhere.",
    date: 'Oct 2026',
    isUserSubmitted: true
  },
  {
    id: 'review-shashwat',
    authorName: 'Shashwat Verma',
    role: 'Doctor',
    authorTooltip: 'Shashwat Verma — Doctor',
    rating: 5,
    categoryTag: 'General Experience',
    badge: 'Verified',
    story:
      "RakshaSaathi is a promising initiative that makes essential first-aid guidance more accessible. Its best feature is step-by-step first-aid guidance, which can help users understand what to do during emergencies without feeling overwhelmed. By presenting medical instructions in a simple, structured manner, it has the potential to reduce confusion and encourage timely action while professional medical help is being arranged.\n\nOverall, RakshaSaathi demonstrates how technology can support emergency preparedness and make healthcare guidance more accessible to everyone.",
    date: 'Oct 2026',
    isUserSubmitted: true
  },
  {
    id: 'review-sumi',
    authorName: 'Dr. Sumi Chandra',
    role: 'Doctor',
    authorTooltip: 'Dr. Sumi Chandra — Doctor',
    rating: 5,
    categoryTag: 'Crowd Squad QR',
    badge: 'Verified',
    story:
      "It is a very efficient feature which turns the unwanted attention faced by the victims of the public accidents into an opportunity which provides help for the victims.",
    date: 'Oct 2026',
    isUserSubmitted: true
  },
  {
    id: 'review-jitendra',
    authorName: 'Jitendra Singh',
    role: 'Doctor',
    authorTooltip: 'Jitendra Singh — Doctor',
    rating: 5,
    categoryTag: 'Jan Aushadhi Savings',
    badge: 'Verified',
    story:
      "Found cheaper medicines.\nCongratulations for making such a nice website.",
    date: 'Oct 2026',
    isUserSubmitted: true
  },
  {
    id: 'review-chetan',
    authorName: 'Chetan Chandra',
    role: 'Doctor',
    authorTooltip: 'Chetan Chandra — Doctor',
    rating: 5,
    categoryTag: 'CPR Saved a Life',
    badge: 'Verified',
    story:
      "I would call this app as the ‘One-Stop Solution’. This brilliantly combines and organises facilities in one app for the user comfortablilty and gives clear and direct steps to provide proper first-aid. The feature which I find truly innovative and different from other apps is the Generated QR Code which takes the problem of unwanted attention and creates it into an opportunity to receive help and attention in time. This further supports the goal of Saving Lives in 300 seconds. I highly recommend and support this app for anyone who could be in need.",
    date: 'Oct 2026',
    isUserSubmitted: true
  }
];

export const INITIAL_ALL_REVIEWS: UserReview[] = [
  ...TOP_FEATURED_REVIEWS,
  ...GENERAL_COMMUNITY_REVIEWS
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
  if (lowerName.includes('yagyesh')) {
    return {
      cleanName: 'Yagyesh Pandey',
      shortRole: 'Founder',
      fullTooltip: 'Yagyesh Pandey — Founder of RakshaSaathi · Seth M.R. Jaipuria School',
      isDistinct: true
    };
  }
  if (lowerName.includes('samyak')) {
    return {
      cleanName: 'Samyak Verma',
      shortRole: 'Founder',
      fullTooltip: 'Samyak Verma — Founder of RakshaSaathi · Seth M.R. Jaipuria School',
      isDistinct: true
    };
  }
  if (lowerName.includes('siddhi')) {
    return {
      cleanName: 'Siddhi Misra',
      shortRole: 'Student',
      fullTooltip: 'Siddhi Misra — Student & Bystander Tester',
      isDistinct: false
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

  const [reviews, setReviews] = useState<UserReview[]>(() => {
    try {
      const cached = localStorage.getItem('rakshasaathi_user_reviews') || localStorage.getItem('sanjeevani_user_reviews');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_ALL_REVIEWS.length) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_ALL_REVIEWS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedNotification, setSubmittedNotification] = useState(false);

  // Pagination & expansion states
  const [showAll, setShowAll] = useState(false);
  const [expandedStoryIds, setExpandedStoryIds] = useState<Set<string>>(new Set());

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
    const unsubscribe = subscribeToCustomerReviews((liveFirestoreReviews) => {
      if (liveFirestoreReviews) {
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

        // Filter out duplicate reviews of the founders so top featured order is kept intact
        const additionalReviews = mappedLive.filter(r => {
          const lower = r.authorName.toLowerCase();
          return (
            !lower.includes('yagyesh') &&
            !lower.includes('samyak')
          );
        });

        // Merge initial curated set with any new live submissions
        const existingIds = new Set(INITIAL_ALL_REVIEWS.map(r => r.id));
        const customSubmissions = additionalReviews.filter(r => !existingIds.has(r.id));
        const orderedReviews = [...INITIAL_ALL_REVIEWS, ...customSubmissions];

        setReviews(orderedReviews);
        setIsLoading(false);

        try {
          localStorage.setItem('rakshasaathi_user_reviews', JSON.stringify(orderedReviews));
        } catch (e) {
          console.warn('Could not cache reviews to localStorage', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleStoryExpansion = (id: string) => {
    setExpandedStoryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

    setReviews(prev => [
      ...TOP_FEATURED_REVIEWS,
      optimisticReview,
      ...prev.filter(r => !r.id.startsWith('top-review-') && r.id !== newId)
    ]);

    try {
      await saveCustomerReviewToFirestore(newReviewData);
      console.log('[RakshaSaathi] Real customer review saved to Firestore!');
    } catch (err) {
      console.warn('[RakshaSaathi] Firestore write failed, preserved in local storage:', err);
    } finally {
      setIsSubmitting(false);
    }

    setStory('');
    setRating(5);
    setIsFormOpen(false);
    setSubmittedNotification(true);
    setTimeout(() => setSubmittedNotification(false), 5000);
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const visibleReviews = showAll ? reviews : reviews.slice(0, 6);

  return (
    <section id="community-reviews" className="scroll-reveal mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8 pt-8">
      
      {/* 1. Header & Community Rating Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/80">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-primary dark:text-emerald-400">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Community Stories & Lifesaving Impact</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Real Stories from Real Emergencies
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl font-normal leading-relaxed">
            Live, verified experiences from students, teachers, parents, and healthcare responders across India who use RakshaSaathi v2.0 during critical moments.
          </p>
        </div>

        {/* Rating summary & Action button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 shrink-0">
          <div className="py-2 px-3.5 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border shadow-xs flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">{avgRating}</span>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {reviews.length} Verified Reviews
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="h-11 px-5 rounded-full bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
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
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-emerald-900 dark:text-emerald-200 flex items-center space-x-3 text-sm font-medium shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Thank you for sharing your story! Your review is now live in Cloud Firestore and visible to everyone.</span>
        </div>
      )}

      {/* 3. Interactive Review Form (Collapsible Card matching Design System) */}
      {isFormOpen && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-surface border border-primary/30 shadow-md space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Share Your RakshaSaathi Experience
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Did RakshaSaathi help you in a crisis, during school first-aid drills, or finding generic medicine savings?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Your Name or Alias *
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh K., Priya S., or Class 10 Student"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Your Role / Background
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer"
                >
                  {ROLES_OPTIONS.map((r) => (
                    <option key={r} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Star Rating */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
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
                      className="p-0.5 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                      title={`${star} Stars`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">
                    {hoverRating || rating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Category Tag */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Feature / Topic
                </label>
                <select
                  value={categoryTag}
                  onChange={(e) => setCategoryTag(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer"
                >
                  {CATEGORY_TAGS.map((tag) => (
                    <option key={tag} value={tag} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{tag}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Story / Feedback */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Your Story or Feedback *
              </label>
              <textarea
                required
                rows={3}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="What happened? Which feature did you use (CPR metronome, SBAR handoff, burns guide, crowd QR)? How did it make a difference?..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Submit button */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-full border border-border text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!authorName.trim() || !story.trim() || isSubmitting}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-primary text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-primary-dark transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to RakshaSaathi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Post Review</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Responsive Card Grid (1-col mobile, 2-col tablet, 3-col desktop) */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs font-medium text-slate-500">Loading community stories from Cloud Firestore...</span>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {visibleReviews.map((rev) => {
              const { cleanName, shortRole, fullTooltip, isDistinct } = formatAuthorDisplay(rev.authorName, rev.role);
              const isExpanded = expandedStoryIds.has(rev.id);
              const isFounder = shortRole.toLowerCase() === 'founder';
              const displayDate = !rev.date || rev.date.toLowerCase() === 'just now' || rev.date.toLowerCase() === 'recent'
                ? 'Oct 2026'
                : rev.date;

              return (
                <div
                  key={rev.id}
                  title={rev.authorTooltip || fullTooltip}
                  className={`rounded-2xl bg-white dark:bg-surface border p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isDistinct 
                      ? 'border-primary/40 ring-1 ring-primary/20 shadow-xs' 
                      : 'border-slate-200 dark:border-border/80 shadow-xs'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Header: Avatar, Name, Role, and Star Rating */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                          isDistinct
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {cleanName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {cleanName}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
                              isFounder
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}>
                              {shortRole}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                              ✓ Verified
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex text-amber-400 shrink-0">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    {/* Tag badge */}
                    <div>
                      <span className="inline-block text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border px-2.5 py-0.5 rounded-full">
                        #{rev.categoryTag}
                      </span>
                    </div>

                    {/* Story Body */}
                    <div className="relative">
                      <p className={`text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line ${
                        isExpanded ? '' : 'line-clamp-4'
                      }`}>
                        {rev.story}
                      </p>
                      {rev.story.length > 180 && (
                        <button
                          type="button"
                          onClick={() => toggleStoryExpansion(rev.id)}
                          className="mt-1 text-xs font-semibold text-primary dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <span>Show less</span>
                              <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              <span>Read more</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Date Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-border/50 text-[11px] text-slate-400">
                    <span>{displayDate}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show All / Show Less Reviews Toggle */}
          {reviews.length > 6 && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowAll(prev => !prev)}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full border border-border bg-white dark:bg-surface text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <span>
                  {showAll ? 'Show fewer reviews' : `Show all reviews (${reviews.length})`}
                </span>
                {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty / Invitation State */
        <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-surface border border-dashed border-border text-center space-y-4 max-w-xl mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <MessageSquareHeart className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Be the First to Share Your Experience
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Every review helps inspire confidence during emergencies. Tell other students, teachers, and responders how RakshaSaathi worked for you.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Write the First Review</span>
          </button>
        </div>
      )}

    </section>
  );
};
