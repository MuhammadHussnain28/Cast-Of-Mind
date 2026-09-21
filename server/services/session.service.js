import mongoose from 'mongoose';
import { Session } from '../models/Session.js';
import { Booking } from '../models/Booking.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { AppError } from '../utils/AppError.js';
import { encodeCursor, decodeCursor } from '../utils/cursor.js';
import { localTimeToUtc, isValidTimeZone, LOCAL_TIME_REASON } from '../utils/timezone.js';
import { loadOwnBooking } from './therapistClient.service.js';
import { loadBookingMember } from './bookingMembership.service.js';
import { postSessionNotice } from './chat.service.js';
import {
  completeSession,
  completeOverdue,
  markNotHeld,
  countsAgainst,
  periodStartOf,
  counterFor,
} from './sessionCounter.service.js';
import { SESSION_NOTICE_EVENT } from '../constants/chat.js';
import {
  findCurrentSubscription,
  resolveAccess,
} from '../middleware/requireActiveSubscription.js';
import { PORTAL_ALLOWED_ACCESS } from '../constants/clientPortal.js';
import { BOOKING_STATUS } from '../constants/payments.js';
import { ROLES } from '../constants/roles.js';
import {
  SESSION_STATUS,
  SESSION_SCOPE,
  SESSION_LIVE_WINDOW_MINUTES,
  SESSION_JOIN_OPENS_BEFORE_MINUTES,
  SESSION_HORIZON_DAYS,
  SESSION_NOT_FOUND_MESSAGE,
  SESSION_NOT_FOUND_CODE,
  SESSION_TIME_NONEXISTENT_MESSAGE,
  SESSION_TIME_NONEXISTENT_CODE,
  SESSION_DATE_INVALID_MESSAGE,
  SESSION_DATE_INVALID_CODE,
  SESSION_TIME_PAST_MESSAGE,
  SESSION_TIME_PAST_CODE,
  SESSION_TIME_TOO_FAR_MESSAGE,
  SESSION_TIME_TOO_FAR_CODE,
  SESSION_BOOKING_ENDED_MESSAGE,
  SESSION_BOOKING_ENDED_CODE,
  SESSION_CLIENT_ENDED_MESSAGE,
  SESSION_CLIENT_ENDED_CODE,
  SESSION_NOT_EDITABLE_MESSAGE,
  SESSION_NOT_EDITABLE_CODE,
  SESSION_NOT_CANCELLABLE_MESSAGE,
  SESSION_NOT_CANCELLABLE_CODE,
  SESSION_NOT_STARTED_MESSAGE,
  SESSION_NOT_STARTED_CODE,
  SESSION_NOT_COMPLETED_MESSAGE,
  SESSION_NOT_COMPLETED_CODE,
  SESSION_WARNING_OVER_REMAINING,
  THERAPIST_TIMEZONE_MISSING_MESSAGE,
  THERAPIST_TIMEZONE_MISSING_CODE,
} from '../constants/sessions.js';

// Sessions — master spec §8.4, §10.11, §15. Instances are `therapySession`:
// `session` already means a Mongo transaction in this codebase.
// Meeting links and notes are never logged. privateNotes is not reachable from here.

const MINUTE = 60 * 1000;
const LIVE_WINDOW = SESSION_LIVE_WINDOW_MINUTES * MINUTE;
const JOIN_OPENS_BEFORE = SESSION_JOIN_OPENS_BEFORE_MINUTES * MINUTE;
const HORIZON = SESSION_HORIZON_DAYS * 24 * 60 * MINUTE;

const notFound = () => new AppError(SESSION_NOT_FOUND_MESSAGE, 404, SESSION_NOT_FOUND_CODE);
const refuse = (message, status, code) => new AppError(message, status, code);

