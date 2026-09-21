import { cx } from '../../lib/cx'

/**
 * Small status label. Success uses sage-deep, not sage — plain sage is 3.44:1
 * on paper and fails at this size.
 *
 * THE TINTS ARE MIXED INTO PAPER, NOT TRANSLUCENT (10.2). A `bg-sage/15` tint
 * composites over whatever is behind it, and on a hovered admin row that is
 * mist: success fell to 4.27:1 and danger to 4.32:1, both under the floor.
 * Mixed opaque, each badge is the colour measured on paper — 4.69:1 and
 * 4.74:1 — on every ground. `in srgb` so it equals the alpha figure exactly.
 */
const TONES = {
  neutral: 'bg-mist text-ink border-ink/12',
  accent: 'bg-[color-mix(in_srgb,var(--color-gold)_20%,var(--color-paper))] text-ink border-gold/50',
  success:
    'bg-[color-mix(in_srgb,var(--color-sage)_15%,var(--color-paper))] text-sage-deep border-sage/45',
  danger:
    'bg-[color-mix(in_srgb,var(--color-clay)_10%,var(--color-paper))] text-clay border-clay/35',
  // For DARK surfaces. The light tones above put sage-deep or clay on a pale
  // tint; over ink-deep that is dark on dark — the success tone measures 3.05:1
  // there and fails. Caught by computing it, chunk 4.5.
  inverse: 'bg-paper/10 text-paper border-paper/25',
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
