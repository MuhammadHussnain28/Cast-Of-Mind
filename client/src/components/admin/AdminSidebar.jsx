import { NavLink } from 'react-router-dom'
import { cx } from '../../lib/cx'
import { ADMIN_NAV } from '../../data/adminNav'
import logoWhite from '../../assets/cast-of-mind-logo-white.png'
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
      {/* PREVIOUS VERSION (SAVED FOR BACKUP):
      <div className="flex items-center gap-3 border-b border-paper/12 px-5 py-5">
        <img src={logoWhite} alt="Cast of Mind" className="h-8 w-auto" />
        <span className="font-body text-caption text-paper/70">Admin</span>
      </div>
      */}
      <div className="flex items-center justify-between border-b border-paper/10 px-5 py-4 bg-paper/2">
        <img
          src={logoWhite}
          alt="Cast of Minds"
          className="w-[74px] h-auto scale-x-[1.1] origin-left shrink-0"
        />
        <span className="inline-flex items-center gap-1 rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 font-body text-[9px] font-semibold tracking-wider text-gold uppercase shadow-2xs">
          Console
        </span>
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

      {/* PREVIOUS VERSION (SAVED FOR BACKUP):
      <p className="border-t border-paper/12 px-5 py-4 font-body text-caption text-paper/70">
        Cast of Mind admin
      </p>
      */}
      <div className="border-t border-paper/10 p-3 bg-paper/2">
        <div className="flex items-center gap-3 rounded-xl border border-paper/8 bg-paper/4 p-2.5 transition-colors hover:border-paper/15 shadow-2xs">
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink-deep border border-paper/10 text-gold shadow-2xs">
            {/* Shield Icon */}
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-ink" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body text-xs font-semibold text-paper truncate">
              System Authority
            </p>
            <p className="mt-0.5 font-body text-[10px] text-paper/60 flex items-center gap-1">
              <span>Superadmin</span>
              <span className="text-paper/30">•</span>
              <span className="font-medium text-emerald-400/90">Full Access</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
