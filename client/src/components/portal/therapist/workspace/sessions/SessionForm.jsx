import { useEffect, useId, useRef, useState } from 'react'
import { Button, Input, Textarea } from '../../../../ui'
import Field from '../../../../ui/Field'
import { cx } from '../../../../../lib/cx'
import { controlBase, controlBorder, controlFocus } from '../../../../../lib/controlStyles'
import {
  previewSession,
  dateBounds,
  wallInZone,
  zoneCity,
  zoneAbbr,
  overCycleLimit,
} from '../../../../../lib/therapist/sessionTime'
import { isAllowedMeetingLink, meetingPlatform } from '../../../../../lib/therapist/meetingLink'
import { SESSIONS } from '../../../../../data/therapistPortalContent'
import { BackIcon, ReturnedIcon } from '../../TherapistPortalIcons'
import { AttentionIcon } from '../../../client/ClientPortalIcons'
import TwoClocks from './TwoClocks'

const copy = SESSIONS.form
const NOTE_MAX = 500
const BLANK = { date: '', time: '', zoomLink: '', note: '' }
const FIELDS = ['date', 'time', 'zoomLink', 'note']

// Server refusals that belong on a field rather than above the form.
const FIELD_FOR_CODE = {
  SESSION_TIME_NONEXISTENT: 'time',
  SESSION_TIME_IN_PAST: 'time',
  SESSION_TIME_TOO_FAR: 'date',
  SESSION_DATE_INVALID: 'date',
}

function WhenInput({ inputRef, label, error, ...rest }) {
  return (
    <Field label={label} error={error}>
      {({ id, describedBy, invalid }) => (
        <input
          ref={inputRef}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cx(controlBase, controlFocus, controlBorder(invalid), 'tabular-nums [color-scheme:light]')}
          {...rest}
        />
      )}
    </Field>
  )
}

/**
 * Schedule a session (§8.4), or change one. The time is typed in the therapist's
 * own zone and the preview beside it shows the client's. Moving an existing
 * session asks once, showing old and new; a link or note change just saves.
 */
