import { useEffect, useRef, useState } from 'react'
import { Button, Spinner, Text } from '../../ui'
import { fetchApplicationDocument } from '../../../lib/api/adminApplicationsApi'
import { toApiError } from '../../../lib/api/ApiError'

/**
 * Opens one credential document.
 *
 * Loaded on request, never automatically. Two reasons: every fetch is recorded
 * in the admin action log, so an automatic load would fill the record with
 * views that never happened; and there is no reason to pull a stranger's
 * professional papers over the wire until someone actually wants to read them.
 *
 * The bytes arrive as a Blob through our own API — an authenticated Cloudinary
 * URL carries a permanent signature and must never reach the browser. The
 * object URL built from that Blob lives on this origin and is revoked when the
 * screen closes.
 */
export default function DocumentPanel({ applicationId, document: doc }) {
  const [objectUrl, setObjectUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const urlRef = useRef(null)

  // Revoked on unmount, or the blob stays in memory for the life of the tab.
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    },
    [],
  )

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const blob = await fetchApplicationDocument(applicationId, doc.field)
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setObjectUrl(url)
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setLoading(false)
    }
  }

  if (!doc.present) {
    return (
      <div className="rounded-2xl border border-ink/12 px-4 py-4">
        <Text size="ui">{doc.label}</Text>
        <Text size="caption" tone="muted" className="mt-1">
          Not included with this application.
        </Text>
      </div>
    )
  }

  const isPdf = doc.format === 'pdf'

  return (
    <div className="rounded-2xl border border-ink/12 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Text size="ui">{doc.label}</Text>
          {doc.format && (
            <Text size="caption" tone="muted" className="mt-1 uppercase">
              {doc.format}
            </Text>
          )}
        </div>

        {!objectUrl && (
          <Button size="sm" variant="secondary" onClick={load} loading={loading}>
            {loading ? 'Opening' : 'View'}
          </Button>
        )}

        {objectUrl && (
          <a
            href={objectUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center rounded-full border border-ink/50 px-5 font-body text-caption font-medium text-ink transition-colors duration-200 ease-out hover:bg-mist"
          >
            Open in a new tab
          </a>
        )}
      </div>

      {error && (
        <Text size="caption" tone="error" className="mt-3" role="alert">
          {error}
        </Text>
      )}

      {loading && !objectUrl && (
        <div className="mt-4 flex items-center gap-3">
          <Spinner size="sm" />
          <Text size="caption" tone="muted">
            Loading the document
          </Text>
        </div>
      )}

      {objectUrl &&
        (isPdf ? (
          <iframe
            src={objectUrl}
            title={doc.label}
            className="mt-4 h-[32rem] w-full rounded-xl border border-ink/12"
          />
        ) : (
          <img
            src={objectUrl}
            alt={doc.label}
            className="mt-4 w-full rounded-xl border border-ink/12"
          />
        ))}
    </div>
  )
}
