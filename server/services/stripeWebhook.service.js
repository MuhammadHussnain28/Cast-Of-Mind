import env from '../config/env.js';
import { stripe, isStripeConfigured } from '../config/stripe.js';
import { AppError } from '../utils/AppError.js';
import { PaymentEvent } from '../models/PaymentEvent.js';
import { Subscription } from '../models/Subscription.js';
import { PAYMENT_PLATFORM } from '../constants/payments.js';
import { createClientAccount } from './clientOnboarding.service.js';
import { invoiceSubscriptionId, renewFromInvoice } from './subscriptionRenewal.service.js';
import { completeResubscription } from './resubscription.service.js';
import { RESUBSCRIBE_KIND } from '../constants/subscriptionLifecycle.js';
import {
  handleStripeSubscriptionEnded,
  markPastDueFromInvoice,
  syncStripeCancellation,
} from './subscriptionLifecycle.service.js';
import {
  BILLING_REASON,
  INVALID_SIGNATURE_CODE,
  INVALID_SIGNATURE_MESSAGE,
  SIGNATURE_TOLERANCE_SECONDS,
  STRIPE_EVENT,
  WEBHOOK_NOT_CONFIGURED_CODE,
  WEBHOOK_NOT_CONFIGURED_MESSAGE,
} from '../constants/webhooks.js';

/**
 * The payment webhook.
 *
 * THE GOLDEN RULE (§12): the account is created when the WEBHOOK confirms
 * payment, never when the browser reaches a success page. Browsers drop
 * connections, close early and can be edited by whoever is holding them. This
 * endpoint is the only thing on the platform that is allowed to believe a
 * payment happened.
 *
 * NOTHING FROM THE BROWSER IS TRUSTED HERE. The only input is a signed payload
 * from Stripe, and the signature is checked before a single field is read.
 */

/**
 * Verify the signature over the RAW bytes.
 *
 * `req.body` must be a Buffer here, not a parsed object. Stripe signs the exact
 * bytes it sent, so a re-serialised object produces a different HMAC and every
 * event would fail with "No signatures found matching the expected signature" —
 * which reads like a wrong secret and sends you hunting in the dashboard. The
 * raw parser is mounted for this path only, ahead of express.json(), in app.js.
 */
export function verifyStripeEvent(rawBody, signatureHeader) {
  if (!isStripeConfigured || !env.stripeWebhookSecret) {
    throw new AppError(WEBHOOK_NOT_CONFIGURED_MESSAGE, 503, WEBHOOK_NOT_CONFIGURED_CODE);
  }

  if (!Buffer.isBuffer(rawBody)) {
    // A guard against a future middleware reorder, which would otherwise turn
    // into an unexplained signature failure in production.
    console.error('[webhook] body was parsed before verification — check app.js ordering');
    throw new AppError(INVALID_SIGNATURE_MESSAGE, 400, INVALID_SIGNATURE_CODE);
  }

  if (!signatureHeader) {
    throw new AppError(INVALID_SIGNATURE_MESSAGE, 400, INVALID_SIGNATURE_CODE);
  }

  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signatureHeader,
      env.stripeWebhookSecret,
      // SECONDS, not milliseconds. Passing ms here silently widens the replay
      // window from 5 minutes to about 3.5 days — the signature still verifies,
      // so nothing looks wrong. Caught by the stale-timestamp test.
      SIGNATURE_TOLERANCE_SECONDS,
    );
  } catch (error) {
    // Stripe's message can name the tolerance window and other internals. The
    // caller is either Stripe (which does not read it) or somebody probing.
    console.error('[webhook] signature verification failed:', error.message);
    throw new AppError(INVALID_SIGNATURE_MESSAGE, 400, INVALID_SIGNATURE_CODE);
  }
}

/**
 * Pull out the money, where the event carries any.
 *
 * MINOR UNITS, exactly as Stripe sent them — the ledger must match Stripe for a
 * dispute. Many event types carry no amount at all, which is why 6.1 made these
 * fields optional.
 */
