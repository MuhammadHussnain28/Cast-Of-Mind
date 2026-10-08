import { NavLink } from 'react-router-dom'
import { cx } from '../../../../lib/cx'
import { useUnreadFor } from '../../../../lib/chat/unreadContext'
import { unreadLabel } from '../../../../lib/chat/unreadStore'
import UnreadBadge from '../../UnreadBadge'
import { WORKSPACE_TABS } from '../../../../data/therapistPortalContent'
import { WORKSPACE_TAB_ICONS } from '../workspaceIcons'

/**
 * Mobile bottom tab bar for therapist client workspace (< 1024px).
 *
 * Provides thumb-reachable 1-tap navigation between workspace tabs
 * while liberating 85%+ of viewport height for active chat & workspace content.
 */
export default function TherapistTabBar({ bookingId }) {
  const unread = useUnreadFor(bookingId)

  return (
    <nav
      aria-label="Client workspace navigation"
      data-surface="dark"
      className="fixed bottom-0 inset-x-0 z-30 shrink-0 border-t border-paper/12 bg-ink pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {WORKSPACE_TABS.map((tab) => {
          const Icon = WORKSPACE_TAB_ICONS[tab.slug]
          const count = tab.slug === 'chat' ? unread : 0

          return (
            <li key={tab.slug} className="flex-1">
              <NavLink
                to={`/portal/clients/${bookingId}/${tab.slug}`}
                aria-label={unreadLabel(tab.label, count)}
                className={({ isActive }) =>
                  cx(
                    'flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2',
                    'font-body text-[0.6875rem] transition-colors duration-200 ease-out',
                    isActive ? 'font-medium text-paper' : 'font-normal text-paper/70 hover:text-paper',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden="true"
                      className={cx(
                        'h-0.5 w-6 rounded-full transition-colors duration-200',
                        isActive ? 'bg-gold' : 'bg-transparent',
                      )}
                    />
                    <span className="relative inline-flex">
                      <Icon size={20} className={isActive ? 'text-gold' : 'text-paper/70'} />
                      <UnreadBadge count={count} variant="corner" />
                    </span>
                    <span className="truncate max-w-[68px]">{tab.label === 'Journal and Notes' ? 'Journal' : tab.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
