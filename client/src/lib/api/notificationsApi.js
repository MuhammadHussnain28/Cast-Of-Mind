import { apiClient } from './client'

/**
 * The notification bell — master spec §8.8.
 *
 * Every call is scoped to the signed-in user by the server; no id is ever sent
 * for "whose". A row carries who, what kind, how many and when — never the
 * message itself.
 */

export async function fetchNotifications({ page = 1, limit } = {}) {
  const { data } = await apiClient.get('/notifications', { params: { page, limit } })
  return data
}

export async function markNotificationRead(id) {
  const { data } = await apiClient.post(`/notifications/${id}/read`)
  return data
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.post('/notifications/read-all')
  return data
}