function extractAmount(event) {
  const object = event.data?.object ?? {};

  // A failed invoice carries amount_paid: 0, not null, so `??` never reached
  // amount_due and the ledger said a failed €200 was €0. Fixed in 11.2.
  const amount =
    event.type === STRIPE_EVENT.INVOICE_FAILED
      ? object.amount_due ?? null
      : object.amount_total ?? // checkout.session
        object.amount_paid ?? // invoice (succeeded)
        object.amount_due ??
        null;

  return {
    amount: Number.isInteger(amount) ? amount : undefined,
    currency: object.currency ? String(object.currency).toUpperCase() : undefined,
  };
}

/**
 * Our subscription and client for this event, so a dispute can find its rows.
 *
 * Read BEFORE the insert, because the ledger can never be updated afterwards.
 * Best-effort: a failed lookup leaves the row unlinked, never unwritten. A first
 * payment has nothing to link yet (6.1).
 */
/** The platform subscription an event belongs to, whatever its shape. */
function platformSubscriptionOf(object) {
  if (object.object === 'invoice') return invoiceSubscriptionId(object);
  if (object.object === 'subscription') return object.id;
  if (object.object === 'checkout.session') {
    return typeof object.subscription === 'string' ? object.subscription : object.subscription?.id;
  }
  return null;
}

async function ledgerLinks(event) {
  const platformSubscriptionId = platformSubscriptionOf(event.data?.object ?? {});
  if (typeof platformSubscriptionId !== 'string') return {};

  // Stored even when our subscription does not exist yet (a first payment), so
  // billing history can always find it (11.5).
  const links = { platformSubscriptionId };
  try {
    const found = await Subscription.findOne({ platformSubscriptionId }).select('_id clientId').lean();
    return found ? { ...links, subscriptionId: found._id, clientId: found.clientId } : links;
  } catch (error) {
    console.error(`[webhook] ${event.id} could not link the ledger row: ${error?.name ?? 'Error'}`);
    return links;
  }
}

/**
 * Write the event to the ledger, and let the unique index answer "seen before?".
 *
 * THE INSERT IS THE IDEMPOTENCY GATE, NOT A READ-THEN-WRITE. The obvious build
 * — findOne, then create — races: Stripe genuinely sends the same event twice
 * in quick succession, and two concurrent requests both pass the read, then both
 * process. A duplicate-key error cannot race. This is what 6.1's compound unique
 * index on { platform, platformEventId } exists for.
 *
 * Returns { duplicate: true } when the event has already been recorded.
 */
