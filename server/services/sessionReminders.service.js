import { Session } from '../models/Session.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { sendSessionReminderEmail } from './email/email.service.js';
import { completeOverdue } from './sessionCounter.service.js';
import { findCurrentSubscription, resolveAccess } from '../middleware/requireActiveSubscription.js';
import { PORTAL_ALLOWED_ACCESS } from '../constants/clientPortal.js';
import { BOOKING_STATUS } from '../constants/payments.js';
import { USER_STATUS } from '../constants/roles.js';
import { clientDisplayName } from '../utils/clientDisplayName.js';
import { formatInZone, isValidTimeZone } from '../utils/timezone.js';
import {
  SESSION_STATUS,
  SESSION_REMINDERS,
  SESSION_REMINDER_KINDS,
  SESSION_REMINDER_INTERVAL_MS,
  SESSION_LIVE_WINDOW_MINUTES,
} from '../constants/sessions.js';

/**
 * Session reminders — master spec §16, chunk 9.6.
 *
 * NOTHING HERE IS LOGGED BUT IDS AND ROLES: no address, no meeting link, no
 * session note. A reminder is claimed before it is sent, so it can never go
 * twice; a failed send is logged and not retried.
 */

const LIVE_WINDOW = SESSION_LIVE_WINDOW_MINUTES * 60 * 1000;
const cityOf = (zone) => String(zone).split('/').pop().replace(/_/g, ' ');

/** "Thursday, 14 August 2026 at 10:00 (New York time)" */
export function whenText(instant, timeZone) {
  const { date, time } = formatInZone(instant, timeZone, { locale: 'en-GB' });
  return `${date} at ${time} (${cityOf(timeZone)} time)`;
}

/**
 * Which reminders this session is due, right now.
 *
 * A reminder is only ever sent if the session was on the calendar at least its
 * own notice ahead of the start: booked three hours ahead gets the hour one and
 * never the day one; booked fifteen minutes ahead gets neither. `timeSetAt`
 * moves whenever the time moves, so a rescheduled session is judged afresh.
 */
export function dueKinds(therapySession, now = new Date()) {
  const start = new Date(therapySession.scheduledAt).getTime();
  const setAt = new Date(therapySession.timeSetAt ?? therapySession.createdAt ?? start).getTime();
  const at = now.getTime();

  return SESSION_REMINDER_KINDS.filter((kind) => {
    const { lead, cutoff } = SESSION_REMINDERS[kind];
    if (start - setAt < lead) return false;
    if (at < start - lead || at >= start - cutoff) return false;
    const already = therapySession.reminders?.[kind];
    return !already || new Date(already.for).getTime() !== start;
  });
}

// One winner per reminder, per session time — even across two servers.
async function claim(therapySession, kind, now) {
  const path = `reminders.${kind}`;
  return Session.findOneAndUpdate(
    {
      _id: therapySession._id,
      status: SESSION_STATUS.SCHEDULED,
      scheduledAt: therapySession.scheduledAt,
      [`${path}.for`]: { $ne: therapySession.scheduledAt },
    },
    { $set: { [path]: { for: therapySession.scheduledAt, claimedAt: now } } },
    { new: true },
  );
}

async function send(to, payload, kind, sessionId, role) {
  try {
    await sendSessionReminderEmail(to, payload);
    console.log(`[reminders] ${kind} sent to the ${role} — session ${sessionId}`);
    return true;
  } catch (error) {
    console.error(
      `[reminders] ${kind} FAILED for the ${role} — session ${sessionId} (${error?.name ?? 'Error'})`,
    );
    return false;
  }
}

