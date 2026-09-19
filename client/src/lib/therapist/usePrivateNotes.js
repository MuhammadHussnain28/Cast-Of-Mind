import { useCallback, useEffect, useState } from 'react'
import { fetchNotes, createNote, updateNote, deleteNote } from '../api/therapistJournalApi'

const EMPTY = { data: [], total: 0, nextCursor: null }

/**
 * The therapist's own clinical notes. Fetched separately from the journal and
 * never merged with it — the two only meet in the layout.
 * Mounted per booking (keyed), so nothing crosses clients.
 */
export function usePrivateNotes(bookingId) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading', error: null, ...EMPTY })

  useEffect(() => {
    let cancelled = false
    fetchNotes(bookingId)
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
      const page = await fetchNotes(bookingId, { cursor: state.nextCursor })
      setState((current) => {
        const seen = new Set(current.data.map((n) => n.id))
        return {
          ...current,
          data: [...current.data, ...page.data.filter((n) => !seen.has(n.id))],
          nextCursor: page.meta.nextCursor,
        }
      })
    } catch {
      // What is already on screen stays correct.
    }
  }, [bookingId, state.nextCursor])

  // These three throw, so the composer and the row keep the words and say why.
  const add = useCallback(
    async ({ text }) => {
      const note = await createNote(bookingId, { text })
      setState((current) => ({ ...current, data: [note, ...current.data], total: current.total + 1 }))
      return note
    },
    [bookingId],
  )

  const edit = useCallback(
    async (noteId, { text }) => {
      const note = await updateNote(bookingId, noteId, { text })
      setState((current) => ({
        ...current,
        data: current.data.map((n) => (n.id === noteId ? note : n)),
      }))
      return note
    },
    [bookingId],
  )

  const remove = useCallback(
    async (noteId) => {
      await deleteNote(bookingId, noteId)
      setState((current) => ({
        ...current,
        data: current.data.filter((n) => n.id !== noteId),
        total: Math.max(0, current.total - 1),
      }))
    },
    [bookingId],
  )

  return { ...state, add, edit, remove, retry, loadMore }
}

export default usePrivateNotes
