import { AppError } from '../utils/AppError.js';
import { listMessages, sendMessage, markRead, unreadCount } from '../services/chat.service.js';
import { sendMessageSchema } from '../validation/chat.schema.js';
import {
  SOCKET_EVENTS,
  SOCKET_ERRORS,
  TYPING_TIMEOUT_MS,
  SOCKET_SEND_LIMIT,
  bookingRoom,
} from '../constants/socket.js';
import { tokenHasExpired } from './socketAuth.js';

/**
 * The socket event surface — master spec §14.
 *
 * EVERY WRITE GOES THROUGH THE SAME SERVICE THE REST ROUTES USE. There is one
 * implementation of "send a message", which means membership, the forced
 * `type`, the ended-booking guard and the length limit cannot drift between the
 * two transports. This file is a transport, not a second set of rules.
 *
 * MESSAGE TEXT IS NEVER LOGGED from here, exactly as in the REST path.
 */

/** Only ever an AppError's own safe message, never an internal one. */
function safeError(error) {
  if (error instanceof AppError) return { message: error.message, code: error.code };
  return { message: 'Something went wrong. Please try again.', code: SOCKET_ERRORS.SERVER_ERROR };
}

const respond = (ack, payload) => {
  if (typeof ack === 'function') ack(payload);
};

/**
 * A sliding window per socket, matching the REST limiter's 30 a minute.
 *
 * Without it the socket path would bypass the REST limit completely. Held on
 * the socket, so it dies with the connection and nothing accumulates.
 */
function withinSendLimit(socket, now = Date.now()) {
  const times = socket.data.sendTimes ?? [];
  const fresh = times.filter((t) => now - t < SOCKET_SEND_LIMIT.windowMs);

  if (fresh.length >= SOCKET_SEND_LIMIT.max) {
    socket.data.sendTimes = fresh;
    return false;
  }

  fresh.push(now);
  socket.data.sendTimes = fresh;
  return true;
}

/**
 * Wraps every handler with the expiry re-check and error safety.
 *
 * The expiry check is what stops a socket outliving the token that opened it —
 * see the note in socketAuth.js. It runs before the handler, so an expired
 * connection cannot act even once.
 */
function guarded(socket, handler) {
  return async (payload, ack) => {
    if (tokenHasExpired(socket)) {
      socket.emit(SOCKET_EVENTS.AUTH_EXPIRED, { code: SOCKET_ERRORS.TOKEN_EXPIRED });
      respond(ack, { error: { message: 'Your session needs refreshing.', code: SOCKET_ERRORS.TOKEN_EXPIRED } });
      socket.disconnect(true);
      return;
    }

    try {
      await handler(payload ?? {}, ack);
    } catch (error) {
      if (!(error instanceof AppError)) {
        // The message body is never included — only the shape of the failure.
        console.error('[socket] handler failed:', error.message);
      }
      respond(ack, { error: safeError(error) });
    }
  };
}

/**
 * Membership, without a database hit.
 *
 * The socket's rooms were assigned by the server from the database at connect
 * (see joinOwnRooms), so "is this socket in the room" is already a proved
 * answer rather than a claim. Used for typing, which is too frequent to justify
 * a query; the message and read paths go through the service, which re-checks
 * membership against the booking itself.
 */
const inRoom = (socket, bookingId) => socket.rooms.has(bookingRoom(bookingId));

// ---------------------------------------------------------------------------
// Typing — ephemeral, zero database writes
// ---------------------------------------------------------------------------

function stopTyping(socket, bookingId, { notify = true } = {}) {
  const timers = socket.data.typingTimers;
  const timer = timers?.get(bookingId);

  if (timer) {
    clearTimeout(timer);
    timers.delete(bookingId);
  }

  if (notify) {
    socket.to(bookingRoom(bookingId)).emit(SOCKET_EVENTS.TYPING_STOP, {
      bookingId,
      senderRole: socket.data.user.role,
    });
  }
}

function startTyping(socket, bookingId) {
  const timers = socket.data.typingTimers;

  // Refresh rather than re-announce: a continuous typist emits start once and
  // simply keeps pushing the auto-stop out.
  const existing = timers.get(bookingId);
  if (existing) clearTimeout(existing);
  else {
    socket.to(bookingRoom(bookingId)).emit(SOCKET_EVENTS.TYPING_START, {
      bookingId,
      senderRole: socket.data.user.role,
    });
  }

  timers.set(
    bookingId,
    setTimeout(() => stopTyping(socket, bookingId), TYPING_TIMEOUT_MS),
  );
}

