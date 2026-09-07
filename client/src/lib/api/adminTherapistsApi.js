import { apiClient } from './client'

/**
 * Therapist management — master spec §9.3.
 *
 * There is deliberately no endpoint here for reading a therapist's
 * conversations, journals or clinical notes. §11 records that an admin
 * conversation viewer was proposed and the client decided against it.
 */

export async function fetchTherapists({ status, q, page, limit } = {}) {
  const { data } = await apiClient.get('/admin/therapists', {
    params: { status, q: q || undefined, page, limit },
  })
  return data
}

export async function fetchTherapist(id) {
  const { data } = await apiClient.get(`/admin/therapists/${id}`)
  return data
}

/** Admin-controlled fields only. Anything else is refused by the server. */
export async function updateTherapist(id, changes) {
  const { data } = await apiClient.patch(`/admin/therapists/${id}`, changes)
  return data
}

export async function setTherapistActive(id, active) {
  const action = active ? 'reactivate' : 'deactivate'
  const { data } = await apiClient.post(`/admin/therapists/${id}/${action}`)
  return data
}

/**
 * Sends the standard reset link. No password is chosen, returned or seen —
 * not by the admin, and not by this function.
 */
export async function resetTherapistPassword(id) {
  const { data } = await apiClient.post(`/admin/therapists/${id}/reset-password`)
  return data
}
