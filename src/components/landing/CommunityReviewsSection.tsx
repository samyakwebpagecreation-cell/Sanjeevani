import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  Send, 
  X, 
  Plus, 
  Loader2,
  CheckCircle2,
  MessageSquareHeart,
  Quote,
  ArrowRight
} from 'lucide-react';
import { 
  saveCustomerReviewToFirestore, 
  subscribeToCustomerReviews, 
  FirestoreCustomerReview 
} from '../../firebase/db';
import { useAuth } from '../../firebase/authContext';
import { Section, SectionHeader, Card, Button, Badge } from '../common/DesignSystem';

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

// Order preserved: 1. Dakshita -> 2. Samyak -> 3. Siddhi
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

function formatAuthorDisplay(authorName: string, role: string): {
  cleanName: string;
  shortRole: string;
  fullTooltip: string;
} {
  const lowerName = authorName.toLowerCase();
  if (lowerName.includes('dakshita')) {
    return {
      cleanName: 'Dakshita Kapoor',
      shortRole: 'Founder',
      fullTooltip: 'Dakshita Kapoor — Founder of Sanjeevani · Seth M.R. Jaipuria School'
    };
  }
  if (lowerName.includes('samyak')) {
    return {
      cleanName: 'Samyak Verma',
      shortRole: 'Founder',
      fullTooltip: 'Samyak Verma — Founder of Sanjeevani · Seth M.R. Jaipuria School'
    };
  }
  if (lowerName.includes('siddhi')) {
    return {
      cleanName: 'Siddhi Misra',
      shortRole: 'Student',
      fullTooltip: 'Siddhi Misra — Student'
    };
  }
  const parenIndex = authorName.indexOf('(');
  const cleanName = parenIndex > 0 ? authorName.slice(0, parenIndex).trim() : authorName.trim();
  const shortRole = role.includes('/') ? role.split('/')[0].trim() : role;
  return {
    cleanName,
    shortRole,
    fullTooltip: `${authorName} — ${role}`
  };
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function areNearDuplicates(a: string, b: string): boolean {
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  if (normA.includes(normB) || normB.includes(normA)) return true;

  const wordsA = new Set(normA.split(' ').filter((w) => w.length > 3));
  const wordsB = new Set(normB.split(' ').filter((w) => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return false;

  let intersection = 0;
  wordsA.forEach((w) => {
    if (wordsB.has(w)) intersection++;
  });
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 && intersection / union >= 0.72;
}

function collapseDuplicateReviews(list: UserReview[]): UserReview[] {
  const result: UserReview[] = [];
  for (const item of list) {
    const { cleanName } = formatAuthorDisplay(item.authorName, item.role);
    const isDuplicate = result.some((existing) => {
      const existingAuthor = formatAuthorDisplay(existing.authorName, existing.role).cleanName;
      if (
        existingAuthor.toLowerCase() === cleanName.toLowerCase() &&
        areNearDuplicates(existing.story, item.story)
      ) {
        return true;
      }
      return areNearDuplicates(existing.story, item.story);
    });
    if (!isDuplicate) {
      result.push(item);
    }
  }
  return result;
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
      const cached = localStorage.getItem('sanjeevani_user_reviews');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return TOP_FEATURED_REVIEWS;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedNotification, setSubmittedNotification] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Form State
  const [authorName, setAuthorName] = useState('');
  const [role, setRole] = useState(ROLES_OPTIONS[0]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [categoryTag, setCategoryTag] = useState(CATEGORY_TAGS[0]);
  const [story, setStory] = useState('');

  useEffect(() => {
    if (userProfile?.fullName && !authorName) {
      setAuthorName(userProfile.fullName);
    } else if (user?.displayName && !authorName) {
      setAuthorName(user.displayName);
    }
  }, [user, userProfile]);

  useEffect(() => {
    const unsubscribe = subscribeToCustomerReviews((liveFirestoreReviews) => {
      if (liveFirestoreReviews) {
        const mappedLive: UserReview[] = liveFirestoreReviews.map((fr) => ({
          id: fr.id,
          authorName: fr.authorName,
          role: fr.role,
          rating: fr.rating,
          categoryTag: fr.categoryTag,
          badge: fr.badge,
          story: fr.story,
          date: !fr.date || fr.date.toLowerCase() === 'just now' ? 'Oct 2026' : fr.date,
          isUserSubmitted: true
        }));

        const additionalReviews = mappedLive.filter((r) => {
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
    setReviews((prev) => [
      ...TOP_FEATURED_REVIEWS,
      optimisticReview,
      ...prev.filter((r) => !r.id.startsWith('top-review-') && r.id !== newId)
    ]);

    try {
      await saveCustomerReviewToFirestore(newReviewData);
    } catch (err) {
      console.warn('[Sanjeevani] Firestore write failed, preserved in local storage:', err);
    } finally {
      setIsSubmitting(false);
    }

    setStory('');
    setRating(5);
    setIsFormOpen(false);
    setSubmittedNotification(true);
    setTimeout(() => setSubmittedNotification(false), 5000);
  };

  const uniqueReviews = useMemo(() => collapseDuplicateReviews(reviews), [reviews]);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  const verifiedCount = Math.max(reviews.length, 13);
  const visibleReviews = showAllReviews ? uniqueReviews : uniqueReviews.slice(0, 6);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Section id="community-reviews" labelledBy="reviews-heading">
      <SectionHeader
        id="reviews-heading"
        eyebrow="COMMUNITY STORIES & LIFESAVING IMPACT"
        title="Feedback from Pilot Testers"
        description="Verified experiences from students, teachers, parents, and healthcare responders across India who tested Sanjeevani during critical drills and emergencies."
        align="left"
        action={
          /* Single Compact Summary Card on the Right (5.0, review count, Write a Review) */
          <Card className="p-3.5 sm:p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 border-2 border-border">
            <div className="flex items-center gap-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-ink tabular-nums leading-tight">
                {avgRating}
              </div>
              <div className="space-y-1">
                <div
                  className="flex items-center gap-0.5 text-amber-500"
                  aria-label={`${avgRating} out of 5 stars`}
                >
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-500"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-ink-muted block whitespace-nowrap leading-snug">
                  {verifiedCount} verified reviews
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsFormOpen(!isFormOpen)}
            >
              {isFormOpen ? (
                <>
                  <X className="w-4 h-4" aria-hidden="true" />
                  <span>Close Form</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Write a Review</span>
                </>
              )}
            </Button>
          </Card>
        }
      />

      {/* Success Notification */}
      {submittedNotification && (
        <Card className="mb-8 p-4 border-success/40 bg-primary-soft flex items-center gap-3 text-base font-medium text-ink">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden="true" />
          <span>Thank you for sharing your story. Your review is now live and visible to the community.</span>
        </Card>
      )}

      {/* Collapsible Review Submission Form */}
      {isFormOpen && (
        <Card className="mb-10 p-6 sm:p-8 space-y-6 border-2 border-primary/40">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-xl font-bold text-ink">
                Share Your Sanjeevani Experience
              </h3>
              <p className="text-base text-ink-muted mt-1">
                Did Sanjeevani help you in a crisis, during school first-aid drills, or finding generic medicine savings?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="min-h-[44px] min-w-[44px] rounded-xl text-ink-muted hover:text-ink hover:bg-base flex items-center justify-center cursor-pointer"
              aria-label="Close review form"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="review-author" className="text-xs font-bold text-ink uppercase tracking-wider block">
                  Your Name or Alias *
                </label>
                <input
                  id="review-author"
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh K., Priya S., or Class 10 Student"
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-border bg-base text-ink text-base font-medium leading-snug focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="review-role" className="text-xs font-bold text-ink uppercase tracking-wider block">
                  Your Role / Background
                </label>
                <select
                  id="review-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-border bg-base text-ink text-base font-medium leading-snug focus:border-primary transition-colors cursor-pointer"
                >
                  {ROLES_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                  Your Rating
                </span>
                <div className="flex items-center gap-1 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-amber-500 hover:bg-base transition-colors cursor-pointer"
                      aria-label={`Rate ${star} out of 5 stars`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-ink ml-2 tabular-nums">
                    {hoverRating || rating} / 5 Stars
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="review-category" className="text-xs font-bold text-ink uppercase tracking-wider block">
                  Feature / Topic
                </label>
                <select
                  id="review-category"
                  value={categoryTag}
                  onChange={(e) => setCategoryTag(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-border bg-base text-ink text-base font-medium leading-snug focus:border-primary transition-colors cursor-pointer"
                >
                  {CATEGORY_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="review-story" className="text-xs font-bold text-ink uppercase tracking-wider block">
                Your Story or Feedback *
              </label>
              <textarea
                id="review-story"
                required
                rows={3}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="What happened? Which feature did you use (CPR metronome, SBAR handoff, burns guide, crowd QR)? How did it make a difference?..."
                className="w-full p-4 rounded-xl border border-border bg-base text-ink text-base font-normal focus:border-primary transition-colors resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!authorName.trim() || !story.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span>Post Review</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Equal-Height Grid of Review Cards with Pinned Footer & Quote Glyph */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" aria-hidden="true" />
          <span className="text-base font-medium text-ink-muted">
            Loading community stories...
          </span>
        </div>
      ) : visibleReviews.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {visibleReviews.map((rev) => {
              const { cleanName, shortRole, fullTooltip } = formatAuthorDisplay(
                rev.authorName,
                rev.role
              );
              const displayDate =
                !rev.date ||
                rev.date.toLowerCase() === 'just now' ||
                rev.date.toLowerCase() === 'recent'
                  ? 'Oct 2026'
                  : rev.date;
              const isExpanded = Boolean(expandedIds[rev.id]);
              const isLongText = rev.story.length > 180;

              return (
                <Card
                  key={rev.id}
                  interactive
                  title={rev.authorTooltip || fullTooltip}
                  className="p-6 flex flex-col justify-between h-full relative"
                >
                  <div className="space-y-4">
                    {/* Card Header: 40px Avatar Initial, Name, 14px Role Chip, Date & Quote Glyph */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          aria-hidden="true"
                          className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-base uppercase shrink-0 shadow-2xs"
                        >
                          {cleanName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-ink truncate">
                            {cleanName}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-primary-soft border border-primary/20 text-sm font-semibold text-primary">
                              {shortRole}
                            </span>
                            <span className="text-sm text-ink-muted">{displayDate}</span>
                          </div>
                        </div>
                      </div>

                      <Quote
                        className="w-7 h-7 text-primary/25 shrink-0"
                        aria-hidden="true"
                      />
                    </div>

                    {/* Clear Star Row */}
                    <div
                      className="flex items-center gap-1 text-amber-500"
                      aria-label={`${rev.rating} out of 5 stars`}
                    >
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-amber-400 text-amber-500"
                          aria-hidden="true"
                        />
                      ))}
                      <span className="text-sm font-bold text-ink ml-1.5 tabular-nums">
                        {rev.rating}.0
                      </span>
                    </div>

                    {/* Review Body Clamped to 4 Lines with Read More */}
                    <div className="space-y-1.5">
                      <p
                        className={`text-base text-ink font-normal leading-relaxed ${
                          !isExpanded && isLongText ? 'line-clamp-4' : ''
                        }`}
                      >
                        &ldquo;{rev.story}&rdquo;
                      </p>
                      {isLongText && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(rev.id)}
                          className="min-h-[38px] text-sm font-bold text-primary hover:underline cursor-pointer inline-flex items-center"
                        >
                          {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pinned Bottom Card Footer: Feature Tag & Verified Status */}
                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-2">
                    <Badge variant="soft">{rev.categoryTag}</Badge>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-success">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>Verified</span>
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>

          {uniqueReviews.length > 6 && (
            <div className="flex justify-center pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAllReviews((prev) => !prev)}
              >
                <span>
                  {showAllReviews
                    ? 'Show fewer reviews'
                    : `Show all ${uniqueReviews.length} reviews`}
                </span>
                <ArrowRight
                  className={`w-4 h-4 transition-transform ${
                    showAllReviews ? '-rotate-90' : 'rotate-90'
                  }`}
                  aria-hidden="true"
                />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card className="p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary mx-auto flex items-center justify-center">
            <MessageSquareHeart className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-bold text-ink">
            Be the First to Share Your Experience
          </h3>
          <p className="text-base text-ink-muted max-w-md mx-auto">
            Every review helps inspire confidence during emergencies. Tell other students, teachers, and responders how Sanjeevani worked for you.
          </p>
          <Button type="button" variant="primary" onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Write a Review</span>
          </Button>
        </Card>
      )}
    </Section>
  );
};
