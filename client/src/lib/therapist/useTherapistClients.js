import { useCallback, useEffect, useRef, useState } from 'react'
import { useSocket } from '../socket/socketContext'
import { SOCKET_EVENTS } from '../socket/socketClient'
import { fetchTherapistClients } from '../api/therapistClientsApi'

/**
 * The therapist's client list — master spec §8.1.
 *
 * THE UNREAD BADGE IS NOT THIS HOOK'S JOB. `UnreadProvider` (7.6) owns the
 * counts and pushes them live; this owns who is in the list, in what order, and
 * when each of them was last heard from.
 *
 * It still listens for `message:new`, because a badge rising beside a row that
 * still reads "2 days ago" is visibly wrong, and because a message should move
 * its client to the top of an inbox. One small refetch answers both.
 *
 * KNOWN LIMIT, STATED RATHER THAN HIDDEN: that refetch reloads the FIRST page
 * and drops any further pages that were loaded. Re-ordering makes deeper pages
 * stale anyway, and the page size is 50 against real client counts in the tens,
 * so this is a path a live account does not reach.
 */
export function useTherapistClients() {
  const socket = useSocket()

  const [clients, setClients] = useState([])
  const [total, setTotal] = useState(0)
  const [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  // A counter rather than a boolean, so a retry after a retry still fires.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    // No synchronous setState before the first await — the React Compiler rule
    // fixed at the root in 0.6, 4.2, 5.1 and 7.4 rather than silenced.
    fetchTherapistClients()
      .then((data) => {
        if (cancelled) return
        setClients(data.data ?? [])
        setTotal(data.meta?.total ?? 0)
        setCursor(data.meta?.nextCursor ?? null)
        setError(null)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => {
    setLoading(true)
    setAttempt((n) => n + 1)
  }, [])

  /** Quietly, in place — a list that flashed a skeleton on every message would
      be worse than one that lagged. */
  const refreshQuietly = useCallback(() => setAttempt((n) => n + 1), [])

  const loadMore = useCallback(() => {
    if (!cursor) return

    setLoadingMore(true)
    fetchTherapistClients({ cursor })
      .then((data) => {
        setClients((current) => {
          // Dedupe by booking id: a row that moved between pages while they
          // were being read must not appear twice.
          const seen = new Set(current.map((row) => row.bookingId))
          return [...current, ...(data.data ?? []).filter((row) => !seen.has(row.bookingId))]
        })
        setTotal(data.meta?.total ?? 0)
        setCursor(data.meta?.nextCursor ?? null)
      })
      .catch(() => {
        // Silent: the list already on screen is still correct, and an error
        // banner over it would be worse than a button that did nothing.
      })
      .finally(() => setLoadingMore(false))
  }, [cursor])

  /**
   * Held in a ref so the socket handler reads the CURRENT function without the
   * subscription being torn down and rebuilt — re-binding a socket handler is
   * how events get dropped between the off and the on (7.6).
   */
  const refreshRef = useRef(refreshQuietly)
  useEffect(() => {
    refreshRef.current = refreshQuietly
  }, [refreshQuietly])

  useEffect(() => {
    if (!socket) return undefined

    const onMessage = () => refreshRef.current()
    const onConnect = () => refreshRef.current()

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onMessage)
    socket.on('connect', onConnect)

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onMessage)
      socket.off('connect', onConnect)
    }
  }, [socket])

  return {
    clients,
    total,
    loading,
    loadingMore,
    error,
    hasMore: Boolean(cursor),
    onRetry: reload,
    onLoadMore: loadMore,
  }
}

export default useTherapistClients
