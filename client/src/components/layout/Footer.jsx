import { Link } from 'react-router-dom'
import { siteConfig, navItems, legalItems } from '../../lib/siteConfig'
import logoWhite from '../../assets/cast-of-mind-logo-white.png'

/**
 * data-surface="dark" flips the focus ring to yellow. On ink, an ink ring
 * would be invisible; yellow on ink is 11:1.
 *
 * The underline is at paper/40 (3.81:1), not paper/25 (2.23:1). The underline
 * is the non-colour cue that marks these as links, so it has to be visible.
 */
function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center font-body text-caption text-paper/75
                 underline decoration-paper/40 underline-offset-4 transition-colors duration-200
                 hover:text-paper hover:decoration-paper/60"
    >
      {children}
    </Link>
  )
}

export default function Footer() {
  const year = 2021

  return (
    <footer data-surface="dark" className="bg-ink text-paper">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <img
              src={logoWhite}
              alt="Cast of Minds"
              width={78}
              height={64}
              className="h-16 w-auto scale-x-[1.1] origin-left"
            />
            <p className="mt-5 max-w-[38ch] font-body text-caption leading-relaxed text-paper/75">
              Therapy that fits around a life already in progress. Matched to what
              you are carrying, and reachable between sessions.
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="font-body text-caption font-medium text-paper">Explore</h2>
            <ul className="mt-3 flex flex-col">
              {navItems.map((item) => (
                <li key={item.to}>
                  <FooterLink to={item.to}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h2 className="font-body text-caption font-medium text-paper">Legal</h2>
            <ul className="mt-3 flex flex-col">
              {legalItems.map((item) => (
                <li key={item.to}>
                  <FooterLink to={item.to}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-paper/35 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-caption text-paper/75">
            &copy; {year} {siteConfig.name}. All rights reserved.
          </p>
          <p className="font-body text-caption text-paper/75">
            Developed by{' '}
            <a
              href={siteConfig.developerEmail}
              target='_blank'
              rel="noopener noreferrer"
              className="underline decoration-paper/40 underline-offset-4 transition-colors
                         duration-200 hover:text-paper hover:decoration-paper/60"
            >
              {siteConfig.developerName}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
