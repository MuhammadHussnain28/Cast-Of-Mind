import { Booking } from '../models/Booking.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { Subscription } from '../models/Subscription.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { clientNameClauses, containsIgnoringCase } from '../utils/search.js';
import { clientDisplayName } from '../utils/clientDisplayName.js';
import { resolveAccess } from '../middleware/requireActiveSubscription.js';
import { forgotPassword } from './auth.service.js';
import { cancelSubscription } from './subscriptionLifecycle.service.js';
import { SUBSCRIPTION_CHANGED_CODE, SUBSCRIPTION_CHANGED_MESSAGE } from '../constants/subscriptionLifecycle.js';
import { CANCELLED_BY, SUBSCRIPTION_STATUS } from '../constants/payments.js';
import {
  ADMIN_SUBSCRIPTION_FIELDS,
  ALREADY_CANCELLED_MESSAGE,
  ALREADY_ENDED_MESSAGE,
  CANCELLED_MESSAGE,
  CLIENT_NOT_FOUND_MESSAGE,
  NO_PLATFORM_ID_NOTICE,
  NO_SUBSCRIPTION_MESSAGE,
  RESET_SENT_MESSAGE,
  RESET_SKIPPED_INACTIVE_MESSAGE,
  STATUS_FILTER_ALL,
  STRIPE_FAILED_MESSAGE,
  STRIPE_NOT_CONFIGURED_NOTICE,
  SUBSCRIPTION_HISTORY_LIMIT,
} from '../constants/adminClients.js';

/**
 * Client management — master spec §9.4.
 *
 * THE BOUNDARY: nothing in this file imports or queries `Message`, `Journal` or
 * `PrivateNote`, and nothing ever should. §11 records that an admin
 * conversation viewer was proposed and the client decided against building it,
 * so there must be no route through which chat, journal or clinical content
 * could reach the admin by mistake. `routes/privateNotes.test.js` walks the
 * import graph from `admin.routes.js` and asserts it.
 *
 * `:id` IS THE CLIENT PROFILE ID, NEVER THE USER ID — the same rule 5.5 and 7.1
 * set, and what `/admin/therapists/:id` already means. The therapist's user id
 * does not leave here either; their profile id is what links the two screens.
 */

const pick = (source, fields) => {
  if (!source) return null;
  const out = {};
  for (const field of fields) {
    if (source[field] !== undefined) out[field] = source[field];
  }
  return out;
};

const presentSubscription = (subscription) => pick(subscription, ADMIN_SUBSCRIPTION_FIELDS);

/**
 * The list — one aggregation, whatever the client count.
 *
 * Search, the status filter, the per-status counts, the page and the total all
 * come back in a single round trip. Resolving the subscription and the
 * therapist per row afterwards is the N+1 the backend rules name for exactly
 * this kind of screen.
 *
 * The counts are computed BEFORE the status filter, so the segmented control
 * can show every bucket's size while one of them is selected.
 */
