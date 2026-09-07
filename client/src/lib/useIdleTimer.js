import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Inactivity countdown for the admin portal — master spec §18 asks for a
 * session timeout after ~30 minutes idle.
 *
 * One 1s interval comparing timestamps, rather than nested setTimeouts. That
 * matters for the case people actually hit: a laptop lid closed for an hour.
 * A pending setTimeout can be throttled or deferred by the browser while the
 * machine sleeps, so it may fire late or in the wrong order; comparing
 * Date.now() against the last activity is correct the moment the tab wakes,
 * however long it slept.
 *
 * Activity is shared across tabs through a plain timestamp in localStorage.
 * That is not a credential and never touches the access token, which stays in
 * memory. Every read and write is guarded — localStorage throws outright in
 * some private-window modes, and a convenience must never break the portal.
 */

const STORAGE_KEY = 'cast-of-mind.admin.lastActivity'

// Cheap enough to run on every event; the write is what needs throttling.
const WRITE_THROTTLE_MS = 5000

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll']

function readSharedActivity() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  } catch {
    return null
  }
}

function writeSharedActivity(at) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(at))
  } catch {
    // Private window, or storage disabled. The per-tab timer still works.
  }
}

export function useIdleTimer({ timeoutMs, warningMs, onTimeout, enabled = true }) {
  // Seeded in the effect, not here: reading the clock during render is impure
  // and gives a different answer on every re-render.
  const lastActivityRef = useRef(0)
  const lastWriteRef = useRef(0)
  const firedRef = useRef(false)
  const onTimeoutRef = useRef(onTimeout)

  // Kept in a ref so a caller passing an inline arrow does not restart the
  // interval on every render.
  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  // Only set while the warning is showing, so the rest of the portal does not
  // re-render once a second for a countdown nobody is looking at.
  const [msRemaining, setMsRemaining] = useState(null)

  const markActive = useCallback(
    (at = Date.now()) => {
      lastActivityRef.current = at
      firedRef.current = false
      setMsRemaining(null)

      if (at - lastWriteRef.current > WRITE_THROTTLE_MS) {
        lastWriteRef.current = at
        writeSharedActivity(at)
      }
    },
    [],
  )

  useEffect(() => {
    if (!enabled) return undefined

    if (lastActivityRef.current === 0) lastActivityRef.current = Date.now()

    // Another tab may have been in use while this one sat still.
    const shared = readSharedActivity()
    if (shared && shared > lastActivityRef.current) lastActivityRef.current = shared

    const onActivity = () => markActive()

    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY) return
      const at = Number(event.newValue)
      if (Number.isFinite(at) && at > lastActivityRef.current) {
        lastActivityRef.current = at
        firedRef.current = false
        setMsRemaining(null)
      }
    }

    // Returning to the tab is activity; leaving it is not.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') markActive()
    }

    ACTIVITY_EVENTS.forEach((name) =>
      window.addEventListener(name, onActivity, { passive: true }),
    )
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisibility)

    const interval = window.setInterval(() => {
      const idleFor = Date.now() - lastActivityRef.current
      const remaining = timeoutMs - idleFor

      if (remaining <= 0) {
        // Guarded so a slow sign-out cannot be started twice.
        if (!firedRef.current) {
          firedRef.current = true
          onTimeoutRef.current?.()
        }
        return
      }

      setMsRemaining(remaining <= warningMs ? remaining : null)
    }, 1000)

    return () => {
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity))
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(interval)
    }
  }, [enabled, timeoutMs, warningMs, markActive])

  return {
    // Null unless the warning window has been reached.
    msRemaining,
    stayActive: markActive,
  }
}
