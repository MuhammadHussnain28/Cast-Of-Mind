import { apiClient } from './client'

/**
 * Every admin call in one place, so no screen builds a URL by hand.
 *
 * Each of these hits /api/v1/admin, which is guarded at router level on the
 * server — requireAuth then requireAdmin, on every path under the mount.
 */

export async function fetchAdminSession() {
  const { data } = await apiClient.get('/admin/session')
  return data
}

/** The dashboard overview — master spec §9.1. Counts and one trend. */
export async function fetchAdminStats() {
  const { data } = await apiClient.get('/admin/stats')
  return data
}

/** One check of each service (10.6). Only ever called on load or on request. */
export async function fetchSystemStatus() {
  const { data } = await apiClient.get('/admin/system-status')
  return data
}
