import { verifyAccessToken } from '../utils/tokens.js';
import { Booking } from '../models/Booking.js';
import { ROLES } from '../constants/roles.js';
import { SOCKET_ERRORS, bookingRoom, userRoom } from '../constants/socket.js';
import {
  findCurrentSubscription,
  resolveAccess,
} from '../middleware/requireActiveSubscription.js';
import { PORTAL_ALLOWED_ACCESS } from '../constants/clientPortal.js';

/**
 * Socket authentication — master spec §11 and §14.
 *
 * The same access token the REST layer uses, presented in the handshake.
 * An unauthenticated connection is refused outright; it never reaches a room.
 */

/** Socket.io's convention is `auth`; a query fallback helps nothing and leaks. */
function readToken(socket) {
  const token = socket.handshake?.auth?.token;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

/**
 * THE HOLE THIS CLOSES, WHICH MOST IMPLEMENTATIONS LEAVE OPEN.
 *
 * An access token lives ~15 minutes; a socket can stay open for hours. Verify
 * once at connect and a user whose token expired — or whose account was
 * deactivated — keeps a live, privileged socket indefinitely, quietly undoing
 * the short-token design §11 is built on.
 *
 * So the expiry is re-checked before every inbound event. It is a comparison
 * against the already-decoded `exp`, not a database hit, so it costs nothing.
 * On expiry the socket is told why and disconnected; the client reconnects with
 * a fresh token, exactly as the REST interceptor already refreshes.
 */
export function tokenHasExpired(socket, now = Date.now()) {
  const exp = socket.data?.user?.exp;
  if (!exp) return true;
  return exp * 1000 <= now;
}

/**
 * Handshake middleware. Rejecting here means the connection never opens.
 *
 * The reason is deliberately coarse — `UNAUTHENTICATED` covers a missing,
 * malformed, forged and expired token alike. Same reasoning as the REST login
 * and refresh endpoints: telling somebody holding a stolen token exactly which
 * wall they hit helps only them.
 */
export function authenticateSocket(socket, next) {
  const token = readToken(socket);
  if (!token) return next(Object.assign(new Error('Unauthenticated.'), { data: { code: SOCKET_ERRORS.UNAUTHENTICATED } }));

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return next(Object.assign(new Error('Unauthenticated.'), { data: { code: SOCKET_ERRORS.UNAUTHENTICATED } }));
  }

  // Only what the token proves, exactly as requireAuth does.
  socket.data.user = { id: payload.sub, role: payload.role, exp: payload.exp };
  return next();
}

/**
 * The admin has no chat, so they have no socket either.
 *
 * §11 records that an admin conversation viewer was proposed and the client
 * decided against building it. Refusing the connection means there is no
 * transport through which chat content could reach them even by accident.
 */
export function authoriseSocketRole(socket, next) {
  const { role } = socket.data.user;
  if (role !== ROLES.CLIENT && role !== ROLES.THERAPIST) {
    return next(Object.assign(new Error('Not permitted.'), { data: { code: SOCKET_ERRORS.FORBIDDEN } }));
  }
  return next();
}

/**
 * §13, on the socket: an expired client gets no real-time connection, for the
 * same reason they get no portal. The therapist is unaffected — the thread is
 * their clinical record and somebody else's lapsed card is not their problem.
 */
export async function authoriseSocketSubscription(socket, next) {
  const { id, role } = socket.data.user;
  if (role !== ROLES.CLIENT) return next();

  try {
    const access = resolveAccess(await findCurrentSubscription(id));
    if (!PORTAL_ALLOWED_ACCESS.includes(access)) {
      return next(
        Object.assign(new Error('Subscription ended.'), {
          data: { code: SOCKET_ERRORS.SUBSCRIPTION_ENDED },
        }),
      );
    }
    return next();
  } catch (error) {
    return next(Object.assign(new Error('Server error.'), { data: { code: SOCKET_ERRORS.SERVER_ERROR } }));
  }
}

/**
 * Join the rooms this user actually belongs to.
 *
 * THE SERVER DECIDES, ALWAYS. A socket cannot ask to join a booking room —
 * membership is read from the database, so the room set is not something the
 * client can influence. This is the socket equivalent of never trusting a
 * bookingId from the request.
 *
 * All of the user's bookings are joined at connect rather than on demand: a
 * therapist viewing one client must still receive messages from another, which
 * is exactly what §8.8's notification bell needs.
 */
export async function joinOwnRooms(socket) {
  const { id, role } = socket.data.user;

  const field = role === ROLES.CLIENT ? 'clientId' : 'therapistId';
  const bookings = await Booking.find({ [field]: id }).select('_id');

  for (const booking of bookings) {
    socket.join(bookingRoom(booking._id));
  }

  // Personal room, for badge updates across this user's tabs and devices.
  socket.join(userRoom(id));

  return bookings.map((booking) => String(booking._id));
}
