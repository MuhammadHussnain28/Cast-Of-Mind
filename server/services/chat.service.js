import mongoose from 'mongoose';
import { Message } from '../models/Message.js';
import { Booking } from '../models/Booking.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { AppError } from '../utils/AppError.js';
import { encodeCursor as encode, decodeCursor as decode } from '../utils/cursor.js';
import { clientDisplayName } from '../utils/clientDisplayName.js';
import { emitMessage, emitUnread, getSocketServer } from '../realtime/emitter.js';
import { loadBookingMember } from './bookingMembership.service.js';
import { notifyQuietly } from './notification.service.js';
import { NOTIFICATION_TYPE } from '../constants/notifications.js';
import { ROLES } from '../constants/roles.js';
import { BOOKING_STATUS } from '../constants/payments.js';
import {
  MESSAGE_TYPE,
  MESSAGES_PAGE_SIZE,
  CONVERSATION_NOT_FOUND_MESSAGE,
  CONVERSATION_NOT_FOUND_CODE,
  BOOKING_ENDED_MESSAGE,
  BOOKING_ENDED_CODE,
  INVALID_CURSOR_MESSAGE,
  INVALID_CURSOR_CODE,
  OPENING_MESSAGE_MIN,
  OPENING_MESSAGE_MESSAGE,
  OPENING_MESSAGE_CODE,
  SESSION_NOTICE_TEXT,
} from '../constants/chat.js';

/**
 * Chat — master spec §14.
 *
 * MESSAGE TEXT IS NEVER LOGGED, from anywhere in this file. It is on the
 * never-log list and a chat message here is the most sensitive text in the
 * product. Errors carry ids and codes only.
 *
 * `privateNotes` is not imported, queried or reachable from any of this.
 */

const notFound = () =>
  new AppError(CONVERSATION_NOT_FOUND_MESSAGE, 404, CONVERSATION_NOT_FOUND_CODE);

/**
 * THE AUTHORISATION. Everything in this file goes through it.
 *
 * The bookingId comes from the URL, so it is attacker-controlled: membership is
 * proved against the stored booking, never inferred from the caller's role.
 *
 * A booking that does not exist, a malformed id, and a booking belonging to
 * somebody else all return the SAME 404. A 403 for the third case would confirm
 * the id is real, which is all that is needed to enumerate booking ids by
 * comparing responses. Shared with sessions since 9.1.
 */
export async function loadMembership(bookingId, user) {
  return loadBookingMember(bookingId, user, notFound);
}

/**
 * The two people in this conversation, resolved once per request.
 *
 * NOT per message. The backend rules warn about N+1 on chat loading, and names
 * live on the profile collections rather than on `users`, so populating a
 * sender per row would be one lookup per message. A booking has exactly two
 * participants, so two lookups serve a page of any size.
 */
async function loadParticipants(booking) {
  const [clientProfile, therapistProfile] = await Promise.all([
    ClientProfile.findOne({ userId: booking.clientId }),
    TherapistProfile.findOne({ userId: booking.therapistId }),
  ]);

  // A couple is one account with both partners nested (§6), so the thread is
  // with both of them and the label says so. Shared with the therapist's client
  // list (8.1) — the two must never word the same person differently.
  const clientName = clientDisplayName(clientProfile);

  return {
    client: { name: clientName },
    therapist: therapistProfile
      ? {
          name: [therapistProfile.title, therapistProfile.firstName, therapistProfile.lastName]
            .filter(Boolean)
            .join(' '),
          photoUrl: therapistProfile.photoUrl ?? null,
          timezone: therapistProfile.timezone ?? null,
          workingHours: therapistProfile.workingHours ?? null,
        }
      : null,
  };
}

/**
 * A message as it goes over the wire.
 *
 * NO RAW `senderId`. A booking has exactly two participants, so "who sent this"
 * is fully answered by a role and a `mine` flag — and that means no user id
 * from the `users` collection ever reaches either browser.
 *
 * NO `read` FLAG EITHER, and that is deliberate rather than an omission.
 * Returning it on your own messages is a read receipt, which §14 does not ask
 * for and nobody requested. On this platform it would be actively harmful: "she
 * read it four hours ago and has not replied" is exactly the thought an anxious
 * client does not need. The flag still drives the recipient's unread badge,
 * which is the job §14 gives it.
 */
