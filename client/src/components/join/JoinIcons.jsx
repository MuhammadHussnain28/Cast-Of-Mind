/**
 * Icons for /join-as-therapist. Same language as the How It Works and Contact
 * sets: 24px viewBox, 1.5 stroke, round caps, colour inherited.
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

/** Two circles meeting — the overlap IS the matching mechanism. */
export function Overlap(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="12" r="6" />
      <circle cx="15" cy="12" r="6" />
      <path d="M12 7.4a6 6 0 0 0 0 9.2" strokeOpacity="0.45" />
    </Icon>
  )
}

/** A closed padlock, drawn shut rather than generic. */
export function Lock(props) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.25" />
      <path d="M8.25 10.5V7.75a3.75 3.75 0 0 1 7.5 0v2.75" />
      <path d="M12 14.25v2.25" />
    </Icon>
  )
}

/** Clock with hands set to a working hour, not 12:00. */
export function Clock(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.25V12l3.25 2" />
    </Icon>
  )
}

/** A level line held steady between two marks — dependable, not a currency sign. */
export function Steady(props) {
  return (
    <Icon {...props}>
      <path d="M3.5 12h17" />
      <path d="M7 8.5v7M17 8.5v7" strokeOpacity="0.5" />
      <circle cx="12" cy="12" r="2.5" />
    </Icon>
  )
}

/** Certificate: a document with a seal. */
export function Certificate(props) {
  return (
    <Icon {...props}>
      <path d="M18.5 11V5.5a1.75 1.75 0 0 0-1.75-1.75h-9A1.75 1.75 0 0 0 6 5.5v13a1.75 1.75 0 0 0 1.75 1.75h4.5" />
      <path d="M9 8h6.5M9 11.5h4" />
      <circle cx="17" cy="16.5" r="3.25" />
      <path d="M15.6 19.2 15 22l2-1.1 2 1.1-.6-2.8" />
    </Icon>
  )
}

/** Hours accumulated — a clock face with a filled arc. */
export function Hours(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" strokeWidth={3} strokeOpacity="0.35" />
      <path d="M12 7.5V12l3 1.75" />
    </Icon>
  )
}

/** Shield — cover held over something. */
export function Shield(props) {
  return (
    <Icon {...props}>
      <path d="M12 2.75 20 5.5v6c0 4.4-3.2 7.9-8 9.75-4.8-1.85-8-5.35-8-9.75v-6l8-2.75Z" />
      <path d="M9 12.25 11.25 14.5 15.25 10" />
    </Icon>
  )
}

/** A clean record: a page with an unbroken line through it. */
export function Clean(props) {
  return (
    <Icon {...props}>
      <path d="M6 3.75h8.5L19 8.25v12A1.75 1.75 0 0 1 17.25 22h-11A1.75 1.75 0 0 1 4.5 20.25V5.5A1.75 1.75 0 0 1 6.25 3.75Z" />
      <path d="M14 3.9V8.5h4.6" strokeOpacity="0.5" />
      <path d="M7.75 16.5h8.5" />
    </Icon>
  )
}

/** Independent practice: one figure standing without a second behind it. */
export function Independent(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="7.75" r="3.5" />
      <path d="M5.75 20.25a6.25 6.25 0 0 1 12.5 0" />
    </Icon>
  )
}

/** Camera — the photo upload's idle state. */
export function Camera(props) {
  return (
    <Icon {...props}>
      <path d="M3.25 8.5A1.75 1.75 0 0 1 5 6.75h2.5l1.25-2h6.5l1.25 2H19a1.75 1.75 0 0 1 1.75 1.75v9A1.75 1.75 0 0 1 19 19.25H5a1.75 1.75 0 0 1-1.75-1.75Z" />
      <circle cx="12" cy="12.75" r="3.5" />
    </Icon>
  )
}

export function Check(props) {
  return (
    <Icon {...props}>
      <path d="M4.75 12.5 9.5 17.25 19.25 6.75" />
    </Icon>
  )
}

export function ArrowRight(props) {
  return (
    <Icon {...props}>
      <path d="M4.75 12h14.5M13.5 6.25 19.25 12l-5.75 5.75" />
    </Icon>
  )
}

export function ArrowLeft(props) {
  return (
    <Icon {...props}>
      <path d="M19.25 12H4.75M10.5 6.25 4.75 12l5.75 5.75" />
    </Icon>
  )
}

export function Close(props) {
  return (
    <Icon {...props}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </Icon>
  )
}

export function Plus(props) {
  return (
    <Icon {...props}>
      <path d="M12 5.25v13.5M5.25 12h13.5" />
    </Icon>
  )
}
