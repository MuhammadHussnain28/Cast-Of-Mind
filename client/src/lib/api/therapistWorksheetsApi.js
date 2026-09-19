import { apiClient } from './client'
import { toApiError } from './ApiError'

// Worksheets, therapist side (§8.3). Files travel through our API only.

export async function fetchWorksheets(bookingId, { cursor, limit } = {}) {
  try {
    const { data } = await apiClient.get(`/therapist/worksheets/${bookingId}`, {
      params: { cursor, limit },
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function uploadWorksheet({ bookingId, title, file, onProgress, signal }) {
  const form = new FormData()
  form.append('bookingId', bookingId)
  form.append('title', title)
  form.append('file', file)

  try {
    const { data } = await apiClient.post('/therapist/worksheets', form, {
      signal,
      // 10 MB on a slow line outlasts the default 15 s.
      timeout: 120000,
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100))
      },
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

// A Blob, never a storage URL: the signed link must not reach the browser.
export async function downloadWorksheetFile(bookingId, worksheetId, which) {
  try {
    const { data } = await apiClient.get(
      `/therapist/worksheets/${bookingId}/${worksheetId}/file/${which}`,
      { responseType: 'blob', timeout: 60000 },
    )
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function withdrawWorksheet(bookingId, worksheetId) {
  try {
    const { data } = await apiClient.delete(`/therapist/worksheets/${bookingId}/${worksheetId}`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function markWorksheetReviewed(bookingId, worksheetId) {
  try {
    const { data } = await apiClient.post(`/therapist/worksheets/${bookingId}/${worksheetId}/review`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
