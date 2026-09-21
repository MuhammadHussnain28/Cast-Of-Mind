import { useState } from 'react'
import { Button } from '../../../../ui'
import { cx } from '../../../../../lib/cx'
import { wallInZone, zoneCity, toFormValues } from '../../../../../lib/therapist/sessionTime'
import { meetingPlatform } from '../../../../../lib/therapist/meetingLink'
import { SESSIONS } from '../../../../../data/therapistPortalContent'
import { CancelledIcon, MoonIcon, NoteIcon, ReturnedIcon, VideoIcon } from '../../TherapistPortalIcons'
import { HoursIcon, PencilIcon } from '../../../client/ClientPortalIcons'
import SessionForm from './SessionForm'
import DateLeaf from '../../../sessions/DateLeaf'

function StatusMark({ session, zone }) {
  const cancelledOn = session.cancelledAt ? wallInZone(session.cancelledAt, zone).date : null
  if (session.notHeldAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-ink/70">
        <CancelledIcon size={16} />
        {SESSIONS.status.notHeld}
      </span>
    )
  }
  if (session.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sage-deep">
        <ReturnedIcon size={16} />
        {SESSIONS.status.completed}
      </span>
    )
  }
  if (session.status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 text-ink/70">
        <CancelledIcon size={16} />
        {SESSIONS.status.cancelled(cancelledOn)}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-ink/70">
      <HoursIcon size={16} />
      {SESSIONS.status.past}
    </span>
  )
}

/**
 * One session. `tone` is next, upcoming or history. Only a scheduled session
 * can be edited or cancelled; history is read-only.
 */
