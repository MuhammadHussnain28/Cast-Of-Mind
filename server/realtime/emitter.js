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
export function emitMessage(bookingId, message) {
  const { mine, ...viewerAgnostic } = message;
  void mine;
  return emit(bookingRoom(bookingId), SOCKET_EVENTS.MESSAGE_NEW, viewerAgnostic);
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