export default function SessionForm({
  mode = 'create',
  initial = BLANK,
  therapistZone,
  clientZone,
  clientName,
  cycle,
  onSubmit,
  onClose,
}) {
  const editing = mode === 'edit'
  const headingId = useId()
  const dateRef = useRef(null)
  const moveRef = useRef(null)

  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(null)

  const preview = previewSession(values, therapistZone, clientZone)
  const bounds = dateBounds(therapistZone)
  const timeMoved = editing && (values.date !== initial.date || values.time !== initial.time)
  const judgeTime = !editing || timeMoved

  // Said as soon as it is true, not only on submit.
  const liveTimeError = !judgeTime
    ? null
    : preview.status === 'nonexistent'
      ? copy.errors.nonexistent
      : preview.status === 'past'
        ? copy.errors.past
        : null

  const place = [zoneCity(therapistZone), zoneAbbr(therapistZone, preview.instant ?? new Date())]
    .filter(Boolean)
    .join(', ')
  const platform = meetingPlatform(values.zoomLink.trim())

  // Past what is left this cycle: said, never blocked (9.5). The server flags it too.
  const limit = !editing && preview.status === 'ok' ? overCycleLimit(cycle, preview.instant) : null
  const overLimit = limit?.over ? SESSIONS.overLimit(clientName, cycle.remaining, limit.scheduled) : null

  useEffect(() => {
    if (editing) dateRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (confirming) moveRef.current?.focus()
  }, [confirming])

  const set = (field) => (event) => {
    const value = event.target.value
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => (e[field] ? { ...e, [field]: null } : e))
    setFormError(null)
    setDone(null)
    setConfirming(false)
  }

  const checkLink = () => {
    const link = values.zoomLink.trim()
    if (link && !isAllowedMeetingLink(link)) setErrors((e) => ({ ...e, zoomLink: copy.errors.link }))
  }

  const validate = () => {
    const next = {}
    if (!values.date) next.date = copy.errors.date
    if (!values.time) next.time = copy.errors.time
    if (judgeTime && values.date && values.time) {
      if (preview.status === 'invalid') next.date = copy.errors.dateInvalid
      if (liveTimeError) next.time = liveTimeError
    }
    if (!isAllowedMeetingLink(values.zoomLink.trim())) next.zoomLink = copy.errors.link
    if (values.note.trim().length > NOTE_MAX) next.note = copy.errors.note(NOTE_MAX)
    return next
  }

  const changes = () => {
    const out = {}
    if (timeMoved) Object.assign(out, { date: values.date, time: values.time })
    if (values.zoomLink.trim() !== initial.zoomLink) out.zoomLink = values.zoomLink.trim()
    if (values.note.trim() !== (initial.note ?? '')) out.note = values.note.trim() || null
    return out
  }

  const applyServerError = (error) => {
    const field = FIELD_FOR_CODE[error.code]
    if (field) {
      setErrors((e) => ({ ...e, [field]: error.message }))
      return
    }
    const onFields = (error.details ?? []).filter((d) => FIELDS.includes(d.path))
    if (onFields.length) {
      setErrors((e) => ({ ...e, ...Object.fromEntries(onFields.map((d) => [d.path, d.message])) }))
      return
    }
    setFormError(error.message)
  }

  const submit = async (event) => {
    event.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    if (timeMoved && !confirming) {
      setConfirming(true)
      return
    }

    const payload = editing
      ? changes()
      : {
          date: values.date,
          time: values.time,
          zoomLink: values.zoomLink.trim(),
          note: values.note.trim() || null,
        }

    if (editing && Object.keys(payload).length === 0) {
      onClose?.()
      return
    }

    setBusy(true)
    setFormError(null)
    try {
      const session = await onSubmit(payload)
      if (editing) {
        onClose?.(session)
        return
      }
      const at = wallInZone(session.scheduledAt, therapistZone)
      setValues(BLANK)
      setErrors({})
      setDone(`${at.date}, ${at.time}`)
      setBusy(false)
    } catch (error) {
      applyServerError(error)
      setConfirming(false)
      setBusy(false)
    }
  }

  const before = editing ? previewSession(initial, therapistZone, clientZone, { now: new Date(0) }) : null
  const showTheirs = Boolean(clientZone) && !preview.sameZone

  return (
    <form onSubmit={submit} noValidate aria-labelledby={headingId}>
      <h3 id={headingId} className="font-body text-ui font-medium text-ink">
        {editing ? copy.editHeading : copy.heading(clientName)}
      </h3>

      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-6">
        <div className="grid gap-4 sm:grid-cols-2 md:col-start-1">
          <WhenInput
            inputRef={dateRef}
            type="date"
            label={copy.dateLabel}
            value={values.date}
            min={bounds.min}
            max={bounds.max}
            disabled={busy}
            error={errors.date}
            onChange={set('date')}
          />
          <WhenInput
            type="time"
            label={copy.timeLabel(place)}
            value={values.time}
            disabled={busy}
            error={errors.time || liveTimeError}
            onChange={set('time')}
          />
        </div>

        <div className="md:col-start-2 md:row-span-2 md:row-start-1">
          <TwoClocks
            preview={preview}
            therapistZone={therapistZone}
            clientZone={clientZone}
            clientName={clientName}
          />
        </div>

        <div className="grid content-start gap-4 md:col-start-1">
          <Input
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            label={copy.linkLabel}
            placeholder={copy.linkPlaceholder}
            helper={platform ? `${platform} link.` : copy.linkHelper}
            value={values.zoomLink}
            disabled={busy}
            error={errors.zoomLink}
            onChange={set('zoomLink')}
            onBlur={checkLink}
          />
          <Textarea
            rows={2}
            label={copy.noteLabel(clientName)}
            placeholder={copy.notePlaceholder}
            helper={copy.noteHelper(clientName)}
            value={values.note}
            disabled={busy}
            error={errors.note}
            onChange={set('note')}
          />
        </div>
      </div>

      {overLimit && (
        <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-mist px-4 py-3 font-body text-caption leading-relaxed text-ink">
          <AttentionIcon size={18} className="mt-0.5 shrink-0 text-ink/70" />
          {overLimit}
        </p>
      )}

      {formError && (
        <p role="alert" className="mt-4 font-body text-caption text-clay">
          {formError}
        </p>
      )}

      {confirming ? (
        <div role="group" aria-labelledby={`${headingId}-move`} className="mt-6 rounded-xl bg-mist px-4 py-4">
          <p id={`${headingId}-move`} className="font-body text-ui font-medium text-ink">
            {SESSIONS.confirmMove.title}
          </p>
          <ul className="mt-2 space-y-1.5 font-body text-caption text-ink">
            <MoveLine
              who={SESSIONS.preview.you}
              from={`${before.therapist.date}, ${before.therapist.time}`}
              to={`${preview.therapist.date}, ${preview.therapist.time}`}
            />
            {showTheirs && before.client && preview.client && (
              <MoveLine
                who={clientName}
                from={`${before.client.date}, ${before.client.time}`}
                to={`${preview.client.date}, ${preview.client.time}`}
              />
            )}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button ref={moveRef} type="submit" variant="secondary" size="sm" loading={busy}>
              {SESSIONS.confirmMove.move}
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirming(false)}>
              {SESSIONS.confirmMove.back}
            </Button>
          </div>
        </div>
      ) : editing ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="submit" loading={busy}>
            {copy.save}
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => onClose?.()}>
            {copy.keep}
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Button type="submit" loading={busy}>
            {copy.submit}
          </Button>
          <p className="max-w-md font-body text-caption text-ink/70">{copy.told(clientName)}</p>
        </div>
      )}

      {done && (
        <p role="status" className="mt-4 flex items-center gap-2 font-body text-caption font-medium text-ink">
          <ReturnedIcon size={18} className="shrink-0 text-sage-deep" />
          {copy.scheduled(done)}
        </p>
      )}
    </form>
  )
}

function MoveLine({ who, from, to }) {
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <span className="min-w-14 text-ink/70">{who}</span>
      <span className="tabular-nums">{from}</span>
      <BackIcon size={16} className="rotate-180 text-ink/70" />
      <span className="sr-only">moves to</span>
      <span className="font-medium tabular-nums">{to}</span>
    </li>
  )
}
