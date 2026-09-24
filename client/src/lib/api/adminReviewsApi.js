import { apiClient } from './client'

/**
 * Reviews, admin-only — master spec §9.6. `therapistId` is the therapist's
 * PROFILE id, the handle every admin screen uses.
 */
export async function fetchReviews({ therapistId, page = 1, limit = 10 } = {}) {
  const { data } = await apiClient.get('/admin/reviews', {
    params: { therapistId, page, limit },
  })
  return data
}