function present(message, booking, viewerId) {
  const fromClient = String(message.senderId) === String(booking.clientId);

  const out = {
    id: String(message._id),
    text: message.text,
    type: message.type,
    createdAt: message.createdAt,
    senderRole: fromClient ? ROLES.CLIENT : ROLES.THERAPIST,
    mine: String(message.senderId) === String(viewerId),
  };

  // A session notice (9.3) travels as data, so each reader formats the time in
  // their own zone. Never the meeting link.
  if (message.type === MESSAGE_TYPE.SYSTEM && message.session) {
    out.session = {
      sessionId: String(message.session.sessionId),
      event: message.session.event,
      scheduledAt: message.session.scheduledAt,
      previousScheduledAt: message.session.previousScheduledAt ?? null,
    };
  }

  return out;
}

/**
 * Has the client written their opening message yet? — §7.1.
 *
 * Asked about THE CLIENT from either side, so one implementation serves both:
 * for the client it means "you still owe this", and for the therapist (8.3) it
 * means "they have not written yet". Computed from the client's own messages
 * rather than the booking's, so a therapist who somehow messaged first cannot
 * accidentally unlock it.
 */
async function clientHasWritten(booking) {
  return Boolean(await Message.exists({ bookingId: booking._id, senderId: booking.clientId }));
}

/**
 * Cursor pagination, not offset — and the reason matters.
 *
 * A conversation grows at the end while it is being read. With `?page=2`, a
 * message arriving between two requests shifts every row down, so page 2
 * re-serves a message page 1 already showed and eventually skips one entirely.
 * A cursor means "the thirty before this exact point", which is the same answer
 * however much has arrived since.
 *
 * `createdAt` alone is not unique, so the cursor carries `_id` as the tiebreak
 * and the query compares the pair. The compound index serves exactly this.
 *
 * The encoding moved to utils/cursor.js in 8.1 so the therapist client list
 * shares it. The wrappers keep this file's own field name and its own error.
 */
const encodeCursor = (message) => encode(message.createdAt, message._id);

function decodeCursor(cursor) {
  const decoded = decode(cursor);
  if (!decoded) throw new AppError(INVALID_CURSOR_MESSAGE, 400, INVALID_CURSOR_CODE);
  return { createdAt: decoded.at, id: decoded.id };
}

export async function listMessages(
  bookingId,
  user,
  { before, after, limit = MESSAGES_PAGE_SIZE } = {},
) {
  const { booking } = await loadMembership(bookingId, user);

  if (before && after) {
    throw new AppError(INVALID_CURSOR_MESSAGE, 400, INVALID_CURSOR_CODE);
  }

  const query = { bookingId: booking._id };

  // `after` is the RECONNECTION path (7.3): "what did I miss since this point".
  // It reads forward, so the sort flips and the page needs no reversing.
  const forward = Boolean(after);

  if (before) {
    const cursor = decodeCursor(before);
    query.$or = [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
    ];
  } else if (after) {
    const cursor = decodeCursor(after);
    query.$or = [
      { createdAt: { $gt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $gt: cursor.id } },
    ];
  }

  const direction = forward ? 1 : -1;

  // One extra row answers "is there another page" without a second count.
  const rows = await Message.find(query)
    .sort({ createdAt: direction, _id: direction })
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  const participants = await loadParticipants(booking);

  // Always oldest-first, whichever direction it was read in, so a UI renders it
  // straight down the screen with the newest at the bottom.
  const data = page.map((message) => present(message, booking, user.id));
  if (!forward) data.reverse();

  // Reported by the server rather than derived in the browser: with pagination
  // the client may hold only the newest page and cannot know whether an opening
  // message exists further back.
  const awaitingOpeningMessage = !(await clientHasWritten(booking));

  return {
    data,
    meta: {
      awaitingOpeningMessage,
      hasMore,
      // Where "load older" continues from — the oldest row held.
      nextCursor: !forward && hasMore && page.length ? encodeCursor(page[page.length - 1]) : null,
      // The NEWEST row on this page. The client keeps this and hands it back as
      // `after` when a socket reconnects, to fill exactly the gap it missed.
      syncCursor: data.length ? encodeCursor(page[forward ? page.length - 1 : 0]) : null,
      participants,
      bookingStatus: booking.status,
    },
  };
}

