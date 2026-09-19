import { useState } from 'react'
import { Button } from '../../../ui'
import { cx } from '../../../../lib/cx'
import { formatDate } from '../../../../lib/dateFormat'
import { FORMAT_LABEL, formatBytes } from '../../../../lib/therapist/worksheetFiles'
import { WORKSHEETS } from '../../../../data/therapistPortalContent'
import { FileIcon, ReturnedIcon, WaitingIcon } from '../TherapistPortalIcons'

const copy = WORKSHEETS.row

// One worksheet. Returned ones lead with the client's answers.
export default function WorksheetRow({ worksheet, onDownload, onWithdraw, onReview }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const returned = worksheet.status === 'completed'
  const file = worksheet.assignedFile

  const run = async (key, action) => {
    setBusy(key)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(key === 'withdraw' || key === 'review' ? err.message : copy.downloadFailed)
    } finally {
      setBusy(null)
    }
  }

  const meta = [
    FORMAT_LABEL[file?.format] ?? 'File',
    file?.bytes != null ? formatBytes(file.bytes) : null,
    returned ? copy.returned(formatDate(worksheet.completedAt)) : copy.assigned(formatDate(worksheet.assignedAt)),
    worksheet.reviewedAt ? copy.reviewed(formatDate(worksheet.reviewedAt)) : null,
  ].filter(Boolean)

  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span
          aria-hidden="true"
          className={cx(
            'relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl',
            returned ? 'bg-sage/15 text-sage-deep' : 'bg-mist text-ink/70',
          )}
        >
          <FileIcon size={22} />
          {/* The state, drawn — never colour alone. */}
          <span className="absolute -bottom-1 -right-1 rounded-full bg-paper">
            {returned ? (
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

        {!confirming && (
          <div className="flex flex-wrap items-center gap-2">
            {returned ? (
              <>
                <Button size="sm" loading={busy === 'completed'} onClick={() => run('completed', () => onDownload(worksheet, 'completed'))}>
                  {copy.downloadAnswers}
                </Button>
                {!worksheet.reviewedAt && (
                  <Button variant="secondary" size="sm" loading={busy === 'review'} onClick={() => run('review', () => onReview(worksheet.id))}>
                    {copy.markReviewed}
                  </Button>
                )}
                <Button variant="ghost" size="sm" loading={busy === 'assigned'} onClick={() => run('assigned', () => onDownload(worksheet, 'assigned'))}>
                  {copy.yourCopy}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" loading={busy === 'assigned'} onClick={() => run('assigned', () => onDownload(worksheet, 'assigned'))}>
                  {copy.download}
                </Button>
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="min-h-11 rounded-lg px-3 font-body text-caption font-medium text-clay underline decoration-clay/40 underline-offset-4 transition-colors duration-200 hover:decoration-clay"
                >
                  {copy.withdraw}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {returned && !worksheet.reviewedAt && (
        <p className="mt-2 font-body text-caption text-ink/70 sm:pl-15">{copy.reviewHint}</p>
      )}

      {/* Asked in place, not in a modal: the question is about this row. */}
      {confirming && (
        <div role="group" aria-label={copy.withdraw} className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-mist px-4 py-3">
          <p className="min-w-0 flex-1 basis-56 font-body text-caption text-ink">{copy.confirm(worksheet.title)}</p>
          <div className="flex gap-2">
            <Button variant="danger" size="sm" loading={busy === 'withdraw'} onClick={() => run('withdraw', () => onWithdraw(worksheet.id))}>
              {copy.confirmYes}
            </Button>
            <Button variant="ghost" size="sm" disabled={busy === 'withdraw'} onClick={() => setConfirming(false)}>
              {copy.confirmNo}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 font-body text-caption text-clay">
          {error}
        </p>
      )}
    </div>
  )
}
