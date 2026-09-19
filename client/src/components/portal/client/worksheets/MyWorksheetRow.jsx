import { useState } from 'react'
import { Button } from '../../../ui'
import { cx } from '../../../../lib/cx'
import { formatDate } from '../../../../lib/dateFormat'
import { FORMAT_LABEL, formatBytes } from '../../../../lib/therapist/worksheetFiles'
import { MY_WORKSHEETS } from '../../../../data/clientPortalContent'
import { DownloadIcon, FileIcon, ReturnedIcon, WaitingIcon } from '../../therapist/TherapistPortalIcons'
import ReturnDrop from './ReturnDrop'

const copy = MY_WORKSHEETS.row

// One worksheet. To complete: download it, send it back. Submitted: replace until reviewed.
export default function MyWorksheetRow({ worksheet, onDownload, onSubmit, onSent }) {
  const [returning, setReturning] = useState(false)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const submitted = worksheet.status === 'completed'
  const reviewed = Boolean(worksheet.reviewedAt)
  const shown = submitted ? worksheet.completedFile : worksheet.assignedFile

  const get = async (which) => {
    setBusy(which)
    setError(null)
    try {
      await onDownload(worksheet, which)
    } catch {
      setError(copy.downloadFailed)
    } finally {
      setBusy(null)
    }
  }

  const send = async (file, options) => {
    await onSubmit(worksheet.id, file, options)
    setReturning(false)
    onSent?.()
  }

  const meta = [
    submitted ? copy.sent(formatDate(worksheet.completedAt)) : copy.assigned(formatDate(worksheet.assignedAt)),
    FORMAT_LABEL[shown?.format],
    shown?.bytes != null ? formatBytes(shown.bytes) : null,
  ].filter(Boolean)

  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span
          aria-hidden="true"
          className={cx(
            'relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl',
            submitted ? 'bg-sage/15 text-sage-deep' : 'bg-mist text-ink/70',
          )}
        >
          <FileIcon size={22} />
          <span className="absolute -bottom-1 -right-1 rounded-full bg-paper">
            {submitted ? (
              <ReturnedIcon size={16} className="text-sage-deep" />
            ) : (
              <WaitingIcon size={16} className="text-ink/70" />
            )}
          </span>
        </span>

        <div className="min-w-0 flex-1 basis-48">
          <p className="truncate font-body text-ui font-medium text-ink">{worksheet.title}</p>
          <p className="font-body text-caption text-ink/70">{meta.join(' · ')}</p>
        </div>

        {!returning && (
          <div className="flex flex-wrap items-center gap-2">
            {!submitted && (
              <>
                <Button size="sm" loading={busy === 'assigned'} onClick={() => get('assigned')}>
                  <DownloadIcon size={18} />
                  {copy.download}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setReturning(true)}>
                  {copy.sendBack}
                </Button>
              </>
            )}

            {submitted && reviewed && (
              <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-sage/15 px-3 font-body text-caption font-medium text-sage-deep">
                <ReturnedIcon size={16} />
                {copy.withTherapist}
              </span>
            )}

            {submitted && (
              <Button variant="ghost" size="sm" loading={busy === 'completed'} onClick={() => get('completed')}>
                {copy.yourFile}
              </Button>
            )}

            {submitted && !reviewed && (
              <Button variant="ghost" size="sm" onClick={() => setReturning(true)}>
                {copy.replace}
              </Button>
            )}
          </div>
        )}
      </div>

      {submitted && !reviewed && !returning && (
        <p className="mt-2 font-body text-caption text-ink/70 sm:pl-15">{copy.canReplace}</p>
      )}

      {returning && <ReturnDrop title={worksheet.title} onSend={send} onCancel={() => setReturning(false)} />}

      {error && (
        <p role="alert" className="mt-2 font-body text-caption text-clay">
          {error}
        </p>
      )}
    </div>
  )
}