/** Both people, each in their own clock. Skips a session nobody should be reminded of. */
async function remind(therapySession, kind, now) {
  const booking = await Booking.findById(therapySession.bookingId);
  if (!booking || booking.status !== BOOKING_STATUS.ACTIVE) return { skipped: 'booking' };

  const [clientUser, therapistUser, clientProfile, therapistProfile, subscription] = await Promise.all([
    User.findById(booking.clientId),
    User.findById(booking.therapistId),
    ClientProfile.findOne({ userId: booking.clientId }),
    TherapistProfile.findOne({ userId: booking.therapistId }),
    findCurrentSubscription(booking.clientId),
  ]);

  if (clientUser?.status !== USER_STATUS.ACTIVE || therapistUser?.status !== USER_STATUS.ACTIVE) {
    return { skipped: 'account' };
  }
  // Past-due and cancelled-but-still-paid keep their sessions (§13). Ended does not.
  if (!PORTAL_ALLOWED_ACCESS.includes(resolveAccess(subscription))) return { skipped: 'subscription' };

  const therapistZone = isValidTimeZone(therapistProfile?.timezone) ? therapistProfile.timezone : 'UTC';
  const clientZone = isValidTimeZone(clientProfile?.timezone) ? clientProfile.timezone : therapistZone;
  const therapistName = therapistProfile
    ? [therapistProfile.title, therapistProfile.firstName, therapistProfile.lastName].filter(Boolean).join(' ')
    : 'your therapist';
  const clientName = clientDisplayName(clientProfile) || 'your client';
  const sessionId = String(therapySession._id);

  const clientSent = await send(
    clientUser.email,
    { recipient: 'client', kind, when: whenText(therapySession.scheduledAt, clientZone), otherName: therapistName },
    kind,
    sessionId,
    'client',
  );
  const therapistSent = await send(
    therapistUser.email,
    {
      recipient: 'therapist',
      kind,
      when: whenText(therapySession.scheduledAt, therapistZone),
      otherName: clientName,
      meetingLink: therapySession.zoomLink,
    },
    kind,
    sessionId,
    'therapist',
  );

  const stamps = {};
  if (clientSent) stamps[`reminders.${kind}.clientSentAt`] = now;
  if (therapistSent) stamps[`reminders.${kind}.therapistSentAt`] = now;
  if (Object.keys(stamps).length) await Session.updateOne({ _id: therapySession._id }, { $set: stamps });

  return { client: clientSent, therapist: therapistSent };
}

// The counter stays right even when nobody opens a portal (carried from 9.5).
async function completeOverdueEverywhere(now) {
  const bookingIds = await Session.distinct('bookingId', {
    status: SESSION_STATUS.SCHEDULED,
    scheduledAt: { $lte: new Date(now.getTime() - LIVE_WINDOW) },
  });

  let completed = 0;
  for (const bookingId of bookingIds) {
    completed += await completeOverdue(bookingId, { now });
  }
  return completed;
}

/** One sweep. Safe to run by hand, on a timer, or from a cron job. */
export async function runSessionReminders({ now = new Date() } = {}) {
  const completed = await completeOverdueEverywhere(now);

  const candidates = await Session.find({
    status: SESSION_STATUS.SCHEDULED,
    scheduledAt: { $gt: now, $lte: new Date(now.getTime() + SESSION_REMINDERS.day.lead) },
  });

  const sent = [];
  for (const therapySession of candidates) {
    for (const kind of dueKinds(therapySession, now)) {
      const claimed = await claim(therapySession, kind, now);
      if (!claimed) continue;
      sent.push({ sessionId: String(claimed._id), kind, ...(await remind(claimed, kind, now)) });
    }
  }

  return { completed, sent };
}

// ── the scheduler ───────────────────────────────────────────────────────────

let timer = null;
let running = false;

/**
 * Runs inside the web server, which Render keeps awake on a paid plan. Two
 * instances are safe: the claim above decides who sends. `SESSION_REMINDERS=off`
 * disables it; `npm run reminders:run` does one sweep by hand.
 */
export function startSessionReminders({ intervalMs = SESSION_REMINDER_INTERVAL_MS, firstRunMs = 10_000 } = {}) {
  if (timer) return timer;

  const tick = async () => {
    if (running) return; // a slow sweep is never run twice at once
    running = true;
    try {
      const { sent, completed } = await runSessionReminders();
      if (sent.length || completed) {
        console.log(`[reminders] ${sent.length} reminder(s), ${completed} session(s) completed`);
      }
    } catch (error) {
      console.error(`[reminders] sweep failed (${error?.name ?? 'Error'})`);
    } finally {
      running = false;
    }
  };

  const first = setTimeout(tick, firstRunMs);
  first.unref?.();
  timer = setInterval(tick, intervalMs);
  timer.unref?.();
  return timer;
}

export function stopSessionReminders() {
  if (timer) clearInterval(timer);
  timer = null;
}
