import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { stripe, isStripeConfigured } from '../config/stripe.js';
import { AppError } from '../utils/AppError.js';
import { accessEndsAt } from '../middleware/requireActiveSubscription.js';
import { PAST_DUE_GRACE_DAYS, SUBSCRIPTION_STATUS, formatMinorUnits } from '../constants/payments.js';
import {
  CANCEL_STRIPE_FAILED_CODE,
  CANCEL_STRIPE_FAILED_MESSAGE,
  LIFECYCLE_SWEEP_BATCH,
  LIFECYCLE_SWEEP_FIRST_RUN_MS,
  LIFECYCLE_SWEEP_INTERVAL_MS,
  STRIPE_ENDED_STATES,
  STRIPE_PAID_STATES,
} from '../constants/subscriptionLifecycle.js';
import { formatInZone, isValidTimeZone } from '../utils/timezone.js';
import { invoiceSubscriptionId, renewalPeriod } from './subscriptionRenewal.service.js';
import { sendPaymentFailedEmail } from './email/email.service.js';
import { sendRenewalReminders } from './renewalReminders.service.js';

// Failed payments and the grace period — chunk 11.2, master spec §13.
//
// active → past_due on a failed renewal, with ~3 days' grace and access kept.
// A paid retry brings it back (11.1). Otherwise the sweep ends it: at Stripe
// first, so a late retry cannot charge someone we have locked out, then here.
// Logs carry ids only — never an email, a name or card details.

const DAY_MS = 24 * 60 * 60 * 1000;

// Expiry in one write: the status and §13's "0 when it ends". 11.4 reuses it.
export const EXPIRED_SET = Object.freeze({ status: SUBSCRIPTION_STATUS.EXPIRED, sessionsRemaining: 0 });

const cityOf = (zone) => String(zone).split('/').pop().replace(/_/g, ' ');

/** "Saturday 17 October 2026 at 14:05 (Kolkata time)" */
export function accessUntilText(instant, timeZone) {
  const zone = isValidTimeZone(timeZone) ? timeZone : 'UTC';
  const { date, time } = formatInZone(instant, zone, { locale: 'en-GB' });
  return `${date} at ${time} (${zone === 'UTC' ? 'UTC' : `${cityOf(zone)} time`})`;
}

/** Best-effort: a failed email is logged and never undoes the state change. */
async function sendFailedNotice(subscription, invoice, eventId) {
  try {
    const [user, profile] = await Promise.all([
      User.findById(subscription.clientId).select('email').lean(),
      ClientProfile.findOne({ userId: subscription.clientId }).select('name coupleData timezone').lean(),
    ]);
    if (!user?.email) {
      console.error(`[past-due] ${eventId} no email address for the client — notice not sent`);
      return false;
    }

    const currency = invoice?.currency ? String(invoice.currency).toUpperCase() : subscription.currency;
    const amountMinor = Number.isInteger(invoice?.amount_due) ? invoice.amount_due : subscription.amount;

    await sendPaymentFailedEmail(user.email, {
      name: profile?.name ?? profile?.coupleData?.partner1?.name ?? null,
      amount: formatMinorUnits(amountMinor, currency),
      accessUntil: accessUntilText(subscription.graceEndsAt, profile?.timezone),
    });
    return true;
  } catch (error) {
    console.error(`[past-due] ${eventId} notice email failed: ${error?.name ?? 'Error'}`);
    return false;
  }
}

/**
 * A failed renewal invoice: active → past_due, grace starts.
 *
 * ONE EPISODE, ONE EMAIL. The update matches only an `active` row, so Stripe's
 * own retries failing again never restart the grace or send a second notice.
 * The grace runs from when Stripe reported the failure (`failedAt`), so a retry
 * of this webhook lands on the same deadline.
 *
 * A STALE FAILURE IS IGNORED: if 11.1 already moved the period past this
 * invoice, it was paid, and an out-of-order failure must not undo that.
 *
 * @returns {Promise<{ markedPastDue: boolean, reason?: string, emailSent?: boolean }>}
 */
