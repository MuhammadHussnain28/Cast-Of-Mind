/**
 * Icons for the intake flow. Same language as the How It Works, Join and
 * Contact sets: 24px viewBox, 1.5 stroke, round caps, colour inherited.
 */

function Icon({ children, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

/** One person. Deliberately plain beside Couple, so the pair reads as a count. */
export function Person(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M5.25 19.5a6.75 6.75 0 0 1 13.5 0" />
    </Icon>
  )
}

/** Two people, shoulders overlapping — the overlap is the point: one account. */
export function Couple(props) {
  return (
    <Icon {...props}>
      <circle cx="8.75" cy="8.5" r="3.25" />
      <circle cx="15.25" cy="8.5" r="3.25" strokeOpacity="0.55" />
      <path d="M3 19.5a5.75 5.75 0 0 1 11.5 0" />
      <path d="M9.5 19.5a5.75 5.75 0 0 1 11.5 0" strokeOpacity="0.55" />
    </Icon>
  )
}

/** A pin over open ground, not a generic map marker. */
export function Place(props) {
  return (
    <Icon {...props}>
      <path d="M12 21c4-4.4 6-7.6 6-10.25A6 6 0 0 0 6 10.75C6 13.4 8 16.6 12 21Z" />
      <circle cx="12" cy="10.5" r="2.25" />
    </Icon>
  )
}

/** Two linked rings — relationship, without a heart. */
export function Linked(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="12" r="5" />
      <circle cx="15" cy="12" r="5" strokeOpacity="0.55" />
    </Icon>
  )
}

/** A sealed envelope. */
export function Envelope(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.25" />
      <path d="m3.75 7 7.13 5.35a2 2 0 0 0 2.24 0L20.25 7" />
    </Icon>
  )
}

/** A cross, for removing a chosen concern. */
export function Cross(props) {
  return (
    <Icon {...props}>
      <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
    </Icon>
  )
}

/** A magnifier for the concern search. */
export function Search(props) {
  return (
    <Icon {...props}>
      <circle cx="10.75" cy="10.75" r="6.25" />
      <path d="m15.5 15.5 4 4" />
    </Icon>
  )
}

/** Used to mark a chosen option — never the only signal that it is chosen. */
export function Check(props) {
  return (
    <Icon {...props}>
      <path d="m4.5 12.75 5 5 10-10.5" />
    </Icon>
  )
}
