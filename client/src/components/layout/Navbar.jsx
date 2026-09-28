import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import MobileNav from './MobileNav'
import { navItems } from '../../lib/siteConfig'
import { cx } from '../../lib/cx'
import logoInk from '../../assets/cast-of-mind-logo-singular-ink.png'

/**
 * The active page is marked by weight AND an underline, not by colour alone -
 * colour on its own fails WCAG 1.4.1 for anyone who cannot see the difference.
 * The underline is ink, not yellow: yellow on white is 1.63:1 and would be
 * nearly invisible. Keeping it ink also keeps yellow scarce, which the spec
 * asks for - the only yellow in this bar is the Get started button.
 */
function DesktopLink({ to, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cx(
          'relative inline-flex min-h-11 items-center font-body text-ui transition-colors duration-200',
          isActive ? 'font-medium text-ink' : 'text-ink/70 hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {label}
          <span
            aria-hidden="true"
            className={cx(
              'absolute inset-x-0 bottom-1 h-0.5 rounded-full bg-ink transition-opacity duration-200',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
          />
        </>
      )}
    </NavLink>
  )
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center gap-6 px-5 sm:px-8">
        <Link
          to="/"
          className="inline-flex shrink-0 items-center rounded-lg py-2"
          aria-label="Cast of Mind - home"
        >
          <img
            src={logoInk}
            alt="Cast of Mind"
            width={54}
            height={44}
            className="w-[74px] h-auto scale-x-[1.09] origin-left border-black"
          />
        </Link>

        <nav aria-label="Main" className="ml-2 hidden flex-1 lg:block">
          <ul className="flex items-center gap-8">
            {navItems.map((item) => (
              <li key={item.to}>
                <DesktopLink {...item} />
              </li>
            ))}
          </ul>
        </nav>

        {/* Right side is visually separated from the page links by a divider. */}
        <div className="ml-auto hidden items-center gap-5 lg:flex">
          <span aria-hidden="true" className="h-6 w-px bg-ink/25" />
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center rounded-full px-2 font-body text-ui
                       text-ink/70 transition-colors duration-200 hover:text-ink"
          >
            Log in
          </Link>
          <Link
            to="/questionnaire"
            className="inline-flex min-h-11 items-center rounded-full border border-ink/35
                       bg-gold px-6 font-body text-ui font-medium text-ink
                       transition-colors duration-200 hover:bg-gold/90 active:bg-gold/80"
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full
                     text-ink transition-colors duration-200 hover:bg-mist lg:hidden"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  )
}
