// Subscription lifecycle — master spec §13, slice 11.

// The sweep that ends lapsed subscriptions. Every 5 minutes, first run shortly
// after boot, as the session reminders do (9.6).
export const LIFECYCLE_SWEEP_INTERVAL_MS = 5 * 60 * 1000;
export const LIFECYCLE_SWEEP_FIRST_RUN_MS = 15_000;

// Rows handled per sweep. Bounded like every list; the next sweep takes the rest.
export const LIFECYCLE_SWEEP_BATCH = 100;

// Stripe subscription states that mean the money DID arrive. The sweep never
// expires one of these: the webhook saying so is on its way (11.1 recovers it).
export const STRIPE_PAID_STATES = Object.freeze(['active', 'trialing']);
export const STRIPE_ENDED_STATES = Object.freeze(['canceled', 'incomplete_expired']);

// Cancellation and reactivation (11.3). The client's own words, never Stripe's.
export const CANCEL_RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests. Please try again in a few minutes.',
});

export const CANCEL_STRIPE_FAILED_MESSAGE =
  'We could not reach our payment provider, so nothing has changed. Please try again in a moment.';
export const CANCEL_STRIPE_FAILED_CODE = 'STRIPE_CANCEL_FAILED';
export const NO_SUBSCRIPTION_TO_CHANGE_MESSAGE = 'There is no subscription to change. Please contact support.';
export const NO_SUBSCRIPTION_TO_CHANGE_CODE = 'NO_SUBSCRIPTION';
export const SUBSCRIPTION_CHANGED_MESSAGE =
  'Your subscription changed while we were saving. Please refresh the page and try again.';
export const SUBSCRIPTION_CHANGED_CODE = 'SUBSCRIPTION_CHANGED';
export const NOT_CANCELLED_MESSAGE = 'Your subscription is not cancelled, so there is nothing to reactivate.';
export const NOT_CANCELLED_CODE = 'NOT_CANCELLED';
export const CANNOT_REACTIVATE_MESSAGE =
  'This subscription cannot be restarted here. Please contact us and we will help.';
export const CANNOT_REACTIVATE_CODE = 'CANNOT_REACTIVATE';

// Re-subscribe (11.4). The checkout carries only our own ids, never health data.
export const RESUBSCRIBE_KIND = 'resubscribe';
export const RESUBSCRIBE_RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests. Please try again in a few minutes.',
});
export const STILL_SUBSCRIBED_MESSAGE = 'Your subscription is still running, so there is nothing to restart.';
export const STILL_SUBSCRIBED_CODE = 'STILL_SUBSCRIBED';
export const THERAPIST_GONE_MESSAGE =
  'Your therapist is no longer seeing clients here. Please contact us and we will help you find a way forward.';
export const THERAPIST_GONE_CODE = 'THERAPIST_UNAVAILABLE';
export const NO_BOOKING_TO_RESUME_MESSAGE = 'We could not find your therapist. Please contact support.';
export const NO_BOOKING_TO_RESUME_CODE = 'NO_ACTIVE_BOOKING';
export const RESUBSCRIBE_FAILED_MESSAGE =
  'We could not open the payment page. Nothing has been charged. Please try again in a moment.';
export const RESUBSCRIBE_FAILED_CODE = 'RESUBSCRIBE_FAILED';

// The pre-renewal reminder (11.6), §13's third transparency point. Sent from 3
// days before billing (developer's call); never within 6 hours of the charge,
// when it would only alarm.
export const RENEWAL_REMINDER_LEAD_MS = 3 * 24 * 60 * 60 * 1000;
export const RENEWAL_REMINDER_CUTOFF_MS = 6 * 60 * 60 * 1000;

// Billing history (11.5), from the ledger. One row per invoice, however many
// attempts it took. The scan is bounded; a client has one invoice a month.
export const BILLING_HISTORY_PAGE_SIZE = 12;
export const BILLING_HISTORY_MAX_PAGE = 50;
export const BILLING_HISTORY_SCAN_LIMIT = 600;
export const BILLING_STATUS = Object.freeze({ PAID: 'paid', FAILED: 'failed' });

// The "update your card" link (11.2, reused by 11.5).
export const BILLING_PORTAL_RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests. Please try again in a few minutes.',
});

export const BILLING_NOT_CONFIGURED_MESSAGE = 'Card updates are not available right now.';
export const BILLING_NOT_CONFIGURED_CODE = 'BILLING_NOT_CONFIGURED';
export const NO_BILLING_ACCOUNT_MESSAGE =
  'We could not find your billing details. Please contact support.';
export const NO_BILLING_ACCOUNT_CODE = 'NO_BILLING_ACCOUNT';
export const BILLING_PORTAL_FAILED_MESSAGE =
  'We could not open the card update page. Please try again in a moment.';
export const BILLING_PORTAL_FAILED_CODE = 'BILLING_PORTAL_FAILED';
