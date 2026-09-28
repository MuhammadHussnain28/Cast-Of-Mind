import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { ClientProfile } from '../models/ClientProfile.js';
import {
  SESSIONS_PER_CYCLE,
  SUBSCRIPTION_STATUS,
  formatMinorUnits,
} from '../constants/payments.js';
import { isValidTimeZone } from '../utils/timezone.js';
import { sendPaymentReceiptEmail } from './email/email.service.js';

// Monthly renewal — chunk 11.1, master spec §13.
//
// SEAMLESS: the client does nothing and notices nothing. The portal simply reads
// the new dates. Logs carry ids only — never an email, a name or card details.

// A paid invoice brings a past_due subscription back to active (developer's
// call, 2026-09-24): the money has arrived.
const RENEWABLE = Object.freeze([SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.PAST_DUE]);

const fromSeconds = (seconds) => (Number.isInteger(seconds) ? new Date(seconds * 1000) : null);

/**
 * The Stripe subscription an invoice belongs to. API `2026-08-26.dahlia` moved
 * it under `parent.subscription_details`; older versions had it at the top.
 */
export function invoiceSubscriptionId(invoice) {
  const ref = invoice?.parent?.subscription_details?.subscription ?? invoice?.subscription ?? null;
  if (typeof ref === 'string') return ref;
  return typeof ref?.id === 'string' ? ref.id : null;
}

const isSubscriptionLine = (line) =>
  line?.parent?.type === 'subscription_item_details' || line?.type === 'subscription';

/**
 * The NEW period this invoice paid for, from its subscription line.
 *
 * NOT `invoice.period_start/period_end`: on a renewal invoice those cover the
 * period that just ENDED. Using them would renew into the past.
 */
export function invoiceLinePeriod(invoice) {
  const lines = Array.isArray(invoice?.lines?.data) ? invoice.lines.data : [];
  const withPeriod = lines.filter((line) => Number.isInteger(line?.period?.end));
  const candidates = withPeriod.some(isSubscriptionLine) ? withPeriod.filter(isSubscriptionLine) : withPeriod;
  if (candidates.length === 0) return null;

  const latest = candidates.reduce((a, b) => (b.period.end > a.period.end ? b : a));
  const start = fromSeconds(latest.period.start);
  const end = fromSeconds(latest.period.end);
  return start && end ? { start, end } : null;
}

/** One calendar month later, clamped to the month's last day (31 Jan → 28/29 Feb). */
export function addOneMonth(date) {
  const next = new Date(date);
  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next;
}

/**
 * The period to renew into. The line period first; otherwise one month from the
 * invoice's own `period_end` (the old period's end, so the new one's start).
 *
 * The fallback reads ONLY the invoice, never our stored period end. Anchored on
 * our own record, a retry would extend by a second month.
 */
export function renewalPeriod(invoice) {
  const fromLine = invoiceLinePeriod(invoice);
  if (fromLine) return fromLine;

  const start = fromSeconds(invoice?.period_end);
  return start ? { start, end: addOneMonth(start) } : null;
}

const dateIn = (instant, timeZone) =>
  new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(instant),
  );

/** Best-effort: a failed receipt is logged and never undoes the renewal. */
async function sendReceipt(subscription, invoice, eventId) {
  try {
    const [user, profile] = await Promise.all([
      User.findById(subscription.clientId).select('email').lean(),
      ClientProfile.findOne({ userId: subscription.clientId }).select('name coupleData timezone').lean(),
    ]);
    if (!user?.email) {
      console.error(`[renewal] ${eventId} no email address for the client — receipt not sent`);
      return false;
    }

    const zone = isValidTimeZone(profile?.timezone) ? profile.timezone : 'UTC';
    const label = zone === 'UTC' ? ' (UTC)' : '';
    const on = (instant) => `${dateIn(instant, zone)}${label}`;
    const paidAt = fromSeconds(invoice?.status_transitions?.paid_at) ?? new Date();
    const currency = invoice?.currency ? String(invoice.currency).toUpperCase() : subscription.currency;
    const amountMinor = Number.isInteger(invoice?.amount_paid) ? invoice.amount_paid : subscription.amount;

    await sendPaymentReceiptEmail(user.email, {
      name: profile?.name ?? profile?.coupleData?.partner1?.name ?? null,
      amount: formatMinorUnits(amountMinor, currency),
      paidOn: on(paidAt),
      periodFrom: on(subscription.currentPeriodStart),
      periodTo: on(subscription.currentPeriodEnd),
      nextPayment: on(subscription.nextBillingDate),
    });
    return true;
  } catch (error) {
    // The error's name only: a vendor message can carry the address.
    console.error(`[renewal] ${eventId} receipt email failed: ${error?.name ?? 'Error'}`);
    return false;
  }
}

