import { Link } from 'react-router-dom'
import {
  MessageKindIcon,
  NewClientKindIcon,
  WorksheetKindIcon,
} from './NotificationIcons'
import { kindOf } from '../../../../data/notificationContent'
import { formatRelative } from '../../../../lib/dateFormat'
import { cx } from '../../../../lib/cx'

/**
 * One alert — master spec §8.8.
 *
 * WHO, WHAT KIND, HOW MANY, WHEN. Never a word of what was written.
 *
 * It is a real link, not a div with a click handler: it goes somewhere, so it
 * must be reachable by keyboard, openable in a new tab, and announced as a
 * link. `tone="dark"` is the panel in the ink rail; the light tone is the feed
 * page, where the same row sits on paper.
 */
function KindMark({ icon, className }) {
  if (icon === 'worksheet') return <WorksheetKindIcon className={className} />
  if (icon === 'client') return <NewClientKindIcon className={className} />
  return <MessageKindIcon className={className} />
}

export default function NotificationRow({ notification, tone = 'dark', onOpen }) {
  const kind = kindOf(notification.type)
  const dark = tone === 'dark'
  const name = notification.client?.name ?? 'A client'

  return (
    <Link
      to={`/portal/clients/${notification.bookingId}/${kind.tab}`}
      onClick={() => onOpen?.(notification)}
      className={cx(
        'group flex min-h-11 items-start gap-3 rounded-xl px-3 py-3 transition-colors duration-200 ease-out',
        dark ? 'hover:bg-paper/10' : 'hover:bg-mist',
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
          dark ? 'bg-paper/10 text-paper' : 'bg-mist text-ink',
        )}
      >
        <KindMark icon={kind.icon} className="size-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cx(
            'block truncate font-body text-ui',
            notification.read ? 'font-normal' : 'font-medium',
            dark ? 'text-paper' : 'text-ink',
          )}
        >
          {name}
        </span>
        <span className={cx('mt-0.5 block font-body text-caption', dark ? 'text-paper/70' : 'text-ink/70')}>
          {kind.line(notification.count)} · {formatRelative(notification.lastAt)}
        </span>
      </span>

      {/* Unread is marked by a dot AND by the weight of the name above, so it
          never rests on colour alone (WCAG 1.4.1). Gold carries on ink at
          11.08:1; on paper it would be 1.63:1, so the light tone uses ink. */}
      {!notification.read && (
        <>
          <span
            aria-hidden="true"
            className={cx('mt-2 size-2 shrink-0 rounded-full', dark ? 'bg-gold' : 'bg-ink')}
          />
          <span className="sr-only">Unread</span>
        </>
      )}
    </Link>
  )
}