export async function markPastDueFromInvoice(invoice, { eventId, failedAt = new Date() }) {
  const platformSubscriptionId = invoiceSubscriptionId(invoice);
  if (!platformSubscriptionId) {
    console.error(`[past-due] ${eventId} NOT APPLIED — the invoice names no subscription`);
    return { markedPastDue: false, reason: 'no_subscription_id' };
  }

  const current = await Subscription.findOne({ platformSubscriptionId })
    .select('_id status currentPeriodEnd')
    .lean();
  if (!current) {
    console.error(`[past-due] ${eventId} NOT APPLIED — no subscription for ${platformSubscriptionId}`);
    return { markedPastDue: false, reason: 'not_found' };
  }

  const period = renewalPeriod(invoice);
  if (period && period.end <= current.currentPeriodEnd) {
    console.log(`[past-due] ${eventId} invoice already paid for subscription ${current._id} — ignored`);
    return { markedPastDue: false, reason: 'already_paid' };
  }

  if (current.status !== SUBSCRIPTION_STATUS.ACTIVE) {
    console.log(`[past-due] ${eventId} subscription ${current._id} is ${current.status} — no change`);
    return { markedPastDue: false, reason: `status_${current.status}` };
  }

  const filter = { _id: current._id, status: SUBSCRIPTION_STATUS.ACTIVE };
  if (period) filter.currentPeriodEnd = { $lt: period.end };

  const updated = await Subscription.findOneAndUpdate(
    filter,
    {
      $set: {
        status: SUBSCRIPTION_STATUS.PAST_DUE,
        pastDueSince: failedAt,
        graceEndsAt: new Date(failedAt.getTime() + PAST_DUE_GRACE_DAYS * DAY_MS),
      },
    },
    { returnDocument: 'after', runValidators: true },
  ).lean();

  if (!updated) {
    console.log(`[past-due] ${eventId} subscription ${current._id} changed meanwhile — no change`);
    return { markedPastDue: false, reason: 'changed_meanwhile' };
  }

  const emailSent = await sendFailedNotice(updated, invoice, eventId);
  console.log(
    `[past-due] ${eventId} subscription ${updated._id} is past due (notice ${emailSent ? 'sent' : 'NOT sent'})`,
  );
  return { markedPastDue: true, emailSent };
}

/**
 * Stop the billing at Stripe before we expire. Returns whether to expire here.
 *
 * If Stripe says the money arrived, we do NOT expire: 11.1's webhook is on its
 * way and will bring the row back. Already ended at Stripe → just expire here.
 * Any Stripe failure throws, and the next sweep tries again.
 */
async function stopAtStripe(subscription) {
  if (!subscription.platformSubscriptionId) return true;
  if (!isStripeConfigured) {
    console.warn(`[lifecycle] Stripe not configured — expiring ${subscription._id} locally only`);
    return true;
  }

  const remote = await stripe.subscriptions.retrieve(subscription.platformSubscriptionId);
  if (STRIPE_PAID_STATES.includes(remote?.status)) {
    console.log(`[lifecycle] ${subscription._id} is paid at Stripe — waiting for the webhook, not expiring`);
    return false;
  }
  if (!STRIPE_ENDED_STATES.includes(remote?.status)) {
    await stripe.subscriptions.cancel(subscription.platformSubscriptionId);
  }
  return true;
}

/**
 * Expire every past_due subscription whose grace has run out.
 *
 * Stripe first, database second (10.1's rule). The update matches only a row
 * STILL past_due with the grace passed, so a recovery landing at the same
 * moment wins and nothing is expired.
 *
 * @returns {Promise<{ expired: number, waiting: number, failed: number }>}
 */
