import { DAY_KEYS, DAY_LABELS, DAY_SHORT } from '../data/matchesContent.js'

/**
 * Working hours, converted from the therapist's timezone into the viewer's.
 *
 * WHY THIS IS NOT A SIMPLE CONVERSION. Working hours are RECURRING LOCAL TIMES,
 * not timestamps, so §15's "store UTC, convert on display" does not apply
 * directly. Three things bite:
 *
 *  1. THE DAY ROLLS OVER. A Perth therapist working Monday 09:00-17:00 is
 *     Sunday 21:00 - Monday 05:00 in Toronto. Converting the clock time and
 *     keeping the day label would be quietly wrong for half the world.
 *  2. DST MAKES ANY WEEKLY ANSWER APPROXIMATE. A recurring schedule has no
 *     date, so a reference date has to be chosen and the answer shifts when
 *     either country changes its clocks. The page says so rather than pretending.
 *  3. A span can cross midnight in the viewer's zone even when it did not in
 *     the therapist's.
 *
 * Built on `Intl` only — the same choice `dateFormat.js` made, and it already
 * knows every IANA zone and its DST rules, so no library is needed.
 */

/**
 * Reads an instant back as wall-clock parts in a given zone.
 *
 * Exported for `therapistAvailability.js`, which needs the same DST-safe
 * arithmetic to answer "is the therapist working right now". A second copy of
 * this is how two screens end up disagreeing about a Perth therapist's Monday.
 */
export function partsInZone(instant, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  })

  const parts = {}
  for (const part of formatter.formatToParts(instant)) parts[part.type] = part.value

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: parts.weekday,
  }
}

/**
 * The wall-clock time `hh:mm` on a given date in `timeZone`, as a UTC instant.
 *
 * Two passes, not one: the first guess assumes the wall time is UTC and
 * measures how far off the zone puts it; the second corrects a residual error
 * that appears when the offset itself changes across the guessed instant, which
 * is exactly what happens on a DST boundary.
 */
export function wallTimeToInstant(year, month, day, hour, minute, timeZone) {
  let instant = Date.UTC(year, month - 1, day, hour, minute)

  for (let pass = 0; pass < 2; pass += 1) {
    const seen = partsInZone(instant, timeZone)
    const seenAsUtc = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute)
    const drift = seenAsUtc - Date.UTC(year, month - 1, day, hour, minute)
    if (drift === 0) break
    instant -= drift
  }

  return instant
}

export const WALL_TIME_REASON = Object.freeze({
  INVALID_DATE: 'invalid_date',
  INVALID_TIME: 'invalid_time',
  INVALID_ZONE: 'invalid_zone',
  NONEXISTENT: 'nonexistent',
})

const DAY_MS = 24 * 60 * 60 * 1000

function offsetAt(instant, timeZone) {
  const at = Math.floor(instant / 60000) * 60000
  const p = partsInZone(at, timeZone)
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - at
}

/**
 * A dated wall-clock time (`YYYY-MM-DD`, `HH:MM`) in `timeZone`, as one instant,
 * by the same rules as the server's `utils/timezone.js`: a skipped time is
 * `nonexistent`, a repeated time takes the first. A server parity test holds
 * the two together, so the scheduling preview cannot disagree with what is stored.
 *
 * @returns {{ instant: Date|null, reason: string|null, ambiguous: boolean }}
 */
