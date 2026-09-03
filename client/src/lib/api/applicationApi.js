import { apiClient } from './client'

/**
 * Submit a therapist application.
 *
 * Errors are thrown for the caller to interpret — a 409 means the email is
 * already known and needs a jump back to step 1, and a 422 carries per-field
 * details the form can map onto its own fields.
 */
export async function submitApplication(payload) {
  const { data } = await apiClient.post('/therapist-applications', payload)
  return data
}

/** Public status check. Returns only status and dates by design. */
export async function getApplicationStatus(id) {
  const { data } = await apiClient.get(`/therapist-applications/${id}/status`)
  return data
}