export async function expireLapsedGrace({ now = new Date() } = {}) {
  const lapsed = await Subscription.find({
    status: SUBSCRIPTION_STATUS.PAST_DUE,
    graceEndsAt: { $lte: now },
  })
    .select('_id platformSubscriptionId')
    .sort({ graceEndsAt: 1 })
    .limit(LIFECYCLE_SWEEP_BATCH)
    .lean();

  const result = { expired: 0, waiting: 0, failed: 0 };

  for (const subscription of lapsed) {
    try {
      if (!(await stopAtStripe(subscription))) {
        result.waiting += 1;
        continue;
      }
      const changed = await Subscription.updateOne(
        { _id: subscription._id, status: SUBSCRIPTION_STATUS.PAST_DUE, graceEndsAt: { $lte: now } },
        { $set: EXPIRED_SET },
        { runValidators: true },
      );
      if (changed.modifiedCount > 0) {
        result.expired += 1;
        console.log(`[lifecycle] ${subscription._id} grace ended — expired`);
      }
    } catch (error) {
      // Nothing changed here; the next sweep retries. Never Stripe's own text.
      result.failed += 1;
      console.error(`[lifecycle] ${subscription._id} could not be expired (${error?.name ?? 'Error'}) — will retry`);
    }
  }

  return result;
}

// ── cancellation (11.3) ─────────────────────────────────────────────────────

/**
 * Cancel one subscription — the ONE path, for the client (11.3) and the admin
 * (10.1). Stripe first, database second.
 *
 * ACTIVE: Stripe stops at the period end, and access runs to it (§13).
 * PAST DUE: Stripe stops NOW, so no retry can charge someone who has left; access
 * runs to the grace end already promised (developer's call, 2026-09-25). 10.1
 * used "at period end" for both, which cut a past-due client off at once while
 * Stripe kept retrying their card.
 *
 * @returns {Promise<{ outcome: 'cancelled'|'already_cancelled'|'ended'|'changed',
 *   stripe?: 'done'|'not_configured'|'no_platform_id', subscription?: object }>}
 */
export async function cancelSubscription(
  subscription,
  { by, now = new Date(), stripeFailedMessage = CANCEL_STRIPE_FAILED_MESSAGE } = {},
) {
  if (subscription.status === SUBSCRIPTION_STATUS.CANCELLED) return { outcome: 'already_cancelled' };
  if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE && subscription.status !== SUBSCRIPTION_STATUS.PAST_DUE) {
    return { outcome: 'ended' };
  }

  let stripeResult = 'done';
  if (!isStripeConfigured) stripeResult = 'not_configured';
  else if (!subscription.platformSubscriptionId) stripeResult = 'no_platform_id';
  else {
    try {
      if (subscription.status === SUBSCRIPTION_STATUS.PAST_DUE) {
        await stripe.subscriptions.cancel(subscription.platformSubscriptionId);
      } else {
        await stripe.subscriptions.update(subscription.platformSubscriptionId, { cancel_at_period_end: true });
      }
    } catch (error) {
      // The name only: Stripe's text can name internal objects.
      console.error(`[cancel] Stripe refused for ${subscription._id} (${error?.name ?? 'Error'}) — nothing changed`);
      throw new AppError(stripeFailedMessage, 502, CANCEL_STRIPE_FAILED_CODE);
    }
  }

  // Matches only the status Stripe was just told about, so a renewal or a
  // second cancel landing meanwhile is never overwritten.
  const updated = await Subscription.findOneAndUpdate(
    { _id: subscription._id, status: subscription.status },
    { $set: { status: SUBSCRIPTION_STATUS.CANCELLED, cancelledAt: now, cancelledBy: by } },
    { returnDocument: 'after', runValidators: true },
  ).lean();

  if (updated) return { outcome: 'cancelled', stripe: stripeResult, subscription: updated };

  const latest = await Subscription.findById(subscription._id).select('status').lean();
  if (latest?.status === SUBSCRIPTION_STATUS.CANCELLED) return { outcome: 'already_cancelled' };
  console.error(`[cancel] ${subscription._id} changed during cancellation (now ${latest?.status}) — check Stripe`);
  return { outcome: 'changed' };
}

