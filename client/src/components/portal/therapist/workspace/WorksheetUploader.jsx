import { useId, useRef, useState } from 'react'
import { Button, Input } from '../../../ui'
import { cx } from '../../../../lib/cx'
import {
  WORKSHEET_ACCEPT,
  checkWorksheetFile,
  checkWorksheetTitle,
  extensionOf,
  formatBytes,
} from '../../../../lib/therapist/worksheetFiles'
import { WORKSHEETS } from '../../../../data/therapistPortalContent'
import { FileIcon, UploadIcon, ReturnedIcon } from '../TherapistPortalIcons'

const copy = WORKSHEETS.upload

// Title + one file, assigned to the client on screen.
export default function WorksheetUploader({ clientName, upload, onAssign, onReset }) {
  const inputId = useId()
  const inputRef = useRef(null)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [errors, setErrors] = useState({})

  const busy = upload.status === 'uploading'

  const choose = (picked) => {
    if (!picked) return
    setFile(picked)
    setErrors((e) => ({ ...e, file: checkWorksheetFile(picked) }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const next = { title: checkWorksheetTitle(title), file: checkWorksheetFile(file) }
    setErrors(next)
    if (next.title || next.file) return
    const ok = await onAssign({ title: title.trim(), file })
    if (ok) {
      setTitle('')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (upload.status === 'done') {
    return (
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-full bg-sage/15 text-sage-deep">
            <ReturnedIcon size={22} />
          </span>
          <p role="status" className="font-body text-ui font-medium text-ink">
            {copy.done(clientName)}
          </p>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={onReset}>
            {copy.another}
          </Button>
        </div>
      </Panel>
    )
  }

  return (
    <Panel>
      <form onSubmit={submit} noValidate>
        <h3 className="font-body text-ui font-medium text-ink">{copy.heading}</h3>

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-start">
          <Input
            label={copy.titleLabel}
            value={title}
            placeholder={copy.titlePlaceholder}
            disabled={busy}
            error={errors.title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (errors.title) setErrors((x) => ({ ...x, title: checkWorksheetTitle(e.target.value) }))
            }}
          />

          <div>
            <span className="block font-body text-caption font-medium text-ink">{copy.fileLabel}</span>
            {/* The label is the drop target; the real input stays keyboard-reachable. */}
            <label
              htmlFor={inputId}
              onDragOver={(e) => {
                e.preventDefault()
                if (!busy) setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                if (!busy) choose(e.dataTransfer.files?.[0])
              }}
              className={cx(
                'mt-1.5 flex min-h-24 cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3',
                'transition-colors duration-200 ease-out has-focus-visible:ring-2 has-focus-visible:ring-ink',
                dragging ? 'border-ink bg-sage/10' : 'border-ink/50 bg-mist/60 hover:border-ink',
                errors.file && 'border-clay',
                busy && 'cursor-not-allowed opacity-70',
              )}
            >
              <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={WORKSHEET_ACCEPT}
                disabled={busy}
                className="sr-only"
                aria-describedby={`${inputId}-rules`}
                onChange={(e) => choose(e.target.files?.[0])}
              />

              <span
                aria-hidden="true"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-paper text-sage-deep shadow-[0_6px_16px_-10px_rgba(25,18,43,0.4)]"
              >
                {file ? <FileIcon size={22} /> : <UploadIcon size={22} />}
              </span>

              {file ? (
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body text-ui text-ink">{file.name}</span>
                  <span className="block font-body text-caption text-ink/70">
                    {extensionOf(file.name).toUpperCase()} · {formatBytes(file.size)} · {copy.change}
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
            {errors.file && (
              <p role="alert" className="mt-1 font-body text-caption text-clay">
                {errors.file}
              </p>
            )}
          </div>
        </div>

        {busy && (
          <div className="mt-4">
            <div
              role="progressbar"
              aria-label={copy.uploading}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={upload.progress}
              className="h-1.5 overflow-hidden rounded-full bg-ink/12"
            >
              <div
                className="h-full rounded-full bg-ink transition-[width] duration-200 ease-out"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
            <p className="mt-1.5 font-body text-caption tabular-nums text-ink/70">
              {copy.uploading} · {upload.progress}%
            </p>
          </div>
        )}

        {upload.status === 'error' && (
          <p role="alert" className="mt-4 font-body text-caption text-clay">
            {upload.error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
          <Button type="submit" loading={busy}>
            {copy.assign(clientName)}
          </Button>
          <p className="max-w-md font-body text-caption text-ink/70">{copy.note}</p>
        </div>
      </form>
    </Panel>
  )
}

function Panel({ children }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-paper px-5 py-5 shadow-[0_18px_50px_-28px_rgba(25,18,43,0.35)] sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-sage/10 blur-[130px]" />
      <div className="relative">{children}</div>
    </section>
  )
}
