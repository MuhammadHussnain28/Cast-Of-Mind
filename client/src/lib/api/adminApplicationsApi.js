import { apiClient } from './client'

/**
 * Admin review of therapist applications — master spec §9.2.
 */

export async function fetchApplications({ status, q, page, limit } = {}) {
  const { data } = await apiClient.get('/admin/applications', {
    params: { status, q: q || undefined, page, limit },
  })
  return data
}

export async function fetchApplication(id) {
  const { data } = await apiClient.get(`/admin/applications/${id}`)
  return data
}

/**
 * Returns the document as a Blob.
 *
 * The bytes come through our own API rather than from Cloudinary, because an
 * `authenticated` Cloudinary URL carries a permanent embedded signature — one
 * that reached the browser could never be revoked. A Blob keeps the file on
 * this origin, and the object URL built from it dies with the page.
 */
export async function fetchApplicationDocument(id, field) {
  const { data } = await apiClient.get(`/admin/applications/${id}/documents/${field}`, {
    responseType: 'blob',
  })
  return data
}

/**
 * Approve an application. Creates the therapist's users + therapistProfiles
 * records in one transaction on the server, then emails them.
 *
 * Idempotent: approving twice returns `alreadyApproved: true` and creates
 * nothing the second time.
 */
export async function approveApplication(id) {
  const { data } = await apiClient.post(`/admin/applications/${id}/approve`)
  return data
}

/** Reject an application. No account is created and no email is sent. */
export async function rejectApplication(id, reason) {
  const { data } = await apiClient.post(`/admin/applications/${id}/reject`, { reason })
  return data
}