export default function SessionItem({
  session,
  tone,
  therapistZone,
  clientZone,
  clientName,
  canEdit,
  now = new Date(),
  onUpdate,
  onCancel,
  onHeld,
  onNotHeld,
}) {
  const [mode, setMode] = useState('view')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const mine = wallInZone(session.scheduledAt, therapistZone)
  const monthShort = new Intl.DateTimeFormat(undefined, { timeZone: therapistZone, month: 'short' }).format(
    new Date(session.scheduledAt),
  )
  let theirs = null
  if (clientZone && clientZone !== therapistZone) {
    try {
      theirs = wallInZone(session.scheduledAt, clientZone)
    } catch {
      theirs = null
    }
  }
  const dayShift = theirs && theirs.dayKey !== mine.dayKey
  const live = session.status === 'scheduled' && tone !== 'history'
  const platform = meetingPlatform(session.zoomLink ?? '')
  // 9.5: a started session can be completed now; a completed one can be corrected.
  const started = live && now.getTime() >= new Date(session.scheduledAt).getTime()
  const correctable = tone === 'history' && session.status === 'completed' && Boolean(onNotHeld)

  const run = async (action) => {
    setBusy(true)
    setError(null)
    try {
      await action(session.id)
      // A corrected row stays on screen, so it leaves the confirm state too.
      setMode('view')
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }
  const cancel = () => run(onCancel)

  if (mode === 'edit') {
    return (
      <div className="px-4 py-5 sm:px-5">
        <SessionForm
          mode="edit"
          initial={{
            ...toFormValues(session.scheduledAt, therapistZone),
            zoomLink: session.zoomLink ?? '',
            note: session.note ?? '',
          }}
          therapistZone={therapistZone}
          clientZone={clientZone}
          clientName={clientName}
          onSubmit={(changes) => onUpdate(session.id, changes)}
          onClose={() => setMode('view')}
        />
      </div>
    )
  }

  return (
    <div className={cx('px-4 sm:px-5', tone === 'next' ? 'py-5 sm:py-6' : 'py-4')}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <DateLeaf weekday={mine.weekday} day={mine.day} month={monthShort} tone={tone} />

        <div className="min-w-0 flex-1 basis-52">
          <p className={cx('flex flex-wrap items-center gap-x-2 font-body font-medium text-ink', tone === 'next' ? 'text-subsection leading-snug' : 'text-ui')}>
            <span>
              {mine.weekdayLong}, <span className="tabular-nums">{SESSIONS.yourTime(mine.time)}</span>
            </span>
            {tone === 'next' && (
              <span className="rounded-full bg-ink px-2.5 py-0.5 font-body text-caption font-medium text-paper">
                {SESSIONS.next}
              </span>
            )}
          </p>

          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-body text-caption text-ink/70">
            {theirs ? (
              <>
                {theirs.night && <MoonIcon size={14} className="text-ink/70" />}
                <span className="tabular-nums">
                  {SESSIONS.theirTime(theirs.time, clientName, zoneCity(clientZone))}
                  {dayShift ? `, ${theirs.date}` : ''}
                </span>
              </>
            ) : clientZone ? (
              <span>{SESSIONS.sameTime(clientName)}</span>
            ) : (
              <span>{SESSIONS.theirTimeUnknown(clientName)}</span>
            )}
          </p>

          {live && session.zoomLink && (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 font-body text-caption text-ink">
              <VideoIcon size={16} className="text-sage-deep" />
              <span>{platform ?? SESSIONS.form.linkLabel}</span>
              <span aria-hidden="true" className="text-ink/50">·</span>
              <a
                href={session.zoomLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center font-medium underline decoration-ink/50 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
              >
                {SESSIONS.openLink}
              </a>
            </p>
          )}

          {session.note && (
            <p className="mt-2 flex max-w-prose gap-2 font-body text-caption leading-relaxed text-ink">
              <NoteIcon size={16} className="mt-0.5 shrink-0 text-ink/70" />
              <span className="min-w-0 whitespace-pre-wrap wrap-break-word">{session.note}</span>
            </p>
          )}

          {tone === 'history' && (
            <p className="mt-2 font-body text-caption">
              <StatusMark session={session} zone={therapistZone} />
            </p>
          )}
        </div>

        {correctable && mode === 'view' && (
          <button
            type="button"
            onClick={() => setMode('confirmNotHeld')}
            className="min-h-11 rounded-lg px-3 font-body text-caption font-medium text-ink underline decoration-ink/50 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
          >
            {SESSIONS.notHeld}
          </button>
        )}

        {live && mode === 'view' && (
          <div className="flex flex-wrap items-center gap-1">
            {started && onHeld && (
              <Button variant="secondary" size="sm" loading={busy} onClick={() => run(onHeld)}>
                <ReturnedIcon size={16} />
                {SESSIONS.held}
              </Button>
            )}
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => setMode('edit')}>
                <PencilIcon size={16} className="mr-1.5" />
                {SESSIONS.edit}
              </Button>
            )}
            <button
              type="button"
              onClick={() => setMode('confirmCancel')}
              className="min-h-11 rounded-lg px-3 font-body text-caption font-medium text-clay underline decoration-clay/40 underline-offset-4 transition-colors duration-200 hover:decoration-clay"
            >
              {SESSIONS.cancel}
            </button>
          </div>
        )}
      </div>

      {/* Asked in place, not in a modal: the question is about this session. */}
      {mode === 'confirmCancel' && (
        <div role="group" aria-label={SESSIONS.cancelYes} className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-mist px-4 py-3">
          <p className="min-w-0 flex-1 basis-56 font-body text-caption text-ink">
            {SESSIONS.cancelConfirm(mine.weekdayLong, clientName)}
          </p>
          <div className="flex gap-2">
            <Button variant="danger" size="sm" loading={busy} onClick={cancel}>
              {SESSIONS.cancelYes}
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setMode('view')}>
              {SESSIONS.cancelNo}
            </Button>
          </div>
        </div>
      )}

      {mode === 'confirmNotHeld' && (
        <div role="group" aria-label={SESSIONS.notHeldYes} className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-mist px-4 py-3">
          <p className="min-w-0 flex-1 basis-56 font-body text-caption text-ink">
            {SESSIONS.notHeldConfirm(mine.weekdayLong, clientName)}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" loading={busy} onClick={() => run(onNotHeld)}>
              {SESSIONS.notHeldYes}
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setMode('view')}>
              {SESSIONS.notHeldNo}
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
