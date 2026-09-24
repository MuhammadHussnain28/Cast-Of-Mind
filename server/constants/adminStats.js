// Admin dashboard figures — master spec §9.1.
//
// "Keep to counts and simple trends. This is an overview, not an analytics
// suite." Nothing here computes a rate, a projection or a cohort.

/**
 * Collections read through the raw driver rather than a model.
 *
 * MongoDB returns 0 and [] for a collection that has never been created, so
 * these figures read zero today and start reporting on their own the moment
 * their slice creates documents — no code change needed.
 *
 * `bookings` and `subscriptions` have had models since chunk 6.1, but nothing
 * writes them until the payment webhook in 6.4, so the raw reads stay correct
 * and are left alone. Model tests pin these names against the real collections.
 *
 * THESE NAMES MUST MATCH WHAT MONGOOSE WILL PLURALISE TO, or the dashboard will
 * silently report 0 for ever, which is far worse than an error. Mongoose
 * lowercases and pluralises the model name: `Subscription` -> `subscriptions`,
 * `ClientProfile` -> `clientprofiles`.
 */
export const FUTURE_COLLECTIONS = Object.freeze({
  subscriptions: 'subscriptions', // slice 6
  sessions: 'sessions', // slice 9
  reviews: 'reviews', // chunk 10.3
  bookings: 'bookings', // slice 6
  clientProfiles: 'clientprofiles', // slice 6
});

// Re-exported from the canonical home, created in chunk 6.1. These were
// duplicated here while the subscriptions model did not exist; existing callers
// keep importing them from this file rather than being rewritten.
export { SUBSCRIPTION_STATUS, BILLING_CURRENCY } from './payments.js';

// A year reads as a trend without becoming an analytics view.
export const TREND_MONTHS = 12;

// The recent-reviews limit moved to constants/reviews.js in 10.3, beside every
// other review value.
