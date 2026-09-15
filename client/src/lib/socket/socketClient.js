import { io } from 'socket.io-client'
import { getAccessToken } from '../api/accessToken'
import { runSingleFlightRefresh } from '../api/interceptors'

/**
 * The portal's socket connection — master spec §14.
 *
 * ONE CONNECTION FOR THE WHOLE PORTAL, owned by the shell rather than by the
 * chat screen. A connection that tore down every time someone tapped
 * Worksheets would drop messages between tabs, and 7.6's unread badges need the
 * same connection anyway.
 *
 * THE TOKEN IS READ AT CONNECT TIME, NEVER STORED HERE. It lives in memory in
 * `accessToken.js` and nowhere else (§11); this module borrows it for the
 * handshake and keeps no copy.
 */

export const SOCKET_EVENTS = Object.freeze({
  MESSAGE_SEND: 'message:send',
  MESSAGE_READ: 'message:read',
  CONVERSATION_SYNC: 'conversation:sync',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  MESSAGE_NEW: 'message:new',
  UNREAD_UPDATE: 'unread:update',
  AUTH_EXPIRED: 'auth:expired',
})

/**
 * Where the socket connects.
 *
 * `VITE_API_BASE_URL` is `/api/v1` behind the dev proxy and an absolute origin
 * in production. Socket.io needs an ORIGIN, not the API path, so the path is
 * stripped — and a relative base means "same origin as the page", which is
 * exactly right behind the proxy.
 *
 * CARRIED TO CHUNK 12.5: in production this must resolve to the real API
 * origin. A relative value would point at the Vercel domain, where nothing is
 * listening — the same trap already parked for `VITE_API_BASE_URL` itself.
 */
function socketOrigin() {
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  if (/^https?:\/\//i.test(base)) return new URL(base).origin
  return undefined // same origin as the page
}

export function createSocket({ onAuthExpired } = {}) {
  const socket = io(socketOrigin(), {
    auth: (cb) => cb({ token: getAccessToken() }),
    transports: ['websocket', 'polling'],
    autoConnect: false,
    withCredentials: true,
  })

  /**
   * The client half of 7.3's expiry fix.
   *
   * The server disconnects a socket whose access token has expired. Refreshing
   * through the SAME single-flight promise the REST interceptor uses means a
   * simultaneous 401 and socket expiry cause one refresh between them, not two
   * — and two would be worse than useless, because refresh rotates the token
   * and the second would present one that no longer exists.
   */
  const refreshAndReconnect = async () => {
    try {
      await runSingleFlightRefresh()
      // `auth` is a callback, so the new token is read on the next attempt.
      socket.connect()
    } catch {
      onAuthExpired?.()
    }
  }

  socket.on(SOCKET_EVENTS.AUTH_EXPIRED, refreshAndReconnect)

  socket.on('connect_error', (error) => {
    // The server refuses a stale token at the handshake with this code.
    if (error?.data?.code === 'UNAUTHENTICATED' || error?.data?.code === 'TOKEN_EXPIRED') {
      refreshAndReconnect()
    }
    // Every other reason — offline, server down, subscription ended — is left
    // alone. Socket.io retries transport failures itself, and chat keeps
    // working over REST regardless (§14).
  })

  return socket
}

/**
 * `socket.emit` with an acknowledgement, as a promise.
 *
 * Always resolves — never rejects — so a caller cannot forget to handle a
 * refusal. A timeout resolves as an error rather than hanging a send for ever.
 */
export function emitWithAck(socket, event, payload, timeoutMs = 10000) {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ error: { code: 'OFFLINE', message: 'Not connected.' } })
      return
    }

    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      resolve({ error: { code: 'TIMEOUT', message: 'That took too long. Please try again.' } })
    }, timeoutMs)

    socket.emit(event, payload, (response) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(response ?? {})
    })
  })
}
