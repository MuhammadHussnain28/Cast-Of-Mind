// Admin dashboard figures — master spec §9.1.
//
// "Keep to counts and simple trends. This is an overview, not an analytics
// suite." Nothing here computes a rate, a projection or a cohort.

/**
 * Collections that do not exist yet, read through the raw driver.
 *
 * MongoDB returns 0 and [] for a collection that has never been created, so
 * these figures read zero today and start reporting on their own the moment
 * their slice creates documents — no code change needed.
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

// Subscription states, from §13's state machine. Duplicated here rather than
// imported because the subscriptions model does not exist yet; slice 6 should
// import ITS values from wherever it defines them and delete these.
export const SUBSCRIPTION_STATUS = Object.freeze({
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
});

// §2: billing currency is EUR, one plan only.
export const BILLING_CURRENCY = 'EUR';

// A year reads as a trend without becoming an analytics view.
export const TREND_MONTHS = 12;

// §9.6: the dashboard shows a short feed, not the full review list.
export const RECENT_REVIEWS_LIMIT = 5;
