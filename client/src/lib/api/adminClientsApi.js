import { apiClient } from './client'

/**
 * Client management — master spec §9.4.
 *
 * There is deliberately no endpoint here for reading a client's conversations,
 * journal entries or their therapist's clinical notes. §11 records that an
 * admin conversation viewer was proposed and the client decided against it, and
 * the server has no route that would serve one.
 */

export async function fetchClients({ status, q, page, limit } = {}) {
  const { data } = await apiClient.get('/admin/clients', {
    params: { status, q: q || undefined, page, limit },
  })
  return data
}

export async function fetchClient(id) {
  const { data } = await apiClient.get(`/admin/clients/${id}`)
  return data
}

/**
 * Stops the renewal at the end of the period already paid for (§13).
 * The server sets Stripe first and refuses outright if Stripe cannot be
 * reached, so a success here means the card will genuinely not be charged.
 */
export async function cancelClientSubscription(id) {
  const { data } = await apiClient.post(`/admin/clients/${id}/cancel-subscription`)
  return data
}

/** Sign-in only. It does NOT stop the billing — that is a separate action. */
export async function setClientActive(id, active) {
  const action = active ? 'reactivate' : 'deactivate'
  const { data } = await apiClient.post(`/admin/clients/${id}/${action}`)
  return data
}

/**
 * Sends the standard reset link. No password is chosen, returned or seen —
 * not by the admin, and not by this function.
 */
export async function resetClientPassword(id) {
  const { data } = await apiClient.post(`/admin/clients/${id}/reset-password`)
  return data
}
