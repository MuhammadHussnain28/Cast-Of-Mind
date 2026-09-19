import mongoose from 'mongoose';

/**
 * Keyset pagination cursors — one implementation, used by every paginated list.
 *
 * CURSOR, NOT OFFSET, and the reason is the same everywhere it is used. A list
 * ordered by time grows while it is being read, so `?page=2` re-serves rows
 * page 1 already showed and eventually skips one. A cursor means "the rows
 * after this exact point", which is the same answer however much has arrived
 * since.
 *
 * A timestamp alone is not unique, so the cursor carries `_id` as the tiebreak
 * and callers compare the pair against a compound index.
 *
 * EXTRACTED FROM chat.service.js IN CHUNK 8.1. The therapist client list needs
 * exactly this encoding, and two cursor formats drifting apart is the failure
 * `lib/workingHours.js` was centralised to avoid (5.6). Returning `null` rather
 * than throwing keeps the domain's own error message and code at the caller:
 * chat answers INVALID_CURSOR, the client list answers its own.
 */

/** @returns {string} opaque, url-safe, and meaningless to the browser. */
export function encodeCursor(date, id) {
  return Buffer.from(`${new Date(date).getTime()}:${id}`).toString('base64url');
}

/** @returns {{ at: Date, id: mongoose.Types.ObjectId } | null} null if unreadable. */
export function decodeCursor(cursor) {
  try {
    const [time, id] = Buffer.from(String(cursor), 'base64url').toString('utf8').split(':');
    const at = new Date(Number(time));
    if (Number.isNaN(at.getTime()) || !mongoose.isValidObjectId(id)) return null;
    return { at, id: new mongoose.Types.ObjectId(id) };
  } catch {
    // Anything that is not base64url at all lands here. Same answer: unreadable.
    return null;
  }
}

export default { encodeCursor, decodeCursor };
