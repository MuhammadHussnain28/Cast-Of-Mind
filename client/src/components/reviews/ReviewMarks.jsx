import { cx } from '../../lib/cx'

/**
 * The drawn marks every review surface shares — the client's rating form, the
 * admin dashboard and the admin's therapist screen — so a star means the same
 * shape everywhere. 24 viewBox, 1.5 stroke, round joins, colour inherited.
 *
 * STARS ARE SAGE-DEEP, NEVER GOLD, on light ground. Gold is 1.63:1 on paper —
 * too faint even for a graphic's 3:1 — while sage-deep is 5.48:1, and it is the
 * colour 4.4's dashboard stars already used.
 *
 * Components only in this file, so fast refresh keeps working.
 */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
}

const STAR = 'M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85L12 3.5Z'

/**
 * One star — filled or open. Filled is a difference of SHAPE, not only hue.
 *
 * THE FILL IS GOLD; THE OUTLINE IS INK. Gold on paper is 1.63:1, so a star
 * coloured gold throughout would all but vanish on a white card. The ink
 * outline carries the contrast (6.74:1) and the gold stays the fill, which is
 * exactly what the palette rules permit gold to be on a light surface.
 */
export function StarShape({ filled = false, className, ...props }) {
  return (
    <svg {...base} className={className} {...props}>
      <path
        d={STAR}
        className={filled ? 'fill-gold stroke-ink/70' : 'fill-none stroke-ink/50'}
      />
    </svg>
  )
}

/**
 * Five stars for a value, rounded to the nearest whole star. Always paired by
 * its caller with the number in words ("4 of 5"), so it is aria-hidden.
 */
export function StarRow({ value, size = 'size-3.5', className }) {
  const whole = Math.round(value ?? 0)

  // No colour here: StarShape sets its own fill and outline, so the row cannot
  // tint a star into something that fails contrast.
  return (
    <span aria-hidden="true" className={cx('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((step) => (
        <StarShape key={step} filled={step <= whole} className={size} />
      ))}
    </span>
  )
}

/** An eye at rest — "your therapist never sees this". */
export function UnseenIcon({ className, ...props }) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M3.5 10.5c2.2 2.9 5.1 4.4 8.5 4.4s6.3-1.5 8.5-4.4" />
      <path d="M6.2 13.4 4.6 15.6" />
      <path d="M12 14.9v2.6" />
      <path d="M17.8 13.4l1.6 2.2" />
    </svg>
  )
}

/** A leaf unfolding — the quiet thank-you, never a celebration. */
export function ThanksIcon({ className, ...props }) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M5.5 18.5C5.5 10.5 10.5 5 19 5c0 8.5-5.5 13.5-13.5 13.5Z" />
      <path d="M5.5 18.5 13 11" />
    </svg>
  )
}

/** A line across many points — the §9.6 caveat's mark: read it as a trend. */
export function TrendIcon({ className, ...props }) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M3.5 17.5 8.5 12l3.5 3 7.5-8" />
      <path d="M15.5 7h4v4" />
    </svg>
  )
}
