import { partsInZone } from '../workingHours.js'

// The client's Session Hub (9.4). Pure, so it can be run in Node.

const pad = (n) => String(n).padStart(2, '0')

/** Everything the page shows about one instant, in the reader's own zone. */
export function sessionDisplay(instant, timeZone, locale) {
  const at = new Date(instant)
  const f = (options) => new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(at)
  const p = partsInZone(at, timeZone)
  return {
    dayKey: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    weekday: f({ weekday: 'short' }),
    weekdayLong: f({ weekday: 'long' }),
    day: p.day,
    month: f({ month: 'short' }),
    dateLong: f({ weekday: 'long', day: 'numeric', month: 'long' }),
    dateShort: f({ weekday: 'short', day: 'numeric', month: 'short' }),
    time: f({ timeStyle: 'short' }),
  }
}

/**
 * Where a session stands against its Join window, by the reader's clock.
 * The window itself comes from the server, so the two cannot disagree.
 * 'fetching' means the window is open but the link has not arrived yet.
 */
export function joinState(session, now = new Date()) {
  if (session?.status !== 'scheduled' || !session.joinOpensAt || !session.joinClosesAt) return 'none'
  const t = now.getTime()
  if (t < Date.parse(session.joinOpensAt)) return 'before'
  if (t >= Date.parse(session.joinClosesAt)) return 'after'
  return session.zoomLink ? 'open' : 'fetching'
}

/**
 * The next moment the page should ask the server again: a Join window edge, or
 * soon if a window is open but its link has not arrived. Null if nothing is due.
 */
export function nextRefreshAt(sessions, now = new Date()) {
  const t = now.getTime()
  let next = null
  for (const s of sessions ?? []) {
    if (joinState(s, now) === 'fetching') return new Date(t + 30 * 1000)
    for (const edge of [s.joinOpensAt, s.joinClosesAt]) {
      const at = edge ? Date.parse(edge) : NaN
      if (at > t && (next === null || at < next)) next = at
    }
  }
  return next === null ? null : new Date(next)
}

/**
 * The counter: sessions left, and what happens at the end of the period.
 * A cancelled plan still inside its paid period ends rather than resets (§13).
 */
export function counterView(subscription, access, timeZone, locale) {
  const left = subscription?.sessionsRemaining
  if (left == null) return null
  const end = subscription.currentPeriodEnd
  const date = end
    ? new Intl.DateTimeFormat(locale, { timeZone, day: 'numeric', month: 'long' }).format(new Date(end))
    : null
  return {
    left: Math.max(0, Math.min(4, left)),
    total: 4,
    ending: access === 'ending',
    date,
  }
}
