// Real-time delivery — master spec §14.
//
// THE DATABASE IS THE RECORD. Everything here is delivery: a message is
// persisted first and emitted second, so a dropped socket loses nothing and
// chat keeps working over REST with no socket server attached at all.

/**
 * Event names, in one place so the server and the 7.4 client cannot drift.
 *
 * The server-to-client message event is `message:new` rather than the brief's
 * `message:receive` — the latter reads like something the client sends, and a
 * mis-wired listener is a silent failure rather than a loud one.
 */
export const SOCKET_EVENTS = Object.freeze({
  // client → server
  MESSAGE_SEND: 'message:send',
  MESSAGE_READ: 'message:read',
  CONVERSATION_SYNC: 'conversation:sync',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // server → client
  MESSAGE_NEW: 'message:new',
  UNREAD_UPDATE: 'unread:update',
  AUTH_EXPIRED: 'auth:expired',
  // 8.5: the client's count of worksheets still to complete. A number only.
  WORKSHEETS_UPDATE: 'worksheets:update',
  // 10.4: the therapist's bell. Who and what kind, never what was written.
  NOTIFICATION_NEW: 'notification:new',
});

export const SOCKET_ERRORS = Object.freeze({
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  SUBSCRIPTION_ENDED: 'SUBSCRIPTION_ENDED',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
});

/** The room a booking's two participants share. */
export const bookingRoom = (bookingId) => `booking:${bookingId}`;

/** A user's own sockets — every tab and device. Used for unread updates. */
export const userRoom = (userId) => `user:${userId}`;

/**
 * TYPING IS PURELY EPHEMERAL — no database write, ever. It exists only as an
 * event passing through a room, and the server holds nothing but a timer.
 *
 * The auto-stop matters more than it looks: if a connection drops mid-sentence
 * the other side would otherwise show "typing…" for ever. The server stops it
 * on this timer and again on disconnect.
 */
export const TYPING_TIMEOUT_MS = 5000;

/**
 * The socket send budget, matching the REST limiter exactly (30 a minute).
 *
 * express-rate-limit does not apply to sockets, so without this the socket path
 * would bypass the REST limit entirely — a real hole rather than a theoretical
 * one. Deliberately loose for the same reason: someone in distress types in
 * bursts, and this exists to stop automation, not people.
 */
export const SOCKET_SEND_LIMIT = Object.freeze({ windowMs: 60 * 1000, max: 30 });
