/**
 * The seven step icons. One 24px viewBox, one 1.5 stroke, round caps and joins,
 * colour inherited from the parent so the whole set stays a single language.
 * Drawn, never glyphs (§24.5).
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

/** Ruled sheet whose last line breaks into a wave — the free-text part. */
export function Questionnaire(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="2.75" width="16" height="18.5" rx="2.5" />
      <path d="M8 8h8M8 11.75h8" />
      <path d="M8 16.25c1.35-1.5 2.65-1.5 4 0s2.65 1.5 4 0" />
    </Icon>
  )
}

/** Two sets overlapping. The overlap is the whole mechanism. */
export function Matching(props) {
  return (
    <Icon {...props}>
      <circle cx="9.25" cy="12" r="6.25" />
      <circle cx="14.75" cy="12" r="6.25" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
    </Icon>
  )
}

/** Three profiles, one brought forward. */
export function Choosing(props) {
  return (
    <Icon {...props}>
      <rect x="2.75" y="7" width="5.75" height="10" rx="1.5" />
      <rect x="15.5" y="7" width="5.75" height="10" rx="1.5" />
      <rect x="8" y="4.5" width="8" height="13" rx="2" />
      <circle cx="12" cy="20.5" r="1.15" fill="currentColor" stroke="none" />
    </Icon>
  )
}

/** A card. The reassurance line carries the security point, not the drawing. */
export function Subscribe(props) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19" />
      <path d="M6.5 14.75h4" />
    </Icon>
  )
}

/** Envelope with a key — credentials arriving, not just mail. */
export function Credentials(props) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
      <path d="M3.25 6.25 10 11l6.75-4.75" />
      <circle cx="18.25" cy="16.25" r="2.6" />
      <path d="M18.25 18.85v3.15M17 20.6h2.5" />
    </Icon>
  )
}

/** One bubble, written in. */
export function Message(props) {
  return (
    <Icon {...props}>
      <path d="M20.5 11.75c0 3.87-3.8 7-8.5 7-1.06 0-2.08-.16-3.02-.45L4 20l1.6-3.55C4.28 15.2 3.5 13.55 3.5 11.75c0-3.87 3.8-7 8.5-7s8.5 3.13 8.5 7Z" />
      <path d="M8.25 10h7.5M8.25 13.25h4.5" />
    </Icon>
  )
}

/** Screen with a join marker. */
export function Sessions(props) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="4" width="19" height="13.5" rx="2.5" />
      <path d="M12 17.5V21M8.25 21h7.5" />
      <path d="M10.25 8.4 14.5 10.75l-4.25 2.35Z" />
    </Icon>
  )
}
