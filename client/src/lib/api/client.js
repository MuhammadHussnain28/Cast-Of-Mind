import axios from 'axios'

/**
 * The one axios instance the whole app calls through.
 *
 * withCredentials: true — every request carries cookies. Nothing uses that
 * yet, but the future login flow (chunk 1.x) issues a refresh token as an
 * httpOnly cookie, and this has to already be true for that to work.
 * (server/app.js was updated to `cors({ ..., credentials: true })` to match —
 * without both sides set, the browser blocks the response.)
 *
 * timeout: 15000 — a request that hangs this long is treated as failed
 * rather than left spinning forever. Override per call with
 * `apiClient.get(url, { timeout: 30000 })` if a specific call needs longer.
 *
 * Where the auth interceptor attaches later (chunk 1.x, not built here):
 *   apiClient.interceptors.request.use((config) => {
 *     if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
 *     return config
 *   })
 * Nothing is registered yet — an empty stub referencing a token that doesn't
 * exist would be auth logic in disguise, which this chunk excludes.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
})
