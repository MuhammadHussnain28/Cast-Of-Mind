import { NavLink } from 'react-router-dom'
import { cx } from '../../../lib/cx'
import { THERAPIST_GLOBAL_NAV } from '../../../data/therapistPortalContent'
import { THERAPIST_NAV_ICONS } from './navIcons'

/**
 * What belongs to the therapist rather than to a client — master spec §8.7, §8.8.
 *
 * The inbox pattern's whole distinction is per-client versus global, and §8
 * marks both of these *(global)*. Putting them below the list rather than above
 * it keeps the clients as the subject of the screen — the same place a mail
 * client puts the account it is signed in as.
 *
 * On a phone these are rows at the end of the list page rather than a bottom
 * tab bar, so that the bottom of the CLIENT WORKSPACE stays free for chunk
 * 8.2's per-client tabs. Two competing tab bars on one small screen is the
 * problem that choice avoids.
 */
export default function TherapistGlobalNav({ onNavigate }) {
  return (
    <nav aria-label="Your account" className="px-3 py-3">
      <ul className="flex flex-col gap-1">
        {THERAPIST_GLOBAL_NAV.map((item) => {
          const Icon = THERAPIST_NAV_ICONS[item.icon]

          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
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
