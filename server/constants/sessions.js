// Sessions — master spec §7.4, §8.4, §10.11, §15 (Timezone Handling).

export const SESSION_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const SESSION_STATUS_VALUES = Object.freeze(Object.values(SESSION_STATUS));

// Upcoming = still scheduled and not yet over; history = everything else,
// including a cancelled session whose date is still ahead.
export const SESSION_SCOPE = Object.freeze({
  UPCOMING: 'upcoming',
  HISTORY: 'history',
});

export const SESSION_SCOPE_VALUES = Object.freeze(Object.values(SESSION_SCOPE));

// A session that started within this window still counts as upcoming, so it
// does not vanish from the list while it is running. The Join window closes on
// the same boundary (9.4). Internal only: never shown as a session length.
export const SESSION_LIVE_WINDOW_MINUTES = 60;

// The Join button opens this long before the start (9.4).
export const SESSION_JOIN_OPENS_BEFORE_MINUTES = 10;

// 366, not 365, so a date one year out still fits across a leap day.
export const SESSION_HORIZON_DAYS = 366;

export const SESSION_NOTE_MAX = 500;
export const MEETING_LINK_MAX = 2048;

// Developer's decision, 2026-09-19: Zoom and Google Meet. The spec says Zoom.
// Exact host, or a true subdomain where `subdomains` is set — never a suffix
// match on the raw string, which would let `zoom.us.evil.example` through.
export const MEETING_LINK_HOSTS = Object.freeze([
  Object.freeze({ host: 'zoom.us', subdomains: true }),
  Object.freeze({ host: 'zoomgov.com', subdomains: true }),
  Object.freeze({ host: 'meet.google.com', subdomains: false }),
]);

export const SESSIONS_PAGE_SIZE = 20;
export const SESSIONS_MAX_PAGE_SIZE = 50;

/**
 * Reminder emails (9.6). `lead` is how far ahead it goes out; `cutoff` is how
 * late it may still be sent after a quiet period. A reminder is only ever sent
 * if the session was booked at least `lead` before its start — so a session
 * booked three hours ahead gets the hour reminder and never the day one, and a
 * session booked fifteen minutes ahead gets neither.
 */
export const SESSION_REMINDERS = Object.freeze({
  day: Object.freeze({ lead: 24 * 60 * 60 * 1000, cutoff: 2 * 60 * 60 * 1000 }),
  hour: Object.freeze({ lead: 60 * 60 * 1000, cutoff: 10 * 60 * 1000 }),
});

export const SESSION_REMINDER_KINDS = Object.freeze(Object.keys(SESSION_REMINDERS));

// How often the sweep runs inside the web server.
export const SESSION_REMINDER_INTERVAL_MS = 5 * 60 * 1000;

// ── refusals ────────────────────────────────────────────────────────────────

// One refusal for every "not yours / not there" case, as in 7.2 and 8.2.
export const SESSION_NOT_FOUND_MESSAGE = 'We could not find that session.';
export const SESSION_NOT_FOUND_CODE = 'SESSION_NOT_FOUND';

export const MEETING_LINK_MESSAGE =
  'Use a Zoom or Google Meet link that starts with https://.';

export const SESSION_TIME_NONEXISTENT_MESSAGE =
  'That time does not exist on that day, because the clocks go forward. Pick another time.';
export const SESSION_TIME_NONEXISTENT_CODE = 'SESSION_TIME_NONEXISTENT';

export const SESSION_DATE_INVALID_MESSAGE = 'That date does not exist. Check the day and month.';
export const SESSION_DATE_INVALID_CODE = 'SESSION_DATE_INVALID';

export const SESSION_TIME_PAST_MESSAGE = 'That time has already passed. Pick a time in the future.';
export const SESSION_TIME_PAST_CODE = 'SESSION_TIME_IN_PAST';

export const SESSION_TIME_TOO_FAR_MESSAGE =
  'Sessions can be scheduled up to a year ahead. Check the year.';
export const SESSION_TIME_TOO_FAR_CODE = 'SESSION_TIME_TOO_FAR';

export const SESSION_BOOKING_ENDED_MESSAGE =
  'Your work with this client has ended, so new sessions cannot be scheduled.';
export const SESSION_BOOKING_ENDED_CODE = 'SESSION_BOOKING_ENDED';

export const SESSION_CLIENT_ENDED_MESSAGE =
  "This client's subscription has ended, so they could not see a new session.";
export const SESSION_CLIENT_ENDED_CODE = 'SESSION_CLIENT_SUBSCRIPTION_ENDED';

export const SESSION_NOT_EDITABLE_MESSAGE = 'Only a scheduled session can be changed.';
export const SESSION_NOT_EDITABLE_CODE = 'SESSION_NOT_EDITABLE';

export const SESSION_NOT_CANCELLABLE_MESSAGE =
  'A completed session cannot be cancelled. If it did not take place, mark it that way instead.';
export const SESSION_NOT_CANCELLABLE_CODE = 'SESSION_NOT_CANCELLABLE';

export const SESSION_NOT_STARTED_MESSAGE = 'A session can be marked as held once it has started.';
export const SESSION_NOT_STARTED_CODE = 'SESSION_NOT_STARTED';

export const SESSION_NOT_COMPLETED_MESSAGE = 'Only a held session can be marked as not taking place.';
export const SESSION_NOT_COMPLETED_CODE = 'SESSION_NOT_COMPLETED';

// Scheduling beyond what is left is warned about, never blocked (9.5).
// A business decision for Asad to confirm.
export const SESSION_WARNING_OVER_REMAINING = 'OVER_REMAINING';

export const THERAPIST_TIMEZONE_MISSING_MESSAGE =
  'Your timezone is missing from your profile, so this time cannot be placed. Please contact support.';
export const THERAPIST_TIMEZONE_MISSING_CODE = 'THERAPIST_TIMEZONE_MISSING';

// ── rate limits ─────────────────────────────────────────────────────────────

// Stops automation, not a therapist planning a month of sessions.
export const SESSION_WRITE_RATE_LIMIT = Object.freeze({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: 'Too many session changes at once. Please try again in a little while.',
});

export const SESSIONS_READ_RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests. Please try again in a few minutes.',
});
