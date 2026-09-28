import mongoose from 'mongoose';
import { Session } from '../models/Session.js';
import { Subscription } from '../models/Subscription.js';
import { SESSION_STATUS, SESSION_LIVE_WINDOW_MINUTES } from '../constants/sessions.js';
import { SESSIONS_PER_CYCLE } from '../constants/payments.js';

// The session counter — master spec §13. 4 a cycle, down by one when a session
// completes, never below 0, never above 4 (no carry-over), 4 on renewal, 0 when
// the subscription ends. The Mongo transaction handle is `txn`, never `session`.

const LIVE_WINDOW = SESSION_LIVE_WINDOW_MINUTES * 60 * 1000;

// The booking's current subscription: newest first, as the access gate reads it.
function currentSubscription(bookingId, txn) {
  return Subscription.findOne({ bookingId }).sort({ createdAt: -1 }).session(txn ?? null);
}

/**
 * The start of the current billing period: Stripe's exact start once a renewal
 * has stored it (11.1). Before that, one calendar month before `currentPeriodEnd`.
 * Never earlier than the subscription began.
 */
export function periodStartOf(subscription) {
  let periodStart;
  if (subscription.currentPeriodStart) {
    periodStart = new Date(subscription.currentPeriodStart);
  } else {
    periodStart = new Date(subscription.currentPeriodEnd);
    periodStart.setUTCMonth(periodStart.getUTCMonth() - 1);
  }
  const began = subscription.startDate ? new Date(subscription.startDate) : periodStart;
  return began > periodStart ? began : periodStart;
}

/** Does a session at this time belong to the subscription's current period? */
export function countsAgainst(subscription, scheduledAt) {
  if (!subscription?.currentPeriodEnd) return false;
  const at = new Date(scheduledAt).getTime();
  return at >= periodStartOf(subscription).getTime() && at < new Date(subscription.currentPeriodEnd).getTime();
}

async function inTransaction(work) {
  const txn = await mongoose.startSession();
  try {
    let result;
    await txn.withTransaction(async () => {
      result = await work(txn);
    });
    return result;
  } finally {
    await txn.endSession();
  }
}

/**
 * Completes one scheduled session and takes one of the client's sessions, in
 * one transaction. Only the call that actually moves it from scheduled counts,
 * so two readers at once cannot take two. At 0 it completes without counting.
 * @returns {{ completed: boolean, counted: boolean }}
 */
export async function completeSession(sessionId, { now = new Date() } = {}) {
  return inTransaction(async (txn) => {
    const therapySession = await Session.findOneAndUpdate(
      { _id: sessionId, status: SESSION_STATUS.SCHEDULED },
      { $set: { status: SESSION_STATUS.COMPLETED } },
      { new: true, session: txn },
    );
    if (!therapySession) return { completed: false, counted: false };

    const subscription = await currentSubscription(therapySession.bookingId, txn);
    if (!subscription || !countsAgainst(subscription, therapySession.scheduledAt)) {
      return { completed: true, counted: false };
    }

    const taken = await Subscription.updateOne(
      { _id: subscription._id, sessionsRemaining: { $gt: 0 } },
      { $inc: { sessionsRemaining: -1 } },
      { session: txn },
    );
    if (taken.modifiedCount === 0) return { completed: true, counted: false };

    await Session.updateOne({ _id: therapySession._id }, { $set: { countedAt: now } }, { session: txn });
    return { completed: true, counted: true };
  });
}

/**
 * The on-read check: every scheduled session of this booking whose Join window
 * has closed is completed. Cheap when there is nothing overdue — one indexed find.
 * @returns {number} how many were completed by this call
 */
export async function completeOverdue(bookingId, { now = new Date() } = {}) {
  const overdue = await Session.find({
    bookingId,
    status: SESSION_STATUS.SCHEDULED,
    scheduledAt: { $lte: new Date(now.getTime() - LIVE_WINDOW) },
  })
    .select('_id')
    .lean();

  let completed = 0;
  for (const { _id } of overdue) {
    if ((await completeSession(_id, { now })).completed) completed += 1;
  }
  return completed;
}

/**
 * The therapist's "didn't take place" (9.5): a completed session becomes
 * cancelled, and the credit comes back — only if it was taken, only within the
 * current period (no carry-over), and never above 4.
 * @returns {{ changed: boolean, restored: boolean }}
 */
export async function markNotHeld(sessionId, { now = new Date() } = {}) {
  return inTransaction(async (txn) => {
    const before = await Session.findOneAndUpdate(
      { _id: sessionId, status: SESSION_STATUS.COMPLETED },
      {
        $set: { status: SESSION_STATUS.CANCELLED, cancelledAt: now, notHeldAt: now },
        $unset: { countedAt: 1 },
      },
      { new: false, session: txn },
    );
    if (!before) return { changed: false, restored: false };
    if (!before.countedAt) return { changed: true, restored: false };

    const subscription = await currentSubscription(before.bookingId, txn);
    if (!subscription || !countsAgainst(subscription, before.scheduledAt)) {
      return { changed: true, restored: false };
    }

    const given = await Subscription.updateOne(
      { _id: subscription._id, sessionsRemaining: { $lt: SESSIONS_PER_CYCLE } },
      { $inc: { sessionsRemaining: 1 } },
      { session: txn },
    );
    return { changed: true, restored: given.modifiedCount > 0 };
  });
}

// Renewal's reset to 4 (subscriptionRenewal.service.js) and expiry's drop to 0
// (EXPIRED_SET, subscriptionLifecycle.service.js) each sit inside the one atomic
// update that changes the status, so the count can never be applied apart.

/** What the counter shows: 0 once access has ended, whatever is stored. */
export function counterFor(subscription, access) {
  if (!subscription) return null;
  return {
    sessionsRemaining: access === 'ended' ? 0 : subscription.sessionsRemaining,
    total: SESSIONS_PER_CYCLE,
    cycleEndsAt: subscription.currentPeriodEnd ?? null,
    access,
  };
}
