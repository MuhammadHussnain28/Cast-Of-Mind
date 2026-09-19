import { useCallback, useEffect, useState } from 'react'
import { fetchTherapistClient } from '../api/therapistClientsApi'

/**
 * One client's workspace context — master spec §8.2.
 *
 * KEYED ON THE BOOKING ID, so switching clients in the sidebar discards
 * everything and refetches. That is what "tab state resets appropriately when
 * switching clients" has to mean at the data layer: the tab CHOICE persists,
 * but no row of one person's record may ever survive into another's screen.
 *
 * THE OLD CLIENT IS CLEARED DURING RENDER, NOT IN AN EFFECT. React's documented
 * pattern for resetting state when an input changes, and the same root fix this
 * project applied in 0.6, 4.2, 5.1 and 7.4 rather than silencing the compiler.
 * Doing it in an effect would paint one frame of the PREVIOUS client's name
 * under the new one's heading — a therapist glancing at that is exactly the
 * mix-up this screen must never allow.
 */
export function useTherapistClient(bookingId) {
  // A counter rather than a boolean, so a retry after a retry still fires.
  const [attempt, setAttempt] = useState(0)
  const key = `${bookingId ?? ''}:${attempt}`

  const [state, setState] = useState({ key, data: null, error: null, loading: true })

  // Render-phase adjustment. Nothing async, nothing in an effect.
  if (state.key !== key) {
    setState({ key, data: null, error: null, loading: true })
  }

  useEffect(() => {
    if (!bookingId) return undefined
    let cancelled = false

    fetchTherapistClient(bookingId)
      .then((data) => {
        if (!cancelled) setState({ key, data, error: null, loading: false })
      })
      .catch((error) => {
        if (!cancelled) setState({ key, data: null, error, loading: false })
      })

    return () => {
      cancelled = true
    }
    // `key` carries both the booking and the retry count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, bookingId])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  // Read from the adjusted value, never from stale state on the resetting pass.
  const current = state.key === key ? state : { data: null, error: null, loading: true }

  return { client: current.data, loading: current.loading, error: current.error, retry }
}

export default useTherapistClient
