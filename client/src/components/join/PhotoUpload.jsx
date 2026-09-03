import { useRef, useState, useEffect } from 'react'
import { uploadFile } from '../../lib/api/uploadApi'
import { toApiError } from '../../lib/api/ApiError'
import { Camera, Check, Close } from './JoinIcons'
import { cx } from '../../lib/cx'

/**
 * Profile photo upload — the four states §24.7 requires: idle, uploading,
 * uploaded, error.
 *
 * The preview is circular because that is how clients see it on the matching
 * page. Showing the real crop is more useful than describing it.
 */
export default function PhotoUpload({ value, onChange, error, id = 'photo-upload' }) {
  const inputRef = useRef(null)
  const [state, setState] = useState(value ? 'uploaded' : 'idle')
  const [percent, setPercent] = useState(0)
  const [uploadError, setUploadError] = useState(null)
  const [localPreview, setLocalPreview] = useState(null)
  // Kept so a failed upload can be retried without re-picking the file.
  const [lastFile, setLastFile] = useState(null)

  // Revoke the object URL when it changes or the component goes away, or the
  // browser holds the file in memory for the life of the tab.
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  async function handleFile(file) {
    if (!file) return

    setUploadError(null)
    setPercent(0)
    setState('uploading')
    setLastFile(file)

    const preview = URL.createObjectURL(file)
    setLocalPreview((old) => {
      if (old) URL.revokeObjectURL(old)
      return preview
    })

    try {
      const result = await uploadFile(file, 'photo', setPercent)
      onChange(result.url)
      setState('uploaded')
    } catch (err) {
      // The server's message is specific and actionable ("that file type is not
      // accepted... please upload one of: JPEG, PNG, WebP"), so it is shown as
      // written rather than replaced with something vaguer.
      setUploadError(toApiError(err).message)
      setState('error')
      onChange('')
    }
  }

  function clear() {
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(null)
    setUploadError(null)
    setPercent(0)
    setState('idle')
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const shown = localPreview || value
  const message = uploadError || error

  return (
    <div className="flex flex-col gap-2" data-field="photoUrl">
      <span id={`${id}-label`} className="font-body text-caption font-medium text-ink">
        Profile photo
        <span className="ml-1 text-clay" aria-hidden="true">*</span>
        <span className="sr-only"> (required)</span>
      </span>

      <div className="flex items-center gap-5">
        {/* The frame clients will actually see. */}
        <div
          className={cx(
            'relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border transition-colors duration-200',
            state === 'uploaded' && 'border-sage',
            state === 'error' && 'border-clay',
            state !== 'uploaded' && state !== 'error' && 'border-ink/25 bg-mist',
          )}
        >
          {shown ? (
            <img
              src={shown}
              alt=""
              className={cx(
                'h-full w-full object-cover transition-opacity duration-200',
                state === 'uploading' && 'opacity-40',
              )}
            />
          ) : (
            <Camera className="h-7 w-7 text-ink/60" />
          )}

          {state === 'uploading' && (
            <span className="absolute inset-0 flex items-center justify-center bg-paper/70 font-body text-caption font-medium text-ink tabular-nums">
              {percent}%
            </span>
          )}

          {state === 'uploaded' && (
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-paper bg-sage text-paper">
              <Check className="h-3.5 w-3.5" />
            </span>
          )}
        </div>

        <div className="min-w-0">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-describedby={message ? `${id}-msg` : `${id}-help`}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={state === 'uploading'}
              className="inline-flex min-h-11 items-center rounded-xl border border-ink/50 px-4 font-body text-ui text-ink transition-colors duration-200 hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state === 'uploading'
                ? 'Uploading…'
                : shown
                  ? 'Choose a different photo'
                  : 'Choose a photo'}
            </button>

            {state === 'error' && lastFile && (
              <button
                type="button"
                onClick={() => handleFile(lastFile)}
                className="inline-flex min-h-11 items-center rounded-xl border border-ink/50 px-4 font-body text-ui text-ink transition-colors duration-200 hover:border-ink"
              >
                Try again
              </button>
            )}

            {shown && state !== 'uploading' && (
              <button
                type="button"
                onClick={clear}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-2 text-ink/60 transition-colors duration-200 hover:text-clay"
              >
                <Close className="h-4 w-4" />
                <span className="sr-only">Remove photo</span>
              </button>
            )}
          </div>

          {message ? (
            <p id={`${id}-msg`} role="alert" className="mt-2 font-body text-caption text-clay">
              {message}
            </p>
          ) : (
            <p id={`${id}-help`} className="mt-2 font-body text-caption text-ink/70">
              A clear headshot. JPEG, PNG or WebP, up to 5&nbsp;MB.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
