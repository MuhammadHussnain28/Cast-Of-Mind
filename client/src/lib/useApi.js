import { useCallback, useEffect, useRef, useState } from 'react'
import { toApiError } from './api/ApiError'

/**
 * Loading/error/data state for one API call.
 *
 * const { data, error, loading, run } = useApi(() => apiClient.get('/health'))
 *
 * `immediate: true` runs it once on mount — for a read that should load as
 * soon as the page does. Leave it false and call `run()` yourself for
 * anything triggered by a user action (a form submit, a retry button).
 *
 * Guards against setting state after the component has unmounted — a real
 * bug once slower calls exist (a slow request finishing after the user has
 * already navigated away), not a hypothetical one.
 */
export function useApi(apiFn, { immediate = false } = {}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const mountedRef = useRef(true)
  const apiFnRef = useRef(apiFn)

  useEffect(() => {
    apiFnRef.current = apiFn
  })

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Does the actual call. No synchronous state change happens here before
  // the first `await`, so calling this from the mount effect below never
  // triggers a same-tick render — only `run` (used from event handlers)
  // resets loading/error synchronously.
  const execute = useCallback(async (...args) => {
    try {
      const result = await apiFnRef.current(...args)
      if (mountedRef.current) {
        setData(result)
        setLoading(false)
      }
      return result
    } catch (err) {
      const apiError = toApiError(err)
      if (mountedRef.current) {
        setError(apiError)
        setLoading(false)
      }
      throw apiError
    }
  }, [])

  const run = useCallback(
    (...args) => {
      setLoading(true)
      setError(null)
      return execute(...args)
    },
    [execute],
  )

  useEffect(() => {
    // `loading`/`error` are already correctly initialized above for the
    // immediate case, so this only needs to start the fetch — not reset
    // state that's already right. `execute`'s identity never changes
    // (empty deps), so this still only fires once on mount.
    if (immediate) execute()
  }, [execute, immediate])

  return { data, error, loading, run }
}