export async function listClients({ status, q, page, limit }) {
  const match = {};

  if (q) {
    // The email lives on `users`, so addresses are resolved to ids first rather
    // than joined in — the same approach the therapist list takes.
    const matchingUsers = await User.find({
      role: ROLES.CLIENT,
      email: containsIgnoringCase(q),
    })
      .select('_id')
      .lean();

    match.$or = [...clientNameClauses(q), { userId: { $in: matchingUsers.map((u) => u._id) } }];
  }

  const statusMatch = status === STATUS_FILTER_ALL ? {} : { subscriptionStatus: status };
  const skip = (page - 1) * limit;

  const [result] = await ClientProfile.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        pipeline: [{ $project: { email: 1, status: 1 } }],
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      // Newest first and one only: a booking may own several subscriptions over
      // its life and the most recent decides access, exactly as the gate reads it.
      $lookup: {
        from: 'subscriptions',
        let: { clientId: '$userId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$clientId', '$$clientId'] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          { $project: { status: 1, currentPeriodEnd: 1, nextBillingDate: 1 } },
        ],
        as: 'subscription',
      },
    },
    { $unwind: { path: '$subscription', preserveNullAndEmptyArrays: true } },
    // 'none' is a real bucket, not a gap: a client with no subscription row is a
    // broken state and the admin should be able to find them.
    { $addFields: { subscriptionStatus: { $ifNull: ['$subscription.status', 'none'] } } },
    {
      $facet: {
        counts: [{ $group: { _id: '$subscriptionStatus', count: { $sum: 1 } } }],
        total: [{ $match: statusMatch }, { $count: 'value' }],
        rows: [
          { $match: statusMatch },
          { $sort: { createdAt: -1, _id: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'bookings',
              let: { clientId: '$userId' },
              pipeline: [
                { $match: { $expr: { $eq: ['$clientId', '$$clientId'] } } },
                { $sort: { matchedAt: -1 } },
                { $limit: 1 },
                {
                  $lookup: {
                    from: 'therapistprofiles',
                    localField: 'therapistId',
                    foreignField: 'userId',
                    // The therapist's USER id stays on the booking and never
                    // travels; their PROFILE id is the handle both admin
                    // screens share.
                    pipeline: [{ $project: { title: 1, firstName: 1, lastName: 1 } }],
                    as: 'therapist',
                  },
                },
                { $unwind: { path: '$therapist', preserveNullAndEmptyArrays: true } },
                { $project: { _id: 0, status: 1, therapist: 1 } },
              ],
              as: 'booking',
            },
          },
          { $unwind: { path: '$booking', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              type: 1,
              name: 1,
              coupleData: 1,
              country: 1,
              city: 1,
              createdAt: 1,
              user: 1,
              subscription: 1,
              subscriptionStatus: 1,
              booking: 1,
            },
          },
        ],
      },
    },
  ]);

  const counts = { active: 0, past_due: 0, cancelled: 0, expired: 0, none: 0 };
  for (const row of result?.counts ?? []) {
    if (row._id in counts) counts[row._id] = row.count;
  }

  const data = (result?.rows ?? []).map((row) => {
    const therapist = row.booking?.therapist;

    return {
      _id: row._id,
      displayName: clientDisplayName(row),
      type: row.type,
      country: row.country,
      city: row.city,
      email: row.user?.email ?? null,
      accountStatus: row.user?.status ?? null,
      subscriptionStatus: row.subscriptionStatus,
      currentPeriodEnd: row.subscription?.currentPeriodEnd ?? null,
      nextBillingDate: row.subscription?.nextBillingDate ?? null,
      therapist: therapist
        ? {
            id: therapist._id,
            name: `${therapist.title} ${therapist.firstName} ${therapist.lastName}`,
          }
        : null,
      bookingStatus: row.booking?.status ?? null,
      createdAt: row.createdAt,
    };
  });

  const total = result?.total?.[0]?.value ?? 0;

  return {
    data,
    meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)), counts },
  };
}

async function loadProfile(id) {
  const profile = await ClientProfile.findById(id).populate('userId', 'email status role');

  if (!profile) {
    throw new AppError(CLIENT_NOT_FOUND_MESSAGE, 404, 'CLIENT_NOT_FOUND');
  }

  return profile;
}

export async function getClient(id) {
  const profile = await loadProfile(id);
  const userId = profile.userId?._id;

  const [subscriptions, booking] = await Promise.all([
    Subscription.find({ clientId: userId })
      .sort({ createdAt: -1 })
      .limit(SUBSCRIPTION_HISTORY_LIMIT)
      .lean(),
    Booking.findOne({ clientId: userId }).sort({ matchedAt: -1 }).lean(),
  ]);

  let therapist = null;
  if (booking?.therapistId) {
    // An allowlist, not a denylist — a denylist leaks whatever a later chunk
    // adds to `therapistProfiles`. The therapist's user id is not on it: their
    // PROFILE id is the handle the admin's two screens share.
    const found = await TherapistProfile.findOne({ userId: booking.therapistId })
      .select('title firstName lastName therapistType photoUrl country timezone status')
      .lean();

    if (found) {
      const { _id, ...rest } = found;
      therapist = { id: _id, ...rest };
    }
  }

  const plain = profile.toObject();
  // The populated user carries the refresh-token fields toward the browser if
  // it travels whole. Two fields are all this screen needs from it.
  delete plain.userId;

  const [current] = subscriptions;

  return {
    ...plain,
    displayName: clientDisplayName(plain),
    email: profile.userId?.email ?? null,
    accountStatus: profile.userId?.status ?? null,
    // The resolved state the gate itself would return, so the screen and the
    // portal cannot disagree about whether this person still has access.
    access: resolveAccess(current),
    booking: booking ? { status: booking.status, matchedAt: booking.matchedAt } : null,
    therapist,
    subscription: presentSubscription(current),
    subscriptionHistory: subscriptions.slice(1).map(presentSubscription),
  };
}

