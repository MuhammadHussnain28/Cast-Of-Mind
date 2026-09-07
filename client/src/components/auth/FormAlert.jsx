import { cx } from '../../lib/cx'

/**
 * The message a form shows after it has been submitted.
 *
 * Deliberately NOT a toast. A toast slides away on a timer, and someone
 * anxious who has just failed to sign in may still be reading when it
 * vanishes — then there is nothing on screen explaining what happened. This
 * stays until it is resolved.
 *
 * `role="alert"` makes a screen reader announce it the moment it appears,
 * which is the whole point of an error the user did not ask to see.
 *
 * One 1px border carries the whole edge — no thick coloured stripe down the
 * side, which reads as a template alert rather than part of this system.
 */
const TONES = {
  // clay on near-white measures 5.48:1 — comfortably past the 4.5:1 floor.
  error: 'border-clay/40 bg-clay/5 text-clay',
  // sage-deep, because plain sage fails contrast at text sizes.
  success: 'border-sage/40 bg-sage/10 text-sage-deep',
  // Nothing went wrong — an explanation the page owes the reader. ink on mist
  // is 16.25:1. Added chunk 4.1 for the admin inactivity sign-out.
  notice: 'border-ink/12 bg-mist text-ink',
}

/**
 * `role` is a prop because the two cases differ. An error the user did not ask
 * to see should interrupt a screen reader (`alert`); a notice that is simply
 * present when the page loads should not (`status`).
 */
export default function FormAlert({ tone = 'error', role = 'alert', className, children }) {
  return (
    <p
      role={role}
      className={cx(
        'rounded-xl border px-4 py-3 font-body text-ui',
        TONES[tone],
        className,
      )}
    >
      {children}
    </p>
  )
}
