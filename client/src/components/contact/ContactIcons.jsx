/**
 * Contact channel icons. Same language as the How It Works set: 24px viewBox,
 * 1.5 stroke, round caps, colour inherited.
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

export function Envelope(props) {
  return (
    <Icon {...props}>
      <rect x="2.75" y="5" width="18.5" height="14" rx="2.5" />
      <path d="M3.5 6.75 12 12.75l8.5-6" />
    </Icon>
  )
}

/** Shield with a handset — escalation, not general contact. */
export function Shield(props) {
  return (
    <Icon {...props}>
      <path d="M12 2.75 20 5.5v6c0 4.4-3.2 7.9-8 9.75-4.8-1.85-8-5.35-8-9.75v-6l8-2.75Z" />
      <path d="M9.75 9.5c0 3 1.75 4.75 4.5 5.5l.9-1.4-2-1.2-.9.75c-.8-.5-1.4-1.1-1.75-1.9l.8-.85-1.05-1.9-1.5.9Z" />
    </Icon>
  )
}

/** Clock with a meridian arc — hours across time zones. */
export function Clock(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M12 6.75V12l3.25 2" />
      <path d="M12 2.75c2.4 2.6 3.6 5.6 3.6 9.25s-1.2 6.65-3.6 9.25" />
    </Icon>
  )
}
