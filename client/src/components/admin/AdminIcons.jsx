/**
 * Admin navigation icons. 24 viewBox, 1.5 stroke, round caps, colour inherited
 * — the same drawn language as StepIcons and JoinIcons.
 *
 * Components only in this file, no lookup object: a module that exports both a
 * component and a plain value silently breaks fast refresh for the whole file.
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

/** Panels of unequal weight — the business at a glance. */
export function DashboardIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="7.5" height="18" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7" rx="2" />
      <rect x="13.5" y="13" width="7.5" height="8" rx="2" />
    </svg>
  )
}

/** A submitted document, corner folded, waiting to be read. */
export function ApplicationsIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3.75h7.5L18.5 8.75V20.25a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.75a1 1 0 0 1 1-1Z" />
      <path d="M13.5 3.75V8.5a.5.5 0 0 0 .5.5h4.5" />
      <path d="M8 13h7" />
      <path d="M8 16.5h4.5" />
    </svg>
  )
}

/** One person, verified — a therapist exists only after admin approval. */
export function TherapistsIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="7.5" r="3.75" />
      <path d="M3.75 20.25a6.25 6.25 0 0 1 11.4-3.55" />
      <path d="m14.75 18.5 2 2 3.5-4" />
    </svg>
  )
}

/** Two people — a client account may be one person or a couple. */
export function ClientsIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M15.75 5.1a3.5 3.5 0 0 1 0 6.8" />
      <path d="M17 15.2A6 6 0 0 1 21 20" />
    </svg>
  )
}

/** Two rings linked — a booking is the join between one client and one therapist. */
export function BookingsIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="8.25" cy="12" r="5.25" />
      <circle cx="15.75" cy="12" r="5.25" />
    </svg>
  )
}

/** Sidebar toggle on small screens. */
export function MenuIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  )
}

export function CloseIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  )
}

/** Sort direction, rotated by the caller. */
export function SortArrowIcon(props) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="M12 4.5v15" />
      <path d="m6.5 14 5.5 5.5 5.5-5.5" />
    </svg>
  )
}

/** Neutral, unsorted column. */
export function SortableIcon(props) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <path d="m7.5 10 4.5-4.5 4.5 4.5" />
      <path d="m7.5 14 4.5 4.5 4.5-4.5" />
    </svg>
  )
}

export function SearchIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  )
}

/** A row that opens somewhere — the whole row is the target (10.2). */
export function OpenRowIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 6.5 15 12l-5.5 5.5" />
    </svg>
  )
}
