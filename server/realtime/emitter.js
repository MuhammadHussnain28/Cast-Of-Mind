import { SOCKET_EVENTS, bookingRoom, userRoom } from '../constants/socket.js';

/**
 * The one place that knows how to push something to a socket.
 *
 * WHY IT IS A MODULE AND NOT AN IMPORT OF `io`: the chat service calls this
 * after a successful write, and the service must not depend on Socket.io. When
 * no socket server is attached — the entire Jest suite, and any deployment
 * running REST only — every function here is a no-op and nothing changes.
 *
 * That is what makes graceful degradation structural rather than a fallback
 * mode: there is one write path, and delivery is simply switched off.
 */

let io = null;

export function setSocketServer(instance) {
  io = instance;
}

export function getSocketServer() {
  return io;
}

/** @returns true if it was actually delivered anywhere. */
function emit(room, event, payload) {
  if (!io) return false;
  io.to(room).emit(event, payload);
  return true;
}

/**
 * A new message, to both people in the booking.
 *
 * THE PAYLOAD CARRIES NO `mine` FLAG, unlike the REST response. One emit
 * reaches both parties, so a viewer-relative field cannot be baked into it.
 * The client derives it by comparing `senderRole` against its own role, which
 * is unambiguous because a booking has exactly two participants.
 *
 * THE SENDER'S OWN SOCKETS RECEIVE IT TOO, deliberately. Excluding them would
 * break the second tab of anyone with two open, so the client de-duplicates by
 * message id instead — which it must do anyway to survive a reconnect that
 * re-syncs an overlapping window.
 */
export function emitMessage(bookingId, message, participantIds = []) {
  const { mine, ...viewerAgnostic } = message;
  void mine;

  if (io) joinParticipants(bookingId, participantIds);

  /**
   * THE BOOKING ID TRAVELS WITH EVERY MESSAGE (8.3).
   *
   * A therapist's socket is in EVERY one of their clients' rooms, so a message
   * arriving on it has to say which conversation it belongs to — otherwise the
   * open thread cannot tell Client A's words from Client B's, and the only
   * thing standing between them is luck. The browser refuses any message whose
   * booking is not the one on screen.
   *
   * Its absence went unnoticed until 8.3 because the client portal has one
   * booking and never needed it — and `UnreadProvider`'s instant increment,
   * which DID need it, returned early on every message and was silently
   * covered by the separate `unread:update` push.
   *
   * On the emit rather than on the REST shape: a REST page is already scoped by
   * the booking id in its own URL.
   */
  return emit(bookingRoom(bookingId), SOCKET_EVENTS.MESSAGE_NEW, {
    ...viewerAgnostic,
    bookingId: String(bookingId),
  });
}

/**
 * Put both people's sockets in the booking's room before anything is emitted
 * to it (8.3).
 *
 * Rooms are joined at connect (`joinOwnRooms`), which leaves one real gap: a
 * booking created AFTER someone connected. A client pays while their new
 * therapist is already online, and the therapist's socket is not in that room
 * — so the opening message, the most important one in the relationship, would
 * not appear in an open thread until the socket happened to reconnect.
 *
 * THE SERVER STILL DECIDES THE ROOMS. The ids come from the STORED BOOKING the
 * caller has already proved membership against, never from a request, so this
 * is the same guarantee `joinOwnRooms` gives, applied after connect as well as
 * at it. A browser still cannot ask to join anything.
 *
 * Joining a room a socket is already in is a no-op, so this costs nothing on
 * the common path. `socketsJoin` acts on every socket in the user's personal
 * room — every tab and device they have open.
 */
function joinParticipants(bookingId, participantIds) {
  const room = bookingRoom(bookingId);
  for (const userId of participantIds) {
    if (userId) io.in(userRoom(String(userId))).socketsJoin(room);
  }
}

/**
 * A live unread count, to every socket belonging to one user.
 *
 * §14: "Socket.io pushes badge updates live so counts change without a page
 * refresh." It goes to the user's own room rather than the booking's, because
 * a badge is personal — the other party's count did not change.
 */
export function emitUnread(userId, counts) {
  return emit(userRoom(userId), SOCKET_EVENTS.UNREAD_UPDATE, counts);
}

// 8.5: a client's count of worksheets still to complete, to their own sockets.
// A number only — never a title or a file.
export function emitWorksheetsUpdate(userId, pending) {
  return emit(userRoom(String(userId)), SOCKET_EVENTS.WORKSHEETS_UPDATE, { pending });
}

/**
 * 10.4: one alert to the recipient's own sockets, with their new unread total.
 *
 * To their room, never a booking's — a bell is personal, and the person who
 * caused the alert must not learn that it arrived.
 */
export function emitNotification(userId, notification, unread) {
  return emit(userRoom(String(userId)), SOCKET_EVENTS.NOTIFICATION_NEW, { notification, unread });
}
