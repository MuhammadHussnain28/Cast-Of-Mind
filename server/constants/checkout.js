// Checkout — master spec §12, §13.
//
// THE GOLDEN RULE GOVERNS THIS WHOLE SLICE: an account is created only when the
// WEBHOOK confirms payment, never when the browser reaches a success page.
// Nothing in this chunk writes a user, a booking or a subscription.

/**
 * How long a half-finished checkout is kept.
 *
 * Stripe Checkout Sessions expire after 24 hours, so the pending record has to
 * outlive the session it belongs to — otherwise a client who pays at hour 23
 * would arrive at a webhook with no questionnaire behind it. 26 hours gives two
 * hours of margin, and MongoDB's TTL monitor only sweeps once a minute anyway.
 */
export const PENDING_CHECKOUT_TTL_HOURS = 26;

// What we ask Stripe to enforce on its own side. Deliberately shorter than our
// TTL, so the session is always the first of the two to die.
export const CHECKOUT_SESSION_TTL_HOURS = 24;

// §13 requires the auto-renewal terms at checkout — "most important" of the
// three places it must appear. This is the copy shown on Stripe's own page,
// which is the last screen before a card is charged.
export const RENEWAL_DISCLOSURE =
  'This is a monthly subscription. Your card will be charged €200 automatically ' +
  'each month until you cancel. You can cancel any time from your portal.';

// Shown as the product name on Stripe's hosted page and on the card statement
// descriptor Stripe derives from it.
export const CHECKOUT_PRODUCT_NAME = 'Cast of Mind — monthly therapy';

export const CHECKOUT_PRODUCT_DESCRIPTION =
  'Four therapy sessions a month with your chosen therapist, plus unlimited chat in between.';

/**
 * ONE MESSAGE FOR EVERY "WE ALREADY KNOW THIS ADDRESS" CASE.
 *
 * The same shape chunk 3.2 uses on the therapist application, approved on the
 * same grounds: it tells a stranger the address is known to us, but never
 * whether it belongs to a client, a therapist or the admin. On a mental health
 * platform "this address is a patient of ours" is the sensitive part.
 *
 * Refusing here rather than at the webhook is deliberate — the alternative is
 * taking €200 from someone who then cannot be given an account.
 */
export const EMAIL_IN_USE_MESSAGE =
  'An account already exists for this email address. Please sign in, or use ' +
  '"Forgot password" if you cannot remember your password.';

export const EMAIL_IN_USE_CODE = 'EMAIL_IN_USE';

export const THERAPIST_UNAVAILABLE_MESSAGE =
  'That therapist is no longer available. Please choose another from your matches.';

export const THERAPIST_UNAVAILABLE_CODE = 'THERAPIST_UNAVAILABLE';

export const PAYMENTS_UNAVAILABLE_MESSAGE =
  'Payments are not available right now. Please try again shortly.';

export const PAYMENTS_UNAVAILABLE_CODE = 'PAYMENTS_UNAVAILABLE';

// Strict, because each call creates a record and hits an external API. A real
// person starts checkout once or twice; ten an hour is generous for genuine
// retries and useless for anything else.
export const CHECKOUT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const CHECKOUT_RATE_LIMIT_MAX = 10;
export const CHECKOUT_RATE_LIMIT_MESSAGE =
  'Too many checkout attempts. Please wait a little and try again.';

/**
 * What /welcome is allowed to learn.
 *
 * THREE WORDS, AND NOTHING ELSE EVER. No email, no therapist, no amount, no
 * name. The endpoint is public by necessity — the client has no account yet, so
 * there is no token to check — and chunk 3.2's application-status endpoint set
 * the same discipline for the same reason.
 *
 * UNKNOWN deliberately does not separate "never existed" from "expired". Both
 * answer the same word, so the endpoint cannot be used to probe for valid
 * session ids.
 */
export const SESSION_STATUS = Object.freeze({
  READY: 'ready', // the account exists — the webhook has been through
  PROCESSING: 'processing', // the draft is still there, the webhook has not
  UNKNOWN: 'unknown', // neither; expired, already cleaned up, or invented
});

// Polled every couple of seconds for under a minute, so this has to be
// generous enough for one honest visitor and tight enough to stop a scraper.
export const SESSION_STATUS_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const SESSION_STATUS_RATE_LIMIT_MAX = 120;
export const SESSION_STATUS_RATE_LIMIT_MESSAGE =
  'Too many status checks. Please refresh the page in a moment.';
