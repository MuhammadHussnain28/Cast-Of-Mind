// End-of-subscription reviews — master spec §9.6 and §10.12.
//
// ADMIN-ONLY, WITHOUT EXCEPTION. A review is never shown to the therapist it
// is about, never on a public profile or the matching page, and never back to
// the client who wrote it (approved 2026-09-21). Public ratings on a mental
// health platform punish therapists who take the hardest cases and turn
// matching into a popularity contest — §9.6's own reasoning.
//
// THE READ PATH IS ONE FILE: services/adminReviews.service.js. Nothing on a
// client, therapist or public route can import it, and a test walks the import
// graph to prove that rather than trusting this comment.

export const STARS_MIN = 1;
export const STARS_MAX = 5;

// Generous — this is somebody's account of their therapy ending — and bounded,
// because the rules forbid unbounded input.
export const REVIEW_TEXT_MAX = 2000;

/**
 * A therapist needs this many ratings before they are RANKED as highest rated
 * or needing attention. Approved 2026-09-21; the number is the developer's and
 * wants Asad's confirmation.
 *
 * It is §9.6's caveat made structural rather than only printed: stars are
 * mandatory and words optional, so most ratings arrive without context, and a
 * single low rating from a client in severe difficulty must not put a therapist
 * on a warning list.
 */
export const RANKING_MIN_RATINGS = 3;

// How many names each ranked list shows at most.
export const RANKED_LIST_SIZE = 5;

export const RECENT_REVIEWS_LIMIT = 5;

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

/**
 * What the client portal is told — a STATE, never content (approved: the
 * client never sees their review after submitting).
 */
export const REVIEW_STATE = Object.freeze({
  NOT_YET: 'not_yet',
  ELIGIBLE: 'eligible',
  SUBMITTED: 'submitted',
  // "No thanks" (11.6): never offered again for that subscription.
  DECLINED: 'declined',
});

export const REVIEW_NOT_AVAILABLE_MESSAGE =
  'You can leave a rating once your subscription has been cancelled or has ended.';
export const ALREADY_REVIEWED_MESSAGE =
  'You have already rated this subscription — thank you. Only one rating is kept for each.';
export const THERAPIST_NOT_FOUND_MESSAGE = 'No therapist found with that reference.';

// A submission is a deliberate act, not a stream. Loose enough never to stop a
// person who mistyped; tight enough to stop a script.
export const REVIEW_RATE_LIMIT = Object.freeze({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many attempts. Please try again later.',
});
