import mongoose from 'mongoose';
import { Journal } from '../models/Journal.js';
import { Booking } from '../models/Booking.js';
import { AppError } from '../utils/AppError.js';
import { encodeCursor, decodeCursor } from '../utils/cursor.js';
import { BOOKING_STATUS } from '../constants/payments.js';
import { loadOwnBooking } from './therapistClient.service.js';
import {
  JOURNAL_PAGE_SIZE,
  ENTRY_NOT_FOUND_MESSAGE,
  ENTRY_NOT_FOUND_CODE,
} from '../constants/journal.js';

/**
 * The client's journal — master spec §7.3, §10.9. Written by the client, read
 * by them and by their assigned therapist. There is no privacy toggle (§7.3).
 *
 * THE privateNotes BOUNDARY IS HERE, AND IT IS AN IMPORT EDGE, NOT A FILTER.
 * This file does not import `PrivateNote` or `privateNotes.service.js`, and it
 * never will. The therapist's screen shows entries and notes side by side, so
 * this is exactly the file where a convenience join would look harmless — and
 * a joined response is one bug away from a client reading their own clinical
 * notes. §8.5/8.6 requires the separation to be architectural. A test reads
 * this source and asserts the word `PrivateNote` does not appear in it.
 *
 * Entry text is never logged. It is the most sensitive writing in the product
 * after chat, and it is on the never-log list.
 */

const notFound = () => new AppError(ENTRY_NOT_FOUND_MESSAGE, 404, ENTRY_NOT_FOUND_CODE);

// What either browser gets. The author's user id never travels: a journal has
// exactly one author and the reader already knows who that is.
function present(entry) {
  return {
    id: String(entry._id),
    text: entry.text,
    moodTag: entry.moodTag ?? null,
    createdAt: entry.createdAt,
    editedAt: entry.editedAt ?? null,
  };
}

async function pageOf(bookingId, { cursor, limit } = {}) {
  const pageSize = limit ?? JOURNAL_PAGE_SIZE;
  const query = { bookingId };

  if (cursor) {
    const at = decodeCursor(cursor);
    if (!at) throw new AppError('That page reference is not valid.', 400, 'INVALID_CURSOR');
    query.$or = [{ createdAt: { $lt: at.at } }, { createdAt: at.at, _id: { $lt: at.id } }];
  }

  const [rows, total] = await Promise.all([
    Journal.find(query).sort({ createdAt: -1, _id: -1 }).limit(pageSize + 1),
    Journal.countDocuments({ bookingId }),
  ]);

  const hasMore = rows.length > pageSize;
  const page = hasMore ? rows.slice(0, pageSize) : rows;
  const last = page[page.length - 1];

  return {
    data: page.map(present),
    meta: {
      total,
      hasMore,
      nextCursor: hasMore && last ? encodeCursor(last.createdAt, last._id) : null,
    },
  };
}

// ── client ──────────────────────────────────────────────────────────────────

// The client's own active booking — found from the token, never from a URL.
async function loadClientBooking(clientUserId) {
  const booking = await Booking.findOne({ clientId: clientUserId, status: BOOKING_STATUS.ACTIVE });
  if (!booking) throw notFound();
  return booking;
}

/**
 * ALL THREE MUST MATCH: the entry id, the booking it belongs to, and its author.
 * Another client's entry, one from another booking, a missing one and junk all
 * end here as the same 404 — a 403 on any of them would confirm the id is real.
 */
async function loadOwnEntry(entryId, booking, clientUserId) {
  if (!mongoose.isValidObjectId(entryId)) throw notFound();

  const entry = await Journal.findOne({
    _id: entryId,
    bookingId: booking._id,
    clientId: clientUserId,
  });

  if (!entry) throw notFound();
  return entry;
}

export async function listOwnEntries(clientUserId, options) {
  const booking = await loadClientBooking(clientUserId);
  return pageOf(booking._id, options);
}

export async function createEntry(clientUserId, { text, moodTag }) {
  const booking = await loadClientBooking(clientUserId);
  const entry = await Journal.create({
    bookingId: booking._id,
    clientId: clientUserId,
    text,
    moodTag: moodTag ?? undefined,
  });
  return present(entry);
}

// Editing stamps `editedAt`, so the therapist can see the record changed.
export async function updateEntry(clientUserId, entryId, { text, moodTag }) {
  const booking = await loadClientBooking(clientUserId);
  const entry = await loadOwnEntry(entryId, booking, clientUserId);

  entry.text = text;
  entry.moodTag = moodTag ?? undefined;
  entry.editedAt = new Date();

  await entry.save();
  return present(entry);
}

// Permanent, by decision 2026-09-18. It leaves the therapist's view too.
export async function deleteEntry(clientUserId, entryId) {
  const booking = await loadClientBooking(clientUserId);
  const entry = await loadOwnEntry(entryId, booking, clientUserId);
  await Journal.deleteOne({ _id: entry._id });
  return { id: String(entry._id), deleted: true };
}

// ── therapist ───────────────────────────────────────────────────────────────

/**
 * READ ONLY, AND THAT IS STRUCTURAL. There is no therapist function here that
 * creates, edits or deletes an entry, and no route mounts one — the client's
 * own writing is not the therapist's to change.
 */
export async function listClientEntries(therapistUserId, bookingId, options) {
  const booking = await loadOwnBooking(bookingId, therapistUserId);
  return pageOf(booking._id, options);
}
