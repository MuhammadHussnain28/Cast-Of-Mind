import { NavLink } from 'react-router-dom'
import { cx } from '../../../lib/cx'
import { CLIENT_NAV } from '../../../data/clientPortalContent'
import { NAV_ICONS } from './navIcons'

/**
 * The phone's navigation — a bottom bar, not a drawer.
 *
 * Five items is exactly what a thumb-reachable bar is for, and it needs no
 * opening gesture: every section is one tap from every other. The admin portal
 * uses a drawer because it has dense tables and a different job; §24.8 asks the
 * client portal to run warmer and simpler, and this is one of the places that
 * difference is real rather than decorative.
 *
 * Ink ground for the same contrast reason as the rail — it is the only surface
 * where gold may mark the current item. Exactly one of the bar and the rail is
 * in the DOM at a time (`lg:hidden` against `hidden lg:block`), so a screen
 * reader never meets two copies of the same navigation.
 *
 * `pb-[env(safe-area-inset-bottom)]` keeps the row clear of the home indicator
 * on a modern iPhone, where a bar flush to the bottom edge is partly untappable.
 *
 * ONE DEVIATION FROM THE TYPE SCALE, FLAGGED RATHER THAN SLIPPED IN: the labels
 * are 11px, below the scale's 14px caption floor. At 360px each tab has about
 * 64px of usable width and "Worksheets" does not fit at 14px. The icon carries
 * the meaning and the label confirms it, which is the standard tab-bar
 * relationship. Same footing as the `--text-ui` step added in chunk 0.4: if it
 * should be 14px with shorter labels instead, that is a one-line change here
 * plus the labels in data/clientPortalContent.js.
 */
export default function ClientTabBar() {
  return (
    <nav
      aria-label="Your portal"
      data-surface="dark"
      className="sticky bottom-0 z-30 border-t border-paper/12 bg-ink pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {CLIENT_NAV.map((item) => {
          const Icon = NAV_ICONS[item.icon]

          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    'flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2',
                    'font-body text-[0.6875rem] transition-colors duration-200 ease-out',
                    isActive ? 'font-medium text-paper' : 'font-normal text-paper/70',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* The active item is marked three ways — the gold icon, the
                        weight, and the rule above it — so it never depends on
                        colour alone (WCAG 1.4.1). */}
                    <span
                      aria-hidden="true"
                      className={cx(
                        'h-0.5 w-6 rounded-full transition-colors duration-200',
                        isActive ? 'bg-gold' : 'bg-transparent',
                      )}
                    />
                    <Icon size={22} className={isActive ? 'text-gold' : 'text-paper/70'} />
                    <span>{item.label}</span>
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
