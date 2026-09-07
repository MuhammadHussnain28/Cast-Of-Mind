/**
 * Therapist portal icons. 24 viewBox, 1.5 stroke, round caps, colour inherited
 * — the same drawn language as AdminIcons, StepIcons and JoinIcons.
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

/**
 * A shield with a check — verified, not locked.
 *
 * A padlock would say "you are shut out". §8.7's reasoning is the opposite: the
 * fields the therapist cannot change are the ones our team checked, and that
 * checking is what makes them worth something to a client. The mark should read
 * as a credential.
 */
export function VerifiedIcon({ size = 16, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M12 3.25 5.25 5.9v5.6c0 4 2.8 7.4 6.75 8.75 3.95-1.35 6.75-4.75 6.75-8.75V5.9L12 3.25Z" />
      <path d="m9 11.9 2.1 2.1L15.2 10" />
    </svg>
  )
}

/** Practice counts. */
export function ClientsIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M15.75 5.1a3.5 3.5 0 0 1 0 6.8" />
      <path d="M17 15.2A6 6 0 0 1 21 20" />
    </svg>
  )
}

export function HistoryIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5V12l3 1.75" />
    </svg>
  )
}

export function SessionsIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <rect x="3.25" y="6" width="13" height="12" rx="2" />
      <path d="m16.25 11 4.5-2.75v7.5L16.25 13" />
    </svg>
  )
}
