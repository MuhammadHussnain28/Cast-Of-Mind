/**
 * The unread badge, as pure functions — master spec §14.
 *
 * Kept out of React for the same reason `messageStore.js` is: the client has no
 * Jest suite, and a count that drifts is the kind of bug nobody notices until a
 * badge sits on "1" for a week with nothing behind it.
 *
 * TWO SOURCES, ONE ANSWER. `GET /chat/unread-count` is the truth; the socket's
 * `unread:update` is the same truth arriving faster; and a `message:new` that
 * has not been counted yet raises it locally so the badge moves at the instant
 * the message lands. The server's number always wins when it arrives, so a
 * local increment can never leave the badge permanently wrong.
 *
 * Shaped as a map rather than the server's array because every read is a lookup
 * by booking — the client has one booking, the therapist sidebar (§8.1) has one
 * row per client.
 */

export const EMPTY_UNREAD = Object.freeze({ total: 0, byBooking: Object.freeze({}) });

const sumOf = (byBooking) => Object.values(byBooking).reduce((sum, n) => sum + n, 0);

/**
 * Normalise what the server sends — the REST body and the socket payload are
 * deliberately the same shape, so one function reads both.
 */
export function fromServer(payload) {
  const rows = Array.isArray(payload?.byBooking) ? payload.byBooking : [];

  const byBooking = {};
  for (const row of rows) {
    if (!row?.bookingId) continue;
    const count = Number(row.count);
    if (!Number.isFinite(count) || count <= 0) continue;
    byBooking[String(row.bookingId)] = count;
  }

  // The total is recomputed rather than trusted, so a malformed payload cannot
  // put a number on the badge that nothing in the breakdown accounts for.
  return { total: sumOf(byBooking), byBooking };
}

/** One more unread message in a booking. */
export function increment(state, bookingId) {
  if (!bookingId) return state;

  const key = String(bookingId);
  const byBooking = { ...state.byBooking, [key]: (state.byBooking[key] ?? 0) + 1 };
  return { total: sumOf(byBooking), byBooking };
}

/**
 * That conversation has been read.
 *
 * Applied locally the moment someone reaches the bottom of a thread, so the
 * badge clears immediately rather than after a round trip. The server emits the
 * same zero a moment later and the two agree.
 */
export function clearBooking(state, bookingId) {
  if (!bookingId) return state;

  const key = String(bookingId);
  if (!(key in state.byBooking)) return state; // already clear — same reference

  const byBooking = { ...state.byBooking };
  delete byBooking[key];
  return { total: sumOf(byBooking), byBooking };
}

/** The number on one booking's badge. */
export function countFor(state, bookingId) {
  if (!bookingId) return 0;
  return state.byBooking[String(bookingId)] ?? 0;
}

/**
 * What the badge actually prints.
 *
 * Capped, because the tab bar gives each item about 64px at 360px wide and a
 * four-digit pill would push the label out of its own row.
 */
export function badgeLabel(count, cap = 9) {
  if (count <= 0) return null;
  return count > cap ? `${cap}+` : String(count);
}

/**
 * What a screen reader hears instead of the pill.
 *
 * Here rather than beside the badge component so the rail and the tab bar
 * cannot word it differently — one nav item saying "3 unread" and the other "3
 * new messages" is the kind of drift nobody notices, because nobody uses both
 * on the same device.
 */
export function unreadLabel(base, count) {
  if (count <= 0) return base;
  return `${base}, ${count} unread ${count === 1 ? 'message' : 'messages'}`;
}
