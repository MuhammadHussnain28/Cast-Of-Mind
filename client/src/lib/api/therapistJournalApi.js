import { apiClient } from './client'
import { toApiError } from './ApiError'

/**
 * The therapist's half of §8.5/8.6 — TWO SEPARATE ENDPOINTS, DELIBERATELY.
 *
 * The client's entries and the therapist's notes are fetched independently and
 * only meet in the layout. There is no combined call because there is no
 * combined response: the separation that keeps a client from ever seeing a
 * clinical note is the same one kept here.
 */

export async function fetchClientJournal(bookingId, { cursor, limit } = {}) {
  try {
    const { data } = await apiClient.get(`/therapist/journal/${bookingId}`, {
      params: { cursor, limit },
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function fetchNotes(bookingId, { cursor, limit } = {}) {
  try {
    const { data } = await apiClient.get(`/therapist/notes/${bookingId}`, {
      params: { cursor, limit },
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function createNote(bookingId, { text }) {
  try {
    const { data } = await apiClient.post(`/therapist/notes/${bookingId}`, { text })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function updateNote(bookingId, noteId, { text }) {
  try {
    const { data } = await apiClient.patch(`/therapist/notes/${bookingId}/${noteId}`, { text })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function deleteNote(bookingId, noteId) {
  try {
    const { data } = await apiClient.delete(`/therapist/notes/${bookingId}/${noteId}`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
