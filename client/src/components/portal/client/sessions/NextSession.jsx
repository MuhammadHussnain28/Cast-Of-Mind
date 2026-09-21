import { useId } from 'react'
import { Button } from '../../../ui'
import DateLeaf from '../../sessions/DateLeaf'
import { sessionDisplay, joinState } from '../../../../lib/client/mySessions'
import { MY_SESSIONS } from '../../../../data/clientPortalContent'
import { NoteIcon, VideoIcon } from '../../therapist/TherapistPortalIcons'
import { HoursIcon } from '../ClientPortalIcons'

// The session ahead (§7.4), in the client's own clock, with the one thing they
// can do here: join, once it is time. No countdown; the opening time is enough.
export default function NextSession({ session, therapist, timeZone, now }) {
  const headingId = useId()
  const when = sessionDisplay(session.scheduledAt, timeZone)
  const opens = session.joinOpensAt ? sessionDisplay(session.joinOpensAt, timeZone) : null
  const today = sessionDisplay(now, timeZone).dayKey
  const state = joinState(session, now)

  const therapistName = therapist
    ? [therapist.title, therapist.firstName, therapist.lastName].filter(Boolean).join(' ')
    : null

  return (
    <article
      aria-labelledby={headingId}
      className="relative overflow-hidden rounded-2xl bg-paper px-5 py-6 shadow-[0_18px_50px_-28px_rgba(25,18,43,0.35)] sm:px-7 sm:py-7"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-20 size-72 rounded-full bg-sage/10 blur-[130px]" />

      <div className="relative">
        <h2 id={headingId} className="font-body text-ui font-medium text-ink">
          {MY_SESSIONS.nextHeading}
        </h2>

        <div className="mt-4 flex items-start gap-4 sm:gap-5">
          <DateLeaf weekday={when.weekday} day={when.day} month={when.month} tone="next" />
          <div className="min-w-0">
            <p className="font-body text-subsection font-medium leading-snug text-ink-deep">{when.dateLong}</p>
            <p className="mt-0.5 font-body text-ui tabular-nums text-ink">{MY_SESSIONS.yourTime(when.time)}</p>
            {therapistName && (
              <p className="mt-3 flex items-center gap-2.5 font-body text-caption text-ink/70">
                {therapist.photoUrl && (
                  <img src={therapist.photoUrl} alt="" className="size-8 shrink-0 rounded-full object-cover ring-1 ring-sage/40" />
                )}
                {MY_SESSIONS.withTherapist(therapistName)}
              </p>
            )}
          </div>
        </div>

        {session.note && (
          <p className="mt-5 flex max-w-prose gap-2.5 rounded-xl bg-mist px-4 py-3 font-body text-caption leading-relaxed text-ink">
            <NoteIcon size={16} className="mt-0.5 shrink-0 text-ink/70" />
            <span className="min-w-0 whitespace-pre-wrap wrap-break-word">{session.note}</span>
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          {state === 'open' && (
            <>
              <Button as="a" href={session.zoomLink} target="_blank" rel="noopener noreferrer">
                <VideoIcon size={18} />
                {MY_SESSIONS.join}
              </Button>
              <span className="font-body text-caption text-ink/70">{MY_SESSIONS.joinNewTab}</span>
            </>
          )}

          {state === 'before' && opens && (
            <p className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-mist px-4 font-body text-caption text-ink">
              <HoursIcon size={18} className="shrink-0 text-sage-deep" />
              {opens.dayKey === today
                ? MY_SESSIONS.joinsFrom(opens.time)
                : MY_SESSIONS.joinsFromOn(opens.time, opens.dateShort)}
            </p>
          )}

          {state === 'fetching' && (
            <p role="status" className="inline-flex min-h-11 items-center gap-2 font-body text-caption text-ink/70">
              <HoursIcon size={18} className="shrink-0 text-sage-deep" />
              {MY_SESSIONS.gettingLink}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
