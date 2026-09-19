import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { Message } from '../models/Message.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { AppError } from '../utils/AppError.js';
import { encodeCursor, decodeCursor } from '../utils/cursor.js';
import { clientDisplayName } from '../utils/clientDisplayName.js';
import { BOOKING_STATUS } from '../constants/payments.js';
import {
  CLIENT_LIST_PAGE_SIZE,
  LAST_ACTIVITY_KIND,
  INVALID_CURSOR_MESSAGE,
  INVALID_CURSOR_CODE,
} from '../constants/therapistClients.js';

/**
 * The therapist's client list — master spec §8.1, inbox architecture §8.
 *
 * THE privateNotes BOUNDARY IS HERE TOO. This file never imports, queries or
 * joins `privateNotes` — not filtered out of a response, simply never reached
 * for. §8.5 requires that separation to be architectural. It is named here
 * because the therapist list is the one client-adjacent surface where a future
 * "show me a note preview" would look like a small, harmless addition.
 *
 * THERE IS NO THERAPIST ID IN THE REQUEST. Every query below is scoped to the
 * authenticated user's own token, so one therapist cannot read another's client
 * list by editing a URL — there is no parameter to tamper with. The same rule
 * clientPortal.service.js and therapistProfile.service.js hold.
 *
 * NO MESSAGE TEXT LEAVES THIS FILE. The aggregation reads message timestamps
 * and a count, never `text`, so a preview cannot be exposed by a later mistake
 * in the controller — the data is not in the object to begin with.
 */

const NAME_UNAVAILABLE = 'Your client';

/**
 * ONE AGGREGATION, WHATEVER THE CLIENT COUNT.
 *
 * The backend rules name the therapist client list as an N+1 risk by name, and
 * it is the obvious shape: loop the bookings, ask for each one's last message,
 * ask for each one's unread count. That is 2N+1 round trips on the first screen
 * a therapist ever sees.
 *
 * Both sub-pipelines are served by indexes that already exist on `messages`:
 * `{ bookingId, createdAt, _id }` for the newest row, and
 * `{ bookingId, read, senderId }` for the unread count.
 *
 * `$arrayElemAt` rather than `$first` — `$first` as an array operator needs
 * MongoDB 4.4, and pinning the floor higher than it has to be is a deployment
 * problem nobody would connect to this file.
 */
function buildPipeline(therapistObjectId, cursor, limit) {
  const messages = Message.collection.name;

  return [
    { $match: { therapistId: therapistObjectId, status: BOOKING_STATUS.ACTIVE } },

    {
      $lookup: {
        from: messages,
        let: { booking: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$bookingId', '$$booking'] } } },
          { $sort: { createdAt: -1, _id: -1 } },
          { $limit: 1 },
          // The TIMESTAMP ONLY. `text` is never projected, from either side.
          { $project: { _id: 0, createdAt: 1 } },
        ],
        as: 'latestMessage',
      },
    },

    {
      $lookup: {
        from: messages,
        let: { booking: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$bookingId', '$$booking'] },
                  { $eq: ['$read', false] },
                  // §14 exactly: a message you sent is never unread for you.
                  { $ne: ['$senderId', therapistObjectId] },
                ],
              },
            },
          },
          { $count: 'total' },
        ],
        as: 'unread',
      },
    },

    {
      $addFields: {
        lastMessageAt: { $arrayElemAt: ['$latestMessage.createdAt', 0] },
        unreadCount: { $ifNull: [{ $arrayElemAt: ['$unread.total', 0] }, 0] },
      },
    },

    // A conversation nobody has written in yet still has to sort somewhere, and
    // the day they were matched is the honest answer — it is genuinely the last
    // thing that happened on that booking.
    { $addFields: { lastActivityAt: { $ifNull: ['$lastMessageAt', '$matchedAt'] } } },

    // Keyset, after the field it sorts on exists. `lastActivityAt` is not
    // unique across bookings, so `_id` is the tiebreak and the pair is compared
    // together — the same rule the chat cursor follows.
    ...(cursor
      ? [
          {
            $match: {
              $or: [
                { lastActivityAt: { $lt: cursor.at } },
                { lastActivityAt: cursor.at, _id: { $lt: cursor.id } },
              ],
            },
          },
        ]
      : []),

    { $sort: { lastActivityAt: -1, _id: -1 } },

    // One extra row answers "is there another page" without a second count.
    { $limit: limit + 1 },

    { $project: { clientId: 1, matchedAt: 1, lastMessageAt: 1, lastActivityAt: 1, unreadCount: 1 } },
  ];
}

/**
 * A row as it goes over the wire.
 *
 * `bookingId` is the ONLY identifier on it. A booking is the central record
 * (§10.5) and every per-client screen from 8.2 onwards is keyed on it, so the
 * client's `users._id` has no use in the therapist's browser — the same call
 * 7.2 made when it kept `senderId` off the message payload.
 */
function present(row, name) {
  return {
    bookingId: String(row._id),
    name: name ?? NAME_UNAVAILABLE,
    matchedAt: row.matchedAt,
    lastActivityAt: row.lastActivityAt,
    lastActivityKind: row.lastMessageAt ? LAST_ACTIVITY_KIND.MESSAGE : LAST_ACTIVITY_KIND.MATCHED,
    unreadCount: row.unreadCount,
  };
}

export async function listTherapistClients(therapistUserId, { cursor, limit } = {}) {
  const pageSize = limit ?? CLIENT_LIST_PAGE_SIZE;
  const me = new mongoose.Types.ObjectId(String(therapistUserId));

  let decoded = null;
  if (cursor) {
    decoded = decodeCursor(cursor);
    if (!decoded) throw new AppError(INVALID_CURSOR_MESSAGE, 400, INVALID_CURSOR_CODE);
  }

  const [rows, total] = await Promise.all([
    Booking.aggregate(buildPipeline(me, decoded, pageSize)),
    // The true count, not the page length — the rail prints it beside the
    // heading and a paged number there would simply be wrong.
    Booking.countDocuments({ therapistId: me, status: BOOKING_STATUS.ACTIVE }),
  ]);

  const hasMore = rows.length > pageSize;
  const page = hasMore ? rows.slice(0, pageSize) : rows;

  // ONE LOOKUP FOR EVERY NAME. Names live on the profile collections rather
  // than on `users` (the store-IDs-only rule, §10), so resolving them per row
  // is the N+1 this screen is warned about.
  const profiles = page.length
    ? await ClientProfile.find({ userId: { $in: page.map((row) => row.clientId) } })
    : [];

  const byUser = new Map(profiles.map((profile) => [String(profile.userId), profile]));

  const last = page[page.length - 1];

  return {
    data: page.map((row) => present(row, clientDisplayName(byUser.get(String(row.clientId))))),
    meta: {
      total,
      hasMore,
      nextCursor: hasMore && last ? encodeCursor(last.lastActivityAt, last._id) : null,
    },
  };
}

export default listTherapistClients;
