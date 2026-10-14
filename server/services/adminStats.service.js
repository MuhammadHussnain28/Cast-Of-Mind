import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { TherapistApplication, APPLICATION_STATUS } from '../models/TherapistApplication.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { platformQuality } from './adminReviews.service.js';
import {
  BILLING_CURRENCY,
  FUTURE_COLLECTIONS,
  SUBSCRIPTION_STATUS,
  TREND_MONTHS,
} from '../constants/adminStats.js';

/**
 * The admin dashboard's figures — master spec §9.1.
 *
 * Half of these read collections that do not exist yet. They go through the raw
 * driver rather than a model, because MongoDB answers 0 and [] for a collection
 * that has never been created — so every figure is honest today and starts
 * reporting by itself once its slice ships.
 *
 * All month boundaries are UTC (§15: store one universal time). "This month"
 * therefore means the same window for everyone looking at the dashboard, which
 * is what a business overview wants.
 */

const raw = (name) => mongoose.connection.db.collection(name);

/** First instant of the UTC month, `offset` months back from now. */
function monthStart(offset = 0, now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
}

const monthKey = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

/**
 * New client signups per month for the last year.
 *
 * The one figure here that is live from day one: it reads `users`, which
 * already exists. Every month in the window is returned, including the empty
 * ones — a trend with gaps knocked out is a different shape from the truth.
 */
async function signupTrend(now) {
  const from = monthStart(-(TREND_MONTHS - 1), now);

  const grouped = await User.aggregate([
    { $match: { role: ROLES.CLIENT, createdAt: { $gte: from } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
  ]);

  const counts = new Map(
    grouped.map((row) => [
      `${row._id.year}-${String(row._id.month).padStart(2, '0')}`,
      row.count,
    ]),
  );

  return Array.from({ length: TREND_MONTHS }, (_, index) => {
    const date = monthStart(index - (TREND_MONTHS - 1), now);
    const key = monthKey(date);

    return {
      month: key,
      // Sent with the data so the axis cannot disagree with it.
      //
      // en-US rather than the en-GB used elsewhere for dates: en-GB abbreviates
      // September as "Sept", four characters where every other month is three,
      // which leaves the axis visibly ragged. Axis ticks want one width.
      label: date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
      count: counts.get(key) ?? 0,
    };
  });
}

/**
 * Monthly recurring revenue.
 *
 * §9.1 describes this as "active subscriptions × price". Summing each
 * subscription's own `amount` is the same number today and stays correct if the
 * price ever changes or a subscription is ever priced differently.
 *
 * OPEN ITEM for slice 6: §10.6 types `amount` as a Number without saying
 * whether it holds euros or cents. This returns the raw sum; whichever unit
 * slice 6 chooses, the formatting on the dashboard must be checked against it.
 * It cannot be wrong today, because there are no subscriptions.
 */
async function money(now) {
  const thisMonth = monthStart(0, now);
  const lastMonth = monthStart(-1, now);

  const subscriptions = raw(FUTURE_COLLECTIONS.subscriptions);

  const [revenue, activeSubscriptions, newThisMonth, newLastMonth, endedThisMonth, paidEvents] =
    await Promise.all([
      subscriptions
        .aggregate([
          { $match: { status: SUBSCRIPTION_STATUS.ACTIVE, currency: BILLING_CURRENCY } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
        .toArray(),
      subscriptions.countDocuments({ status: SUBSCRIPTION_STATUS.ACTIVE }),
      subscriptions.countDocuments({ createdAt: { $gte: thisMonth } }),
      subscriptions.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } }),
      // Churn. `updatedAt` is the only timestamp both end states share —
      // `cancelledAt` exists but expiry has no stamp of its own. Slice 11 may
      // want a dedicated `endedAt`; until then this is the honest signal.
      subscriptions.countDocuments({
        status: { $in: [SUBSCRIPTION_STATUS.CANCELLED, SUBSCRIPTION_STATUS.EXPIRED] },
        updatedAt: { $gte: thisMonth },
      }),
      raw('paymentevents')
        .aggregate([
          { $match: { eventType: 'invoice.payment_succeeded', amount: { $gt: 0 } } },
          { $group: { _id: null, totalCents: { $sum: '$amount' } } },
        ])
        .toArray(),
    ]);

  const totalFromEvents = paidEvents[0]?.totalCents ?? 0;
  const currentMrr = revenue[0]?.total ?? 0;
  const totalRevenueEarned = totalFromEvents > 0 ? totalFromEvents : currentMrr;

  return {
    monthlyRecurringRevenue: currentMrr,
    totalRevenueEarned,
    currency: BILLING_CURRENCY,
    activeSubscriptions,
    newThisMonth,
    newLastMonth,
    cancelledOrExpiredThisMonth: endedThisMonth,
  };
}

async function people() {
  const [activeClients, inactiveClients, totalTherapists, pendingApplications] =
    await Promise.all([
      User.countDocuments({ role: ROLES.CLIENT, status: USER_STATUS.ACTIVE }),
      User.countDocuments({ role: ROLES.CLIENT, status: USER_STATUS.INACTIVE }),
      // Profiles rather than users: a therapist only exists once approval has
      // created both records, and the profile is what matching reads.
      TherapistProfile.countDocuments({ status: USER_STATUS.ACTIVE }),
      TherapistApplication.countDocuments({ status: APPLICATION_STATUS.PENDING }),
    ]);

  return {
    activeClients,
    inactiveClients,
    totalClients: activeClients + inactiveClients,
    totalTherapists,
    pendingApplications,
  };
}

async function activity(now) {
  const thisMonth = monthStart(0, now);

  const sessionsThisMonth = await raw(FUTURE_COLLECTIONS.sessions).countDocuments({
    scheduledAt: { $gte: thisMonth },
  });

  return { sessionsThisMonth, signups: await signupTrend(now) };
}

/**
 * §9.6: reviews are admin-only and never shown publicly.
 *
 * Read through adminReviews.service.js since 10.3 — the one file allowed to read
 * the collection — rather than the raw driver this used while `reviews` had no
 * model. `averageRating` stays null when nothing is rated, never 0.
 */
const quality = () => platformQuality();

export async function getDashboardStats({ now = new Date() } = {}) {
  const [moneyStats, peopleStats, activityStats, qualityStats] = await Promise.all([
    money(now),
    people(),
    activity(now),
    quality(),
  ]);

  return {
    money: moneyStats,
    people: peopleStats,
    activity: activityStats,
    quality: qualityStats,
    generatedAt: now.toISOString(),
  };
}
