import { User } from '../models/User.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { Booking } from '../models/Booking.js';
import { AppError } from '../utils/AppError.js';
import { BOOKING_STATUS } from '../constants/payments.js';
import { countPendingWorksheets } from './worksheet.service.js';
import { completeOverdue } from './sessionCounter.service.js';
import { resolveAccess, findCurrentSubscription } from '../middleware/requireActiveSubscription.js';
import { reviewStateFor } from './reviewSubmission.service.js';
import {
  CLIENT_SUBSCRIPTION_FIELDS,
  CLIENT_THERAPIST_FIELDS,
  NO_BOOKING_MESSAGE,
  NO_BOOKING_CODE,
} from '../constants/clientPortal.js';

/**
 * The client portal's own state — master spec §7.
 *
 * THE privateNotes BOUNDARY IS HERE. This file is the whole client-facing read
 * surface for the portal, and it never imports, queries or joins `privateNotes`
 * — not filtered out of a response, simply never reached for. §8.5 requires the
 * separation to be architectural rather than a UI decision, because a client
 * seeing their therapist's clinical notes is a serious breach. Anything added
 * to this service must hold the same line.
 *
 * THERE IS NO ID IN ANY OF THESE FUNCTIONS. Everything is found from the
 * authenticated user's own token, so one client cannot read another's portal by
 * editing a URL. There is no parameter to tamper with.
 */

/** Take only the listed keys. Anything not named simply does not travel. */
function pick(doc, fields) {
  const out = {};
  for (const field of fields) {
    if (doc[field] !== undefined) out[field] = doc[field];
  }
  return out;
}

/**
 * The client's assigned therapist.
 *
 * The booking stores the therapist's USER id (§10.5 links two users), so the
 * profile is found by `userId`. The id returned is the PROFILE id — the same
 * one the public directory uses — so nothing hands the browser a key into the
 * `users` collection.
 */
async function loadTherapist(therapistUserId) {
  const profile = await TherapistProfile.findOne({ userId: therapistUserId });
  if (!profile) return null;

  return { id: String(profile._id), ...pick(profile, CLIENT_THERAPIST_FIELDS) };
}

export async function getClientPortalState(userId) {
  const [user, profile, booking] = await Promise.all([
    User.findById(userId),
    ClientProfile.findOne({ userId }),
    Booking.findOne({ clientId: userId, status: BOOKING_STATUS.ACTIVE }),
  ]);

  if (!user) {
    // The token verified but the account is gone. Not a 404 for the route —
    // the route exists; the session behind it no longer resolves.
    throw new AppError(NO_BOOKING_MESSAGE, 404, NO_BOOKING_CODE);
  }

  // Every client is created with a booking in the same transaction (§10.5,
  // chunk 6.4), so this is a broken-state guard rather than an expected path.
  if (!booking) {
    throw new AppError(NO_BOOKING_MESSAGE, 404, NO_BOOKING_CODE);
  }

  // A session whose Join window has closed completes first, so the counter is current (9.5).
  await completeOverdue(booking._id);

  const [therapist, subscription, pendingWorksheets] = await Promise.all([
    loadTherapist(booking.therapistId),
    findCurrentSubscription(userId),
    countPendingWorksheets(booking._id),
  ]);

  return {
    user: {
      id: String(user._id),
      email: user.email,
      role: user.role,
      memberSince: user.createdAt,
    },

    // The client's own questionnaire answers. A couple is one profile with both
    // partners nested (§6), so this shape branches exactly as the profile does.
    profile: profile
      ? {
          type: profile.type,
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          coupleData: profile.coupleData,
          country: profile.country,
          city: profile.city,
          relationshipStatus: profile.relationshipStatus,
          concernTags: profile.concernTags,
          therapistGenderPreference: profile.therapistGenderPreference,
          timezone: profile.timezone ?? null,
        }
      : null,

    booking: { id: String(booking._id), matchedAt: booking.matchedAt },

    // The Worksheets nav dot (8.5): a count only, never a title.
    pendingWorksheets,

    therapist,

    // `access` is the resolved state the gate uses, NOT the raw stored status.
    // A cancelled subscription still inside its paid period reads as "ending"
    // here and as "cancelled" in `subscription.status` — the portal needs the
    // first to decide what to show and the second to tell the truth about it.
    access: resolveAccess(subscription),
    subscription: subscription ? pick(subscription, CLIENT_SUBSCRIPTION_FIELDS) : null,

    // Whether to offer the end-of-subscription rating (10.3). A STATE ONLY —
    // 'not_yet' | 'eligible' | 'submitted' — never the stars or the words, not
    // even the client's own (approved 2026-09-21).
    reviewState: await reviewStateFor(subscription),
  };
}

/**
 * The client's browser timezone (9.2), so their therapist can see when a session
 * lands for them. From the token only; a couple's one account keeps whichever
 * browser saved last.
 */
export async function saveClientTimezone(userId, timezone) {
  const profile = await ClientProfile.findOneAndUpdate(
    { userId },
    { $set: { timezone } },
    { new: true, runValidators: true },
  );
  if (!profile) throw new AppError(NO_BOOKING_MESSAGE, 404, NO_BOOKING_CODE);
  return { timezone: profile.timezone };
}

export default getClientPortalState;
