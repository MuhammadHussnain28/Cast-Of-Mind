import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';
import { Booking } from '../models/Booking.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { AppError } from '../utils/AppError.js';
import { clientDisplayName } from '../utils/clientDisplayName.js';
import { emitNotification } from '../realtime/emitter.js';
import { NOT_FOUND_MESSAGE } from '../constants/notifications.js';

/**
 * The bell — master spec §8.8.
 *
 * NOTHING THAT LEAVES HERE CARRIES CONTENT. A row says who, what kind, how many
 * and when. Never the message, never the worksheet's title (approved
 * 2026-09-23). The therapist opens the conversation to read it, which is where
 * reading it belongs.
 *
 * Every read is scoped to the caller's own id. There is no route that takes a
 * user id, so one therapist cannot reach another's feed even by guessing.
 */

/**
 * Name the clients on a page of alerts in two lookups, whatever its size.
 *
 * Two queries rather than one per row — the N+1 the backend rules name for
 * exactly this kind of list.
 */
async function present(rows) {
  if (rows.length === 0) return [];

  const bookingIds = [...new Set(rows.map((row) => String(row.bookingId)))];
  const bookings = await Booking.find({ _id: { $in: bookingIds } })
    .select('clientId')
    .lean();

  const profiles = await ClientProfile.find({
    userId: { $in: bookings.map((booking) => booking.clientId) },
  })
    .select('userId type name coupleData')
    .lean();

  const nameByUser = new Map(
    profiles.map((profile) => [String(profile.userId), clientDisplayName(profile)]),
  );
  const nameByBooking = new Map(
    bookings.map((booking) => [String(booking._id), nameByUser.get(String(booking.clientId)) ?? null]),
  );

  return rows.map((row) => ({
    id: String(row._id),
    type: row.type,
    bookingId: String(row.bookingId),
    count: row.count,
    read: row.read,
    lastAt: row.lastAt,
    // A couple is one account with two people in it (§6), worded as everywhere.
    client: { name: nameByBooking.get(String(row.bookingId)) ?? null },
  }));
}

export const unreadCount = (userId) => Notification.countDocuments({ userId, read: false });

/**
 * Record an event for one recipient, grouped.
 *
 * The upsert matches only UNREAD alerts, so a new event after the therapist has
 * read the last one opens a fresh group rather than silently raising a count
 * they have already cleared. The partial unique index makes that atomic; a
 * genuine race surfaces as a duplicate key, and the retry then matches the row
 * the other request just wrote.
 */
export async function notify({ userId, type, bookingId }) {
  const filter = { userId, bookingId, type, read: false };
  const update = {
    $inc: { count: 1 },
    $set: { lastAt: new Date() },
    $setOnInsert: { userId, bookingId, type, read: false },
  };
  const options = { new: true, upsert: true, setDefaultsOnInsert: true };

  let row;
  try {
    row = await Notification.findOneAndUpdate(filter, update, options);
  } catch (error) {
    if (error?.code !== 11000) throw error;
    // Two events landed together; the other one inserted. Increment theirs.
    row = await Notification.findOneAndUpdate(filter, {
      $inc: { count: 1 },
      $set: { lastAt: new Date() },
    }, { new: true });
  }

  if (!row) return null;

  const [presented] = await present([row.toObject ? row.toObject() : row]);
  // Delivery only. The record above is what the bell actually reads, so a
  // missing socket costs immediacy and nothing else.
  emitNotification(userId, presented, await unreadCount(userId));

  return presented;
}

/**
 * Best-effort, for callers on a path that must not fail because of a bell.
 *
 * A notification is a courtesy on top of something that already succeeded — a
 * message saved, a worksheet returned, an account created. None of those may be
 * undone or reported as failed because this did not work. The log names the
 * type and the error's NAME only: never the error's message, which could carry
 * a fragment of what was written.
 */
export async function notifyQuietly(payload) {
  try {
    return await notify(payload);
  } catch (error) {
    console.error(`[notify] ${payload?.type} failed: ${error?.name ?? 'Error'}`);
    return null;
  }
}

/** The caller's own feed, newest activity first. */
export async function listNotifications(userId, { page, limit }) {
  const [rows, total, unread] = await Promise.all([
    Notification.find({ userId })
      .sort({ lastAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId }),
    unreadCount(userId),
  ]);

  return {
    data: await present(rows),
    meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)), unread },
  };
}

/**
 * Mark one read — scoped to the owner.
 *
 * Another therapist's id gets the same 404 a made-up one does, so the endpoint
 * cannot be used to find out whether an id is real.
 */
export async function markRead(userId, notificationId) {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new AppError(NOT_FOUND_MESSAGE, 404, 'NOTIFICATION_NOT_FOUND');
  }

  const row = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { read: true } },
    { new: true },
  );

  if (!row) throw new AppError(NOT_FOUND_MESSAGE, 404, 'NOTIFICATION_NOT_FOUND');

  return { read: true, unread: await unreadCount(userId) };
}

export async function markAllRead(userId) {
  const result = await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
  return { read: result.modifiedCount ?? 0, unread: 0 };
}
