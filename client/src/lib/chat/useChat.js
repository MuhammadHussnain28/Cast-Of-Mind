import { useCallback, useEffect, useRef, useState } from 'react'
import { useSocket } from '../socket/socketContext'
import { SOCKET_EVENTS, emitWithAck } from '../socket/socketClient'
import { fetchMessages, postMessage, markConversationRead } from '../api/chatApi'
import {
  MESSAGE_STATUS,
  markFailed,
  markSending,
  mergePage,
  normalise,
  optimisticMessage,
  upsert,
} from './messageStore'

const newClientMessageId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`

/**
 * Why a send failed, in words the reader can act on.
 *
 * The server's own message when there is one — it explains the rate limit and
 * the length cap better than the browser could. A transport failure has no
 * server message, and `null` means the row falls back to the plain "Not sent".
 */
const TRANSPORT_CODES = new Set(['OFFLINE', 'TIMEOUT', 'NETWORK_ERROR'])

function reasonFor(error) {
  if (!error) return null
  if (TRANSPORT_CODES.has(error.code)) return null
  return error.message || null
}

/**
 * The conversation — master spec §7.1 and §14.
 *
 * THE SOCKET IS AN ACCELERATOR, NEVER A REQUIREMENT. Every operation here has a
 * REST path and takes it whenever the socket is absent or disconnected, so a
 * blocked websocket costs instant delivery and nothing else.
 */
export function useChat({ bookingId, myRole }) {
  const socket = useSocket()

  const [messages, setMessages] = useState([])
  const [meta, setMeta] = useState({
    hasMore: false,
    nextCursor: null,
    syncCursor: null,
    participants: null,
    // §7.1: has the client sent their opening message yet? Reported by the
    // server, because with pagination the browser may hold only the newest page
    // and cannot know whether an opening exists further back.
    awaitingOpeningMessage: false,
  })
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [theyAreTyping, setTheyAreTyping] = useState(false)
  // The newest message from the other person, for the screen-reader live
  // region. Carries a sequence number so two identical messages in a row are
  // still two separate announcements rather than one silently swallowed.
  const [lastIncoming, setLastIncoming] = useState(null)

  // Read in callbacks that must not re-subscribe when the list changes.
  // Synced in an effect rather than assigned during render — a ref written
  // while rendering is the React Compiler objection fixed at the root in 3.5
  // and 5.1, not something to silence.
  const messagesRef = useRef(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const syncCursorRef = useRef(null)
  const typingSentAt = useRef(0)
  const typingStopTimer = useRef(null)

  // --- first load -----------------------------------------------------------
  useEffect(() => {
    if (!bookingId) return undefined
    let cancelled = false

    fetchMessages(bookingId)
      .then((page) => {
        if (cancelled) return
        setMessages(page.data.map((m) => normalise(m, myRole)))
        setMeta({
          hasMore: page.meta.hasMore,
          nextCursor: page.meta.nextCursor,
          // Where a reconnect resumes from. Kept in a ref as well, because the
          // socket's connect handler must read the CURRENT value without
          // re-subscribing every time it moves.
          syncCursor: page.meta.syncCursor,
          participants: page.meta.participants,
          awaitingOpeningMessage: Boolean(page.meta.awaitingOpeningMessage),
        })
        syncCursorRef.current = page.meta.syncCursor
        setStatus('ready')
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err)
          setStatus('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [bookingId, myRole])

  // --- live delivery --------------------------------------------------------
  useEffect(() => {
    if (!socket || !bookingId) return undefined

    const onMessage = (payload) => {
      setMessages((current) => upsert(current, normalise(payload, myRole)))
      if (payload.senderRole !== myRole) {
        setTheyAreTyping(false)
        // Fed to the live region so a screen reader hears the message arrive.
        // Only what came FROM the other person, and only while this screen is
        // mounted — history and my own sends are not events.
        //
        // `seq` counts arrivals rather than carrying a timestamp: the announcer
        // alternates between two regions on it, which is what makes the same
        // message twice in a row get announced twice.
        setLastIncoming((previous) => ({
          id: payload.id,
          text: payload.text,
          seq: (previous?.seq ?? 0) + 1,
        }))
      }
    }

    const onTypingStart = (payload) => {
      if (payload.bookingId === bookingId && payload.senderRole !== myRole) setTheyAreTyping(true)
    }
    const onTypingStop = (payload) => {
      if (payload.bookingId === bookingId && payload.senderRole !== myRole) setTheyAreTyping(false)
    }

    /**
     * Reconnection: ask for exactly what arrived while the socket was away.
     *
     * `after` is the cursor 7.3 added for this, so the server returns the gap
     * rather than a blind refetch. Merging is idempotent — anything already
     * held dedupes by id — so an overlap costs nothing and a missed message
     * cannot slip through.
     *
     * Limitation, stated rather than hidden: if more than one page arrived
     * while disconnected, the remainder is filled by scrolling up as normal.
     * At 30 sends a minute in a one-to-one conversation that is not a case a
     * real reconnect produces.
     */
    const onConnect = async () => {
      try {
        const cursor = syncCursorRef.current
        const page = await fetchMessages(bookingId, cursor ? { after: cursor } : { limit: 50 })
        setMessages((current) => mergePage(current, page.data.map((m) => normalise(m, myRole))))
        if (page.meta.syncCursor) {
          syncCursorRef.current = page.meta.syncCursor
          setMeta((current) => ({ ...current, syncCursor: page.meta.syncCursor }))
        }
      } catch {
        // A failed catch-up is not fatal — the thread already on screen stands.
      }
    }

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onMessage)
    socket.on(SOCKET_EVENTS.TYPING_START, onTypingStart)
    socket.on(SOCKET_EVENTS.TYPING_STOP, onTypingStop)
    socket.on('connect', onConnect)

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onMessage)
      socket.off(SOCKET_EVENTS.TYPING_START, onTypingStart)
      socket.off(SOCKET_EVENTS.TYPING_STOP, onTypingStop)
      socket.off('connect', onConnect)
    }
  }, [socket, bookingId, myRole])

  // --- history --------------------------------------------------------------
  const loadOlder = useCallback(async () => {
    if (!meta.hasMore || !meta.nextCursor || loadingOlder) return
    setLoadingOlder(true)
    try {
      const page = await fetchMessages(bookingId, { before: meta.nextCursor })
      setMessages((current) => mergePage(current, page.data.map((m) => normalise(m, myRole))))
      setMeta((current) => ({
        ...current,
        hasMore: page.meta.hasMore,
        nextCursor: page.meta.nextCursor,
      }))
    } catch {
      // Silent: the thread already on screen is unaffected, and an error banner
      // over history someone did not ask for would be noise.
    } finally {
      setLoadingOlder(false)
    }
  }, [bookingId, meta.hasMore, meta.nextCursor, loadingOlder, myRole])

  // --- sending --------------------------------------------------------------
  const deliver = useCallback(
    async (clientMessageId, text) => {
      // Socket first for speed; REST whenever it is not available. Both reach
      // the same service, so the rules are identical either way.
      if (socket?.connected) {
        const ack = await emitWithAck(socket, SOCKET_EVENTS.MESSAGE_SEND, {
          bookingId,
          text,
          clientMessageId,
        })
        if (ack?.data) return ack.data
        if (ack?.error?.code !== 'OFFLINE' && ack?.error?.code !== 'TIMEOUT') {
          // The code travels with the message, so the caller can tell a refusal
          // it should explain from a transport failure it should not.
          const failure = new Error(ack?.error?.message ?? 'Message not sent.')
          failure.code = ack?.error?.code
          throw failure
        }
        // Offline or timed out — fall through and try HTTP.
      }

      return postMessage(bookingId, { text, clientMessageId })
    },
    [socket, bookingId],
  )

  const send = useCallback(
    async (text) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const clientMessageId = newClientMessageId()
      setMessages((current) =>
        upsert(current, optimisticMessage({ clientMessageId, text: trimmed, senderRole: myRole })),
      )

      try {
        const saved = await deliver(clientMessageId, trimmed)
        setMessages((current) =>
          upsert(current, normalise({ ...saved, clientMessageId }, myRole)),
        )
        // The opening message is simply the client's first message, so sending
        // one clears the requirement. No separate "unlock" call — the server
        // would report the same thing on the next fetch anyway.
        setMeta((current) =>
          current.awaitingOpeningMessage ? { ...current, awaitingOpeningMessage: false } : current,
        )
      } catch (err) {
        // THE TEXT IS NEVER LOST. The row stays exactly where it was, visibly
        // unsent, with a retry — somebody who has just written something hard
        // must not have to write it twice.
        //
        // NO AUTOMATIC RETRY, ANYWHERE. `clientMessageId` is never stored
        // server-side, so the server cannot recognise a repeat: if a send
        // actually landed and only the acknowledgement was lost, retrying would
        // post the message twice. A duplicated message in a therapy
        // conversation is worse than a visible failure, so retrying is always
        // the reader's own deliberate act.
        setMessages((current) => markFailed(current, clientMessageId, reasonFor(err)))
      }
    },
    [deliver, myRole],
  )

  /**
   * The mandatory first message (§7.1) — deliberately NOT optimistic.
   *
   * Ordinary sending draws the bubble immediately and marks it failed if the
   * write does not land, because the thread is the right place to show that.
   * Here the reader is watching one button on a screen with nothing else on it,
   * so optimism buys nothing and would leave a phantom failed row behind a
   * screen they cannot yet see. This awaits the real write and THROWS, so the
   * opening screen can say what happened while keeping every word they wrote.
   */
  const sendOpening = useCallback(
    async (text) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const clientMessageId = newClientMessageId()
      const saved = await deliver(clientMessageId, trimmed)

      setMessages((current) => upsert(current, normalise({ ...saved, clientMessageId }, myRole)))
      setMeta((current) => ({ ...current, awaitingOpeningMessage: false }))
    },
    [deliver, myRole],
  )

  const retry = useCallback(
    async (clientMessageId) => {
      const target = messagesRef.current.find((m) => m.clientMessageId === clientMessageId)
      if (!target) return

      setMessages((current) => markSending(current, clientMessageId))
      try {
        const saved = await deliver(clientMessageId, target.text)
        setMessages((current) => upsert(current, normalise({ ...saved, clientMessageId }, myRole)))
      } catch (err) {
        setMessages((current) => markFailed(current, clientMessageId, reasonFor(err)))
      }
    },
    [deliver, myRole],
  )

  // --- read state -----------------------------------------------------------
  /**
   * §14: opening a conversation marks it read — and 7.6's brief adds the word
   * that matters, "AND VISIBLE".
   *
   * A hidden tab is refused here rather than at the call site, so every path
   * into this — first paint, reaching the bottom, coming back to the tab —
   * inherits the same rule. Marking messages read on a background tab would be
   * a lie the badge then tells, and the person it lies to is the one waiting to
   * find out their therapist replied.
   */
  const markRead = useCallback(async () => {
    if (!bookingId) return
    if (typeof document !== 'undefined' && document.hidden) return

    try {
      if (socket?.connected) {
        await emitWithAck(socket, SOCKET_EVENTS.MESSAGE_READ, { bookingId })
      } else {
        await markConversationRead(bookingId)
      }
    } catch {
      // Best effort. A badge that clears a moment late is not worth an error.
    }
  }, [socket, bookingId])

  // --- typing ---------------------------------------------------------------
  /**
   * Throttled to one `start` every two seconds, with a stop after a pause.
   *
   * An event per keystroke would be both wasteful and visually jittery on the
   * other side; the server also auto-stops after five seconds, so a dropped
   * connection cannot leave anyone watching "typing…" for ever.
   */
  const notifyTyping = useCallback(() => {
    if (!socket?.connected || !bookingId) return

    const now = Date.now()
    if (now - typingSentAt.current > 2000) {
      typingSentAt.current = now
      socket.emit(SOCKET_EVENTS.TYPING_START, { bookingId })
    }

    clearTimeout(typingStopTimer.current)
    typingStopTimer.current = setTimeout(() => {
      typingSentAt.current = 0
      socket.emit(SOCKET_EVENTS.TYPING_STOP, { bookingId })
    }, 2500)
  }, [socket, bookingId])

  const stopTyping = useCallback(() => {
    clearTimeout(typingStopTimer.current)
    typingSentAt.current = 0
    if (socket?.connected && bookingId) socket.emit(SOCKET_EVENTS.TYPING_STOP, { bookingId })
  }, [socket, bookingId])

  useEffect(() => () => clearTimeout(typingStopTimer.current), [])

  return {
    messages,
    participants: meta.participants,
    awaitingOpeningMessage: meta.awaitingOpeningMessage,
    hasMore: meta.hasMore,
    loadingOlder,
    status,
    error,
    theyAreTyping,
    lastIncoming,
    connected: Boolean(socket?.connected),
    send,
    sendOpening,
    retry,
    loadOlder,
    markRead,
    notifyTyping,
    stopTyping,
    MESSAGE_STATUS,
  }
}
