import { apiClient } from './client'
import { toApiError } from './ApiError'

// Worksheets, client side (§7.2). Files travel through our API only.

export async function fetchMyWorksheets({ cursor, limit } = {}) {
  try {
    const { data } = await apiClient.get('/client/worksheets', { params: { cursor, limit } })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function downloadMyWorksheet(worksheetId, which) {
  try {
    const { data } = await apiClient.get(`/client/worksheets/${worksheetId}/file/${which}`, {
      responseType: 'blob',
      timeout: 60000,
    })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function submitMyWorksheet({ worksheetId, file, onProgress, signal }) {
  const form = new FormData()
  form.append('file', file)
  try {
    const { data } = await apiClient.post(`/client/worksheets/${worksheetId}/submit`, form, {
      signal,
      // A 10 MB photo on a phone connection outlasts the default 15 s.
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
