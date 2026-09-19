import { useCallback, useEffect, useState } from 'react'
import { fetchClientJournal } from '../api/therapistJournalApi'

const EMPTY = { data: [], total: 0, nextCursor: null }

/**
 * The client's entries, READ ONLY. There is no write function here and no
 * endpoint behind one — their writing is not the therapist's to change.
 * Mounted per booking (keyed), so nothing crosses clients.
 */
export function useClientJournal(bookingId) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading', error: null, ...EMPTY })

  useEffect(() => {
    let cancelled = false
    fetchClientJournal(bookingId)
      .then((page) => {
        if (cancelled) return
        setState({
          status: 'ready',
          error: null,
          data: page.data,
          total: page.meta.total,
          nextCursor: page.meta.nextCursor,
        })
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', error, ...EMPTY })
      })
    return () => {
      cancelled = true
    }
  }, [bookingId, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading', error: null, ...EMPTY })
    setAttempt((n) => n + 1)
  }, [])

  const loadMore = useCallback(async () => {
    if (!state.nextCursor) return
    try {
      const page = await fetchClientJournal(bookingId, { cursor: state.nextCursor })
      setState((current) => {
        const seen = new Set(current.data.map((e) => e.id))
        return {
          ...current,
          data: [...current.data, ...page.data.filter((e) => !seen.has(e.id))],
          nextCursor: page.meta.nextCursor,
        }
      })
    } catch {
      // What is already on screen stays correct.
    }
  }, [bookingId, state.nextCursor])

  return { ...state, retry, loadMore }
}

export default useClientJournal
