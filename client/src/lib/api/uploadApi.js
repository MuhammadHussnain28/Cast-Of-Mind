import { apiClient } from './client'

/**
 * Upload one file to POST /api/v1/uploads.
 *
 * The server checks the real leading bytes, not the filename or the type the
 * browser declares, so a rejection here is authoritative. It returns a
 * Cloudinary URL which the application form submits as text — and which the
 * server then re-checks belongs to our own account.
 *
 * @param {File} file
 * @param {'photo'|'certificate'|'license'} kind
 * @param {(percent: number) => void} [onProgress]
 */
export async function uploadFile(file, kind, onProgress) {
  const form = new FormData()
  form.append('kind', kind)
  form.append('file', file)

  const { data } = await apiClient.post('/uploads', form, {
    // Let the browser set the multipart boundary; setting it by hand breaks it.
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return
      onProgress(Math.round((event.loaded / event.total) * 100))
    },
  })

  return data
}
