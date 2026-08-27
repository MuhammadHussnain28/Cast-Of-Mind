import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { clearAccessToken } from '../../lib/api/accessToken'
import { runSingleFlightRefresh } from '../../lib/api/interceptors'
import { fetchMe } from '../../lib/api/authApi'
import { credentialsReceived, sessionEnded } from '../../store/authSlice'

/**
 * Restores the session on page load.
 *
 * The access token lives in memory only, so a reload loses it. The refresh
 * cookie survives, though, because the browser kept it — so on load we ask
 * /auth/refresh for a new access token. If that works, the user was signed in
 * all along and never sees a flicker.
 *
 * THE STRICTMODE TRAP, which cost nothing to avoid and would have been
 * miserable to debug:
 *
 * React StrictMode deliberately runs mount effects TWICE in development. The
 * server rotates the refresh token on every use, so a second call would
 * present the token the first call just replaced — the server would correctly
 * refuse it, and you would appear signed out after every reload, in
 * development only, with the production build working fine.
 *
 * Two guards, both needed:
 *   - `startedRef` stops this component running the effect twice.
 *   - runSingleFlightRefresh() is shared with the 401 interceptor, so a
 *     request failing during startup joins the same refresh instead of
 *     starting a competing one.
 */
export default function AuthBootstrap({ children }) {
  const dispatch = useDispatch()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    async function restore() {
      try {
        const { user } = await runSingleFlightRefresh()

        // The refresh response already carries the user, so this is usually
        // all we need. fetchMe is the fallback for the unlikely case where a
        // future server change stops returning it.
        if (user) {
          dispatch(credentialsReceived({ user }))
          return
        }

        const me = await fetchMe()
        dispatch(credentialsReceived({ user: me.user }))
      } catch {
        // No cookie, expired, revoked, or the account was deactivated. All of
        // them mean the same thing here: nobody is signed in. This is the
        // ordinary path for a first-time visitor, so it is not an error.
        clearAccessToken()
        dispatch(sessionEnded())
      }
    }

    restore()
  }, [dispatch])

  return children
}
