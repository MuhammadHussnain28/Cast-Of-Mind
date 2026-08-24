import { useCallback, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cx } from '../../lib/cx'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Hand-built dialog — no library, per the chunk.
 *
 * It does four things people rely on:
 *  1. traps Tab inside the dialog while it is open
 *  2. closes on Escape
 *  3. gives focus back to whatever opened it
 *  4. stops the page behind it from scrolling
 *
 * Motion is capped at 200ms. This is a functional interaction, so it stays
 * fast — the slow breathing rhythm is only for ambient and scroll motion.
 */
export default function Modal({ open, onClose, title, description, children, footer }) {
  const panelRef = useRef(null)
  const returnFocusRef = useRef(null)
  const reduce = useReducedMotion()
  const id = useId()
  const titleId = `${id}-title`
  const descId = `${id}-desc`

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
        return
      }
      if (e.key !== 'Tab') return

      const nodes = panelRef.current?.querySelectorAll(FOCUSABLE)
      if (!nodes || nodes.length === 0) {
        e.preventDefault()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    returnFocusRef.current = document.activeElement

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const t = window.setTimeout(() => {
      const nodes = panelRef.current?.querySelectorAll(FOCUSABLE)
      if (nodes && nodes.length) nodes[0].focus()
      else panelRef.current?.focus()
    }, 0)

    return () => {
      window.clearTimeout(t)
      document.body.style.overflow = overflow
      // Give focus back to the trigger so keyboard users are not dumped at the top.
      returnFocusRef.current?.focus?.()
    }
  }, [open])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          onKeyDown={handleKeyDown}
        >
          <motion.div
            className="absolute inset-0 bg-ink-deep/55"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            className={cx(
              'relative w-full max-w-lg rounded-2xl border border-ink/12 bg-paper p-6 shadow-xl shadow-ink/10',
              'focus-visible:outline-none',
            )}
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {title && (
              <h2 id={titleId} className="font-display text-subsection text-ink">
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className="mt-2 font-body text-ui text-ink/70">
                {description}
              </p>
            )}
            {children && <div className="mt-5">{children}</div>}
            {footer && <div className="mt-7 flex flex-wrap justify-end gap-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
