/**
 * Checkout icons. Same language as the How It Works and Contact sets:
 * 24px viewBox, 1.5 stroke, round caps, colour inherited.
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

// A screen with a play triangle — a scheduled video hour, not a generic camera.
export function Sessions(props) {
  return (
    <Icon {...props}>
      <rect x="2.75" y="4.75" width="18.5" height="12.5" rx="2.5" />
      <path d="M10.25 9.5 14 11.9l-3.75 2.4z" />
      <path d="M8.5 20.25h7" />
    </Icon>
  )
}

// Two overlapping bubbles: a conversation, not a notification.
export function Chat(props) {
  return (
    <Icon {...props}>
      <path d="M3 9.25A3.25 3.25 0 0 1 6.25 6h6.5A3.25 3.25 0 0 1 16 9.25v1.5A3.25 3.25 0 0 1 12.75 14H8.5L5.5 16.5V14h-.25A2.25 2.25 0 0 1 3 11.75z" />
      <path d="M18 10.5a3 3 0 0 1 3 3v1.25a3 3 0 0 1-3 3v2l-2.5-2h-2" />
    </Icon>
  )
}

// A sheet with a pencil resting on it — something to fill in and hand back.
export function Worksheets(props) {
  return (
    <Icon {...props}>
      <path d="M6.75 3.75h6.5l4 4v8.5" />
      <path d="M13 3.75v4.5h4.5" />
      <path d="M6.75 3.75A1.75 1.75 0 0 0 5 5.5v13a1.75 1.75 0 0 0 1.75 1.75h5" />
      <path d="M20.5 15.5 15 21l-2.5.5.5-2.5 5.5-5.5z" />
    </Icon>
  )
}

// A closed book with a ribbon — private, kept, returned to.
export function Journal(props) {
  return (
    <Icon {...props}>
      <path d="M5.5 4.5A1.75 1.75 0 0 1 7.25 2.75h10.5a.75.75 0 0 1 .75.75v15.25" />
      <path d="M5.5 4.5v13.25A2.5 2.5 0 0 0 8 20.25h10.5" />
      <path d="M5.5 17.75A2.5 2.5 0 0 1 8 15.25h10.5" />
      <path d="M11 2.75v5l1.75-1.4 1.75 1.4v-5" />
    </Icon>
  )
}

// The lock is a padlock body plus shackle. It is the only reassurance mark on
// the page and stays plain — a shield would overclaim.
export function Lock(props) {
  return (
    <Icon {...props}>
      <rect x="4.75" y="10.25" width="14.5" height="9.5" rx="2.25" />
      <path d="M8.25 10.25V7.5a3.75 3.75 0 0 1 7.5 0v2.75" />
      <path d="M12 14v2" />
    </Icon>
  )
}
