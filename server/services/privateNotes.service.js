import mongoose from 'mongoose';
import { PrivateNote } from '../models/PrivateNote.js';
import { AppError } from '../utils/AppError.js';
import { encodeCursor, decodeCursor } from '../utils/cursor.js';
import { loadOwnBooking } from './therapistClient.service.js';
import {
  JOURNAL_PAGE_SIZE,
  NOTE_NOT_FOUND_MESSAGE,
  NOTE_NOT_FOUND_CODE,
} from '../constants/journal.js';

/**
 * THE THERAPIST'S PRIVATE CLINICAL NOTES — master spec §8.5/8.6, §10.10.
 *
 * *** THIS FILE IS REACHABLE FROM THE /api/v1/therapist ROUTER AND NOWHERE ELSE. ***
 *
 * Nothing on the client's request path imports it, and nothing ever may. The
 * client is never given a filtered version of a note, an id of a note, or a
 * count of notes — their responses are built without this module being loaded
 * at all, which is what §8.5 means by "architecturally unreachable". Hiding a
 * field in the UI is not sufficient: a client seeing their therapist's notes
 * about them is a serious breach of trust and a liability on this platform.
 *
 * A test walks every source file on the client request path and asserts none
 * of them names `PrivateNote` or this file.
 *
 * Note text is never logged, and never reaches Sentry.
 */

const notFound = () => new AppError(NOTE_NOT_FOUND_MESSAGE, 404, NOTE_NOT_FOUND_CODE);

// The author's user id never travels — the reader is the only author there is.
function present(note) {
  return {
    id: String(note._id),
    text: note.text,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    edited: note.updatedAt > note.createdAt,
  };
}

/**
 * BOTH MUST MATCH: the booking AND the author. Scoping by booking alone would
 * let a therapist read a colleague's notes on a client who moved between them.
 */
async function loadOwnNote(noteId, booking, therapistUserId) {
  if (!mongoose.isValidObjectId(noteId)) throw notFound();

  const note = await PrivateNote.findOne({
    _id: noteId,
    bookingId: booking._id,
    therapistId: therapistUserId,
  });

  if (!note) throw notFound();
  return note;
}

export async function listNotes(therapistUserId, bookingId, { cursor, limit } = {}) {
  const booking = await loadOwnBooking(bookingId, therapistUserId);
  const pageSize = limit ?? JOURNAL_PAGE_SIZE;
  const query = { bookingId: booking._id, therapistId: therapistUserId };

  if (cursor) {
    const at = decodeCursor(cursor);
    if (!at) throw new AppError('That page reference is not valid.', 400, 'INVALID_CURSOR');
    query.$or = [{ createdAt: { $lt: at.at } }, { createdAt: at.at, _id: { $lt: at.id } }];
  }

  const [rows, total] = await Promise.all([
    PrivateNote.find(query).sort({ createdAt: -1, _id: -1 }).limit(pageSize + 1),
    PrivateNote.countDocuments({ bookingId: booking._id, therapistId: therapistUserId }),
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

// An ended booking still takes notes: the record is the therapist's, and a
// closing note is written after the work finishes, not before.
export async function createNote(therapistUserId, bookingId, { text }) {
  const booking = await loadOwnBooking(bookingId, therapistUserId);
  const note = await PrivateNote.create({
    bookingId: booking._id,
    therapistId: therapistUserId,
    text,
  });
  return present(note);
}

export async function updateNote(therapistUserId, bookingId, noteId, { text }) {
  const booking = await loadOwnBooking(bookingId, therapistUserId);
  const note = await loadOwnNote(noteId, booking, therapistUserId);

  note.text = text;
  await note.save();
  return present(note);
}

export async function deleteNote(therapistUserId, bookingId, noteId) {
  const booking = await loadOwnBooking(bookingId, therapistUserId);
  const note = await loadOwnNote(noteId, booking, therapistUserId);
  await PrivateNote.deleteOne({ _id: note._id });
  return { id: String(note._id), deleted: true };
}
