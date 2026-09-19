import { apiClient } from './client'
import { toApiError } from './ApiError'

// The client's own journal (§7.3). Their therapist reads it; nobody else can.
// This module knows nothing about private notes and never will.

export async function fetchMyJournal({ cursor, limit } = {}) {
  try {
    const { data } = await apiClient.get('/client/journal', { params: { cursor, limit } })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function createMyEntry({ text, moodTag }) {
  try {
    const { data } = await apiClient.post('/client/journal', { text, moodTag })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function updateMyEntry(entryId, { text, moodTag }) {
  try {
    const { data } = await apiClient.patch(`/client/journal/${entryId}`, { text, moodTag })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function deleteMyEntry(entryId) {
  try {
    const { data } = await apiClient.delete(`/client/journal/${entryId}`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
