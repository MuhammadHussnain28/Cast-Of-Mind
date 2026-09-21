/**
 * Therapist portal icons. 24 viewBox, 1.5 stroke, round caps, colour inherited
 * — the same drawn language as ClientPortalIcons, AdminIcons and PortalIcons.
 *
 * Every shape is bounds-checked against the viewBox including the stroke before
 * shipping, as in chunks 2.5, 2.6, 5.2 and 7.4.
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

/** A person and a card edge — the profile as something verified, not a bust. */
export function ProfileIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <circle cx="12" cy="8.25" r="3.5" />
      <path d="M5 19.25a7 7 0 0 1 14 0" />
    </svg>
  )
}

/**
 * A bell drawn as a struck shape rather than the usual rounded dome, so it
 * reads at 20px in a rail rather than turning into a blob.
 */
export function NotificationsIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M6.75 10.25a5.25 5.25 0 0 1 10.5 0v3.1l1.4 2.65H5.35l1.4-2.65v-3.1Z" />
      <path d="M10.25 18.5a1.9 1.9 0 0 0 3.5 0" />
    </svg>
  )
}

/**
 * The inbox itself — a tray with a line resting in it. Used on the resting
 * pane, where a generic folder would say nothing about what this place is.
 */
export function InboxIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M3.75 13.5 6.4 6.15a2 2 0 0 1 1.9-1.4h7.4a2 2 0 0 1 1.9 1.4l2.65 7.35v3.75a2 2 0 0 1-2 2H5.75a2 2 0 0 1-2-2V13.5Z" />
      <path d="M3.75 13.5h3.9l1.1 2.1h6.5l1.1-2.1h3.9" />
    </svg>
  )
}

/**
 * Two figures side by side — the client list, drawn as people rather than as
 * rows. A list icon would describe the UI; this describes what is in it.
 */
export function ClientListIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <circle cx="9" cy="8" r="3.1" />
      <path d="M3.75 18.25a5.25 5.25 0 0 1 10.5 0" />
      <path d="M16 5.4a3.1 3.1 0 0 1 0 5.2" />
      <path d="M17.25 14.1a5.25 5.25 0 0 1 3 4.15" />
    </svg>
  )
}

/** Back to the list, phone only. A plain chevron, at the shared stroke. */
export function BackIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M14.25 5.75 8 12l6.25 6.25" />
    </svg>
  )
}

/**
 * A single leaf on a stem, for the resting pane and the empty state.
 *
 * The sprout motif is already the portal's own (SproutIcon, 7.1 follow-up) —
 * something growing, which is the brand's botanical line rather than a
 * decorative flourish added here.
 */
export function LeafIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M12 20.25V11.5" />
      <path d="M12 11.5c0-3.75 2.6-6.75 7-7.25.5 4.4-1.85 7.6-5.6 8.2-.5.08-.95.1-1.4.05Z" />
      <path d="M12 15.1c-.35.04-.72.03-1.1-.03-3-.5-4.9-3.05-4.5-6.6 3.5.4 5.6 2.8 5.6 5.8" />
    </svg>
  )
}

/**
 * The Client info tab — a record card with two lines on it, not the usual
 * circled "i", which reads as help rather than as someone's file.
 */
export function InfoIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <rect x="3.75" y="4.75" width="16.5" height="14.5" rx="2.5" />
      <circle cx="9" cy="10" r="1.85" />
      <path d="M5.9 16.1a3.4 3.4 0 0 1 6.2 0" />
      <path d="M14.75 9.5h3.5" />
      <path d="M14.75 13h3.5" />
    </svg>
  )
}

/** A page with a folded corner — a worksheet file. */
export function FileIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M7 3.75h6.75L18 8v10.25a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5.75a2 2 0 0 1 2-2Z" />
      <path d="M13.5 3.9V8.25H17.85" />
      <path d="M8.5 12.75h6.5" />
      <path d="M8.5 16h4" />
    </svg>
  )
}

/** An arrow rising out of a tray — sending a file up. */
export function UploadIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M12 15.25V4.75" />
      <path d="m7.75 9 4.25-4.25L16.25 9" />
      <path d="M4.75 14.75v2.5a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2v-2.5" />
    </svg>
  )
}

/** An arrow settling into a tray — taking a file down. */
export function DownloadIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M12 4.75v10.5" />
      <path d="m7.75 11 4.25 4.25L16.25 11" />
      <path d="M4.75 14.75v2.5a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2v-2.5" />
    </svg>
  )
}

/** An open ring with one hand — still with the client. */
export function WaitingIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M19.25 12a7.25 7.25 0 1 1-2.12-5.13" />
      <path d="M12 8v4l2.5 1.5" />
    </svg>
  )
}

/** A closed ring with a tick — their answers are back. */
export function ReturnedIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <circle cx="12" cy="12" r="7.25" />
      <path d="m8.75 12.25 2.25 2.25 4.25-4.5" />
    </svg>
  )
}

/** A camera body and lens — a video meeting, never a brand logo. */
export function VideoIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <rect x="3.25" y="7" width="12" height="10" rx="2" />
      <path d="m15.25 10.5 5.25-2.75v8.5l-5.25-2.75" />
    </svg>
  )
}

/** A struck ring — a session called off, kept on the record. */
export function CancelledIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <circle cx="12" cy="12" r="7.25" />
      <path d="m7 17 10-10" />
    </svg>
  )
}

/** A crescent — the time falls at night for the other person. */
export function MoonIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M19.25 14.5A7.75 7.75 0 1 1 9.5 4.75a6.25 6.25 0 0 0 9.75 9.75Z" />
    </svg>
  )
}

/** A folded note — words written for the client to read. */
export function NoteIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M6.25 3.75h8l3.5 3.5v13H6.25z" />
      <path d="M14.25 3.75v3.5h3.5" />
      <path d="M9 12h6" />
      <path d="M9 15.5h4" />
    </svg>
  )
}
