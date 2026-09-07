import { apiClient } from './client'
import { toApiError } from './ApiError'

/**
 * Matching is a POST for a read, deliberately: concern tags in a query string
 * land in access logs, browser history and Referer headers, and those are
 * somebody's mental health concerns. See the server controller.
 */
export async function findMatches({ concernTags, therapistGenderPreference }) {
  try {
    const { data } = await apiClient.post('/matching', {
      concernTags,
      therapistGenderPreference,
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function fetchTherapist(id) {
  try {
    const { data } = await apiClient.get(`/therapists/${id}`)
    return data.data
  } catch (error) {
    throw toApiError(error)
  }
}
