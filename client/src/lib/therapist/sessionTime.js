import { partsInZone, resolveWallTime, WALL_TIME_REASON } from '../workingHours.js'

// The maths behind the scheduling preview (9.2): one wall-clock choice in the
// therapist's zone, read back in the client's. Pure, so it can be run in Node.

const MINUTE = 60 * 1000
const pad = (n) => String(n).padStart(2, '0')

// 22:00 to 06:59 counts as night on the preview dials and in the night note.
export const NIGHT_FROM = 22
export const NIGHT_UNTIL = 7

export const isNight = (hour) => hour >= NIGHT_FROM || hour < NIGHT_UNTIL

/** "New York" from "America/New_York"; "UTC" stays "UTC". */
export function zoneCity(timeZone) {
  if (!timeZone) return null
  const last = String(timeZone).split('/').pop()
  return last.replace(/_/g, ' ')
}

/** One instant, as the parts and labels a viewer in `timeZone` needs. */
export function wallInZone(instant, timeZone, locale) {
  const at = new Date(instant)
  const p = partsInZone(at, timeZone)
  return {
    ...p,
    dayKey: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    time: new Intl.DateTimeFormat(locale, { timeZone, timeStyle: 'short' }).format(at),
    date: new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(at),
    weekdayLong: new Intl.DateTimeFormat(locale, { timeZone, weekday: 'long' }).format(at),
    night: isNight(p.hour),
  }
}

// Minutes the client's clock is ahead (+) or behind (-) the therapist's.
function offsetBetween(instant, fromZone, toZone) {
  const a = partsInZone(instant, fromZone)
  const b = partsInZone(instant, toZone)
  const asUtc = (p) => Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)
  return Math.round((asUtc(b) - asUtc(a)) / MINUTE)
}

/** "5 hours behind you", "4 h 30 min ahead of you", or null when the same. */
export function offsetLabel(minutes) {
  if (!minutes) return null
  const abs = Math.abs(minutes)
  const hours = Math.floor(abs / 60)
  const mins = abs % 60
  const size = mins
    ? `${hours ? `${hours} h ` : ''}${mins} min`
    : `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  return `${size} ${minutes > 0 ? 'ahead of' : 'behind'} you`
}

/**
 * The preview for a date and time typed in the therapist's zone.
 *
 * @returns {{ status: 'empty'|'invalid'|'nonexistent'|'past'|'ok', instant: Date|null,
 *   therapist: object|null, client: object|null, dayShift: number, offset: number|null,
 *   sameZone: boolean, ambiguous: boolean }}
 */
export function previewSession({ date, time }, therapistZone, clientZone, { now = new Date(), locale } = {}) {
  const base = {
    instant: null,
    therapist: null,
    client: null,
    dayShift: 0,
    offset: null,
    sameZone: Boolean(clientZone) && clientZone === therapistZone,
    ambiguous: false,
  }

  if (!date || !time || !therapistZone) return { ...base, status: 'empty' }

  const result = resolveWallTime({ date, time }, therapistZone)
  if (result.reason === WALL_TIME_REASON.NONEXISTENT) return { ...base, status: 'nonexistent' }
  if (result.reason) return { ...base, status: 'invalid' }

  const instant = result.instant
  const therapist = wallInZone(instant, therapistZone, locale)
  const out = { ...base, instant, therapist, ambiguous: result.ambiguous }

  if (clientZone) {
    let client = null
    try {
      client = wallInZone(instant, clientZone, locale)
    } catch {
      client = null
    }
    if (client) {
      out.client = client
      out.offset = offsetBetween(instant, therapistZone, clientZone)
      out.dayShift = Math.round(
        (Date.UTC(client.year, client.month - 1, client.day) -
          Date.UTC(therapist.year, therapist.month - 1, therapist.day)) /
          (24 * 60 * MINUTE),
      )
    }
  }

  return { ...out, status: instant.getTime() <= now.getTime() ? 'past' : 'ok' }
}

/** "BST", "GMT+5:30" — the zone's short name at an instant, in the reader's locale. */
export function zoneAbbr(timeZone, at = new Date(), locale) {
  try {
    return (
      new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'short' })
        .formatToParts(new Date(at))
        .find((part) => part.type === 'timeZoneName')?.value ?? null
    )
  } catch {
    return null
  }
}

/** "New York · Eastern Daylight Time", for the client info row. */
export function zoneDescription(timeZone, at = new Date(), locale) {
  let long = null
  try {
    long =
      new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'long' })
        .formatToParts(new Date(at))
        .find((part) => part.type === 'timeZoneName')?.value ?? null
  } catch {
    return zoneCity(timeZone)
  }
  return long ? `${zoneCity(timeZone)} · ${long}` : zoneCity(timeZone)
}

/** A stored session's time as `{ date, time }` in the therapist's zone, for editing. */
export function toFormValues(scheduledAt, therapistZone) {
  const p = partsInZone(new Date(scheduledAt), therapistZone)
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` }
}

/** Today and a year ahead in the therapist's zone, for the date picker's bounds. */
export function dateBounds(therapistZone, now = new Date()) {
  const today = partsInZone(now, therapistZone)
  const min = `${today.year}-${pad(today.month)}-${pad(today.day)}`
  // A year ahead less a day, inside the server's 366-day limit.
  const ahead = new Date(Date.UTC(today.year + 1, today.month - 1, today.day) - 24 * 60 * MINUTE)
  const max = `${ahead.getUTCFullYear()}-${pad(ahead.getUTCMonth() + 1)}-${pad(ahead.getUTCDate())}`
  return { min, max }
}

/**
 * Would a session at `instant` go past what is left this cycle? (9.5) Warned,
 * never blocked. Only sessions before the cycle's end count towards it.
 * @returns {{ over: boolean, scheduled: number }|null} null when it is next cycle's
 */
export function overCycleLimit(cycle, instant) {
  if (!cycle?.endsAt || !instant) return null
  const end = new Date(cycle.endsAt).getTime()
  if (new Date(instant).getTime() >= end) return null
  const scheduled = (cycle.scheduledTimes ?? []).filter((t) => new Date(t).getTime() < end).length
  return { over: scheduled + 1 > cycle.remaining, scheduled }
}
