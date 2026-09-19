import { moodPath } from '../../../lib/client/moods'

/**
 * Journal and notes icons — 24 viewBox, 1.5 stroke, round caps, colour
 * inherited, matching ClientPortalIcons and TherapistPortalIcons.
 * Every shape is bounds-checked against the viewBox including the stroke.
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

/** One mood, drawn as the line it behaves like. Sits on a 24x12 box. */
export function MoodStroke({ label, width = 24, ...props }) {
  return (
    <svg
      viewBox="0 0 24 12"
      width={width}
      height={width / 2}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={moodPath(label)} />
    </svg>
  )
}

/** Two pages, one behind the other — the same writing, read by two people. */
export function SharedPageIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M8.75 3.25h5.5l3.5 3.5v10.5a1.75 1.75 0 0 1-1.75 1.75h-7.25a1.75 1.75 0 0 1-1.75-1.75V5a1.75 1.75 0 0 1 1.75-1.75Z" />
      <path d="M14 3.4v3.4h3.4" />
      <path d="M5.25 6.5A1.75 1.75 0 0 0 3.5 8.25v10.5A1.75 1.75 0 0 0 5.25 20.5h7.25" />
    </svg>
  )
}

/** A nib — the act of writing, not a file or a folder. */
export function QuillIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M19.75 4.25c-6.5.5-10.75 3.75-12.25 8.5l3.75 3.75c4.75-1.5 8-5.75 8.5-12.25Z" />
      <path d="m7.5 12.75 3.75 3.75" />
      <path d="M6.25 17.75 4.25 19.75" />
      <path d="M13.5 10.5 9.75 14.25" />
    </svg>
  )
}

/** A folded note with a written line — the therapist's own record. */
export function ClinicalNoteIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M5.5 4.75A1.75 1.75 0 0 1 7.25 3h9.5a1.75 1.75 0 0 1 1.75 1.75v10.5L14 19.5H7.25a1.75 1.75 0 0 1-1.75-1.75V4.75Z" />
      <path d="M18.4 15.1h-3.15a1 1 0 0 0-1 1v3.3" />
      <path d="M8.75 8h6.5" />
      <path d="M8.75 11.5h4.25" />
    </svg>
  )
}

/** A closed clasp — nobody else holds a key to this. */
export function PrivateIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M6.25 10.5h11.5a1.25 1.25 0 0 1 1.25 1.25v7a1.25 1.25 0 0 1-1.25 1.25H6.25A1.25 1.25 0 0 1 5 18.75v-7a1.25 1.25 0 0 1 1.25-1.25Z" />
      <path d="M8.25 10.5V7.75a3.75 3.75 0 0 1 7.5 0v2.75" />
      <path d="M12 14.25v2.25" />
    </svg>
  )
}

/** A short rule with a node — one day on the spine. */
export function EntryNodeIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 3.25v3" />
      <path d="M12 17.75v3" />
    </svg>
  )
}

/** A line being rewritten — the edit action. */
export function EditIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M15.75 4.5a1.77 1.77 0 0 1 2.5 0l1.25 1.25a1.77 1.77 0 0 1 0 2.5L9 19.75l-4 1 1-4Z" />
      <path d="m14.5 5.75 3.75 3.75" />
    </svg>
  )
}

/** A bin with a lifted lid — deletion, and it is permanent. */
export function DeleteIcon({ size = 20, ...props }) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M4.75 6.75h14.5" />
      <path d="M9.25 6.75V5.25a1.5 1.5 0 0 1 1.5-1.5h2.5a1.5 1.5 0 0 1 1.5 1.5v1.5" />
      <path d="M6.75 6.75v12a1.5 1.5 0 0 0 1.5 1.5h7.5a1.5 1.5 0 0 0 1.5-1.5v-12" />
      <path d="M10.25 10.5v6" />
      <path d="M13.75 10.5v6" />
    </svg>
  )
}
