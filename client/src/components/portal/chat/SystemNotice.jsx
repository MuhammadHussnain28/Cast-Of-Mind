import { timeIn } from '../../../lib/chat/groupMessages'
import { sessionNoticeText } from '../../../lib/chat/sessionNotice'
import MessageText from './MessageText'
import { NoticeCancelledIcon, NoticeIcon } from './ChatIcons'

/**
 * A notice from the platform — NOT a bubble, on purpose.
 *
 * §14: a system message is posted automatically when a therapist schedules,
 * moves or cancels a session (9.3). Rendering it as a bubble would read as
 * though one of the two people had typed it. Centred, on a paper pill with a
 * sage ring and a drawn mark, so it is visibly the platform speaking.
 *
 * The session time arrives as data and is worded here in the reader's own zone.
 */
export default function SystemNotice({ message, timeZone }) {
  const cancelled = ['cancelled', 'not_held'].includes(message.session?.event)
  const Mark = cancelled ? NoticeCancelledIcon : NoticeIcon

  return (
    <div className="flex justify-center py-1">
      {/* A PAPER pill with a sage ring, not a sage tint on the mist ground.
          Measured: sage-deep on sage/12 over mist is 4.40:1 and FAILS the 4.5
          floor, and the time at 80% opacity was 2.98:1. On paper the same text
          is 5.48:1 and the time 6.73:1. The sage character is carried by the
          ring and the mark instead of by a tint that cost the contrast. */}
      <p className="inline-flex max-w-[90%] items-center gap-2 rounded-2xl bg-paper px-4 py-2 text-center font-body text-caption text-sage-deep ring-1 ring-sage/40">
        <Mark className="shrink-0" />
        <span className="wrap-break-word">
          {message.session ? sessionNoticeText(message, timeZone) : <MessageText text={message.text} />}
        </span>
        {/* Differentiated by hue rather than opacity — a faded version of the
            same colour is what failed above. */}
        <time dateTime={message.createdAt} className="shrink-0 tabular-nums text-ink/70">
          {timeIn(message.createdAt, timeZone)}
        </time>
      </p>
    </div>
  )
}