// No user id leaves the server. Only a live session carries its link: a finished
// one may still open a room the therapist now uses with someone else. A client
// gets it only inside the Join window (9.4), so a reused room is not open early.
function present(therapySession, therapistTimezone, { viewer = ROLES.THERAPIST, now = new Date() } = {}) {
  const live = therapySession.status === SESSION_STATUS.SCHEDULED;
  const start = therapySession.scheduledAt.getTime();
  const joinOpensAt = live ? new Date(start - JOIN_OPENS_BEFORE) : null;
  const joinClosesAt = live ? new Date(start + LIVE_WINDOW) : null;
  const inWindow = live && now >= joinOpensAt && now < joinClosesAt;
  const showLink = live && (viewer !== ROLES.CLIENT || inWindow);

  return {
    id: String(therapySession._id),
    bookingId: String(therapySession.bookingId),
    scheduledAt: therapySession.scheduledAt,
    status: therapySession.status,
    zoomLink: showLink ? therapySession.zoomLink : null,
    joinOpensAt,
    joinClosesAt,
    note: therapySession.note ?? null,
    therapistTimezone: therapistTimezone ?? null,
    createdAt: therapySession.createdAt,
    updatedAt: therapySession.updatedAt,
    cancelledAt: therapySession.cancelledAt ?? null,
    notHeldAt: therapySession.notHeldAt ?? null,
  };
}

// Scheduling past what is left this cycle is flagged, never refused (9.5).
async function overRemaining(booking, scheduledAt) {
  const subscription = await findCurrentSubscription(booking.clientId);
  if (!subscription || !countsAgainst(subscription, scheduledAt)) return null;
  const scheduled = await Session.countDocuments({
    bookingId: booking._id,
    status: SESSION_STATUS.SCHEDULED,
    scheduledAt: { $gte: periodStartOf(subscription), $lt: subscription.currentPeriodEnd },
  });
  if (scheduled <= subscription.sessionsRemaining) return null;
  return { code: SESSION_WARNING_OVER_REMAINING, remaining: subscription.sessionsRemaining, scheduled };
}

async function counterOf(booking) {
  const subscription = await findCurrentSubscription(booking.clientId);
  return counterFor(subscription, resolveAccess(subscription));
}

async function therapistZone(therapistUserId) {
  const profile = await TherapistProfile.findOne({ userId: therapistUserId })
    .select('timezone')
    .lean();
  return isValidTimeZone(profile?.timezone) ? profile.timezone : null;
}

// The zone comes from the profile, never the request.
async function requireTherapistZone(therapistUserId) {
  const zone = await therapistZone(therapistUserId);
  if (!zone) {
    throw refuse(THERAPIST_TIMEZONE_MISSING_MESSAGE, 409, THERAPIST_TIMEZONE_MISSING_CODE);
  }
  return zone;
}

function placeInTime({ date, time }, timeZone, now) {
  const { instant, reason } = localTimeToUtc({ date, time }, timeZone);

  if (reason === LOCAL_TIME_REASON.NONEXISTENT) {
    throw refuse(SESSION_TIME_NONEXISTENT_MESSAGE, 422, SESSION_TIME_NONEXISTENT_CODE);
  }
  if (reason === LOCAL_TIME_REASON.INVALID_ZONE) {
    throw refuse(THERAPIST_TIMEZONE_MISSING_MESSAGE, 409, THERAPIST_TIMEZONE_MISSING_CODE);
  }
  if (reason) throw refuse(SESSION_DATE_INVALID_MESSAGE, 422, SESSION_DATE_INVALID_CODE);

  if (instant.getTime() <= now.getTime()) {
    throw refuse(SESSION_TIME_PAST_MESSAGE, 422, SESSION_TIME_PAST_CODE);
  }
  if (instant.getTime() - now.getTime() > HORIZON) {
    throw refuse(SESSION_TIME_TOO_FAR_MESSAGE, 422, SESSION_TIME_TOO_FAR_CODE);
  }
  return instant;
}

// Past-due and cancelled-but-still-paid clients keep access (§13), so they can be scheduled.
async function assertSchedulable(booking) {
  if (booking.status !== BOOKING_STATUS.ACTIVE) {
    throw refuse(SESSION_BOOKING_ENDED_MESSAGE, 409, SESSION_BOOKING_ENDED_CODE);
  }
  const access = resolveAccess(await findCurrentSubscription(booking.clientId));
  if (!PORTAL_ALLOWED_ACCESS.includes(access)) {
    throw refuse(SESSION_CLIENT_ENDED_MESSAGE, 409, SESSION_CLIENT_ENDED_CODE);
  }
}

// Malformed, unknown and another therapist's session are the same 404.
async function loadOwnSession(sessionId, therapistUserId) {
  if (!mongoose.isValidObjectId(sessionId)) throw notFound();

  const therapySession = await Session.findById(sessionId);
  if (!therapySession) throw notFound();

  const booking = await Booking.findById(therapySession.bookingId);
  if (!booking || String(booking.therapistId) !== String(therapistUserId)) throw notFound();

  return { therapySession, booking };
}