/**
 * Expire every cancelled subscription whose access has run out (§13: "at period
 * end → expired"). No Stripe call: Stripe already stops at the period end, and
 * a past-due cancellation was stopped there at once. The filter repeats the
 * boundary, so a reactivation landing meanwhile wins.
 */
export async function expireEndedCancellations({ now = new Date() } = {}) {
  const ended = {
    status: SUBSCRIPTION_STATUS.CANCELLED,
    currentPeriodEnd: { $lte: now },
    $or: [{ graceEndsAt: { $exists: false } }, { graceEndsAt: null }, { graceEndsAt: { $lte: now } }],
  };

  const rows = await Subscription.find(ended)
    .select('_id')
    .sort({ currentPeriodEnd: 1 })
    .limit(LIFECYCLE_SWEEP_BATCH)
    .lean();

  let expired = 0;
  for (const { _id } of rows) {
    const changed = await Subscription.updateOne({ _id, ...ended }, { $set: EXPIRED_SET }, { runValidators: true });
    if (changed.modifiedCount > 0) {
      expired += 1;
      console.log(`[lifecycle] ${_id} cancelled period over — expired`);
    }
  }
  return { expired };
}

/** One sweep: lapsed grace (11.2), then cancellations that have run out (11.3). */
export async function runLifecycleSweep({ now = new Date() } = {}) {
  return {
    grace: await expireLapsedGrace({ now }),
    cancelled: await expireEndedCancellations({ now }),
    // 11.6: the third transparency point, a few days before each charge.
    reminders: await sendRenewalReminders({ now }),
  };
}

// ── Stripe-side changes (11.3) ──────────────────────────────────────────────

/**
 * `customer.subscription.deleted`: Stripe has stopped billing — at a period end,
 * from our own cancel, or from its dashboard. NEVER mid-paid-period: if paid
 * time remains the row becomes cancelled and keeps access; otherwise expired.
 * The filter pins the status and period we read, so a renewal meanwhile wins.
 */
export async function handleStripeSubscriptionEnded(stripeSubscription, { eventId, now = new Date() }) {
  const local = await Subscription.findOne({ platformSubscriptionId: stripeSubscription?.id })
    .select('_id status currentPeriodEnd graceEndsAt')
    .lean();
  if (!local) {
    console.error(`[lifecycle] ${eventId} Stripe ended ${stripeSubscription?.id}, which we do not hold`);
    return { changed: false, reason: 'not_found' };
  }
  if (local.status === SUBSCRIPTION_STATUS.EXPIRED) return { changed: false, reason: 'already_expired' };

  const ends = local.status === SUBSCRIPTION_STATUS.ACTIVE ? local.currentPeriodEnd : accessEndsAt(local);
  const pinned = { _id: local._id, status: local.status, currentPeriodEnd: local.currentPeriodEnd };

  if (ends && ends > now) {
    if (local.status === SUBSCRIPTION_STATUS.CANCELLED) return { changed: false, reason: 'already_cancelled' };
    const changed = await Subscription.updateOne(pinned, {
      $set: { status: SUBSCRIPTION_STATUS.CANCELLED, cancelledAt: now },
    });
    console.log(`[lifecycle] ${eventId} ${local._id} ended at Stripe — cancelled, access kept until its end`);
    return { changed: changed.modifiedCount > 0, reason: 'cancelled' };
  }

  const changed = await Subscription.updateOne(pinned, { $set: EXPIRED_SET }, { runValidators: true });
  console.log(`[lifecycle] ${eventId} ${local._id} ended at Stripe — expired`);
  return { changed: changed.modifiedCount > 0, reason: 'expired' };
}

/**
 * `customer.subscription.updated`: a safety net for a cancel or undo made in
 * Stripe's own screens. It RE-READS the live subscription rather than trusting
 * the payload, so a late, out-of-order event can never flip us the wrong way.
 */
