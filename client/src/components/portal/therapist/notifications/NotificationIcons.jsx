/**
 * The bell and its three kinds — 24 viewBox, 1.5 stroke, round caps, colour
 * inherited. The same drawn language as the rest of the therapist portal.
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

/** A bell at rest — never mid-ring, which would read as an alarm. */
export function BellIcon({ className, ...props }) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M6 10.5a6 6 0 0 1 12 0c0 3 .7 4.6 1.5 5.6.4.5 0 1.2-.6 1.2H5.1c-.6 0-1-.7-.6-1.2.8-1 1.5-2.6 1.5-5.6Z" />
      <path d="M10.2 20a2 2 0 0 0 3.6 0" />
    </svg>
  )
}

/** Something written — a line of speech, not a quotation of it. */
export function MessageKindIcon({ className, ...props }) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M4.5 6.75a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4 3.25v-3.25a2 2 0 0 1-1.5-2Z" />
    </svg>
  )
}

/** A sheet coming back, with a tick — the loop closing. */
export function WorksheetKindIcon({ className, ...props }) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M6.5 3.75h7.25L18 8v5" />
      <path d="M13.5 3.75V8h4.25" />
      <path d="M6.5 3.75a1 1 0 0 0-1 1v13.5a1 1 0 0 0 1 1h4" />
      <path d="m13 17.5 2.25 2.25L20 14.5" />
    </svg>
  )
}

/** A person arriving — one figure, with the mark of something new beside it. */
export function NewClientKindIcon({ className, ...props }) {
  return (
    <svg {...base} className={className} {...props}>
      <circle cx="10" cy="8.25" r="3.5" />
      <path d="M4 19.25a6 6 0 0 1 12 0" />
      <path d="M18.5 6v5" />
      <path d="M21 8.5h-5" />
    </svg>
  )
}

/**
 * Deliberately NO lookup object here. A module exporting both a component and a
 * plain value silently breaks fast refresh for the whole file (the rule
 * AdminIcons and the portal icon sets already follow) — the row picks its
 * component instead.
 */
