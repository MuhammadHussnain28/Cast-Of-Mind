/**
 * The eight moods, each drawn as the shape of a line rather than only named.
 *
 * A row of eight word-chips would be text in boxes, which is what the standing
 * directive rules out — so each mood carries a 24x12 stroke that behaves the
 * way the feeling does: Low descends, Hopeful rises, Flat holds, Anxious
 * ripples, Angry spikes, Overwhelmed climbs out of its own range. The word is
 * the caption underneath it.
 *
 * APPROVED 2026-09-18: these eight plus a custom word the client types.
 * THE LIST IS OURS, NOT ASAD'S — it wants his confirmation before launch, on
 * the same footing as the relationship-status list from 5.1.
 */

// Paths live inside x 2-22, y 2.75-9.5 of a 24x12 box, so a 1.5 stroke fits.
export const MOODS = Object.freeze([
  { label: 'Low', path: 'M2 3.5 C 8 3.5, 14 9, 22 9' },
  {
    label: 'Anxious',
    path: 'M2 6 L4.5 4.75 L7 7.25 L9.5 4.75 L12 7.25 L14.5 4.75 L17 7.25 L19.5 4.75 L22 6',
  },
  { label: 'Flat', path: 'M2 6 H22' },
  { label: 'Steady', path: 'M2 6.5 C 7 5, 11 7.5, 16 5.75 C 19 4.75, 21 5.5, 22 5.75' },
  { label: 'Hopeful', path: 'M2 9 C 8 9, 14 3, 22 2.75' },
  { label: 'Tired', path: 'M2 4 C 7 9.5, 13 9.75, 17 8 C 19.5 7, 21 6.5, 22 6.25' },
  { label: 'Angry', path: 'M2 9.5 L7 2.75 L11 9.5 L16 2.75 L19 8 L22 5.5' },
  {
    label: 'Overwhelmed',
    path: 'M2 6.25 L4 5.25 L6 7.25 L8 4.5 L10 8 L12 3.75 L14 8.75 L16 3 L18 9.25 L20 3 L22 7',
  },
])

// A word we did not write gets an open, unfinished line.
export const CUSTOM_MOOD_PATH = 'M2 6 H9 M13 6 H16 M20 6 H22'

export const MOOD_TAG_MAX = 30

const BY_LABEL = new Map(MOODS.map((mood) => [mood.label, mood.path]))

/** A preset's own line, or the open one for anything the client typed. */
export function moodPath(label) {
  return BY_LABEL.get(label) ?? CUSTOM_MOOD_PATH
}

export function isPresetMood(label) {
  return BY_LABEL.has(label)
}
