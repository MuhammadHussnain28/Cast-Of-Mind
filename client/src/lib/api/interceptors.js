import { apiClient } from './client'
import { getAccessToken, setAccessToken, clearAccessToken } from './accessToken'
import { refreshSession } from './authApi'

/**
 * Attaches the access token to every request, and quietly recovers from an
 * expired one.
 *
 * THE SINGLE-FLIGHT REFRESH, and why it is not optional here.
 *
 * The server ROTATES the refresh token on every use (chunk 1.3) — the old one
 * dies the instant a new one is issued. So if five requests all get a 401 at
 * the same moment and each starts its own refresh, the first succeeds and
 * rotates the token, and the other four present a token that no longer
 * exists. All four fail, the session is torn down, and the user is thrown
 * back to the login page for no reason they could ever explain.
 *
 * So: the first 401 starts a refresh and remembers the promise. Every other
 * 401 in that window waits on the SAME promise. One refresh, ever, no matter
 * how many requests were in flight.
 */

let refreshPromise = null

// Set by installAuthInterceptors. Called when the session cannot be recovered.
let onSessionLost = () => {}

function runSingleFlightRefresh() {
  if (!refreshPromise) {
    refreshPromise = refreshSession()
      .then((data) => {
        setAccessToken(data.accessToken)
        return data
      })
      .finally(() => {
        // Cleared either way, so the NEXT expiry starts a fresh attempt
        // rather than reusing a settled promise.
        refreshPromise = null
      })
  }

  return refreshPromise
}

/**
 * Exposed so the session-restore on page load reuses the same guard. Without
 * this, React StrictMode's double-invoked mount effect would fire two
 * refreshes in development, the second one presenting an already-rotated
 * token — and you would appear logged out on every reload, but only on your
 * own machine.
 */
export { runSingleFlightRefresh }

export function installAuthInterceptors({ onSessionLost: handler } = {}) {
  if (handler) onSessionLost = handler

  apiClient.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config
      const status = error.response?.status

      // Not an auth problem, or nothing to retry.
      if (status !== 401 || !original) {
        return Promise.reject(error)
      }

      // The auth endpoints themselves. A 401 from /auth/login is a wrong
      // password, not an expired session — refreshing would be nonsense.
      if (original.skipAuthRefresh) {
        return Promise.reject(error)
      }

      // Retry ONCE. If the request fails again after a successful refresh,
      // the problem is not the token and looping would only hide it.
      if (original._retried) {
        clearAccessToken()
        onSessionLost()
        return Promise.reject(error)
      }

      original._retried = true

      try {
        await runSingleFlightRefresh()
      } catch {
        // The refresh token is gone, expired, or revoked. This is a real
        // logout, and the only honest response is to send them to /login.
        clearAccessToken()
        onSessionLost()
        return Promise.reject(error)
      }

      // The request interceptor picks up the new token on the way through.
      return apiClient(original)
    },
  )
}