export async function sendMessage(bookingId, user, text, { clientMessageId } = {}) {
  const { booking } = await loadMembership(bookingId, user);

  // Reading a finished relationship is fine; adding to it is not. Nothing sets
  // a booking to `ended` yet — slice 11 and the deferred reassignment do — so
  // this is a guard ahead of that rather than a path reachable today.
  if (booking.status === BOOKING_STATUS.ENDED) {
    throw new AppError(BOOKING_ENDED_MESSAGE, 409, BOOKING_ENDED_CODE);
  }

  /**
   * THE MANDATORY FIRST MESSAGE (§7.1), enforced here so REST and the socket
   * inherit it identically — there is one write path and this is on it.
   *
   * CLIENTS ONLY. A therapist is never blocked: nothing in §7.1 restricts them,
   * and stopping a clinician reaching someone would be the wrong failure. It
   * applies exactly once, to the client's first message; everything after is an
   * ordinary message of any length.
   *
   * The floor exists to stop "hi" and "test" reaching a therapist as somebody's
   * entire opening — not to demand an essay. See constants/chat.js for why it
   * is deliberately low.
   */
  if (user.role === ROLES.CLIENT && !(await clientHasWritten(booking))) {
    if (String(text).trim().length < OPENING_MESSAGE_MIN) {
      throw new AppError(OPENING_MESSAGE_MESSAGE, 422, OPENING_MESSAGE_CODE);
    }
  }

  // TYPE IS FORCED, NEVER TAKEN FROM THE REQUEST. If a caller could set
  // `type: "system"` they could forge "Session scheduled for Thursday at 6pm"
  // in the other party's voice. System messages are written by the platform
  // alone — chunk 9.3, when a therapist actually schedules something.
  const message = await Message.create({
    bookingId: booking._id,
    senderId: user.id,
    text,
    type: MESSAGE_TYPE.TEXT,
    read: false,
  });

  // The browser's own id, echoed straight back and never written anywhere. It
  // rides on the payload so the sender's tab can reconcile without guessing,
  // and so a second tab of the same person dedupes exactly.
  const presented = { ...present(message, booking, user.id), clientMessageId };

  // PERSISTED FIRST, EMITTED SECOND — §14's rule, and the order is the whole
  // point: the row exists before anyone is told about it, so a dropped socket
  // loses nothing. `emitMessage` is a no-op when no socket server is attached,
  // which is why every REST test still passes untouched.
  // The booking's two people, from the STORED record — so a booking created
  // after either of them connected still reaches both (8.3).
  emitMessage(booking._id, presented, [booking.clientId, booking.therapistId]);

  await pushUnreadToRecipient(booking, user);
  await notifyRecipient(booking, user);

  return presented;
}

// The only writer of `type: "system"` (9.3); no route or socket event reaches it.
// Sent as the therapist, so it is unread for the client and never for them.
export async function postSessionNotice(booking, therapistUserId, { event, sessionId, scheduledAt, previousScheduledAt }) {
  if (booking.status === BOOKING_STATUS.ENDED) return null;

  const message = await Message.create({
    bookingId: booking._id,
    senderId: therapistUserId,
    text: SESSION_NOTICE_TEXT[event],
    type: MESSAGE_TYPE.SYSTEM,
    read: false,
    session: { sessionId, event, scheduledAt, previousScheduledAt: previousScheduledAt ?? undefined },
  });

  const presented = present(message, booking, therapistUserId);
  emitMessage(booking._id, presented, [booking.clientId, booking.therapistId]);
  await pushUnreadToRecipient(booking, { id: therapistUserId });

  return presented;
}

