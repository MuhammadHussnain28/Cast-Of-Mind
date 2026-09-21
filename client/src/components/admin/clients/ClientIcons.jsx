/**
 * Drawn marks for the admin's client screens. 24 viewBox, 1.5 stroke, round
 * caps, colour inherited — the same language as AdminIcons and the portal sets.
 *
 * Components only in this file, no lookup object: a module exporting both a
 * component and a plain value breaks fast refresh for the whole file.
 */

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
}

/** Two figures side by side — a couple is one account holding two people (§6). */
export function CoupleIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8.5" r="3.25" />
      <path d="M3.75 20.25a5.25 5.25 0 0 1 10.5 0" />
      <circle cx="16.25" cy="9.75" r="2.5" />
      <path d="M16 16.25a4.25 4.25 0 0 1 4.25 4" />
    </svg>
  )
}

/** A card on file, with the line that keeps being charged. */
export function BillingIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5.25" width="18" height="13.5" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M6.75 14.5h4" />
    </svg>
  )
}

/**
 * A closed period on the history spine.
 *
 * `struck` marks a subscription the client or the admin cancelled; the plain
 * ring is one that simply ran out. Two shapes rather than two colours, so the
 * distinction never depends on hue alone (WCAG 1.4.1).
 */
export function PeriodMarkIcon({ struck = false, ...props }) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="7.25" />
      {struck && <path d="M7.4 7.4 16.6 16.6" />}
    </svg>
  )
}

/** A key handed back — the reset link, never a password. */
export function ResetKeyIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="12" r="3.75" />
      <path d="M11.75 12H20.5" />
      <path d="M17.5 12v3.25" />
      <path d="M20.5 12v2.25" />
    </svg>
  )
}
