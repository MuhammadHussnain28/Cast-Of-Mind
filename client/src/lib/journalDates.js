/**
 * Entry dates, in the READER's own timezone.
 *
 * "Today" for a client in Dublin and their therapist in Perth are different
 * days, so the boundary is computed locally on each side rather than in UTC —
 * the same call 7.4 made for the chat's day separators.
 */

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const time = (date) => new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(date)

// timeStyle, never hour: 'numeric' — the latter renders "4:30" in 24-hour
// locales, which is ambiguous with no am/pm to disambiguate it (5.6).
export function entryDateLabel(value, now = new Date()) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86400000)

  if (days === 0) return `Today · ${time(date)}`
  if (days === 1) return `Yesterday · ${time(date)}`

  const sameYear = date.getFullYear() === now.getFullYear()
  const day = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date)

  return `${day} · ${time(date)}`
}

/** "Edited 3 Sept" — enough for a therapist to know the record changed. */
export function editedLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Edited'

  return `Edited ${new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(date)}`
}

export default { entryDateLabel, editedLabel }
