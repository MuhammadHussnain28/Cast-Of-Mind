import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useFocusTrap } from '../../lib/useFocusTrap'
import { navItems } from '../../lib/siteConfig'
import { cx } from '../../lib/cx'

/**
 * Slide-in menu for small screens. Focus is trapped inside while open,
 * Escape closes it, and focus returns to the hamburger button.
 * The slide is 220ms - this is a functional interaction, so it stays fast.
 */
export default function MobileNav({ open, onClose }) {
  const panelRef = useRef(null)
  const reduce = useReducedMotion()
  const { onKeyDown } = useFocusTrap({ active: open, containerRef: panelRef, onClose })

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" onKeyDown={onKeyDown}>
          <motion.div
            className="absolute inset-0 bg-ink-deep/50"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-[min(20rem,86vw)] flex-col
                       border-l border-ink/10 bg-paper focus-visible:outline-none"
            initial={reduce ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: '100%' }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex h-16 items-center justify-end border-b border-ink/10 px-4">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full
                           text-ink transition-colors duration-200 hover:bg-mist"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav aria-label="Main" className="flex-1 overflow-y-auto px-4 py-6">
              <ul className="flex flex-col">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cx(
                          'flex min-h-12 items-center rounded-xl px-3 font-body text-ui',
                          'transition-colors duration-200',
                          isActive
                            ? 'bg-mist font-medium text-ink'
                            : 'text-ink/70 hover:bg-mist hover:text-ink',
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex flex-col gap-3 border-t border-ink/10 px-4 py-5">
              <Link
                to="/login"
                onClick={onClose}
                className="inline-flex min-h-11 items-center justify-center rounded-full
                           border border-ink/50 px-6 font-body text-ui font-medium text-ink
                           transition-colors duration-200 hover:bg-mist"
              >
                Log in
              </Link>
              <Link
                to="/questionnaire"
                onClick={onClose}
                className="inline-flex min-h-11 items-center justify-center rounded-full
                           border border-ink/35 bg-gold px-6 font-body text-ui font-medium text-ink
                           transition-colors duration-200 hover:bg-gold/90"
              >
                Get started
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