export async function recordEvent(event) {
  const { amount, currency } = extractAmount(event);
  const links = await ledgerLinks(event);

  try {
    const record = await PaymentEvent.create({
      platform: PAYMENT_PLATFORM.STRIPE,
      eventType: event.type,
      platformEventId: event.id,
      amount,
      currency,
      ...links,
      // Stored verbatim — this is the permanent record a chargeback is argued
      // from. select: false, and stripped from toJSON, so it never leaves.
      rawPayload: event,
      receivedAt: new Date(),
    });

    return { duplicate: false, record };
  } catch (error) {
    if (error?.code === 11000) {
      return { duplicate: true, record: null };
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- *
 * HANDLERS.
 *
 * EVERY HANDLER MUST BE SAFE TO RUN TWICE. Since 11.1 a duplicate event is
 * routed again, so a retry can heal a handler that failed after its ledger row
 * was written. Each guards at its effect, never at the ledger.
 *
 * NEVER LOG THE PAYLOAD. It carries an email address and payment details, both
 * on the never-log list. Event type and event id are enough to find anything in
 * Stripe's dashboard or in our own ledger.
 * -------------------------------------------------------------------------- */

async function handleCheckoutCompleted(event) {
  const session = event.data.object;

  // A completed session is NOT automatically a paid one — some payment methods
  // settle later. Acting on an unpaid session would create an account for money
  // that never arrived.
  if (session.payment_status !== 'paid') {
    console.log(`[webhook] ${event.id} checkout completed but unpaid — ignored`);
    return { handled: false, reason: 'unpaid' };
  }

  // A returning client (11.4): a new subscription on their existing booking.
  // Marked by metadata WE wrote when making the page, and Stripe has signed it.
  if (session.metadata?.kind === RESUBSCRIBE_KIND) {
    const resumed = await completeResubscription(session, { eventId: event.id });
    return { handled: resumed.created, reason: resumed.reason };
  }

  // IDEMPOTENT ON ITS OWN TERMS, not on the ledger row above. If that row is
  // written and this handler then fails, Stripe's retry is skipped as a
  // duplicate event — so the ledger cannot be the guard. createClientAccount
  // checks for an existing subscription instead, which exists only if the whole
  // transaction committed.
  const result = await createClientAccount(session);

  if (!result.created) {
    console.log(`[webhook] ${event.id} account already exists — nothing to do`);
    return { handled: false, reason: result.reason };
  }

  console.log(
    `[webhook] ${event.id} account created (welcome email ${result.emailSent ? 'sent' : 'FAILED'})`,
  );
  return { handled: true };
}

async function handleInvoicePaid(event) {
  const invoice = event.data.object;

  // THE FIRST INVOICE ALSO FIRES THIS EVENT. Without the billing_reason check
  // the opening payment would be handled twice — once as a completed checkout
  // and once as a renewal — extending a period that had only just begun.
  if (invoice.billing_reason === BILLING_REASON.FIRST_INVOICE) {
    console.log(`[webhook] ${event.id} first invoice — handled by the checkout event, not here`);
    return { handled: false, reason: 'first_invoice' };
  }

  // Only a genuine monthly cycle renews. Other reasons (a manual invoice, a
  // plan change) are recorded and left alone rather than guessed at.
  if (invoice.billing_reason !== BILLING_REASON.RENEWAL) {
    console.log(`[webhook] ${event.id} paid invoice (${invoice.billing_reason ?? 'no reason'}) — not a renewal, no action`);
    return { handled: false, reason: 'not_a_renewal' };
  }

  const result = await renewFromInvoice(invoice, { eventId: event.id });
  return { handled: result.renewed, reason: result.reason };
}

async function handleInvoiceFailed(event) {
  const invoice = event.data.object;

  // Only a failed monthly renewal starts the grace. A failed FIRST invoice means
  // the checkout never completed, so there is no account to put past due.
  if (invoice.billing_reason !== BILLING_REASON.RENEWAL) {
    console.log(`[webhook] ${event.id} failed invoice (${invoice.billing_reason ?? 'no reason'}) — not a renewal, no action`);
    return { handled: false, reason: 'not_a_renewal' };
  }

  // Stripe's own time of failure, so a retried webhook lands on the same deadline.
  const failedAt = Number.isInteger(event.created) ? new Date(event.created * 1000) : new Date();
  const result = await markPastDueFromInvoice(invoice, { eventId: event.id, failedAt });
  return { handled: result.markedPastDue, reason: result.reason };
}

// Stripe stopped billing (11.3): cancelled with access kept, or expired.
async function handleSubscriptionDeleted(event) {
  const result = await handleStripeSubscriptionEnded(event.data.object, { eventId: event.id });
  return { handled: result.changed, reason: result.reason };
}

// A change made in Stripe's own screens (11.3). Re-reads live state, never the payload.
async function handleSubscriptionUpdated(event) {
  console.log(`[webhook] ${event.id} subscription updated — checking Stripe's live state`);
  const result = await syncStripeCancellation(event.data.object?.id, { eventId: event.id });
  return { handled: result.changed, reason: result.reason };
}

const HANDLERS = Object.freeze({
  [STRIPE_EVENT.CHECKOUT_COMPLETED]: handleCheckoutCompleted,
  [STRIPE_EVENT.INVOICE_PAID]: handleInvoicePaid,
  [STRIPE_EVENT.INVOICE_FAILED]: handleInvoiceFailed,
  [STRIPE_EVENT.SUBSCRIPTION_DELETED]: handleSubscriptionDeleted,
  [STRIPE_EVENT.SUBSCRIPTION_UPDATED]: handleSubscriptionUpdated,
});

/**
 * Route a verified, freshly-recorded event to its handler.
 *
 * An unknown type is logged and accepted. Refusing it would make Stripe retry
 * an event we were never going to act on, and eventually mark the endpoint as
 * failing.
 */
export async function routeEvent(event) {
  const handler = HANDLERS[event.type];

  if (!handler) {
    console.log(`[webhook] ${event.id} unhandled type "${event.type}" — recorded, no action`);
    return { handled: false, reason: 'unhandled_type' };
  }

  return handler(event);
}

export default { verifyStripeEvent, recordEvent, routeEvent };
