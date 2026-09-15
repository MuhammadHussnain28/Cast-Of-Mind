import { DAY_KEYS } from '../data/matchesContent.js'
import { partsInZone, wallTimeToInstant } from './workingHours.js'

/**
 * "Is my therapist working right now?" — answered from their recurring hours.
 *
 * WHAT THIS IS NOT. It is not presence. §7.1 is explicit that there is no
 * "unavailable" barrier and that a message simply waits when the therapist is
 * offline, so nothing here gates anything and no online/offline state is ever
 * claimed. It reports published working hours and nothing more.
 *
 * The DST-safe wall-clock arithmetic is reused from `workingHours.js` rather
 * than rewritten — that module carries the two-pass conversion and 21 tests
 * behind it.
 */

const DAY_MS = 24 * 60 * 60 * 1000

function parseTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value ?? '')
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null
}

/**
 * Every working span across a two-week window, as real instants.
 *
 * Two weeks rather than one because the next span may be Monday of next week —
 * a Friday evening with a Monday-to-Friday therapist is the common case, and a
 * single-week window answers "never" for it.
 */
function spansInWindow(workingHours, zone, from) {
  const monday = new Date(from)
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))

  const spans = []

  for (let week = 0; week < 2; week += 1) {
    DAY_KEYS.forEach((key, index) => {
      const day = workingHours?.[key]
      const start = parseTime(day?.start)
      const end = parseTime(day?.end)
      if (!day?.enabled || !start || !end) return

      const date = new Date(monday.getTime() + (week * 7 + index) * DAY_MS)
      const y = date.getUTCFullYear()
      const m = date.getUTCMonth() + 1
      const d = date.getUTCDate()

      // An end earlier than its start means the span runs past midnight.
      const endsNextDay =
        end.hour < start.hour || (end.hour === start.hour && end.minute < start.minute)

      spans.push({
        startsAt: wallTimeToInstant(y, m, d, start.hour, start.minute, zone),
        endsAt: wallTimeToInstant(y, m, d + (endsNextDay ? 1 : 0), end.hour, end.minute, zone),
      })
    })
  }

  return spans.sort((a, b) => a.startsAt - b.startsAt)
}

/**
 * @returns `{ state, endsAt, startsAt }` where state is:
 *   `working`  — now sits inside a published span
 *   `upcoming` — not now, but there is a next span within two weeks
 *   `unknown`  — no usable hours at all; the caller shows nothing
 */
export function therapistAvailability(workingHours, therapistZone, now = new Date()) {
  if (!workingHours || !therapistZone) return { state: 'unknown' }

  const at = now.getTime()

  let spans
  try {
    spans = spansInWindow(workingHours, therapistZone, now)
  } catch {
    // An unrecognised IANA zone makes Intl throw. A broken hours line must
    // never take the portal down with it.
    return { state: 'unknown' }
  }

  if (spans.length === 0) return { state: 'unknown' }

  const current = spans.find((span) => at >= span.startsAt && at < span.endsAt)
  if (current) return { state: 'working', endsAt: new Date(current.endsAt) }

  const next = spans.find((span) => span.startsAt > at)
  if (next) return { state: 'upcoming', startsAt: new Date(next.startsAt) }

  return { state: 'unknown' }
}

/**
 * The availability as one short clinic line, in the READER's own clock.
 *
 * Wording set by the developer, 2026-09-13. The earlier version read "Back
 * tomorrow at 12:00 your time", which landed as a closed door and wrapped onto
 * two lines in a 272px rail. Clinic language is warmer and shorter:
 *
 *   in hours   — In clinic today · Until 12:30 PM
 *   later today — Next in clinic: Today, 4:30 PM
 *   tomorrow    — Next in clinic: Tomorrow, 12:00 PM
 *   beyond      — Next in clinic: Monday, 9:00 AM
 *
 * THE "your time" SUFFIX WAS DROPPED ON PURPOSE, to keep the line unwrapped.
 * Every time here is still converted into the reader's own zone — that has not
 * changed — but the line no longer says so. Worth knowing, because a Dublin
 * client reading a Kolkata therapist's hours has no on-screen cue that the
 * conversion already happened. The chat header (7.2) carries the fuller
 * sentence, which is where that reassurance now lives.
 *
 * Times are formatted in the viewer's locale rather than a pinned one, because
 * this is the one string on the page that is about their own day. `locale` is
 * injectable so it can be tested deterministically.
 */
export function availabilityLabel(availability, viewerZone, now = new Date(), locale = undefined) {
  if (!availability || availability.state === 'unknown') return null

  // `timeStyle: 'short'` rather than hour/minute parts, because it is idiomatic
  // in BOTH clock conventions: a 24-hour locale gets "04:30" and a 12-hour one
  // gets "4:30 PM". Spelling the parts out gave "4:30" on a 24-hour locale,
  // which reads as ambiguous with no am/pm to disambiguate it.
  const time = (date) =>
    new Intl.DateTimeFormat(locale, { timeZone: viewerZone, timeStyle: 'short' }).format(date)

  const dayName = (date) =>
    new Intl.DateTimeFormat(locale, { timeZone: viewerZone, weekday: 'long' }).format(date)

  const sameDay = (a, b) => {
    const pa = partsInZone(a, viewerZone)
    const pb = partsInZone(b, viewerZone)
    return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day
  }

  if (availability.state === 'working') {
    return `In clinic today · Until ${time(availability.endsAt)}`
  }

  const { startsAt } = availability
  if (sameDay(startsAt, now)) return `Next in clinic: Today, ${time(startsAt)}`

  const tomorrow = new Date(now.getTime() + DAY_MS)
  if (sameDay(startsAt, tomorrow)) return `Next in clinic: Tomorrow, ${time(startsAt)}`

  return `Next in clinic: ${dayName(startsAt)}, ${time(startsAt)}`
}
