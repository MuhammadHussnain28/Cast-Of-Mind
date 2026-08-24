import { cx } from '../../lib/cx'

/**
 * Small status label. Success uses sage-deep, not sage — plain sage is 3.44:1
 * on paper and fails at this size.
 */
const TONES = {
  neutral: 'bg-mist text-ink border-ink/12',
  accent: 'bg-gold/20 text-ink border-gold/50',
  success: 'bg-sage/15 text-sage-deep border-sage/45',
  danger: 'bg-clay/10 text-clay border-clay/35',
}

export default function Badge({ tone = 'neutral', className, children, ...rest }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-3 py-1 font-body text-caption font-medium',
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
