import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../../../ui'
import { cx } from '../../../../lib/cx'
import {
  WORKSHEET_RETURN_ACCEPT,
  checkWorksheetFile,
  extensionOf,
  formatBytes,
} from '../../../../lib/therapist/worksheetFiles'
import { MY_WORKSHEETS } from '../../../../data/clientPortalContent'
import { FileIcon, UploadIcon } from '../../therapist/TherapistPortalIcons'

const copy = MY_WORKSHEETS.drop

// Choose a file, send it. Idle → chosen → sending (%) → sent, or an error that keeps the file.
export default function ReturnDrop({ title, onSend, onCancel }) {
  const inputId = useId()
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(null)
  const abort = useRef(null)

  // Leaving mid-upload cancels it rather than letting it land unseen.
  useEffect(() => () => abort.current?.abort(), [])

  const sending = progress !== null

  const choose = (picked) => {
    if (!picked) return
    setFile(picked)
    setError(checkWorksheetFile(picked, { allowImages: true }))
  }

  const send = async () => {
    const problem = checkWorksheetFile(file, { allowImages: true })
    if (problem) return setError(problem)
    const controller = new AbortController()
    abort.current = controller
    setError(null)
    setProgress(0)
    try {
      await onSend(file, { onProgress: setProgress, signal: controller.signal })
    } catch (err) {
      if (controller.signal.aborted) return
      setError(err.message)
      setProgress(null)
    }
  }

  return (
    <div className="mt-3 rounded-xl bg-mist px-4 py-4">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault()
          if (!sending) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!sending) choose(e.dataTransfer.files?.[0])
        }}
        className={cx(
          'flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-paper px-4 py-3',
          'transition-colors duration-200 ease-out has-focus-visible:ring-2 has-focus-visible:ring-ink',
          dragging ? 'border-ink bg-sage/10' : 'border-ink/50 hover:border-ink',
          error && 'border-clay',
          sending && 'cursor-not-allowed opacity-70',
        )}
      >
        <input
          id={inputId}
          type="file"
          accept={WORKSHEET_RETURN_ACCEPT}
          disabled={sending}
          className="sr-only"
          aria-label={`${copy.choose}: ${title}`}
          aria-describedby={`${inputId}-rules`}
          onChange={(e) => choose(e.target.files?.[0])}
        />
        <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-sage/15 text-sage-deep">
          {file ? <FileIcon size={22} /> : <UploadIcon size={22} />}
        </span>
        {file ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate font-body text-ui text-ink">{file.name}</span>
            <span className="block font-body text-caption text-ink/70">
              {extensionOf(file.name).toUpperCase()} · {formatBytes(file.size)}
            </span>
          </span>
        ) : (
          <span className="min-w-0 flex-1">
            <span className="block font-body text-ui font-medium text-ink">{copy.choose}</span>
            <span className="block font-body text-caption text-ink/70">{copy.drop}</span>
          </span>
        )}
      </label>
      <p id={`${inputId}-rules`} className="mt-1.5 font-body text-caption text-ink/70">
        {copy.rules}
      </p>

      {sending && (
        <div className="mt-3">
          <div
            role="progressbar"
            aria-label={copy.sending}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-1.5 overflow-hidden rounded-full bg-ink/12"
          >
            <div className="h-full rounded-full bg-ink transition-[width] duration-200 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 font-body text-caption tabular-nums text-ink/70">
            {copy.sending} · {progress}%
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 font-body text-caption text-clay">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" loading={sending} disabled={!file || Boolean(error)} onClick={send}>
          {copy.send}
        </Button>
        <Button variant="ghost" size="sm" disabled={sending} onClick={onCancel}>
          {MY_WORKSHEETS.row.cancel}
        </Button>
      </div>
    </div>
  )
}
