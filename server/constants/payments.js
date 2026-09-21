// Payments and subscriptions — master spec §2, §10.5, §10.6, §10.14, §13.
//
// The canonical home for every payment value. `constants/adminStats.js` used to
// carry its own copy of the subscription statuses because this file did not
// exist yet; its comment asked slice 6 to delete that copy and import here.

export const BOOKING_STATUS = Object.freeze({
  ACTIVE: 'active',
  ENDED: 'ended',
});

export const BOOKING_STATUS_VALUES = Object.freeze(Object.values(BOOKING_STATUS));

// §13's state machine. active -> past_due -> expired, or active -> cancelled ->
// expired, with past_due able to return to active if the payment is fixed.
export const SUBSCRIPTION_STATUS = Object.freeze({
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
});

export const SUBSCRIPTION_STATUS_VALUES = Object.freeze(Object.values(SUBSCRIPTION_STATUS));

/**
 * WHO ended a subscription — spec addition, approved 2026-09-20 (chunk 10.1).
 *
 * §10.6 stores only `cancelledAt`. A manual cancellation Asad made for a refund
 * dispute and one the client made themselves land in the same state, and after
 * the fact nothing says which happened — on the one record a dispute is about.
 */
export const CANCELLED_BY = Object.freeze({
  CLIENT: 'client',
  ADMIN: 'admin',
});

export const CANCELLED_BY_VALUES = Object.freeze(Object.values(CANCELLED_BY));

export const PAYMENT_PLATFORM = Object.freeze({
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
});

export const PAYMENT_PLATFORM_VALUES = Object.freeze(Object.values(PAYMENT_PLATFORM));

// §2: EUR, one plan, €200/month.
export const BILLING_CURRENCY = 'EUR';

/**
 * MONEY IS STORED IN MINOR UNITS — CENTS. €200.00 is 20000, never 200.
 *
 * Decided 2026-09-07, closing the open item chunk 4.4 recorded: §10.6 types
 * `amount` as a bare Number and never says which unit.
 *
 * Three reasons, and the second is the one that decided it:
 *  1. Stripe speaks cents. The webhook hands us 20000, so nothing converts
 *     between the platform and our ledger, and a conversion is where a x100 bug
 *     lives.
 *  2. `paymentEvents.amount` must match Stripe exactly, because it is the
 *     dispute record. If subscriptions held euros and the ledger held cents,
 *     two fields with the same name in the same slice would mean different
 *     things.
 *  3. Integers never lose a cent. Floats eventually do.
 *
 * The cost: anything showing money to a person must divide by 100.
 * `client/src/lib/dashboardFormat.js` does this for the admin dashboard, and
 * `formatMinorUnits` below does it for server-rendered email.
 */
export const SUBSCRIPTION_AMOUNT_MINOR = 20000;

export const MINOR_UNITS_PER_MAJOR = 100;

// §13: 4 sessions per cycle, reset on renewal, no carry-over.
export const SESSIONS_PER_CYCLE = 4;

// Grace period after a failed payment before the subscription expires (§13).
// Recorded here so slice 11 does not invent its own number.
export const PAST_DUE_GRACE_DAYS = 3;

// Free-text ledger fields are capped rather than enumerated — see the comment
// in models/PaymentEvent.js for why an enum there would be a bug.
export const EVENT_TYPE_MAX = 120;
export const PLATFORM_EVENT_ID_MAX = 255;
export const PLATFORM_SUBSCRIPTION_ID_MAX = 255;

/**
 * Cents to a human string. The one place on the server that knows about the 100.
 *
 * Used by the welcome email (6.4) and the renewal reminders (11.6) so three
 * templates do not each divide by hand.
 */
export function formatMinorUnits(minor, currency = BILLING_CURRENCY) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(
    (minor ?? 0) / MINOR_UNITS_PER_MAJOR,
  );
}
