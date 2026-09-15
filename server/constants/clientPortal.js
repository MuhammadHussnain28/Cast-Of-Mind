// The client portal — master spec §7, access lifecycle §13.

/**
 * THE GATE'S ANSWERS.
 *
 * `past_due` is an ALLOWED state carrying a warning, not a refusal (§13: a
 * ~3-day grace period, banner shown, access retained). Only `expired` — and a
 * cancelled subscription whose paid period has run out — actually blocks.
 */
export const PORTAL_ACCESS = Object.freeze({
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  ENDING: 'ending', // cancelled, still inside the period already paid for
  ENDED: 'ended',
});

export const PORTAL_ACCESS_VALUES = Object.freeze(Object.values(PORTAL_ACCESS));

/** The states that may reach a gated route. */
export const PORTAL_ALLOWED_ACCESS = Object.freeze([
  PORTAL_ACCESS.ACTIVE,
  PORTAL_ACCESS.PAST_DUE,
  PORTAL_ACCESS.ENDING,
]);

export const SUBSCRIPTION_ENDED_MESSAGE =
  'Your subscription has ended. Reactivate it to return to your portal.';
export const SUBSCRIPTION_ENDED_CODE = 'SUBSCRIPTION_ENDED';

export const NO_BOOKING_MESSAGE = 'We could not find your therapist. Please contact support.';
export const NO_BOOKING_CODE = 'NO_ACTIVE_BOOKING';

/**
 * THE THERAPIST FIELDS A CLIENT MAY SEE.
 *
 * An allowlist, not a denylist: this endpoint is authenticated but a denylist
 * would leak any field a later chunk adds to `therapistProfiles` unless whoever
 * added it remembered to update the exclusion. Same discipline as
 * PUBLIC_THERAPIST_FIELDS in constants/matching.js.
 *
 * Every field here is ALREADY public on GET /api/v1/therapists/:id, which the
 * client read before paying, so nothing new is exposed. `workingHours` and
 * `timezone` are included because §7.1 requires the therapist's hours shown at
 * the top of the chat — fetching them here saves chunk 7.4 a second endpoint.
 *
 * Deliberately absent: email, streetAddress, stateProvince, zipPostal,
 * dateOfBirth, taxpayerIdNumber, licenseNumber, licensingStatus,
 * disciplinaryActions, malpracticeInsurance, certificate and licence documents,
 * applicationId, educationSummary, currentWorkSituation.
 */
export const CLIENT_THERAPIST_FIELDS = Object.freeze([
  'title',
  'firstName',
  'lastName',
  'gender',
  'photoUrl',
  'therapistType',
  'credentialType',
  'credentialInitials',
  'specialtyTags',
  'treatmentOrientations',
  'languages',
  'country',
  'city',
  'timezone',
  'workingHours',
  'bio',
]);

/**
 * What a client may read of their own subscription.
 *
 * The Stripe identifiers (`platformSubscriptionId`, `platformCustomerId`,
 * `checkoutSessionId`) are deliberately NOT here. The browser has no use for
 * them, and slice 11 will open Stripe's billing portal server-side rather than
 * by handing the customer id to the page.
 */
export const CLIENT_SUBSCRIPTION_FIELDS = Object.freeze([
  'status',
  'amount',
  'currency',
  'startDate',
  'currentPeriodEnd',
  'nextBillingDate',
  'sessionsRemaining',
  'cancelledAt',
]);

// A signed-in client reading their own portal. Generous: the shell fetches on
// every mount and slice 7 adds chat polling on top of it.
export const CLIENT_RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests. Please try again in a few minutes.',
});
