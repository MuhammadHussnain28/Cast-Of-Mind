import { useRef, useState } from 'react'
import { uploadFile } from '../../lib/api/uploadApi'
import { toApiError } from '../../lib/api/ApiError'
import { Certificate, Check, Close } from './JoinIcons'
import { cx } from '../../lib/cx'

/**
 * Credential document upload — the four states §24.7 requires.
 *
 * A sibling of PhotoUpload rather than a shared component: a PDF has no
 * thumbnail, so this needs a file name, a format badge and a size, where a
 * headshot needs the round preview clients will see.
 *
 * It captures the Cloudinary `publicId` as well as the URL, because chunk 3.1
 * stores these as AUTHENTICATED assets — the plain URL returns nothing, and
 * slice 4 signs a short-lived viewing URL from the id when the admin opens the
 * application.
 */

function formatSize(bytes) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentUpload({
  id,
  label,
  kind,
  required = false,
  helper,
  value,
  publicId,
  onChange,
  error,
}) {
  const inputRef = useRef(null)
  const [state, setState] = useState(value ? 'uploaded' : 'idle')
  const [percent, setPercent] = useState(0)
  const [uploadError, setUploadError] = useState(null)
  const [meta, setMeta] = useState(null)
  // The File itself is kept on failure so Retry does not make someone find the
  // document in their file picker a second time. A flaky connection mid-form is
  // the common case, not a wrong file.
  const [lastFile, setLastFile] = useState(null)

  async function handleFile(file) {
    if (!file) return

    setUploadError(null)
    setPercent(0)
    setState('uploading')
    setLastFile(file)
    setMeta({ name: file.name, size: file.size })

    try {
      const result = await uploadFile(file, kind, setPercent)
      onChange({ url: result.url, publicId: result.publicId })
      setMeta({ name: file.name, size: result.bytes ?? file.size, format: result.format })
      setState('uploaded')
    } catch (err) {
      // The server's message is specific and actionable — it names the formats
      // that would have worked — so it is shown as written.
      setUploadError(toApiError(err).message)
      setState('error')
      onChange({ url: '', publicId: '' })
    }
  }

  function clear() {
    setMeta(null)
    setLastFile(null)
    setUploadError(null)
    setPercent(0)
    setState('idle')
    onChange({ url: '', publicId: '' })
    if (inputRef.current) inputRef.current.value = ''
  }

  const message = uploadError || error
  const describedBy = message ? `${id}-msg` : helper ? `${id}-help` : undefined

  return (
    <div className="flex flex-col gap-2" data-field={id === 'certificate-1' ? 'certificateUrl1' : undefined}>
      <span className="font-body text-caption font-medium text-ink">
        {label}
        {required ? (
          <>
            <span className="ml-1 text-clay" aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </>
        ) : (
          <span className="ml-2 font-normal text-ink/60">Optional</span>
        )}
      </span>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-describedby={describedBy}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div
        className={cx(
          'flex flex-wrap items-center gap-4 rounded-2xl border p-4 transition-colors duration-200',
          state === 'uploaded' && 'border-sage bg-sage/[0.06]',
          state === 'error' && 'border-clay bg-clay/[0.04]',
          state !== 'uploaded' && state !== 'error' && 'border-ink/25 bg-mist/40',
        )}
      >
        <span
          className={cx(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            state === 'uploaded' ? 'bg-sage text-paper' : 'bg-paper text-ink/60',
          )}
        >
          {state === 'uploaded' ? (
            <Check className="h-5 w-5" />
          ) : (
            <Certificate className="h-5 w-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          {meta ? (
            <>
              <p className="truncate font-body text-ui text-ink">{meta.name}</p>
              <p className="font-body text-caption tabular-nums text-ink/60">
                {state === 'uploading'
                  ? `Uploading… ${percent}%`
                  : [meta.format?.toUpperCase(), formatSize(meta.size)].filter(Boolean).join(' · ')}
              </p>
            </>
          ) : (
            <p className="font-body text-ui text-ink/60">No file chosen</p>
          )}

          {/* A real progress bar while it climbs, rather than a spinner that
              says nothing about how long is left. */}
          {state === 'uploading' && (
            <div aria-hidden="true" className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10">
              <span
                className="block h-full rounded-full bg-sage transition-[width] duration-200 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {state === 'error' && lastFile && (
            <button
              type="button"
              onClick={() => handleFile(lastFile)}
              className="inline-flex min-h-11 items-center rounded-xl border border-ink/50 bg-paper px-4 font-body text-ui text-ink transition-colors duration-200 hover:border-ink"
            >
              Try again
            </button>
          )}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={state === 'uploading'}
            className="inline-flex min-h-11 items-center rounded-xl border border-ink/50 bg-paper px-4 font-body text-ui text-ink transition-colors duration-200 hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === 'uploading' ? 'Uploading…' : value ? 'Replace' : 'Choose file'}
          </button>

          {value && state !== 'uploading' && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-ink/60 transition-colors duration-200 hover:text-clay"
            >
              <Close className="h-4 w-4" />
              <span className="sr-only">Remove {label}</span>
            </button>
          )}
        </div>
      </div>

      {message ? (
        <p id={`${id}-msg`} role="alert" className="font-body text-caption text-clay">
          {message}
        </p>
      ) : helper ? (
        <p id={`${id}-help`} className="font-body text-caption text-ink/70">
          {helper}
        </p>
      ) : null}

      {/* Kept for the review screen and for slice 4's signed viewing URL. */}
      {publicId && <input type="hidden" value={publicId} readOnly />}
    </div>
  )
}
