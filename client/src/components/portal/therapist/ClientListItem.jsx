import { NavLink } from 'react-router-dom'
import { cx } from '../../../lib/cx'
import { formatRelative } from '../../../lib/dateFormat'
import { useUnread } from '../../../lib/chat/unreadContext'
import { countFor, unreadLabel } from '../../../lib/chat/unreadStore'
import UnreadBadge from '../UnreadBadge'
import ClientMonogram from './ClientMonogram'
import { ACTIVITY_PREFIX, DEFAULT_WORKSPACE_TAB } from '../../../data/therapistPortalContent'

/**
 * One client in the therapist's list — master spec §8.1.
 *
 * Three things and no more: who, when something last happened, how many
 * messages are waiting. §8.1 asks for exactly those.
 *
 * THERE IS NO MESSAGE PREVIEW HERE, AND THAT IS THE POINT. Every mail client
 * puts a snippet under the name, and on this platform that snippet is what
 * somebody wrote to their therapist about their own mind — sitting permanently
 * in a sidebar, readable over a shoulder, in a screen share, in a screenshot of
 * something else. §8.1 asks for "last activity", which is a time. The server
 * does not send the text either, so this is a boundary rather than a choice
 * made in the markup.
 *
 * THE UNREAD COUNT IS NOT FETCHED HERE. It comes from `UnreadProvider`, which
 * 7.6 built role-agnostic for exactly this, so the badge rises live the moment
 * a client writes — without this row knowing anything about sockets. The
 * server's list also carries a count, used only until the provider's first
 * read lands.
 */
export default function ClientListItem({ client, tab = DEFAULT_WORKSPACE_TAB }) {
  const { unread, ready } = useUnread()

  /**
   * THE PROVIDER IS THE TRUTH ONCE IT HAS ANSWERED — INCLUDING WHEN IT SAYS ZERO.
   *
   * This was `live || client.unreadCount` in 8.1, and that was a bug: when the
   * therapist read the conversation the live count fell to 0, and `0 || 3` is
   * 3, so the badge stayed stuck on the list's stale number until something
   * else refetched it. The list's own count is only a stand-in for the moment
   * before the provider's first read lands.
   */
  const count = ready ? countFor(unread, client.bookingId) : client.unreadCount || 0

  const when = formatRelative(client.lastActivityAt)
  const prefix = ACTIVITY_PREFIX[client.lastActivityKind]

  // "Matched 3 days ago" rather than "3 days ago", so a client who has never
  // written does not look like one who wrote three days ago.
  const activity = prefix ? `${prefix} ${when}` : when

  return (
    <li>
      <NavLink
        to={`/portal/clients/${client.bookingId}/${tab}`}
        aria-label={unreadLabel(`${client.name}. ${activity}`, count)}
        className={({ isActive }) =>
          cx(
            'relative flex min-h-16 items-center gap-3 rounded-xl py-2.5 pl-3 pr-3',
            'transition-colors duration-200 ease-out',
            isActive ? 'bg-paper/10' : 'hover:bg-paper/5',
          )
        }
      >
        {({ isActive }) => (
          <>
            {/* The selected marker, drawn once as a hairline at the leading
                edge. Kept to 1px deliberately: a thicker coloured left border
                is the card-callout cliché, and the ground, the weight and the
                monogram ring are already carrying the state three other ways
                so it never rests on colour alone (WCAG 1.4.1). */}
            <span
              aria-hidden="true"
              className={cx(
                'absolute inset-y-3 left-0 w-px rounded-full transition-colors duration-200',
                isActive ? 'bg-gold' : 'bg-transparent',
              )}
            />

            <ClientMonogram name={client.name} selected={isActive} />

            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                className={cx(
                  'truncate font-body text-ui',
                  isActive ? 'font-medium text-paper' : 'font-normal text-paper/90',
                )}
              >
                {client.name}
              </span>
              <span className="truncate font-body text-caption text-paper/70">{activity}</span>
            </span>

            <UnreadBadge count={count} className="ml-auto shrink-0" />
          </>
        )}
      </NavLink>
    </li>
  )
}
