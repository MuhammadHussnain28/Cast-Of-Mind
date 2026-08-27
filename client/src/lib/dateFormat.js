/**
 * Date/time display helpers built on the native Intl API — never manual
 * offset math, matching the backend's own rule (see .claude/rules/backend.md).
 *
 * `timeZone` is optional everywhere. Omit it and the browser's own zone is
 * used, which is fine for now (no feature reads a stored UTC timestamp yet).
 * Intl.DateTimeFormat already accepts any IANA zone string (e.g.
 * "Europe/London"), so when session/chat timestamps land (§15 — store UTC,
 * display in the viewer's IANA zone from their profile) these same
 * functions take a `timeZone` argument. No new library needed then either.
 */

function toDate(value) {
  return value instanceof Date ? value : new Date(value)
}

export function formatDate(value, { timeZone } = {}) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone,
  }).format(toDate(value))
}

export function formatTime(value, { timeZone } = {}) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(toDate(value))
}

export function formatDateTime(value, { timeZone } = {}) {
  return `${formatDate(value, { timeZone })}, ${formatTime(value, { timeZone })}`
}

const RELATIVE_UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
]

/** "2 hours ago" / "in 3 days" — for chat timestamps, notification feeds. */
export function formatRelative(value, { now = new Date() } = {}) {
  const diffSeconds = (toDate(value).getTime() - now.getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' })

  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= secondsInUnit || unit === 'second') {
      return rtf.format(Math.round(diffSeconds / secondsInUnit), unit)
    }
  }
  return rtf.format(0, 'second')
}
