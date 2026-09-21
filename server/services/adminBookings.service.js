import { Booking } from '../models/Booking.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { User } from '../models/User.js';
import { ROLES } from '../constants/roles.js';
import { SUBSCRIPTION_STATUS } from '../constants/payments.js';
import { STATUS_FILTER_ALL } from '../constants/adminClients.js';
import { SORT_KEYS, STATUS_RANK } from '../constants/adminBookings.js';
import { clientNameClauses, containsIgnoringCase, nameClauses } from '../utils/search.js';
import { clientDisplayName } from '../utils/clientDisplayName.js';

/**
 * Bookings and subscriptions overview — master spec §9.5.
 *
 * ONE ROW PER BOOKING, carrying its newest subscription — the same "most recent
 * decides" rule the access gate uses (7.1), so this screen and a client's
 * portal can never disagree about the state of one pairing.
 *
 * THE BOUNDARY: nothing here imports or queries `Message`, `Journal` or
 * `PrivateNote`. `routes/privateNotes.test.js` walks the admin router's import
 * graph and asserts it.
 *
 * NO USER ID LEAVES. The booking holds both people's user ids; what goes out is
 * each person's PROFILE id — the handle the client and therapist admin screens
 * already use — and the booking's own id as the row key.
 */

// Each sort key names ONE computed field. The query string chooses the key; it
// never supplies the field, so `$sort` only ever sees names written here.
const SORT_FIELDS = Object.freeze({
  [SORT_KEYS.CLIENT]: 'clientSortName',
  [SORT_KEYS.THERAPIST]: 'therapistSortName',
  [SORT_KEYS.STATUS]: 'statusRank',
  [SORT_KEYS.PAIRED_SINCE]: 'matchedAt',
  [SORT_KEYS.NEXT_PAYMENT]: 'nextPayment',
});

// Only a live subscription has a next payment. A cancelled or expired row
// still stores `nextBillingDate` (the model requires it), but nothing will be
// charged on it — showing or sorting by it would schedule money that is not
// coming.
const LIVE_STATUSES = [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.PAST_DUE];

/**
 * Who a search term can reach: the client by name, either partner, or email;
 * the therapist by name. Resolved to user ids first so the aggregation can
 * match on the booking's own indexed fields rather than join-then-filter.
 */
async function searchMatch(q) {
  const [clientUsers, clientProfiles, therapistProfiles] = await Promise.all([
    User.find({ role: ROLES.CLIENT, email: containsIgnoringCase(q) }).select('_id').lean(),
    ClientProfile.find({ $or: clientNameClauses(q) }).select('userId').lean(),
    TherapistProfile.find({ $or: nameClauses(q) }).select('userId').lean(),
  ]);

  return {
    $or: [
      {
        clientId: {
          $in: [...clientUsers.map((u) => u._id), ...clientProfiles.map((p) => p.userId)],
        },
      },
      { therapistId: { $in: therapistProfiles.map((p) => p.userId) } },
    ],
  };
}

/**
 * The table — one aggregation whatever the booking count.
 *
 * Search, the status filter, the counts, the sort, the page and the total come
 * back in one round trip. The counts are taken BEFORE the status filter and
 * AFTER the search, so the ledger always shows every bucket of what the admin
 * searched for, whichever bucket is selected.
 *
 * Known limit, stated: a name sort joins every matched booking before it can
 * order them. Real volume is in the tens to low hundreds, which is nowhere near
 * mattering; past a few thousand the fix is a stored sort key.
 */