/** Everything they were typing, silenced — on disconnect or after a send. */
function clearAllTyping(socket, { notify = true } = {}) {
  const timers = socket.data.typingTimers;
  if (!timers) return;
  for (const bookingId of [...timers.keys()]) stopTyping(socket, bookingId, { notify });
}

// ---------------------------------------------------------------------------
// Expiry — close a socket the moment its token expires (12.3)
// ---------------------------------------------------------------------------

// setTimeout's ceiling; past it Node fires after 1ms instead.
const MAX_TIMER_MS = 2 ** 31 - 1;

/**
 * `guarded` only checks expiry when the user SENDS. A socket that only listened
 * stayed open, so a deactivated user's tab kept receiving messages. The client
 * refreshes on `auth:expired` and reconnects; a deactivated account cannot.
 */
function armExpiry(socket) {
  const remaining = (socket.data.user?.exp ?? 0) * 1000 - Date.now();
  const timer = setTimeout(() => {
    if (!tokenHasExpired(socket)) {
      armExpiry(socket);
      return;
    }
    socket.emit(SOCKET_EVENTS.AUTH_EXPIRED, { code: SOCKET_ERRORS.TOKEN_EXPIRED });
    socket.disconnect(true);
  }, Math.min(Math.max(remaining, 0), MAX_TIMER_MS));
  timer.unref?.();
  socket.data.expiryTimer = timer;
}

// ---------------------------------------------------------------------------

export function registerHandlers(socket) {
  socket.data.typingTimers = new Map();
  socket.data.sendTimes = [];
  armExpiry(socket);

  const user = socket.data.user;

  socket.on(
    SOCKET_EVENTS.MESSAGE_SEND,
    guarded(socket, async ({ bookingId, text, clientMessageId }, ack) => {
      if (!withinSendLimit(socket)) {
        respond(ack, {
          error: {
            message: 'You are sending messages very quickly. Please wait a moment.',
            code: SOCKET_ERRORS.RATE_LIMITED,
          },
        });
        return;
      }

      // The same schema the REST route validates against, so a message refused
      // over HTTP is refused identically here.
      const parsed = sendMessageSchema.safeParse({ text, clientMessageId });
      if (!parsed.success) {
        respond(ack, {
          error: { message: parsed.error.issues[0]?.message ?? 'Invalid message.', code: 'VALIDATION_ERROR' },
        });
        return;
      }

      // Persist. The service emits to the room itself, after the write.
      const message = await sendMessage(bookingId, user, parsed.data.text, {
        clientMessageId: parsed.data.clientMessageId,
      });

      // Somebody who just sent is no longer typing.
      stopTyping(socket, bookingId);

      respond(ack, { data: message });
    }),
  );

  socket.on(
    SOCKET_EVENTS.MESSAGE_READ,
    guarded(socket, async ({ bookingId }, ack) => {
      const result = await markRead(bookingId, user);
      respond(ack, { data: result });
    }),
  );

  /**
   * Reconnection gap-fill. The client hands back the newest cursor it holds and
   * gets exactly what arrived while it was away — not a blind refetch.
   */
  socket.on(
    SOCKET_EVENTS.CONVERSATION_SYNC,
    guarded(socket, async ({ bookingId, after }, ack) => {
      const result = await listMessages(bookingId, user, { after });
      respond(ack, { data: result });
    }),
  );

  socket.on(
    SOCKET_EVENTS.TYPING_START,
    guarded(socket, async ({ bookingId }) => {
      if (!bookingId || !inRoom(socket, bookingId)) return;
      startTyping(socket, bookingId);
    }),
  );

  socket.on(
    SOCKET_EVENTS.TYPING_STOP,
    guarded(socket, async ({ bookingId }) => {
      if (!bookingId || !inRoom(socket, bookingId)) return;
      stopTyping(socket, bookingId);
    }),
  );

  socket.on('disconnect', () => {
    clearTimeout(socket.data.expiryTimer);
    // The other side must not be left watching "typing…" for ever because a
    // connection dropped mid-sentence.
    clearAllTyping(socket);
  });
}

export { withinSendLimit, startTyping, stopTyping, clearAllTyping, unreadCount };
