import { apiClient } from './client'
import { toApiError } from './ApiError'

/**
 * The client portal's own state — profile, booking, therapist basics and
 * subscription (§7).
 *
 * This endpoint sits OUTSIDE the server's subscription gate on purpose, so it
 * answers for a client whose subscription has ended. `access` in the response
 * is what decides whether the portal or the re-subscribe screen renders.
 */
export async function fetchClientMe() {
  try {
    const { data } = await apiClient.get('/client/me')
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

// The browser's own zone (9.2), so the therapist can see when a session lands.
export async function saveClientTimezone(timezone) {
  try {
    const { data } = await apiClient.patch('/client/timezone', { timezone })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
