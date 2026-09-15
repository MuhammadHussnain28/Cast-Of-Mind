import { apiClient } from './client'
import { toApiError } from './ApiError'

/**
 * The REST half of chat — master spec §14.
 *
 * NOT A FALLBACK BOLTED ON. The database is the record and these endpoints are
 * how it is read and written; the socket only makes delivery instant. Every
 * function here works with no socket connection at all.
 */

export async function fetchMessages(bookingId, { before, after, limit } = {}) {
  try {
    const { data } = await apiClient.get(`/chat/${bookingId}/messages`, {
      params: { before, after, limit },
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function postMessage(bookingId, { text, clientMessageId }) {
  try {
    const { data } = await apiClient.post(`/chat/${bookingId}/messages`, { text, clientMessageId })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function markConversationRead(bookingId) {
  try {
    const { data } = await apiClient.post(`/chat/${bookingId}/read`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
