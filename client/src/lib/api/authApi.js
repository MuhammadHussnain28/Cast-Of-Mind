import { apiClient } from './client'

/**
 * Every auth call the app makes, in one place, so no component builds a URL
 * by hand.
 *
 * The refresh token is never touched here — it lives in an httpOnly cookie
 * the browser attaches and removes on its own. JavaScript cannot read it,
 * which is exactly what protects it from an XSS attack.
 */

export async function login({ email, password }) {
  const { data } = await apiClient.post('/auth/login', { email, password })
  return data
}

/**
 * Exchanges the refresh cookie for a new access token.
 *
 * `skipAuthRefresh` stops the response interceptor from reacting to a 401
 * here. Without it a failed refresh would trigger another refresh, and that
 * one would fail too — an endless loop instead of a clean "please log in".
 */
export async function refreshSession() {
  const { data } = await apiClient.post('/auth/refresh', null, { skipAuthRefresh: true })
  return data
}

export async function logout() {
  const { data } = await apiClient.post('/auth/logout', null, { skipAuthRefresh: true })
  return data
}

export async function fetchMe() {
  const { data } = await apiClient.get('/auth/me')
  return data
}

export async function forgotPassword({ email }) {
  const { data } = await apiClient.post('/auth/forgot-password', { email })
  return data
}

export async function resetPassword({ token, password }) {
  const { data } = await apiClient.post('/auth/reset-password', { token, password })
  return data
}
