import { motion, useReducedMotion } from 'framer-motion'

/**
 * One mark per outcome page. 48px, 1.5 stroke, round caps — the same drawn
 * language as the How It Works, Contact and Join sets.
 *
 * Deliberately NOT a filled green success badge or a red stop sign. Both pages
 * are calm moments: one is a beginning, the other is a pause. The palette does
 * the signalling, and sage carries both.
 */

function Frame({ children, className = '' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

/**
 * /welcome — a ring that CLOSES around a check.
 *
 * It completes rather than pops. The ring draws first and the check follows it
 * in, so the mark reads as something being finished, which is what has just
 * happened. Same path-tracing idea as the How It Works connector.
 */
export function CompletedMark({ className = '' }) {
  const reduceMotion = useReducedMotion()
  const draw = (delay, duration) => ({
    initial: reduceMotion ? false : { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration, delay, ease: [0.22, 1, 0.36, 1] },
  })

  return (
    <Frame className={className}>
      {/* Started at the top and drawn clockwise, so it closes where it began. */}
      <motion.path
        d="M24 6.5a17.5 17.5 0 1 1 0 35 17.5 17.5 0 0 1 0-35"
        {...draw(0.1, 1)}
      />
      <motion.path d="M16.5 24.5 21.75 30 32 19" {...draw(0.85, 0.45)} />
    </Frame>
  )
}

/**
 * /checkout/cancel — a bookmark ribbon.
 *
 * Chosen over a pause mark: a bookmark says YOUR PLACE IS KEPT, which is
 * exactly what that page means. A pause reads mechanical, and a cross would
 * read as failure when nothing failed.
 *
 * Static. Nothing here is being celebrated.
 */
export function KeptPlaceMark({ className = '' }) {
  return (
    <Frame className={className}>
      <path d="M14 8.5h20a2.5 2.5 0 0 1 2.5 2.5v28.5L24 31.5 11.5 39.5V11A2.5 2.5 0 0 1 14 8.5z" />
      <path d="M19 18.5h10" />
    </Frame>
  )
}
