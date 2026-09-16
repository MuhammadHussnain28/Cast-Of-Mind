import { NavLink } from 'react-router-dom'
import { cx } from '../../../lib/cx'
import { formatDate } from '../../../lib/dateFormat'
import { CLIENT_NAV } from '../../../data/clientPortalContent'
import { useUnreadFor } from '../../../lib/chat/unreadContext'
import UnreadBadge from '../UnreadBadge'
import { unreadLabel } from '../../../lib/chat/unreadStore'
import TherapistPresence from './TherapistPresence'
import { NAV_ICONS } from './navIcons'

/**
 * The client portal's rail — desktop only; the phone gets a tab bar instead.
 *
 * Dark ink for the same reason the admin rail is dark, and it is accessibility
 * rather than taste: gold is 1.63:1 on a light surface and is never permitted
 * as text or an indicator there, so ink is the only ground in a portal where
 * the accent can mark the current section (gold on ink is 11.08:1).
 * `data-surface="dark"` flips the focus ring to gold via the rule in index.css.
 *
 * The active item carries a filled ground and weight as well as the gold icon —
 * colour alone would fail WCAG 1.4.1.
 *
 * The soft sage wash is the same ambient device the questionnaire, contact,
 * join and checkout asides use, which is what makes this read as the fifth
 * surface in one family rather than a new place.
 */
export default function ClientRail({ therapist, subscription, bookingId, onNavigate, footer }) {
  // §14. A client has exactly one booking (§7), so this is the whole answer.
  const unread = useUnreadFor(bookingId)

  return (
    <div data-surface="dark" className="relative flex h-full flex-col overflow-hidden bg-ink">
      {/* Ambient only — a flat ground with light on it, never a band gradient. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-20 size-72 rounded-full bg-sage/10 blur-[130px]"
      />

      <div className="relative flex flex-col gap-5 px-5 pb-5 pt-6">
        <TherapistPresence therapist={therapist} tone="dark" />
      </div>

      <nav aria-label="Your portal" className="relative flex-1 overflow-y-auto px-3 pb-3">
        <ul className="flex flex-col gap-1">
          {CLIENT_NAV.map((item) => {
            const Icon = NAV_ICONS[item.icon]
            const count = item.unread ? unread : 0

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  // The count goes in the ACCESSIBLE NAME, never left to the
                  // pill: a numeral announced on its own means nothing.
                  aria-label={unreadLabel(item.label, count)}
                  className={({ isActive }) =>
                    cx(
                      'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5',
                      'font-body text-ui transition-colors duration-200 ease-out',
                      isActive
                        ? 'bg-paper/10 font-medium text-paper'
                        : 'font-normal text-paper/70 hover:bg-paper/5 hover:text-paper',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={isActive ? 'text-gold' : 'text-paper/70'} />
                      <span>{item.label}</span>
                      <UnreadBadge count={count} className="ml-auto" />
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* §13 wants the next payment date visible in the portal, not only in the
          account section. Quiet, because nothing about it needs acting on. */}
      {subscription?.nextBillingDate && (
        <p className="relative border-t border-paper/12 px-5 py-4 font-body text-caption text-paper/70">
          Next payment {formatDate(subscription.nextBillingDate)}
        </p>
      )}

      {footer && <div className="relative px-3 pb-4">{footer}</div>}
    </div>
  )
}
