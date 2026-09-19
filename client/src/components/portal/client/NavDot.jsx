import { cx } from '../../../lib/cx'

// A quiet gold dot: something is waiting. Gold on ink is 11.08:1.
// No number and no pulse — a worksheet is an invitation, not an alarm.
export default function NavDot({ show, variant = 'inline', className }) {
  if (!show) return null
  return (
    <span
      aria-hidden="true"
      className={cx(
        'size-2 shrink-0 rounded-full bg-gold',
        variant === 'corner' && 'absolute -right-0.5 -top-0.5 ring-2 ring-ink',
        className,
      )}
    />
  )
}
