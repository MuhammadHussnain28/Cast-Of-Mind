import { useCallback, useEffect, useState } from 'react'
import { fetchSessions } from '../api/sessionsApi'
import { useSocket } from '../socket/socketContext'
import { SOCKET_EVENTS } from '../socket/socketClient'
import { nextRefreshAt } from './mySessions'

// Longest delay setTimeout can hold (~24.8 days); anything later waits for a revisit.
const MAX_TIMEOUT = 2 ** 31 - 1

/**
 * The client's own sessions (§7.4), read only. Asks again when a session notice
 * arrives for this booking, and at each Join window edge so the link appears
 * when it is time. A refresh keeps the list on screen rather than blanking it.
 */
export function useMySessions(bookingId) {
  const socket = useSocket()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({
    status: 'loading',
    error: null,
    upcoming: [],
    history: [],
    historyCursor: null,
    counter: null,
  })

  const refresh = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    if (!bookingId) return undefined
    let cancelled = false
    Promise.all([
      fetchSessions(bookingId, { scope: 'upcoming', limit: 50 }),
      fetchSessions(bookingId, { scope: 'history' }),
    ])
      .then(([upcoming, history]) => {
        if (cancelled) return
        setState({
          status: 'ready',
          error: null,
          upcoming: upcoming.data,
          history: history.data,
          historyCursor: history.meta.nextCursor,
          counter: upcoming.meta.counter ?? null,
        })
      })
      .catch((error) => {
        if (cancelled) return
        setState((s) => ({ ...s, status: s.status === 'ready' ? 'ready' : 'error', error }))
      })
    return () => {
      cancelled = true
    }
  }, [bookingId, attempt])

  // A therapist scheduled, moved or cancelled something: ask again.
  useEffect(() => {
    if (!socket) return undefined
    const onMessage = (payload) => {
      if (payload?.type === 'system' && String(payload.bookingId) === String(bookingId)) refresh()
    }
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onMessage)
    return () => socket.off(SOCKET_EVENTS.MESSAGE_NEW, onMessage)
  }, [socket, bookingId, refresh])

  // The next Join window edge.
  useEffect(() => {
    const at = nextRefreshAt(state.upcoming)
    if (!at) return undefined
    const wait = Math.max(0, at.getTime() - Date.now()) + 1000
    if (wait > MAX_TIMEOUT) return undefined
    const id = setTimeout(refresh, wait)
    return () => clearTimeout(id)
  }, [state.upcoming, refresh])

  const loadMore = useCallback(async () => {
    if (!state.historyCursor) return
    const page = await fetchSessions(bookingId, { scope: 'history', cursor: state.historyCursor })
    setState((s) => {
      const seen = new Set(s.history.map((row) => row.id))
      return {
        ...s,
        history: [...s.history, ...page.data.filter((row) => !seen.has(row.id))],
        historyCursor: page.meta.nextCursor,
      }
    })
  }, [bookingId, state.historyCursor])

  return { ...state, refresh, loadMore }
}

export default useMySessions