export async function listBookings({ status, q, sort, direction, page, limit }) {
  const match = q ? await searchMatch(q) : {};
  const statusMatch = status === STATUS_FILTER_ALL ? {} : { subscriptionStatus: status };
  const sortField = SORT_FIELDS[sort];
  const order = direction === 'asc' ? 1 : -1;

  const [result] = await Booking.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'clientprofiles',
        localField: 'clientId',
        foreignField: 'userId',
        pipeline: [{ $project: { type: 1, name: 1, coupleData: 1 } }],
        as: 'client',
      },
    },
    { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'clientId',
        foreignField: '_id',
        pipeline: [{ $project: { _id: 0, status: 1 } }],
        as: 'clientUser',
      },
    },
    { $unwind: { path: '$clientUser', preserveNullAndEmptyArrays: true } },
    {
      // Profile status is enough for the therapist: deactivation flips it in the
      // same transaction as `users.status` (4.5), so the two cannot disagree.
      $lookup: {
        from: 'therapistprofiles',
        localField: 'therapistId',
        foreignField: 'userId',
        pipeline: [{ $project: { title: 1, firstName: 1, lastName: 1, status: 1 } }],
        as: 'therapist',
      },
    },
    { $unwind: { path: '$therapist', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'subscriptions',
        let: { bookingId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$bookingId', '$$bookingId'] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          { $project: { _id: 0, status: 1, currentPeriodEnd: 1, nextBillingDate: 1 } },
        ],
        as: 'subscription',
      },
    },
    { $unwind: { path: '$subscription', preserveNullAndEmptyArrays: true } },
    { $addFields: { subscriptionStatus: { $ifNull: ['$subscription.status', 'none'] } } },
    {
      $addFields: {
        statusRank: {
          $switch: {
            branches: Object.entries(STATUS_RANK).map(([value, rank]) => ({
              case: { $eq: ['$subscriptionStatus', value] },
              then: rank,
            })),
            default: 99,
          },
        },
        nextPayment: {
          $cond: [
            { $in: ['$subscriptionStatus', LIVE_STATUSES] },
            '$subscription.nextBillingDate',
            null,
          ],
        },
        // Built the way `clientDisplayName` words it, so a couple sorts under
        // the label the admin actually reads: "Marta and Joris".
        clientSortName: {
          $cond: [
            { $eq: ['$client.type', 'couple'] },
            {
              $concat: [
                { $ifNull: ['$client.coupleData.partner1.name', ''] },
                ' and ',
                { $ifNull: ['$client.coupleData.partner2.name', ''] },
              ],
            },
            { $ifNull: ['$client.name', null] },
          ],
        },
        therapistSortName: {
          $cond: [
            { $ifNull: ['$therapist._id', false] },
            { $concat: ['$therapist.firstName', ' ', '$therapist.lastName'] },
            null,
          ],
        },
      },
    },
    {
      $facet: {
        counts: [{ $group: { _id: '$subscriptionStatus', count: { $sum: 1 } } }],
        total: [{ $match: statusMatch }, { $count: 'value' }],
        rows: [
          { $match: statusMatch },
          // Missing values always sort LAST, whichever way the column runs —
          // otherwise "soonest payment first" opens on every row with no
          // payment at all.
          {
            $addFields: {
              sortMissing: {
                $cond: [{ $eq: [{ $ifNull: [`$${sortField}`, null] }, null] }, 1, 0],
              },
            },
          },
          { $sort: { sortMissing: 1, [sortField]: order, _id: order } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              matchedAt: 1,
              status: 1,
              client: 1,
              clientAccountStatus: '$clientUser.status',
              therapist: 1,
              subscriptionStatus: 1,
              currentPeriodEnd: '$subscription.currentPeriodEnd',
              nextPayment: 1,
            },
          },
        ],
      },
    },
  ]).collation({ locale: 'en', strength: 2 });

  const counts = { active: 0, past_due: 0, cancelled: 0, expired: 0, none: 0 };
  for (const row of result?.counts ?? []) {
    if (row._id in counts) counts[row._id] = row.count;
  }

  const data = (result?.rows ?? []).map((row) => ({
    _id: row._id,
    pairedSince: row.matchedAt,
    bookingStatus: row.status,
    client: row.client
      ? {
          id: row.client._id,
          displayName: clientDisplayName(row.client),
          type: row.client.type,
          accountStatus: row.clientAccountStatus ?? null,
        }
      : null,
    therapist: row.therapist
      ? {
          id: row.therapist._id,
          name: `${row.therapist.title} ${row.therapist.firstName} ${row.therapist.lastName}`,
          status: row.therapist.status,
        }
      : null,
    subscriptionStatus: row.subscriptionStatus,
    currentPeriodEnd: row.currentPeriodEnd ?? null,
    nextPayment: row.nextPayment ?? null,
  }));

  const total = result?.total?.[0]?.value ?? 0;

  return {
    data,
    meta: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      counts,
      sort,
      direction,
    },
  };
}
