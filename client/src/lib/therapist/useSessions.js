import { useCallback, useEffect, useState } from 'react'
import {
  fetchSessions,
  createSession,
  updateSession,
  cancelSession,
  markSessionHeld,
  markSessionNotHeld,
} from '../api/sessionsApi'

const EMPTY_LIST = { data: [], nextCursor: null }
const byTime = (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)

function merge(rows, extra, order) {
  const map = new Map(rows.map((row) => [row.id, row]))
  for (const row of extra) map.set(row.id, row)
  const out = [...map.values()].sort(byTime)
  return order === 'desc' ? out.reverse() : out
}

// One client's sessions, upcoming and history. Mounted per booking (keyed).
export function useSessions(bookingId) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({
    status: 'loading',
    error: null,
    therapistTimezone: null,
    counter: null,
    upcoming: EMPTY_LIST,
    history: EMPTY_LIST,
  })

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchSessions(bookingId, { scope: 'upcoming' }),
      fetchSessions(bookingId, { scope: 'history' }),
    ])
      .then(([upcoming, history]) => {
        if (cancelled) return
        setState({
          status: 'ready',
          error: null,
          therapistTimezone: upcoming.meta.therapistTimezone ?? history.meta.therapistTimezone ?? null,
          counter: upcoming.meta.counter ?? null,
          upcoming: { data: upcoming.data, nextCursor: upcoming.meta.nextCursor },
          history: { data: history.data, nextCursor: history.meta.nextCursor },
        })
      })
      .catch((error) => {
        if (!cancelled) {
          setState((s) => ({ ...s, status: 'error', error, upcoming: EMPTY_LIST, history: EMPTY_LIST }))
        }
      })
    return () => {
      cancelled = true
    }
  }, [bookingId, attempt])

  const retry = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading', error: null }))
    setAttempt((n) => n + 1)
  }, [])

  // Asks again without blanking the list — after a change that moves the counter.
  const refresh = useCallback(() => setAttempt((n) => n + 1), [])

  const loadMore = useCallback(
    async (scope) => {
      const cursor = state[scope].nextCursor
      if (!cursor) return
      const page = await fetchSessions(bookingId, { scope, cursor })
      setState((s) => ({
        ...s,
        [scope]: {
          data: merge(s[scope].data, page.data, scope === 'history' ? 'desc' : 'asc'),
          nextCursor: page.meta.nextCursor,
        },
      }))
    },
    [bookingId, state],
  )

  // Each of these throws, so the form or row can say what went wrong in place.
  const schedule = useCallback(
    async (values) => {
      const session = await createSession({ bookingId, ...values })
      setState((s) => ({
        ...s,
        therapistTimezone: session.therapistTimezone ?? s.therapistTimezone,
        upcoming: { ...s.upcoming, data: merge(s.upcoming.data, [session], 'asc') },
      }))
      return session
    },
    [bookingId],
  )

  const update = useCallback(async (sessionId, changes) => {
    const session = await updateSession(sessionId, changes)
    setState((s) => ({
      ...s,
      upcoming: { ...s.upcoming, data: merge(s.upcoming.data, [session], 'asc') },
    }))
    return session
  }, [])

  // A cancelled session leaves Upcoming and joins History; it is never deleted.
  const cancel = useCallback(async (sessionId) => {
    const session = await cancelSession(sessionId)
    setState((s) => ({
      ...s,
      upcoming: { ...s.upcoming, data: s.upcoming.data.filter((row) => row.id !== sessionId) },
      history: { ...s.history, data: merge(s.history.data, [session], 'desc') },
    }))
    return session
  }, [])

  // 9.5. Each throws so the row can say what went wrong; both move the counter.
  const markHeld = useCallback(
    async (sessionId) => {
      const result = await markSessionHeld(sessionId)
      refresh()
      return result
    },
    [refresh],
  )

  const markNotHeld = useCallback(
    async (sessionId) => {
      const result = await markSessionNotHeld(sessionId)
      refresh()
      return result
    },
    [refresh],
  )

  return { ...state, retry, refresh, loadMore, schedule, update, cancel, markHeld, markNotHeld }
}

export default useSessions
