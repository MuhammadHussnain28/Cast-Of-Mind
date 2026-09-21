import { chat } from '../../data/chatContent.js'

// Session notices (9.3): the server sends the time as data and each reader's
// screen words it in their own zone. Pure, so it can be run in Node.

const copy = chat.sessionNotice

/** "Thursday, 14 August at 18:00" in `timeZone` and the reader's locale. */
export function sessionWhen(instant, timeZone, locale) {
  const at = new Date(instant)
  const date = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(at)
  const time = new Intl.DateTimeFormat(locale, { timeZone, timeStyle: 'short' }).format(at)
  return copy.joiner.replace('{date}', date).replace('{time}', time)
}

/** The sentence for a notice, or the stored fallback if it cannot be worded. */
export function sessionNoticeText(message, timeZone, locale) {
  const notice = message?.session
  if (!notice || !copy[notice.event]) return message?.text ?? ''
  try {
    const when = sessionWhen(notice.scheduledAt, timeZone, locale)
    const before = notice.previousScheduledAt
      ? sessionWhen(notice.previousScheduledAt, timeZone, locale)
      : ''
    return copy[notice.event].replace('{when}', when).replace('{before}', before)
  } catch {
    return message.text ?? ''
  }
}

/**
 * The soonest session still ahead, read from the notices alone — for a client
 * who has not opened the thread yet (their opening screen). Each session's
 * latest notice decides; a cancelled one drops out.
 */
export function nextSessionFromNotices(messages, now = new Date()) {
  const latest = new Map()
  for (const message of messages ?? []) {
    const notice = message?.session
    if (message?.type !== 'system' || !notice?.sessionId) continue
    const seen = latest.get(notice.sessionId)
    if (!seen || new Date(message.createdAt) >= new Date(seen.createdAt)) {
      latest.set(notice.sessionId, { ...notice, createdAt: message.createdAt })
    }
  }

  let next = null
  for (const notice of latest.values()) {
    if (notice.event === 'cancelled' || notice.event === 'not_held') continue
    const at = new Date(notice.scheduledAt)
    if (at <= now) continue
    if (!next || at < new Date(next.scheduledAt)) next = notice
  }
  return next
}

/** "Your next session: Thursday, 14 August at 18:00, your time." */
export function nextSessionLine(notice, timeZone, locale) {
  if (!notice) return null
  try {
    return copy.next.replace('{when}', sessionWhen(notice.scheduledAt, timeZone, locale))
  } catch {
    return null
  }
}
