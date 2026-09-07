// Matching engine — master spec §15.
//
// THREE RULES GOVERN THIS FILE AND THE SERVICE BESIDE IT:
//   1. Gender preference is a SOFT SORT. It never removes anyone.
//   2. Zero overlap returns every active therapist, SILENTLY — no flag, no
//      message, nothing in the payload a UI could turn into a banner.
//   3. Matching is specialty tags ONLY. Country, timezone, availability and
//      treatment orientations never filter.

/**
 * THE PUBLIC PROJECTION — an allowlist, never a denylist.
 *
 * This endpoint is unauthenticated: anyone on the internet can call it. A
 * denylist would leak any field added to therapistProfiles later by whoever
 * forgot to add it to the list. Naming what may leave is the only shape that
 * fails closed.
 *
 * Deliberately absent, and each for a reason:
 *   userId ............ the public id is the PROFILE id, so nothing hands a
 *                       stranger a key into the users collection
 *   streetAddress, stateProvince, zipPostal, dateOfBirth ... personal
 *   taxpayerIdNumber, licenseNumber ....................... sensitive (§23)
 *   licensingStatus, disciplinaryActions/Details .......... admin review only
 *   malpracticeInsurance, insuranceDetails ................ admin review only
 *   certificateUrl1/2, licenseDocUrl ...................... credentials (§3.1)
 *   applicationId, status, educationSummary, currentWorkSituation, workingHours
 *
 * `city` is included but `streetAddress` is not: a city is professional
 * context, a street address is where someone lives.
 */
export const PUBLIC_THERAPIST_FIELDS = Object.freeze([
  'title',
  'firstName',
  'lastName',
  // Included by decision 2026-09-07: the client stated a preference, and seeing
  // gender is how they can tell it was honoured.
  'gender',
  'photoUrl',
  'city',
  'country',
  'timezone',
  'therapistType',
  'credentialType',
  'credentialInitials',
  'yearsExperience',
  'languages',
  'specialtyTags',
  'treatmentOrientations',
  'bio',
]);

/**
 * The detail page needs one field more than a results card: when they work.
 *
 * Deliberately NOT widened further. `educationSummary` and `currentWorkSituation`
 * are not on the chunk brief's list for this page, and an unauthenticated
 * endpoint should carry the least that does the job.
 */
export const PUBLIC_THERAPIST_DETAIL_FIELDS = Object.freeze([
  ...PUBLIC_THERAPIST_FIELDS,
  'workingHours',
]);

// Browsing profiles is a normal thing to do several times while deciding, so
// this sits looser than matching. Still bounded, because it is public.
export const THERAPIST_DETAIL_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const THERAPIST_DETAIL_RATE_LIMIT_MAX = 120;

// Cheap, read-only and re-run whenever someone edits their answers, so this is
// about stopping a scraper rather than protecting an expensive operation.
export const MATCHING_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const MATCHING_RATE_LIMIT_MAX = 30;
export const MATCHING_RATE_LIMIT_MESSAGE =
  'Too many requests. Please wait a few minutes and try again.';

// "Every list endpoint paginates" (backend rules) against §15's "return all
// therapists". They reconcile as: page the list, never exclude anyone.
export const MATCHING_PAGE_SIZE = 24;
export const MATCHING_MAX_PAGE_SIZE = 100;

export const GENDER_PREFERENCE = Object.freeze({
  MALE: 'male',
  FEMALE: 'female',
  NO_PREFERENCE: 'no_preference',
});

export const GENDER_PREFERENCE_VALUES = Object.freeze(Object.values(GENDER_PREFERENCE));
