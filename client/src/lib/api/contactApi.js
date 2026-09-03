import { apiClient } from './client'

/** Contact form submission. skipAuthRefresh: a 4xx here is never a stale token. */
export async function sendContactMessage(payload) {
  const { data } = await apiClient.post('/contact', payload, {
    skipAuthRefresh: true,
  })
  return data
}
