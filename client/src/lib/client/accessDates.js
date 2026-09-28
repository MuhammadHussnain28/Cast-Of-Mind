/**
 * Dates on the subscription screens (11.2, 11.3), in the reader's own clock.
 * One helper so the banner, the account page and the cancel panel word a date
 * identically. timeStyle, never hour: 'numeric', which drops am/pm (7.1).
 */

function toDate(value) {
  const at = value instanceof Date ? value : new Date(value)
  return Number.isNaN(at.getTime()) ? null : at
}

/** "Saturday 17 October" */
export function longDate(value) {
  const at = toDate(value)
  if (!at) return null
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(at)
}

/** "Saturday 17 October, 14:05" */
export function longDateTime(value) {
  const at = toDate(value)
  if (!at) return null
  return `${longDate(at)}, ${new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(at)}`
}

/** For a <time dateTime> attribute. */
export function isoOf(value) {
  const at = toDate(value)
  return at ? at.toISOString() : undefined
}