// A chat notice for the client (9.3). It must never fail the session change,
// so a failure is logged by name only and the request carries on.
async function notify(booking, therapistUserId, therapySession, event, previousScheduledAt) {
  try {
    await postSessionNotice(booking, therapistUserId, {
      event,
      sessionId: therapySession._id,
      scheduledAt: therapySession.scheduledAt,
      previousScheduledAt,
    });
  } catch (error) {
    console.error(`[sessions] chat notice failed: ${event}, session ${therapySession._id} (${error?.name ?? 'Error'})`);
  }
}

// ── therapist ───────────────────────────────────────────────────────────────

export async function createSession(therapistUserId, body, { now = new Date() } = {}) {
  const booking = await loadOwnBooking(body.bookingId, therapistUserId);
  await assertSchedulable(booking);

  const zone = await requireTherapistZone(therapistUserId);
  const scheduledAt = placeInTime(body, zone, now);

  const therapySession = await Session.create({
    bookingId: booking._id,
    scheduledAt,
    timeSetAt: now,
    zoomLink: body.zoomLink,
    note: body.note || undefined,
  });

  await notify(booking, therapistUserId, therapySession, SESSION_NOTICE_EVENT.SCHEDULED);
  return { ...present(therapySession, zone), warning: await overRemaining(booking, scheduledAt) };
}

export async function updateSession(therapistUserId, sessionId, changes, { now = new Date() } = {}) {
  const { therapySession, booking } = await loadOwnSession(sessionId, therapistUserId);

  if (therapySession.status !== SESSION_STATUS.SCHEDULED) {
    throw refuse(SESSION_NOT_EDITABLE_MESSAGE, 409, SESSION_NOT_EDITABLE_CODE);
  }
  await assertSchedulable(booking);

  const $set = {};
  const $unset = {};

  if (changes.date !== undefined) {
    $set.scheduledAt = placeInTime(changes, await requireTherapistZone(therapistUserId), now);
    // The clock on the notice rule restarts when the time moves (9.6).
    $set.timeSetAt = now;
  }
  if (changes.zoomLink !== undefined) $set.zoomLink = changes.zoomLink;
  if (changes.note !== undefined) {
    if (changes.note) $set.note = changes.note;
    else $unset.note = 1;
  }

  const update = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($unset).length) update.$unset = $unset;

  // Conditional on status, so a cancel that lands mid-edit wins.
  const updated = await Session.findOneAndUpdate(
    { _id: therapySession._id, status: SESSION_STATUS.SCHEDULED },
    update,
    { new: true, runValidators: true },
  );
  if (!updated) throw refuse(SESSION_NOT_EDITABLE_MESSAGE, 409, SESSION_NOT_EDITABLE_CODE);

  // Only a real move is news for the client; a link or note edit posts nothing.
  const moved = $set.scheduledAt && $set.scheduledAt.getTime() !== therapySession.scheduledAt.getTime();
  if (moved) {
    await notify(booking, therapistUserId, updated, SESSION_NOTICE_EVENT.RESCHEDULED, therapySession.scheduledAt);
  }

  return {
    ...present(updated, await therapistZone(therapistUserId)),
    warning: moved ? await overRemaining(booking, updated.scheduledAt) : null,
  };
}

// A soft cancel: the record stays for history. Cancelling twice changes nothing.
export async function cancelSession(therapistUserId, sessionId, { now = new Date() } = {}) {
  const { therapySession, booking } = await loadOwnSession(sessionId, therapistUserId);
  const zone = await therapistZone(therapistUserId);

  if (therapySession.status === SESSION_STATUS.CANCELLED) return present(therapySession, zone);
  if (therapySession.status === SESSION_STATUS.COMPLETED) {
    throw refuse(SESSION_NOT_CANCELLABLE_MESSAGE, 409, SESSION_NOT_CANCELLABLE_CODE);
  }

  const updated = await Session.findOneAndUpdate(
    { _id: therapySession._id, status: SESSION_STATUS.SCHEDULED },
    { $set: { status: SESSION_STATUS.CANCELLED, cancelledAt: now } },
    { new: true },
  );
  if (updated) {
    await notify(booking, therapistUserId, updated, SESSION_NOTICE_EVENT.CANCELLED);
    return present(updated, zone);
  }

  // Another request changed it first.
  const current = await Session.findById(therapySession._id);
  if (current?.status === SESSION_STATUS.CANCELLED) return present(current, zone);
  throw refuse(SESSION_NOT_CANCELLABLE_MESSAGE, 409, SESSION_NOT_CANCELLABLE_CODE);
}

