import { useCallback, useEffect, useState } from 'react'
import { fetchMyWorksheets, downloadMyWorksheet, submitMyWorksheet } from '../api/clientWorksheetsApi'
import { downloadName } from '../therapist/worksheetFiles'
import { useWorksheetsPending } from './worksheetsPending'

const EMPTY = { data: [], counts: { assigned: 0, completed: 0 }, nextCursor: null }

// The client's own worksheets. Keeps the nav dot in step with what is on screen.
export function useMyWorksheets() {
  const { setPending } = useWorksheetsPending()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading', error: null, ...EMPTY })

  useEffect(() => {
    let cancelled = false
    fetchMyWorksheets()
      .then((page) => {
        if (cancelled) return
        setState({ status: 'ready', error: null, data: page.data, counts: page.meta.counts, nextCursor: page.meta.nextCursor })
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', error, ...EMPTY })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  // The nav dot follows what this screen knows; the socket covers other screens.
  useEffect(() => {
    if (state.status === 'ready') setPending(state.counts.assigned)
  }, [state.status, state.counts.assigned, setPending])

  const retry = useCallback(() => {
    setState({ status: 'loading', error: null, ...EMPTY })
    setAttempt((n) => n + 1)
  }, [])

  const loadMore = useCallback(async () => {
    if (!state.nextCursor) return
    try {
      const page = await fetchMyWorksheets({ cursor: state.nextCursor })
      setState((current) => {
        const seen = new Set(current.data.map((w) => w.id))
        return { ...current, data: [...current.data, ...page.data.filter((w) => !seen.has(w.id))], nextCursor: page.meta.nextCursor }
      })
    } catch {
      // The list already shown stays correct.
    }
  }, [state.nextCursor])

  // Throws, so the row can keep the chosen file and say what went wrong.
  const submit = useCallback(
    async (worksheetId, file, { onProgress, signal } = {}) => {
      const updated = await submitMyWorksheet({ worksheetId, file, onProgress, signal })
      setState((current) => {
        const wasWaiting = current.data.find((w) => w.id === worksheetId)?.status === 'assigned'
        const assigned = wasWaiting ? Math.max(0, current.counts.assigned - 1) : current.counts.assigned
        const completed = wasWaiting ? current.counts.completed + 1 : current.counts.completed
        return {
          ...current,
          data: current.data.map((w) => (w.id === worksheetId ? updated : w)),
          counts: { assigned, completed },
        }
      })
      return updated
    },
    [],
  )

  const download = useCallback(async (worksheet, which) => {
    const blob = await downloadMyWorksheet(worksheet.id, which)
    const file = which === 'completed' ? worksheet.completedFile : worksheet.assignedFile
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = downloadName(which === 'completed' ? `${worksheet.title} (my answers)` : worksheet.title, file?.format)
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, [])

  return { ...state, submit, download, retry, loadMore }
}

export default useMyWorksheets
