import { apiClient } from './client'
import { toApiError } from './ApiError'

// Sessions (§8.4). Both roles read; only the therapist writes. Times go up as a
// wall-clock date and time — the server places them in the therapist's zone.

export async function fetchSessions(bookingId, { scope, cursor, limit } = {}) {
  try {
    const { data } = await apiClient.get(`/sessions/${bookingId}`, {
      params: { scope, cursor, limit },
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function createSession({ bookingId, date, time, zoomLink, note }) {
  try {
    const { data } = await apiClient.post('/therapist/sessions', {
      bookingId,
      date,
      time,
      zoomLink,
      note: note || null,
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function updateSession(sessionId, changes) {
  try {
    const { data } = await apiClient.patch(`/therapist/sessions/${sessionId}`, changes)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function cancelSession(sessionId) {
  try {
    const { data } = await apiClient.delete(`/therapist/sessions/${sessionId}`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

// 9.5: complete a started session now, or mark a completed one as not held.
export async function markSessionHeld(sessionId) {
  try {
    const { data } = await apiClient.post(`/therapist/sessions/${sessionId}/held`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function markSessionNotHeld(sessionId) {
  try {
    const { data } = await apiClient.post(`/therapist/sessions/${sessionId}/not-held`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