export async function syncStripeCancellation(stripeSubscriptionId, { eventId, now = new Date() }) {
  if (!isStripeConfigured || !stripeSubscriptionId) return { changed: false, reason: 'not_configured' };

  const local = await Subscription.findOne({ platformSubscriptionId: stripeSubscriptionId })
    .select('_id status currentPeriodEnd graceEndsAt')
    .lean();
  if (!local) return { changed: false, reason: 'not_found' };

  const live = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  if (STRIPE_ENDED_STATES.includes(live?.status)) return { changed: false, reason: 'ended_at_stripe' };

  if (live?.cancel_at_period_end === true && local.status === SUBSCRIPTION_STATUS.ACTIVE) {
    const changed = await Subscription.updateOne(
      { _id: local._id, status: SUBSCRIPTION_STATUS.ACTIVE },
      { $set: { status: SUBSCRIPTION_STATUS.CANCELLED, cancelledAt: now } },
    );
    console.log(`[lifecycle] ${eventId} ${local._id} cancelled in Stripe's screens — synced`);
    return { changed: changed.modifiedCount > 0, reason: 'cancelled' };
  }

  if (
    live?.cancel_at_period_end === false &&
    live?.status === 'active' &&
    local.status === SUBSCRIPTION_STATUS.CANCELLED &&
    !local.graceEndsAt &&
    local.currentPeriodEnd > now
  ) {
    const changed = await Subscription.updateOne(
      { _id: local._id, status: SUBSCRIPTION_STATUS.CANCELLED, graceEndsAt: { $exists: false } },
      { $set: { status: SUBSCRIPTION_STATUS.ACTIVE }, $unset: { cancelledAt: 1, cancelledBy: 1 } },
    );
    console.log(`[lifecycle] ${eventId} ${local._id} reactivated in Stripe's screens — synced`);
    return { changed: changed.modifiedCount > 0, reason: 'reactivated' };
  }

  return { changed: false, reason: 'in_step' };
}

// ── the scheduler ───────────────────────────────────────────────────────────

let timer = null;
let running = false;

/**
 * Runs inside the web server, as the session reminders do (9.6). Two instances
 * are safe: every expiry is a conditional update. `LIFECYCLE_SWEEP=off`
 * disables it; `npm run lifecycle:run` does one sweep by hand.
 */
export function startLifecycleSweep({
  intervalMs = LIFECYCLE_SWEEP_INTERVAL_MS,
  firstRunMs = LIFECYCLE_SWEEP_FIRST_RUN_MS,
} = {}) {
  if (timer) return timer;

  const tick = async () => {
    if (running) return; // a slow sweep is never run twice at once
    running = true;
    try {
      const { grace, cancelled, reminders } = await runLifecycleSweep();
      if (grace.expired || grace.waiting || grace.failed || cancelled.expired || reminders.sent || reminders.failed) {
        console.log(
          `[lifecycle] sweep: grace ${grace.expired} expired, ${grace.waiting} waiting, ${grace.failed} failed; cancelled ${cancelled.expired} expired; reminders ${reminders.sent} sent, ${reminders.failed} failed`,
        );
      }
    } catch (error) {
      console.error(`[lifecycle] sweep failed (${error?.name ?? 'Error'})`);
    } finally {
      running = false;
    }
  };

  const first = setTimeout(tick, firstRunMs);
  first.unref?.();
  timer = setInterval(tick, intervalMs);
  timer.unref?.();
  return timer;
}

export function stopLifecycleSweep() {
  if (timer) clearInterval(timer);
  timer = null;
}

export default {
  markPastDueFromInvoice,
  expireLapsedGrace,
  cancelSubscription,
  expireEndedCancellations,
  handleStripeSubscriptionEnded,
  syncStripeCancellation,
  runLifecycleSweep,
  startLifecycleSweep,
  stopLifecycleSweep,
};
