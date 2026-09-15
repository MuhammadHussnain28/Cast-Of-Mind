/**
 * Client portal icons. 24 viewBox, 1.5 stroke, round caps, colour inherited —
 * the same drawn language as AdminIcons, PortalIcons, StepIcons and JoinIcons.
 *
 * Every shape was bounds-checked against the viewBox including the stroke
 * before shipping, as in chunks 2.5, 2.6 and 5.2.
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

/** A conversation — two overlapping speech shapes, not one generic bubble. */
export function ChatIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M3.25 9.5a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4H9l-3.5 2.75V14.2a4 4 0 0 1-2.25-3.6v-1.1Z" />
      <path d="M17.5 8.4a3.25 3.25 0 0 1 3.25 3.25v1a3.25 3.25 0 0 1-1.75 2.9v2.2l-2.75-2.1" />
    </svg>
  )
}

/** A document that goes out and comes back — the two-way worksheet loop. */
export function WorksheetsIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M6.5 3.25h7.25L18 7.5v9.25a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V5.25a2 2 0 0 1 2-2Z" />
      <path d="M13.5 3.4V7.5H17.8" />
      <path d="M8.25 12.75h5.5" />
      <path d="m11.5 10.5 2.25 2.25-2.25 2.25" />
    </svg>
  )
}

/** An open notebook with a written line — a place to write, not a file. */
export function JournalIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M4 5.25A2 2 0 0 1 6 3.25h4v17.5H6a2 2 0 0 1-2-2V5.25Z" />
      <path d="M20 5.25a2 2 0 0 0-2-2h-4v17.5h4a2 2 0 0 0 2-2V5.25Z" />
      <path d="M6.75 8.5h1.5" />
      <path d="M15.75 8.5h1.5" />
      <path d="M15.75 11.75h1.5" />
    </svg>
  )
}

/** A calendar carrying a play mark — a scheduled session you join by link. */
export function SessionsIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <rect x="3.5" y="5.25" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M8 3.5v3" />
      <path d="M16 3.5v3" />
      <path d="m10.75 13.5 3.5 2-3.5 2v-4Z" />
    </svg>
  )
}

/** A card with a rule — the account and what is billed to it. */
export function AccountIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <rect x="3.25" y="5.5" width="17.5" height="13" rx="2" />
      <path d="M3.25 9.75h17.5" />
      <path d="M7 14.25h4" />
    </svg>
  )
}

/**
 * A sprout — shown when the therapist is in clinic today.
 *
 * Paired with the clock below: a clock for "next time", something growing for
 * "here now". Drawn rather than the 🌿 / 🕒 the wording spec sketched, because
 * the craft rules ban unicode glyphs standing in for an icon system — and an
 * emoji would render in a different style on every platform, which is exactly
 * what the one-stroke-weight set exists to avoid.
 */
export function SproutIcon({ size = 16, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M12 20.5v-7.25" />
      <path d="M12 13.25C12 9.8 9.4 7 6.1 7c-.5 0-.85.4-.8.9.4 3.2 3 5.6 6.2 5.6" />
      <path d="M12 13.25c0-3.1 2.35-5.65 5.35-5.65.45 0 .8.37.75.82-.38 2.9-2.75 5.08-5.6 5.08" />
    </svg>
  )
}

/** A clock — published working hours, never presence. */
export function HoursIcon({ size = 16, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5V12l3.25 1.9" />
    </svg>
  )
}

/**
 * An exclamation inside a rounded triangle, for the failed-payment notice.
 *
 * Deliberately not a filled alarm badge: something needs attention, and
 * nothing has gone wrong with the therapy.
 */
export function AttentionIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M12 4.5 20.5 19a1.5 1.5 0 0 1-1.3 2.25H4.8A1.5 1.5 0 0 1 3.5 19L12 4.5Z" />
      <path d="M12 10v4" />
      <path d="M12 17.25h.01" />
    </svg>
  )
}

/** A bookmark — a place kept, used on the ended-subscription screen. */
export function KeptIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M6.5 3.75h11v16.5L12 16.25l-5.5 4V3.75Z" />
    </svg>
  )
}

/** Sign out — a door with the arrow leaving it. */
export function SignOutIcon({ size = 18, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M14.5 4.25h3.25a2 2 0 0 1 2 2v11.5a2 2 0 0 1-2 2H14.5" />
      <path d="M4.25 12h9" />
      <path d="m9.75 8.5 3.5 3.5-3.5 3.5" />
    </svg>
  )
}
