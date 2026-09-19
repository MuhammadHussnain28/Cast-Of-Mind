import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { cx } from '../../../../lib/cx'
import { useUnreadFor } from '../../../../lib/chat/unreadContext'
import { unreadLabel } from '../../../../lib/chat/unreadStore'
import { WORKSPACE_TABS } from '../../../../data/therapistPortalContent'
import { WORKSPACE_TAB_ICONS } from '../workspaceIcons'

/**
 * The per-client tabs — master spec §8, "The Architecture".
 *
 * THE SAME FIVE TABS ALWAYS EXIST; ONLY THE DATA CHANGES. That is the whole
 * inbox pattern, and it is why these are one component reading one list rather
 * than anything assembled per client.
 *
 * THE ACTIVE MARKER IS INK, NOT GOLD, and that is the palette rule rather than
 * a preference: gold is 1.63:1 on a light surface and is never permitted there
 * as text or an indicator. So the accent stays where it is legible — the ink
 * rail — and this surface marks the current tab three ways instead: a 2px ink
 * rule, the weight, and full-strength ink against `ink/70`. Never colour alone
 * (WCAG 1.4.1).
 *
 * Below 640px the strip scrolls horizontally. Five tabs do not fit at 360px and
 * the alternatives are worse: a dropdown hides where you are, and truncating
 * "Journal and Notes" to "Journal" would rename a feature to make it fit.
 */
export default function WorkspaceTabs({ bookingId }) {
  const listRef = useRef(null)

  // §14. The chat tab carries the same count as the sidebar row, from the same
  // provider — a therapist who is looking at this client should not have to
  // check two places to see that something is waiting.
  const unread = useUnreadFor(bookingId)

  /**
   * Bring the current tab into view on a narrow screen. Without it a therapist
   * arriving on Client info at 360px sees a row that appears to start at Chat,
   * with the active tab off the right-hand edge and no sign it exists.
   */
  useEffect(() => {

    const active = listRef.current?.querySelector('[aria-current="page"]')
    active?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [bookingId])

  return (
    <div className="relative">
      {/* The fades say "there is more this way" without a scrollbar doing it —
          a browser default this design does not otherwise use.

          BOTH hide rules are needed. Tailwind's `scrollbar-none` emits only
          `scrollbar-width: none`, which Safari did not support until 18.2, so
          on an iPhone the bar would still sit across the tabs. Checked in the
          generated CSS rather than assumed. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-linear-to-r from-paper to-transparent sm:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-linear-to-l from-paper to-transparent sm:hidden" />

      <nav aria-label="This client">
        <ul
          ref={listRef}
          className="flex gap-1 overflow-x-auto px-4 scrollbar-none [&::-webkit-scrollbar]:hidden sm:px-6 lg:px-10"
        >
          {WORKSPACE_TABS.map((tab) => {
            const Icon = WORKSPACE_TAB_ICONS[tab.slug]
            const count = tab.slug === 'chat' ? unread : 0

            return (
              <li key={tab.slug} className="shrink-0">
                <NavLink
                  to={`/portal/clients/${bookingId}/${tab.slug}`}
                  // The count goes in the accessible NAME, never left to a
                  // numeral read on its own (7.6's rule).
                  aria-label={unreadLabel(tab.label, count)}
                  className={({ isActive }) =>
                    cx(
                      'relative flex min-h-11 items-center gap-2 whitespace-nowrap px-3 pb-3 pt-2.5',
                      'font-body text-ui transition-colors duration-200 ease-out',
                      isActive
                        ? 'font-medium text-ink'
                        : 'font-normal text-ink/70 hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} className={isActive ? 'text-ink' : 'text-ink/70'} />
                      <span>{tab.label}</span>

                      {count > 0 && (
                        // Not the gold pill from the rail — gold cannot carry a
                        // numeral on paper. A small ink dot says "something is
                        // here" without claiming to be readable as a count, and
                        // the number is already in the accessible name.
                        <span
                          aria-hidden="true"
                          className="size-1.5 shrink-0 rounded-full bg-ink"
                        />
                      )}

                      <span
                        aria-hidden="true"
                        className={cx(
                          'absolute inset-x-3 bottom-0 h-0.5 rounded-full transition-colors duration-200',
                          isActive ? 'bg-ink' : 'bg-transparent',
                        )}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
