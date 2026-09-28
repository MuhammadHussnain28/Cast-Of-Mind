import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { stripe, isStripeConfigured } from '../config/stripe.js';
import { AppError } from '../utils/AppError.js';
import { accessEndsAt, findCurrentSubscription } from '../middleware/requireActiveSubscription.js';
import { CANCELLED_BY, SUBSCRIPTION_STATUS, formatMinorUnits } from '../constants/payments.js';
import {
  CANCEL_STRIPE_FAILED_CODE,
  CANCEL_STRIPE_FAILED_MESSAGE,
  CANNOT_REACTIVATE_CODE,
  CANNOT_REACTIVATE_MESSAGE,
  NOT_CANCELLED_CODE,
  NOT_CANCELLED_MESSAGE,
  NO_SUBSCRIPTION_TO_CHANGE_CODE,
  NO_SUBSCRIPTION_TO_CHANGE_MESSAGE,
  SUBSCRIPTION_CHANGED_CODE,
  SUBSCRIPTION_CHANGED_MESSAGE,
} from '../constants/subscriptionLifecycle.js';
import { accessUntilText, cancelSubscription } from './subscriptionLifecycle.service.js';
import {
  sendSubscriptionCancelledEmail,
  sendSubscriptionReactivatedEmail,
} from './email/email.service.js';

// The client's own cancel and reactivate — chunk 11.3, master spec §13.
//
// The subscription is found from the TOKEN, never from the request: there is no
// id to tamper with. NEVER mid-paid-period: access runs to `accessEndsAt`.
// Logs carry ids only.

/** A past-due cancellation was stopped at Stripe at once, so it cannot be undone here. */
const canReactivate = (subscription) =>
  subscription.status === SUBSCRIPTION_STATUS.CANCELLED &&
  subscription.cancelledBy === CANCELLED_BY.CLIENT &&
  !subscription.graceEndsAt;

async function recipient(userId) {
  const [user, profile] = await Promise.all([
    User.findById(userId).select('email').lean(),
    ClientProfile.findOne({ userId }).select('name coupleData timezone').lean(),
  ]);
  return {
    email: user?.email ?? null,
    name: profile?.name ?? profile?.coupleData?.partner1?.name ?? null,
    timezone: profile?.timezone ?? null,
  };
}

/** Best-effort: a failed email is logged by name and never undoes the change. */
async function notify(label, subscriptionId, send) {
  try {
    await send();
    return true;
  } catch (error) {
    console.error(`[subscription] ${subscriptionId} ${label} email failed (${error?.name ?? 'Error'})`);
    return false;
  }
}

/** @returns {Promise<{ cancelled: boolean, alreadyCancelled?: boolean, accessEndsAt: Date|null }>} */
export async function cancelMySubscription(userId) {
  const current = await findCurrentSubscription(userId);
  if (!current) throw new AppError(NO_SUBSCRIPTION_TO_CHANGE_MESSAGE, 409, NO_SUBSCRIPTION_TO_CHANGE_CODE);

  const result = await cancelSubscription(current, { by: CANCELLED_BY.CLIENT });

  if (result.outcome === 'already_cancelled') {
    const latest = await Subscription.findById(current._id).lean();
    return { cancelled: false, alreadyCancelled: true, accessEndsAt: accessEndsAt(latest) };
  }
  if (result.outcome !== 'cancelled') {
    throw new AppError(SUBSCRIPTION_CHANGED_MESSAGE, 409, SUBSCRIPTION_CHANGED_CODE);
  }

  const ends = accessEndsAt(result.subscription);
  const to = await recipient(userId);
  if (to.email && ends) {
    await notify('cancellation', current._id, () =>
      sendSubscriptionCancelledEmail(to.email, {
        name: to.name,
        accessUntil: accessUntilText(ends, to.timezone),
        canReactivate: canReactivate(result.subscription),
      }),
    );
  }
  console.log(`[subscription] ${current._id} cancelled by the client`);
  return { cancelled: true, accessEndsAt: ends };
}

/**
 * Undo a cancellation before the end date. Only the client's OWN cancellation
 * (an admin one may be a refund dispute), and not a past-due one, which Stripe
 * has already ended. Stripe first, database second.
 *
 * @returns {Promise<{ reactivated: boolean, alreadyActive?: boolean }>}
 */
export async function reactivateMySubscription(userId, { now = new Date() } = {}) {
  const current = await findCurrentSubscription(userId);
  if (!current) throw new AppError(NO_SUBSCRIPTION_TO_CHANGE_MESSAGE, 409, NO_SUBSCRIPTION_TO_CHANGE_CODE);
  if (current.status === SUBSCRIPTION_STATUS.ACTIVE) return { reactivated: false, alreadyActive: true };
  if (current.status !== SUBSCRIPTION_STATUS.CANCELLED) {
    throw new AppError(NOT_CANCELLED_MESSAGE, 409, NOT_CANCELLED_CODE);
  }
  if (!canReactivate(current) || !(current.currentPeriodEnd > now)) {
    throw new AppError(CANNOT_REACTIVATE_MESSAGE, 409, CANNOT_REACTIVATE_CODE);
  }

  if (isStripeConfigured && current.platformSubscriptionId) {
    try {
      await stripe.subscriptions.update(current.platformSubscriptionId, { cancel_at_period_end: false });
    } catch (error) {
      console.error(`[subscription] ${current._id} Stripe refused the reactivation (${error?.name ?? 'Error'})`);
      throw new AppError(CANCEL_STRIPE_FAILED_MESSAGE, 502, CANCEL_STRIPE_FAILED_CODE);
    }
  }

  // Every condition checked above is repeated here, so the sweep expiring it or
  // a second press landing meanwhile always wins cleanly.
  const updated = await Subscription.findOneAndUpdate(
    {
      _id: current._id,
      status: SUBSCRIPTION_STATUS.CANCELLED,
      cancelledBy: CANCELLED_BY.CLIENT,
      graceEndsAt: { $exists: false },
      currentPeriodEnd: { $gt: now },
    },
    { $set: { status: SUBSCRIPTION_STATUS.ACTIVE }, $unset: { cancelledAt: 1, cancelledBy: 1 } },
    { returnDocument: 'after', runValidators: true },
  ).lean();

  if (!updated) {
    const latest = await Subscription.findById(current._id).select('status').lean();
    if (latest?.status === SUBSCRIPTION_STATUS.ACTIVE) return { reactivated: false, alreadyActive: true };
    console.error(`[subscription] ${current._id} changed during reactivation (now ${latest?.status}) — check Stripe`);
    throw new AppError(SUBSCRIPTION_CHANGED_MESSAGE, 409, SUBSCRIPTION_CHANGED_CODE);
  }

  const to = await recipient(userId);
  if (to.email) {
    await notify('reactivation', current._id, () =>
      sendSubscriptionReactivatedEmail(to.email, {
        name: to.name,
        amount: formatMinorUnits(updated.amount, updated.currency),
        nextPayment: accessUntilText(updated.nextBillingDate, to.timezone),
      }),
    );
  }
  console.log(`[subscription] ${current._id} reactivated by the client`);
  return { reactivated: true };
}

export default { cancelMySubscription, reactivateMySubscription };