/**
 * Manual cancellation — §9.4 and §13's admin override.
 *
 * THE SAME PATH AS THE CLIENT'S OWN (11.3): `cancelSubscription`. Stripe first,
 * database second; if Stripe fails, NOTHING is written. An active plan stops at
 * its period end with access kept; a past-due one stops at Stripe at once, so a
 * retry cannot charge someone Asad has just cancelled.
 */
export async function cancelClientSubscription(id) {
  const profile = await loadProfile(id);
  const userId = profile.userId?._id;

  const current = await Subscription.findOne({ clientId: userId }).sort({ createdAt: -1 });

  if (!current) {
    throw new AppError(NO_SUBSCRIPTION_MESSAGE, 409, 'NO_SUBSCRIPTION');
  }

  if (current.status === SUBSCRIPTION_STATUS.EXPIRED) {
    throw new AppError(ALREADY_ENDED_MESSAGE, 409, 'SUBSCRIPTION_ALREADY_ENDED');
  }

  const result = await cancelSubscription(current, {
    by: CANCELLED_BY.ADMIN,
    stripeFailedMessage: STRIPE_FAILED_MESSAGE,
  });

  if (result.outcome === 'changed') {
    throw new AppError(SUBSCRIPTION_CHANGED_MESSAGE, 409, SUBSCRIPTION_CHANGED_CODE);
  }

  // A client cancelling from their own portal at the same moment: whichever
  // lands first wins and the second is reported as already cancelled.
  if (result.outcome !== 'cancelled') {
    return {
      cancelled: false,
      alreadyCancelled: true,
      message: ALREADY_CANCELLED_MESSAGE,
      client: await getClient(id),
    };
  }

  const NOTICES = { not_configured: STRIPE_NOT_CONFIGURED_NOTICE, no_platform_id: NO_PLATFORM_ID_NOTICE };
  return {
    cancelled: true,
    message: CANCELLED_MESSAGE,
    notice: NOTICES[result.stripe] ?? null,
    client: await getClient(id),
  };
}

/**
 * Deactivate or reactivate.
 *
 * ONE RECORD, unlike a therapist. `clientProfiles` has no status field (§10.2),
 * and it should not gain one: a client is not offered to anybody by matching,
 * so there is no second place for the state to be read from.
 *
 * THIS DOES NOT STOP THE BILLING. Stripe keeps charging a deactivated client's
 * card, because the subscription is a separate thing from the login. The screen
 * says so rather than letting the admin assume otherwise.
 */
export async function setClientStatus(id, status) {
  const profile = await loadProfile(id);
  const user = profile.userId;

  if (user.status === status) {
    return { alreadyInState: true, status, client: await getClient(id) };
  }

  await User.updateOne({ _id: user._id }, { $set: { status } });

  return { alreadyInState: false, status, client: await getClient(id) };
}

/**
 * Trigger the standard password reset.
 *
 * Calls the SAME function the public forgot-password endpoint uses, so there is
 * one reset path in the codebase and no admin-only shortcut that could drift
 * from it. The admin never sees, sets or chooses a password — §11: hashes are
 * one-way and recovery is by reset, never retrieval.
 */
export async function resetClientPassword(id) {
  const profile = await loadProfile(id);
  const user = profile.userId;

  if (user.status !== USER_STATUS.ACTIVE) {
    return { sent: false, message: RESET_SKIPPED_INACTIVE_MESSAGE };
  }

  await forgotPassword(user.email);

  return { sent: true, message: RESET_SENT_MESSAGE };
}
