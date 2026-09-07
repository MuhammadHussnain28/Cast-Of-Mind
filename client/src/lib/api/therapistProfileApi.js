import { apiClient } from './client'

/**
 * The signed-in therapist's own profile — master spec §8.7.
 *
 * There is no id in either call. The server reads the therapist from the access
 * token, so there is no parameter that could be pointed at somebody else.
 */

export async function fetchOwnProfile() {
  const { data } = await apiClient.get('/therapist/profile')
  return data
}

/**
 * Accepts ONLY `photoUrl` and `bio`.
 *
 * Sending anything else is refused by the server with a 422 naming the field —
 * deliberately, rather than dropped, so a caller is never told a locked field
 * saved when it did not.
 */
export async function updateOwnProfile(changes) {
  const { data } = await apiClient.patch('/therapist/profile', changes)
  return data
}
