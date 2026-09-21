/**
 * Chat icons. 24 viewBox, 1.5 stroke, round caps, colour inherited — the same
 * drawn language as every other set in the project. Bounds-checked against the
 * viewBox including the stroke before shipping.
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

/** Send — a paper plane drawn as an outline, not a filled triangle. */
export function SendIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M20.25 3.75 10.9 13.1" />
      <path d="M20.25 3.75 14.3 20.25l-3.4-7.15-7.15-3.4L20.25 3.75Z" />
    </svg>
  )
}

/** Down — the jump-to-latest control. */
export function ArrowDownIcon({ size = 18, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M12 4.75v14.5" />
      <path d="m5.75 13 6.25 6.25L18.25 13" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 16, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  )
}

/** A calendar mark for a scheduled-session notice (§8.4 writes these in 9.3). */
export function NoticeIcon({ size = 16, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <rect x="3.75" y="5.25" width="16.5" height="15" rx="2" />
      <path d="M3.75 10h16.5" />
      <path d="M8 3.5v3" />
      <path d="M16 3.5v3" />
    </svg>
  )
}

/** The same calendar, struck — a session that was called off. */
export function NoticeCancelledIcon({ size = 16, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <rect x="3.75" y="5.25" width="16.5" height="15" rx="2" />
      <path d="M8 3.5v3" />
      <path d="M16 3.5v3" />
      <path d="m9 11.5 6 6" />
    </svg>
  )
}

/** Failure beside an unsent message — attention, not alarm. */
export function UnsentIcon({ size = 14, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 8v4.5" />
      <path d="M12 15.75h.01" />
    </svg>
  )
}

/**
 * The empty-thread mark — an open quote, waiting.
 *
 * Not a speech bubble: the screen is about someone's own words, not about
 * messaging as a feature.
 */
export function OpenQuoteIcon({ size = 28, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M9.25 6.75C6.5 8.25 5 10.75 5 14.25a3.25 3.25 0 1 0 3.25-3.25" />
      <path d="M19 6.75c-2.75 1.5-4.25 4-4.25 7.5A3.25 3.25 0 1 0 18 11" />
    </svg>
  )
}
