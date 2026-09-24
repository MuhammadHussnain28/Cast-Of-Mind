import { apiClient } from './client'

/**
 * The client's end-of-subscription rating — master spec §9.6.
 *
 * Stars and optional words only. The server works out which therapist and
 * which subscription from the signed-in account, and answers
 * `{ submitted: true }` and nothing else — the client never sees a review
 * again once it is sent, not even their own.
 */
export async function submitReview({ stars, text }) {
  const { data } = await apiClient.post('/client/reviews', {
    stars,
    ...(text && text.trim() ? { text } : {}),
  })
  return data
}
