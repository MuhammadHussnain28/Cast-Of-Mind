import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSocket } from '../../lib/socket/socketContext'
import { SOCKET_EVENTS } from '../../lib/socket/socketClient'
import { fetchUnreadCount } from '../../lib/api/chatApi'
import { UnreadContext } from '../../lib/chat/unreadContext'
import { useUnreadTabTitle } from '../../lib/chat/useUnreadTabTitle'
import { EMPTY_UNREAD, clearBooking, fromServer, increment } from '../../lib/chat/unreadStore'

/**
 * Unread counts for the whole portal — master spec §14.
 *
 * THE SERVER IS THE TRUTH; THE SOCKET IS THE SPEED. `GET /chat/unread-count`
 * on mount and again on every reconnect is what makes the number right;
 * `unread:update` is what makes it instant. A `message:new` that arrives before
 * its matching push raises the badge locally so it never lags a message it has
 * already delivered — and the server's own number overwrites it a moment later,
 * so a local guess cannot leave the badge permanently wrong.
 *
 * NOT ROLE-SPECIFIC. The therapist portal's client sidebar (§8.1) needs exactly
 * this, one count per booking, which is why it lives here rather than under
 * `portal/client/` and why nothing in it assumes a single conversation.
 *
 * Works with no socket at all: the REST count still loads, and it is refreshed
 * whenever a conversation is read. A blocked websocket costs liveness, not
 * correctness (§14).
 */
export default function UnreadProvider({ myRole, children }) {
  const socket = useSocket()
  const [unread, setUnread] = useState(EMPTY_UNREAD)

  /**
   * Has the server's count arrived at least once? (8.3)
   *
   * Until it has, a zero here means "not known yet", not "nothing unread" — and
   * a caller holding its own count from elsewhere (the therapist list carries
   * one per row) needs to tell those apart. After it has, the provider is the
   * only truth, including when that truth is zero.
   */
  const [ready, setReady] = useState(false)

  /**
   * The conversation currently open, at the bottom, on a visible tab.
   *
   * Held in a ref because the socket listener below must read the CURRENT value
   * without re-subscribing every time someone scrolls — re-binding a socket
   * handler on scroll is how messages get dropped between the off and the on.
   */
  const readingRef = useRef(null)

  const load = useCallback(() => {
    let cancelled = false

    // No synchronous setState before the first await — the React Compiler rule
    // fixed at the root in 0.6, 4.2 and 5.1 rather than silenced.
    fetchUnreadCount()
      .then((data) => {
        if (cancelled) return
        setUnread(fromServer(data))
        setReady(true)
      })
      .catch(() => {
        // Silent. A badge is not worth an error banner over someone's
        // conversation, and the next successful read corrects it.
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => load(), [load])

  useEffect(() => {
    if (!socket) return undefined

    const onUnread = (payload) => {
      const next = fromServer(payload)
      setReady(true)
      // The open conversation is being read right now, so whatever the server
      // counted for it is already stale. Everything else is taken as given.
      const reading = readingRef.current
      setUnread(reading ? clearBooking(next, reading) : next)
    }

    const onMessage = (payload) => {
      if (!payload?.bookingId) return
      if (payload.senderRole === myRole) return // never my own
      if (String(payload.bookingId) === String(readingRef.current)) return // being read
      setUnread((current) => increment(current, payload.bookingId))
    }

    // A reconnect may have missed any number of events. Re-read the truth.
    const onConnect = () => load()

    socket.on(SOCKET_EVENTS.UNREAD_UPDATE, onUnread)
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onMessage)
    socket.on('connect', onConnect)

    return () => {
      socket.off(SOCKET_EVENTS.UNREAD_UPDATE, onUnread)
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onMessage)
      socket.off('connect', onConnect)
    }
  }, [socket, myRole, load])

  /**
   * "This conversation is open, at the bottom, and the tab is visible."
   *
   * Clears it immediately and suppresses further increments for it, so the
   * badge never flashes 1 and back to 0 in front of somebody who is watching
   * the message arrive. Passing null hands the suppression back.
   */
  const setReadingBooking = useCallback((bookingId) => {
    readingRef.current = bookingId ? String(bookingId) : null
    if (bookingId) setUnread((current) => clearBooking(current, bookingId))
  }, [])

  /** Read, but not necessarily still open — a one-off clear. */
  const markBookingRead = useCallback((bookingId) => {
    setUnread((current) => clearBooking(current, bookingId))
  }, [])

  useUnreadTabTitle(unread.total)

  const value = useMemo(
    () => ({ unread, ready, setReadingBooking, markBookingRead }),
    [unread, ready, setReadingBooking, markBookingRead],
  )

  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>
}
