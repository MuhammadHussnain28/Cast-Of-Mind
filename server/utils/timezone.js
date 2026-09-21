// Timezone conversion — master spec §15. Store UTC, show each viewer their own clock.
// Built on Intl (the IANA database via ICU), never hand-written offsets. Same method
// as client/src/lib/workingHours.js.

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

export const LOCAL_TIME_REASON = Object.freeze({
  INVALID_DATE: 'invalid_date',
  INVALID_TIME: 'invalid_time',
  INVALID_ZONE: 'invalid_zone',
  NONEXISTENT: 'nonexistent',
});

// Building a formatter is costly and there are only a few hundred zones.
const partsFormatters = new Map();

function partsFormatter(timeZone) {
  let formatter = partsFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
    });
    partsFormatters.set(timeZone, formatter);
  }
  return formatter;
}

export function isValidTimeZone(timeZone) {
  if (typeof timeZone !== 'string' || !timeZone.trim()) return false;
  try {
    partsFormatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** The wall clock an instant shows in `timeZone`. Throws RangeError on an unknown zone. */
export function partsInZone(instant, timeZone) {
  const parts = {};
  for (const part of partsFormatter(timeZone).formatToParts(new Date(instant))) {
    parts[part.type] = part.value;
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: parts.weekday,
  };
}

// The zone's offset from UTC at an instant, in ms (east positive).
function offsetAt(instant, timeZone) {
  const at = Math.floor(instant / MINUTE) * MINUTE;
  const p = partsInZone(at, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - at;
}

function parseDate(date) {
  const match = DATE_PATTERN.exec(String(date ?? ''));
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  // Date.UTC maps years below 100 onto the 1900s, and nothing here is pre-1970.
  if (year < 1970) return null;
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return { year, month, day };
}

function parseTime(time) {
  const match = TIME_PATTERN.exec(String(time ?? ''));
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}

/**
 * A wall-clock date and time in `timeZone`, as one UTC instant.
 *
 * Every offset in force within a day either side is tried, and only candidates
 * that read back as the same wall clock are kept. None means the clocks skipped
 * that time; two means it happened twice, and the earlier one is used.
 *
 * @returns {{ instant: Date|null, reason: string|null, ambiguous: boolean }}
 */
export function localTimeToUtc({ date, time }, timeZone) {
  const fail = (reason) => ({ instant: null, reason, ambiguous: false });

  if (!isValidTimeZone(timeZone)) return fail(LOCAL_TIME_REASON.INVALID_ZONE);
  const d = parseDate(date);
  if (!d) return fail(LOCAL_TIME_REASON.INVALID_DATE);
  const t = parseTime(time);
  if (!t) return fail(LOCAL_TIME_REASON.INVALID_TIME);

  const wall = Date.UTC(d.year, d.month - 1, d.day, t.hour, t.minute);
  const offsets = new Set([
    offsetAt(wall - DAY, timeZone),
    offsetAt(wall, timeZone),
    offsetAt(wall + DAY, timeZone),
  ]);

  const matches = [...offsets]
    .map((offset) => wall - offset)
    .filter((candidate) => {
      const p = partsInZone(candidate, timeZone);
      return (
        p.year === d.year &&
        p.month === d.month &&
        p.day === d.day &&
        p.hour === t.hour &&
        p.minute === t.minute
      );
    })
    .sort((a, b) => a - b);

  if (matches.length === 0) return fail(LOCAL_TIME_REASON.NONEXISTENT);
  return { instant: new Date(matches[0]), reason: null, ambiguous: matches.length > 1 };
}

/**
 * An instant for display in any zone, with its abbreviation (EDT, BST, GMT+5:30).
 * The abbreviation depends on the locale: en-GB gives BST for London, en-US gives GMT+1.
 */
export function formatInZone(instant, timeZone, { locale = 'en-GB' } = {}) {
  const at = new Date(instant);
  const date = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(at);
  // timeStyle, never hour: 'numeric', which drops am/pm in some locales (7.1).
  const time = new Intl.DateTimeFormat(locale, { timeZone, timeStyle: 'short' }).format(at);
  const zone =
    new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'short' })
      .formatToParts(at)
      .find((part) => part.type === 'timeZoneName')?.value ?? timeZone;

  return { date, time, zone, text: `${date}, ${time} ${zone}` };
}

export default { isValidTimeZone, partsInZone, localTimeToUtc, formatInZone, LOCAL_TIME_REASON };