/**
 * Apply one paid renewal invoice.
 *
 * THE FORWARD-ONLY CONDITION IS THE IDEMPOTENCY. The update matches only while
 * the stored period ends BEFORE the new one, so a duplicate, a racing retry or a
 * late older invoice all match nothing. The period, the counter and the status
 * move in one atomic write, so they can never be applied apart.
 *
 * Never throws for bad data: an unknown subscription is logged loudly and
 * answered, because a retry could not fix it. A database error does throw, so
 * Stripe retries it.
 *
 * @returns {Promise<{ renewed: boolean, reason?: string, emailSent?: boolean }>}
 */
export async function renewFromInvoice(invoice, { eventId }) {
  const platformSubscriptionId = invoiceSubscriptionId(invoice);
  if (!platformSubscriptionId) {
    console.error(`[renewal] ${eventId} RENEWAL NOT APPLIED — the invoice names no subscription`);
    return { renewed: false, reason: 'no_subscription_id' };
  }

  const current = await Subscription.findOne({ platformSubscriptionId })
    .select('_id status amount currency')
    .lean();
  if (!current) {
    console.error(
      `[renewal] ${eventId} RENEWAL NOT APPLIED — no subscription for ${platformSubscriptionId}. Money arrived; resolve by hand.`,
    );
    return { renewed: false, reason: 'not_found' };
  }

  if (!RENEWABLE.includes(current.status)) {
    console.error(
      `[renewal] ${eventId} RENEWAL NOT APPLIED — subscription ${current._id} is ${current.status}. Money arrived; resolve by hand.`,
    );
    return { renewed: false, reason: 'not_renewable' };
  }

  const period = renewalPeriod(invoice);
  if (!period || !(period.end > period.start)) {
    console.error(`[renewal] ${eventId} RENEWAL NOT APPLIED — the invoice carries no usable period`);
    return { renewed: false, reason: 'no_period' };
  }

  const paid = invoice?.amount_paid;
  const currency = invoice?.currency ? String(invoice.currency).toUpperCase() : null;
  if (paid !== current.amount || (currency && currency !== current.currency)) {
    // Still renewed: Stripe is the truth about money (a proration or a coupon).
    console.warn(
      `[renewal] ${eventId} amount differs from the plan: paid ${paid} ${currency}, plan ${current.amount} ${current.currency}`,
    );
  }

  const renewed = await Subscription.findOneAndUpdate(
    {
      _id: current._id,
      status: { $in: RENEWABLE },
      currentPeriodEnd: { $lt: period.end },
    },
    {
      $set: {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        currentPeriodStart: period.start,
        currentPeriodEnd: period.end,
        nextBillingDate: period.end,
        // §13: back to 4. Unused sessions are forfeited, never added on.
        sessionsRemaining: SESSIONS_PER_CYCLE,
      },
      // A recovered past_due (11.2): the grace is over, so the banner goes.
      $unset: { pastDueSince: 1, graceEndsAt: 1 },
    },
    { returnDocument: 'after', runValidators: true },
  ).lean();

  if (!renewed) {
    console.log(`[renewal] ${eventId} already applied to subscription ${current._id} — nothing to do`);
    return { renewed: false, reason: 'already_applied' };
  }

  const emailSent = await sendReceipt(renewed, invoice, eventId);
  console.log(
    `[renewal] ${eventId} subscription ${renewed._id} renewed (receipt ${emailSent ? 'sent' : 'NOT sent'})`,
  );
  return { renewed: true, emailSent };
}

export default { renewFromInvoice, invoiceSubscriptionId, invoiceLinePeriod, renewalPeriod, addOneMonth };
