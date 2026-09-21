import { apiClient } from './client'

/**
 * Bookings and subscriptions overview — master spec §9.5. Read-only: every
 * action on a pairing lives on the client's own admin screen.
 *
 * `sort` is one of the server's named keys and nothing else; the server refuses
 * any other value rather than ordering by a field it was handed.
 */
export async function fetchBookings({ status, q, page, limit, sort, direction } = {}) {
  const { data } = await apiClient.get('/admin/bookings', {
    params: { status, q: q || undefined, page, limit, sort, direction },
  })
  return data
}
