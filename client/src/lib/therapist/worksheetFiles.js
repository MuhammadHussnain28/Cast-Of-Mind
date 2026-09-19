// Worksheet file rules for instant feedback. The server's byte check decides.

export const WORKSHEET_MAX_BYTES = 10 * 1024 * 1024
export const WORKSHEET_TITLE_MAX = 120
export const WORKSHEET_ACCEPT = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const EXTENSIONS = { pdf: 'pdf', docx: 'docx' }
const IMAGE_EXTENSIONS = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp' }

// No HEIC in the list on purpose: iOS then converts a photo to JPEG itself.
export const WORKSHEET_RETURN_ACCEPT = `${WORKSHEET_ACCEPT},.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp`

export function extensionOf(name) {
  const match = /\.([a-z0-9]+)$/i.exec(String(name ?? ''))
  return match ? match[1].toLowerCase() : ''
}

// null when fine, otherwise a sentence that says how to fix it.
// Photos are allowed for returns only (a paper sheet, photographed).
export function checkWorksheetFile(file, { allowImages = false } = {}) {
  if (!file) return 'Choose a file to upload.'
  const ext = extensionOf(file.name)
  if (ext === 'doc') return 'Older Word files (.doc) are not accepted. Save it as a PDF or a .docx first.'
  if (ext === 'docm') return 'Word files with macros are not accepted. Save it as a PDF or a plain .docx.'
  const allowed = EXTENSIONS[ext] || (allowImages && IMAGE_EXTENSIONS[ext])
  if (!allowed) {
    return allowImages
      ? 'Choose a PDF, a Word (.docx) file or a photo (JPEG, PNG).'
      : 'Choose a PDF or a Word (.docx) file.'
  }
  if (file.size === 0) return 'That file is empty. Choose another.'
  if (file.size > WORKSHEET_MAX_BYTES) return 'That file is over 10 MB. Choose a smaller one.'
  return null
}

export function checkWorksheetTitle(title) {
  const trimmed = String(title ?? '').trim()
  if (!trimmed) return 'Give the worksheet a title.'
  if (trimmed.length > WORKSHEET_TITLE_MAX) return `Keep the title to ${WORKSHEET_TITLE_MAX} characters or fewer.`
  return null
}

// 240 KB, 1.4 MB — one decimal only where it helps.
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
}

export const FORMAT_LABEL = { pdf: 'PDF', docx: 'Word', jpeg: 'Image', png: 'Image', webp: 'Image' }

// The name a download is saved under, from the title the therapist gave it.
export function downloadName(title, format) {
  const safe = String(title ?? '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
  return `${safe || 'worksheet'}.${format || 'pdf'}`
}
