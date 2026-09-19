import { useCallback, useEffect, useState } from 'react'
import {
  fetchMyJournal,
  createMyEntry,
  updateMyEntry,
  deleteMyEntry,
} from '../api/journalApi'

const EMPTY = { data: [], total: 0, nextCursor: null }

// The client's own journal. Writes throw, so the composer keeps their words.
export function useJournal() {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading', error: null, ...EMPTY })

  useEffect(() => {
    let cancelled = false
    fetchMyJournal()
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
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading', error: null, ...EMPTY })
    setAttempt((n) => n + 1)
  }, [])

  const loadMore = useCallback(async () => {
    if (!state.nextCursor) return
    try {
      const page = await fetchMyJournal({ cursor: state.nextCursor })
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
  }, [state.nextCursor])

  const add = useCallback(async ({ text, moodTag }) => {
    const entry = await createMyEntry({ text, moodTag })
    setState((current) => ({
      ...current,
      data: [entry, ...current.data],
      total: current.total + 1,
    }))
    return entry
  }, [])

  const edit = useCallback(async (entryId, { text, moodTag }) => {
    const entry = await updateMyEntry(entryId, { text, moodTag })
    setState((current) => ({
      ...current,
      data: current.data.map((e) => (e.id === entryId ? entry : e)),
    }))
    return entry
  }, [])

  const remove = useCallback(async (entryId) => {
    await deleteMyEntry(entryId)
    setState((current) => ({
      ...current,
      data: current.data.filter((e) => e.id !== entryId),
      total: Math.max(0, current.total - 1),
    }))
  }, [])

  return { ...state, add, edit, remove, retry, loadMore }
}

export default useJournal
