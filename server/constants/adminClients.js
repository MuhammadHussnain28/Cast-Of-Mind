// Admin client management — master spec §9.4.
//
// NOTHING IN THIS FEATURE READS `messages`, `journals` OR `privateNotes`.
// §11 records that an admin conversation viewer was proposed as the safe
// alternative to plain-text passwords and the client decided against building
// it; misconduct is reported by email and phone and handled off-platform.

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const SEARCH_MAX_LENGTH = 100;
export const STATUS_FILTER_ALL = 'all';

// A client may hold several subscriptions over their life — cancel, expire,
// re-subscribe — and the detail screen shows them as history. Capped so the
// response cannot grow without bound.
export const SUBSCRIPTION_HISTORY_LIMIT = 20;

/**
 * WHAT THE ADMIN MAY SEE OF A SUBSCRIPTION.
 *
 * Wider than `CLIENT_SUBSCRIPTION_FIELDS` by exactly one field:
 * `platformSubscriptionId`. Approved 2026-09-20. The admin owns the Stripe
 * account, and a refund dispute begins with finding the row in Stripe's
 * dashboard. `platformCustomerId` and `checkoutSessionId` stay out — neither
 * answers a question this screen asks.
 */
export const ADMIN_SUBSCRIPTION_FIELDS = Object.freeze([
  'status',
  'amount',
  'currency',
  'startDate',
  'currentPeriodEnd',
  'nextBillingDate',
  'sessionsRemaining',
  'cancelledAt',
  'cancelledBy',
  'platformSubscriptionId',
  'createdAt',
]);

export const CLIENT_NOT_FOUND_MESSAGE = 'No client found with that reference.';

export const NO_SUBSCRIPTION_MESSAGE =
  'This client has no subscription to cancel.';
export const ALREADY_ENDED_MESSAGE =
  'This subscription has already ended, so there is nothing left to cancel.';

export const CANCELLED_MESSAGE =
  'Cancelled. They keep full access until the end of the period they have already paid for, and Stripe will not charge again.';
export const ALREADY_CANCELLED_MESSAGE =
  'This subscription was already cancelled. Nothing changed.';

/**
 * STRIPE IS CALLED FIRST, AND A FAILURE THERE REFUSES THE WHOLE ACTION.
 *
 * Writing `cancelled` after a failed Stripe call is the one outcome worth
 * designing against: the screen would say cancelled while the card kept being
 * charged €200 a month, and nobody would find out until the client did. So a
 * genuine API failure is an error, not a notice, and nothing is written.
 *
 * The two NOTICE cases below are different in kind — there was nothing to call,
 * rather than a call that failed — so they proceed and say so. Neither can
 * happen in production: config/env.js refuses to start without a Stripe key,
 * and every subscription created by the webhook carries a platform id.
 */
export const STRIPE_FAILED_MESSAGE =
  'Stripe could not be reached, so nothing was changed. Try again, or cancel the subscription in the Stripe dashboard.';
export const STRIPE_NOT_CONFIGURED_NOTICE =
  'Recorded here only: no Stripe key is configured in this environment, so nothing was sent to Stripe.';
export const NO_PLATFORM_ID_NOTICE =
  'Recorded here only: this subscription has no Stripe reference stored, so there was nothing to cancel there.';

export const RESET_SENT_MESSAGE =
  'A password reset link has been emailed to this client. You cannot see or choose their password — nobody can.';
// The public forgot-password endpoint stays silent about deactivated accounts
// because saying anything leaks whether an address exists. Here the admin
// already knows the account exists, so silence would only confuse.
export const RESET_SKIPPED_INACTIVE_MESSAGE =
  'No email was sent: this client is deactivated, so a reset would not let them back in. Reactivate them first.';
