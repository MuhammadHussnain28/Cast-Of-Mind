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
}

export default function FormAlert({ tone = 'error', className, children }) {
  return (
    <p
      role="alert"
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
