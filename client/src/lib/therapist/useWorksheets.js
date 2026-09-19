import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchWorksheets,
  uploadWorksheet,
  withdrawWorksheet,
  downloadWorksheetFile,
  markWorksheetReviewed,
} from '../api/therapistWorksheetsApi'
import { downloadName } from './worksheetFiles'

const EMPTY = { data: [], counts: { assigned: 0, completed: 0 }, nextCursor: null }

// One client's worksheets. Mounted per booking (keyed), so nothing crosses clients.
export function useWorksheets(bookingId) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading', error: null, ...EMPTY })
  const [upload, setUpload] = useState({ status: 'idle', progress: 0, error: null })
  const uploadAbort = useRef(null)

  useEffect(() => {
    let cancelled = false
    fetchWorksheets(bookingId)
      .then((page) => {
        if (cancelled) return
        setState({
          status: 'ready',
          error: null,
          data: page.data,
          counts: page.meta.counts,
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

  // An upload still running when the tab closes is cancelled, not left to land.
  useEffect(() => () => uploadAbort.current?.abort(), [])

  const retry = useCallback(() => {
    setState({ status: 'loading', error: null, ...EMPTY })
    setAttempt((n) => n + 1)
  }, [])

  const loadMore = useCallback(async () => {
    if (!state.nextCursor) return
    try {
      const page = await fetchWorksheets(bookingId, { cursor: state.nextCursor })
      setState((current) => {
        const seen = new Set(current.data.map((w) => w.id))
        return {
          ...current,
          data: [...current.data, ...page.data.filter((w) => !seen.has(w.id))],
          nextCursor: page.meta.nextCursor,
        }
      })
    } catch {
      // The list already shown stays correct.
    }
  }, [bookingId, state.nextCursor])

  const assign = useCallback(
    async ({ title, file }) => {
      const controller = new AbortController()
      uploadAbort.current = controller
      setUpload({ status: 'uploading', progress: 0, error: null })
      try {
        const worksheet = await uploadWorksheet({
          bookingId,
          title,
          file,
          signal: controller.signal,
          onProgress: (progress) => setUpload((u) => ({ ...u, progress })),
        })
        setState((current) => ({
          ...current,
          data: [worksheet, ...current.data],
          counts: { ...current.counts, assigned: current.counts.assigned + 1 },
        }))
        setUpload({ status: 'done', progress: 100, error: null })
        return true
      } catch (error) {
        if (controller.signal.aborted) return false
        setUpload({ status: 'error', progress: 0, error: error.message })
        return false
      }
    },
    [bookingId],
  )

  const resetUpload = useCallback(() => setUpload({ status: 'idle', progress: 0, error: null }), [])

  // Throws, so the row can say what went wrong where it happened.
  const withdraw = useCallback(
    async (id) => {
      await withdrawWorksheet(bookingId, id)
      setState((current) => ({
        ...current,
        data: current.data.filter((w) => w.id !== id),
        counts: { ...current.counts, assigned: Math.max(0, current.counts.assigned - 1) },
      }))
    },
    [bookingId],
  )

  const download = useCallback(
    async (worksheet, which) => {
      const blob = await downloadWorksheetFile(bookingId, worksheet.id, which)
      const file = which === 'completed' ? worksheet.completedFile : worksheet.assignedFile
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = downloadName(
        which === 'completed' ? `${worksheet.title} (answers)` : worksheet.title,
        file?.format,
      )
      document.body.appendChild(link)
      link.click()
      link.remove()
      // Revoked after the click, so the file does not sit in memory.
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    },
    [bookingId],
  )

  // Throws, so the row can say what went wrong.
  const markReviewed = useCallback(
    async (id) => {
      const updated = await markWorksheetReviewed(bookingId, id)
      setState((current) => ({ ...current, data: current.data.map((w) => (w.id === id ? updated : w)) }))
    },
    [bookingId],
  )

  return { ...state, upload, assign, resetUpload, withdraw, download, markReviewed, retry, loadMore }
}

export default useWorksheets