// Held, a little early: once it has started the therapist can complete it now.
export async function markSessionHeld(therapistUserId, sessionId, { now = new Date() } = {}) {
  const { therapySession, booking } = await loadOwnSession(sessionId, therapistUserId);
  if (therapySession.status !== SESSION_STATUS.SCHEDULED) {
    throw refuse(SESSION_NOT_EDITABLE_MESSAGE, 409, SESSION_NOT_EDITABLE_CODE);
  }
  if (now.getTime() < therapySession.scheduledAt.getTime()) {
    throw refuse(SESSION_NOT_STARTED_MESSAGE, 409, SESSION_NOT_STARTED_CODE);
  }

  const { counted } = await completeSession(therapySession._id, { now });
  const fresh = await Session.findById(therapySession._id);
  return {
    ...present(fresh, await therapistZone(therapistUserId)),
    counted,
    counter: await counterOf(booking),
  };
}

// "Didn't take place": the client gets the session back if it counted this cycle.
export async function markSessionNotHeld(therapistUserId, sessionId, { now = new Date() } = {}) {
  const { therapySession, booking } = await loadOwnSession(sessionId, therapistUserId);
  if (therapySession.status !== SESSION_STATUS.COMPLETED) {
    throw refuse(SESSION_NOT_COMPLETED_MESSAGE, 409, SESSION_NOT_COMPLETED_CODE);
  }

  const { changed, restored } = await markNotHeld(therapySession._id, { now });
  const fresh = await Session.findById(therapySession._id);
  if (changed) await notify(booking, therapistUserId, fresh, SESSION_NOTICE_EVENT.NOT_HELD);

  return {
    ...present(fresh, await therapistZone(therapistUserId)),
    restored,
    counter: await counterOf(booking),
  };
}

// ── both roles ──────────────────────────────────────────────────────────────

/**
 * Upcoming: scheduled and not yet over, soonest first. History: everything else
 * (finished, cancelled, or long past), newest first. Cursor-paginated as chat is.
 */
export async function listSessions(user, bookingId, { scope, cursor, limit }, { now = new Date() } = {}) {
  const { booking, role } = await loadBookingMember(bookingId, user, notFound);
  // The on-read check (9.5): a session whose Join window has closed is completed first.
  await completeOverdue(booking._id, { now });
  const zone = await therapistZone(booking.therapistId);

  const upcoming = scope !== SESSION_SCOPE.HISTORY;
  const liveFrom = new Date(now.getTime() - LIVE_WINDOW);
  const filters = [
    { bookingId: booking._id },
    upcoming
      ? { status: SESSION_STATUS.SCHEDULED, scheduledAt: { $gte: liveFrom } }
      : { $or: [{ status: { $ne: SESSION_STATUS.SCHEDULED } }, { scheduledAt: { $lt: liveFrom } }] },
  ];

  if (cursor) {
    const at = decodeCursor(cursor);
    if (!at) throw new AppError('That page reference is not valid.', 400, 'INVALID_CURSOR');
    const op = upcoming ? '$gt' : '$lt';
    filters.push({
      $or: [{ scheduledAt: { [op]: at.at } }, { scheduledAt: at.at, _id: { [op]: at.id } }],
    });
  }

  const direction = upcoming ? 1 : -1;
  const rows = await Session.find({ $and: filters })
    .sort({ scheduledAt: direction, _id: direction })
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];

  return {
    data: page.map((therapySession) => present(therapySession, zone, { viewer: role, now })),
    meta: {
      scope: upcoming ? SESSION_SCOPE.UPCOMING : SESSION_SCOPE.HISTORY,
      // Here too, so the scheduler knows the zone before any session exists (9.2).
      therapistTimezone: zone,
      // The counter both portals draw (9.5), read after the on-read check.
      counter: await counterOf(booking),
      hasMore,
      nextCursor: hasMore && last ? encodeCursor(last.scheduledAt, last._id) : null,
    },
  };
}