export function resolveWallTime({ date, time }, timeZone) {
  const fail = (reason) => ({ instant: null, reason, ambiguous: false })

  try {
    if (!timeZone) return fail(WALL_TIME_REASON.INVALID_ZONE)
    partsInZone(0, timeZone)
  } catch {
    return fail(WALL_TIME_REASON.INVALID_ZONE)
  }

  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date ?? ''))
  if (!d) return fail(WALL_TIME_REASON.INVALID_DATE)
  const [year, month, day] = d.slice(1).map(Number)
  const check = new Date(Date.UTC(year, month - 1, day))
  if (year < 1970 || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return fail(WALL_TIME_REASON.INVALID_DATE)
  }

  const t = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(time ?? ''))
  if (!t) return fail(WALL_TIME_REASON.INVALID_TIME)
  const hour = Number(t[1])
  const minute = Number(t[2])

  const wall = Date.UTC(year, month - 1, day, hour, minute)
  const offsets = new Set([
    offsetAt(wall - DAY_MS, timeZone),
    offsetAt(wall, timeZone),
    offsetAt(wall + DAY_MS, timeZone),
  ])

  const matches = [...offsets]
    .map((offset) => wall - offset)
    .filter((candidate) => {
      const p = partsInZone(candidate, timeZone)
      return p.year === year && p.month === month && p.day === day && p.hour === hour && p.minute === minute
    })
    .sort((a, b) => a - b)

  if (matches.length === 0) return fail(WALL_TIME_REASON.NONEXISTENT)
  return { instant: new Date(matches[0]), reason: null, ambiguous: matches.length > 1 }
}

function parseTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value ?? '')
  if (!match) return null
  return { hour: Number(match[1]), minute: Number(match[2]) }
}

const pad = (n) => String(n).padStart(2, '0')

/**
 * @returns rows of `{ key, label, enabled, theirs, yours, crossesDay }`, where
 *   `yours` carries the viewer's weekday for each end of the span so a rollover
 *   is visible rather than silently absorbed.
 */
export function convertWorkingHours(workingHours, fromZone, toZone, referenceDate = new Date()) {
  // Monday of the reference week, so every day converts against a date that is
  // actually near today and therefore has today's DST offset.
  const monday = new Date(referenceDate)
  const offsetToMonday = (monday.getUTCDay() + 6) % 7
  monday.setUTCDate(monday.getUTCDate() - offsetToMonday)

  return DAY_KEYS.map((key, index) => {
    const day = workingHours?.[key]
    const start = parseTime(day?.start)
    const end = parseTime(day?.end)
    const enabled = Boolean(day?.enabled && start && end)

    const row = {
      key,
      label: DAY_LABELS[index],
      enabled,
      theirs: enabled ? `${day.start} – ${day.end}` : null,
      yours: null,
      crossesDay: false,
    }

    if (!enabled) return row

    const date = new Date(monday)
    date.setUTCDate(date.getUTCDate() + index)

    const y = date.getUTCFullYear()
    const m = date.getUTCMonth() + 1
    const d = date.getUTCDate()

    const startInstant = wallTimeToInstant(y, m, d, start.hour, start.minute, fromZone)
    // An end earlier than its start means the therapist works past midnight,
    // so the span genuinely ends on the following day.
    const endsNextDay =
      end.hour < start.hour || (end.hour === start.hour && end.minute < start.minute)
    const endInstant = wallTimeToInstant(
      y,
      m,
      d + (endsNextDay ? 1 : 0),
      end.hour,
      end.minute,
      fromZone,
    )

    const startHere = partsInZone(startInstant, toZone)
    const endHere = partsInZone(endInstant, toZone)

    row.yours = {
      startDay: startHere.weekday,
      startTime: `${pad(startHere.hour)}:${pad(startHere.minute)}`,
      endDay: endHere.weekday,
      endTime: `${pad(endHere.hour)}:${pad(endHere.minute)}`,
    }

    // True when the viewer's version does not sit inside the therapist's day —
    // either it starts on a different weekday, or it spills into the next one.
    row.crossesDay =
      startHere.weekday !== DAY_SHORT[index] || endHere.weekday !== startHere.weekday

    return row
  })
}

/** The viewer's own zone, or a sane fallback if the browser will not say. */
export function detectViewerZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** True when the therapist works no days at all — an honest empty state. */
export function hasAnyHours(rows) {
  return rows.some((row) => row.enabled)
}
