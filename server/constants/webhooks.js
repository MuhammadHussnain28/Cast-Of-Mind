// Payment webhooks — master spec §12, §13.
//
// THE GOLDEN RULE GOVERNS THIS FILE: the webhook is the authoritative source of
// truth about payment, never the browser. Nothing a redirect claims is trusted.

/**
 * The Stripe events we act on.
 *
 * Anything not listed is still LOGGED and still answered 200 — the rule is to
 * handle unknown types gracefully, because refusing them would make Stripe
 * retry an event we were never going to act on.
 */
export const STRIPE_EVENT = Object.freeze({
  // A client finished the hosted checkout. Chunk 6.4 turns this into four
  // documents. Guarded on payment_status — a completed session is not
  // automatically a paid one.
  CHECKOUT_COMPLETED: 'checkout.session.completed',

  // Monthly renewal succeeded. Slice 11 extends the period and resets sessions.
  INVOICE_PAID: 'invoice.payment_succeeded',

  // Card failed. Slice 11 moves the subscription to past_due and starts grace.
  INVOICE_FAILED: 'invoice.payment_failed',

  // The subscription ended at Stripe's side.
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',

  // Carries cancel_at_period_end, which is how §13's "cancelled but still has
  // access until the period ends" state actually arrives.
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
});

export const HANDLED_STRIPE_EVENTS = Object.freeze(Object.values(STRIPE_EVENT));

/**
 * THE FIRST INVOICE ALSO FIRES `invoice.payment_succeeded`.
 *
 * Without this distinction the opening payment would be handled twice — once as
 * a completed checkout and once as a renewal, extending a period that had only
 * just started and resetting a session counter nobody had used.
 *
 * Stripe sets `billing_reason` on every invoice. `subscription_create` is the
 * first one; `subscription_cycle` is a genuine monthly renewal.
 */
export const BILLING_REASON = Object.freeze({
  FIRST_INVOICE: 'subscription_create',
  RENEWAL: 'subscription_cycle',
});

// Stripe's own default tolerance is 300 seconds. Stated explicitly so a replay
// of a captured request stops working after five minutes, and so the number is
// visible rather than inherited.
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export const SIGNATURE_HEADER = 'stripe-signature';

export const INVALID_SIGNATURE_MESSAGE = 'Invalid webhook signature.';
export const INVALID_SIGNATURE_CODE = 'INVALID_SIGNATURE';

export const WEBHOOK_NOT_CONFIGURED_MESSAGE = 'Webhooks are not configured.';
export const WEBHOOK_NOT_CONFIGURED_CODE = 'WEBHOOK_NOT_CONFIGURED';

/**
 * Deliberately generous, and it only ever counts FAILURES.
 *
 * `skipSuccessfulRequests` means a verified webhook (200) never accumulates, so
 * a burst of renewals on the first of the month can never be throttled. Only
 * requests that fail signature verification count toward the limit.
 *
 * A plain limiter would have been the wrong tool: Stripe sends from a small set
 * of IP addresses, so a per-IP counter is effectively a global one, and
 * repeated 429s can make Stripe disable the endpoint altogether.
 */
export const WEBHOOK_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
export const WEBHOOK_RATE_LIMIT_MAX = 60;
export const WEBHOOK_RATE_LIMIT_MESSAGE = 'Too many invalid webhook requests.';

// Raw-body cap. Stripe events are a few kilobytes; a megabyte is generous and
// stops an unauthenticated endpoint being used to exhaust memory.
export const WEBHOOK_BODY_LIMIT = '1mb';