/**
 * The badge going UP — §14: "Socket.io pushes badge updates live so counts
 * change without a page refresh."
 *
 * `markRead` already pushed the count DOWN to the reader. Until now nothing
 * pushed it up, so a recipient sitting on Worksheets learned about a new
 * message only by opening the chat or reloading. This closes that half.
 *
 * TO THE RECIPIENT ONLY. The sender's count did not change — their own message
 * is never unread for them (§14) — and pushing to the booking room would tell
 * the sender something about the other person's state, which is the read
 * receipt deliberately left out in 7.2.
 *
 * SKIPPED ENTIRELY WITH NO SOCKET SERVER ATTACHED. `emitUnread` would no-op on
 * its own, but the aggregation behind it would still run on every send. Reading
 * the attachment first keeps the REST-only path — the whole Jest suite, and any
 * deployment running without sockets — at exactly the cost it had before.
 */
async function pushUnreadToRecipient(booking, sender) {
  if (!getSocketServer()) return;

  const senderIsClient = String(booking.clientId) === String(sender.id);
  const recipient = senderIsClient
    ? { id: booking.therapistId, role: ROLES.THERAPIST }
    : { id: booking.clientId, role: ROLES.CLIENT };

  emitUnread(recipient.id, await unreadCount(recipient));
}

/**
 * 10.4: the therapist's bell, for a message from a client they may not be
 * looking at.
 *
 * ONLY WHEN THE RECIPIENT IS THE THERAPIST (approved 2026-09-23) — a client has
 * their own unread badge, and §8.8 is a therapist feature. A system message the
 * platform wrote (9.3) is sent as the therapist, so it lands here with the
 * client as recipient and correctly produces nothing.
 *
 * UNLIKE the unread push above, the record is written whether or not a socket
 * server is attached: the bell reads it over REST, and the socket only makes it
 * instant. Never allowed to fail the send.
 */
async function notifyRecipient(booking, sender) {
  const senderIsClient = String(booking.clientId) === String(sender.id);
  if (!senderIsClient) return;

  await notifyQuietly({
    userId: booking.therapistId,
    type: NOTIFICATION_TYPE.NEW_MESSAGE,
    bookingId: booking._id,
  });
}

/**
 * §14: opening a conversation marks that conversation's messages read for the
 * viewer. Only the OTHER party's, and only the unread ones — your own messages
 * are never touched, and nothing outside this booking is reachable.
 */
export async function markRead(bookingId, user) {
  const { booking } = await loadMembership(bookingId, user);

  const result = await Message.updateMany(
    { bookingId: booking._id, senderId: { $ne: user.id }, read: false },
    { $set: { read: true } },
  );

  const marked = result.modifiedCount ?? 0;

  // §14: badge counts change without a page refresh. Pushed to the reader's own
  // sockets only — the other party's count did not change, and telling them
  // their message was read would be the read receipt deliberately left out.
  if (marked > 0) {
    emitUnread(user.id, await unreadCount(user));
  }

  return { marked };
}

/**
 * The unread badge, for every booking the user belongs to.
 *
 * One aggregation rather than a query per booking: a therapist's sidebar (§8.1)
 * needs a count per client, and the N+1 that would cause is named in the
 * backend rules as something to watch for on exactly this screen.
 */
export async function unreadCount(user) {
  const field = user.role === ROLES.CLIENT ? 'clientId' : 'therapistId';
  const bookings = await Booking.find({ [field]: user.id }).select('_id');

  if (bookings.length === 0) return { total: 0, byBooking: [] };

  const counts = await Message.aggregate([
    {
      $match: {
        bookingId: { $in: bookings.map((booking) => booking._id) },
        read: false,
        // §14's rule exactly: a message you sent is never unread for you.
        senderId: { $ne: new mongoose.Types.ObjectId(String(user.id)) },
      },
    },
    { $group: { _id: '$bookingId', count: { $sum: 1 } } },
  ]);

  return {
    total: counts.reduce((sum, row) => sum + row.count, 0),
    byBooking: counts.map((row) => ({ bookingId: String(row._id), count: row.count })),
  };
}
