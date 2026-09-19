import { apiClient } from './client'
import { toApiError } from './ApiError'

/**
 * The therapist's client list — master spec §8.1.
 *
 * One row per active booking: who they are, when something last happened, and
 * how many messages are waiting. Deliberately no message preview and no client
 * user id — see constants/therapistClients.js on the server for why.
 */
export async function fetchTherapistClients({ cursor, limit } = {}) {
  try {
    const { data } = await apiClient.get('/therapist/clients', { params: { cursor, limit } })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

/**
 * One client's full workspace context — master spec §8.2.
 *
 * Every refusal is an identical 404: a booking that does not exist, a malformed
 * id, and another therapist's client are indistinguishable from here, which is
 * deliberate on the server's side and means the browser must not try to tell
 * them apart either.
 */
export async function fetchTherapistClient(bookingId) {
  try {
    const { data } = await apiClient.get(`/therapist/clients/${bookingId}`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export default fetchTherapistClients
