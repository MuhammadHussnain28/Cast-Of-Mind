import { NavLink } from 'react-router-dom'
import { cx } from '../../lib/cx'
import { ADMIN_NAV } from '../../data/adminNav'
import logoWhite from '../../assets/cast-of-mind-logo-singular-white.png'
import {
  ApplicationsIcon,
  BookingsIcon,
  ClientsIcon,
  DashboardIcon,
  TherapistsIcon,
} from './AdminIcons'

const ICONS = {
  dashboard: DashboardIcon,
  applications: ApplicationsIcon,
  therapists: TherapistsIcon,
  clients: ClientsIcon,
  bookings: BookingsIcon,
}

/**
 * Dark ink rail, paper content beside it.
 *
 * The ground is not decoration: gold on a light surface is 1.63:1 and is never
 * allowed as text or an indicator, so ink is the only place in this portal
 * where the accent can mark the current section at all (gold on ink is
 * 11.08:1). data-surface="dark" flips the focus ring to gold here, per the rule
 * already in index.css.
 *
 * The active item is marked by a filled ground AND weight as well as the gold
 * icon — colour alone would fail WCAG 1.4.1.
 */
export default function AdminSidebar({ onNavigate }) {
  return (
    <div data-surface="dark" className="flex h-full flex-col bg-ink">
      <div className="flex items-center gap-3 border-b border-paper/12 px-5 py-5">
        <img src={logoWhite} alt="Cast of Mind" className="h-8 w-auto" />
        <span className="font-body text-caption text-paper/70">Admin</span>
      </div>

      <nav aria-label="Admin sections" className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-1">
          {ADMIN_NAV.map((item) => {
            const Icon = ICONS[item.icon]

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

      <p className="border-t border-paper/12 px-5 py-4 font-body text-caption text-paper/70">
        Cast of Mind admin
      </p>
    </div>
  )
}
