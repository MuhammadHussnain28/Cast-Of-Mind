import { cx } from '../../../lib/cx'
import { timeIn } from '../../../lib/chat/groupMessages'
import { MESSAGE_STATUS } from '../../../lib/chat/messageStore'
import { chat } from '../../../data/chatContent'
import MessageText from './MessageText'
import { OpenQuoteIcon, UnsentIcon } from './ChatIcons'

/**
 * One run of messages from one person.
 *
 * CLUSTERED, NOT STACKED. Five separate bubbles each carrying their own
 * timestamp is what turns a conversation into a spreadsheet. A run shares one
 * timestamp and one tail, which is also how the eye reads it.
 *
 * The tail is a single tightened corner on the last bubble rather than a drawn
 * arrow — the shape tells you who spoke without an applied decoration.
 *
 * Elevation is declared once: each bubble has a ground and neither a border nor
 * a shadow. A tinted rectangle with a hairline under a shadow is the ghost card.
 */
export default function MessageCluster({
  cluster,
  timeZone,
  onRetry,
  density = 'comfortable',
  openingLabel = null,
}) {
  const { mine, messages, opening } = cluster
  const compact = density === 'compact'
  const last = messages[messages.length - 1]

  return (
    <div
      className={cx(
        'flex flex-col',
        compact ? 'gap-0.5' : 'gap-1',
        mine ? 'items-end' : 'items-start',
      )}
    >
      {/* THE OPENING MESSAGE, NAMED (8.3). §7.1 makes it the context a
          therapist never starts without, so it is labelled where it sits in
          the thread rather than left to be recognised. A caption above the
          bubble, never a coloured bar beside it. */}
      {opening && openingLabel && (
        <p className="flex items-center gap-1.5 px-1 pb-0.5 font-body text-caption font-medium text-sage-deep">
          <OpenQuoteIcon size={16} />
          {openingLabel}
        </p>
      )}

      {messages.map((message, index) => {
        const isLast = index === messages.length - 1
        const sending = message.status === MESSAGE_STATUS.SENDING

        return (
          <div
            key={message.id ?? message.clientMessageId}
            className={cx(
              compact
                ? 'max-w-[88%] px-3.5 py-2 sm:max-w-[70%]'
                : 'max-w-[85%] px-4 py-2.5 sm:max-w-[75%]',
              'font-body text-ui leading-relaxed',
              // Long words and pasted URLs must wrap rather than force the
              // whole thread to scroll sideways.
              'whitespace-pre-wrap wrap-break-word',
              mine ? 'bg-ink text-paper' : 'bg-paper text-ink-deep',
              // 16px radius, with the corner nearest the speaker tightened on
              // the final bubble of the run.
              'rounded-2xl',
              isLast && (mine ? 'rounded-br-md' : 'rounded-bl-md'),
              sending && 'opacity-70',
              // A ring, not a shadow and not a tint change: the bubble keeps its
              // own ground, so the message reads exactly as written, and the
              // edge alone says this one is different.
              opening && 'ring-1 ring-sage/60',
            )}
          >
            <MessageText text={message.text} />
          </div>
        )
      })}

      {/* One timestamp for the run, not one per message. */}
      <div className={cx('flex items-center gap-2 px-1', mine ? 'flex-row-reverse' : 'flex-row')}>
        <time
          dateTime={last.createdAt}
          className="font-body text-caption tabular-nums text-ink/70"
        >
          {last.status === MESSAGE_STATUS.SENDING
            ? chat.sending
            : timeIn(last.createdAt, timeZone)}
        </time>
      </div>

      {/* A failure sits BELOW the bubble on the page ground, never inside it:
          clay on ink would not clear contrast, and the message itself is not
          the thing that went wrong. The text stays exactly where it was. */}
      {messages
        .filter((m) => m.status === MESSAGE_STATUS.FAILED)
        .map((m) => (
          <p
            key={`failed-${m.clientMessageId}`}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 font-body text-caption text-clay"
            role="status"
          >
            <UnsentIcon />
            {/* The server's own reason when it gave one — "too many messages",
                "too long" — because "Not sent" alone leaves someone guessing at
                what to change. */}
            <span>{m.error || chat.failed}</span>
            <button
              type="button"
              onClick={() => onRetry?.(m.clientMessageId)}
              className="min-h-11 rounded-lg px-2 font-medium text-clay underline decoration-clay/40 underline-offset-4 transition-colors duration-200 hover:decoration-clay"
            >
              {chat.retry}
            </button>
          </p>
        ))}
    </div>
  )
}
