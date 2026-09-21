import DateLeaf from '../../sessions/DateLeaf'
import { sessionDisplay } from '../../../../lib/client/mySessions'
import { MY_SESSIONS } from '../../../../data/clientPortalContent'
import { CancelledIcon, NoteIcon, ReturnedIcon } from '../../therapist/TherapistPortalIcons'
import { HoursIcon } from '../ClientPortalIcons'

const MARKS = {
  completed: { Icon: ReturnedIcon, tone: 'text-sage-deep', label: MY_SESSIONS.status.completed },
  cancelled: { Icon: CancelledIcon, tone: 'text-ink/70', label: MY_SESSIONS.status.cancelled },
  scheduled: { Icon: HoursIcon, tone: 'text-ink/70', label: MY_SESSIONS.status.past },
  notHeld: { Icon: CancelledIcon, tone: 'text-ink/70', label: MY_SESSIONS.status.notHeld },
}

// A later or earlier session. Read only, and never a link.
export default function MySessionRow({ session, tone, timeZone }) {
  const when = sessionDisplay(session.scheduledAt, timeZone)
  const mark = tone !== 'history' ? null : session.notHeldAt ? MARKS.notHeld : MARKS[session.status]

  return (
    <div className="flex items-start gap-4 px-4 py-4 sm:px-5">
      <DateLeaf weekday={when.weekday} day={when.day} month={when.month} tone={tone} />
      <div className="min-w-0 flex-1">
        <p className="font-body text-ui font-medium text-ink">{when.dateLong}</p>
        <p className="font-body text-caption tabular-nums text-ink/70">{MY_SESSIONS.yourTime(when.time)}</p>
        {mark && (
          <p className={`mt-1.5 inline-flex items-center gap-1.5 font-body text-caption ${mark.tone}`}>
            <mark.Icon size={16} />
            {mark.label}
          </p>
        )}
        {session.note && tone !== 'history' && (
          <p className="mt-2 flex max-w-prose gap-2 font-body text-caption leading-relaxed text-ink">
            <NoteIcon size={16} className="mt-0.5 shrink-0 text-ink/70" />
            <span className="min-w-0 whitespace-pre-wrap wrap-break-word">{session.note}</span>
          </p>
        )}
      </div>
    </div>
  )
}
