import mongoose from 'mongoose';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { AppError } from '../utils/AppError.js';
import { isOwnCloudinaryUrl } from '../utils/cloudinaryUrl.js';
import { FUTURE_COLLECTIONS } from '../constants/adminStats.js';
import {
  FOREIGN_PHOTO_MESSAGE,
  NOTHING_TO_UPDATE_MESSAGE,
  PROFILE_NOT_FOUND_MESSAGE,
  THERAPIST_DISPLAY_FIELDS,
  THERAPIST_EDITABLE_FIELDS,
} from '../constants/therapistProfile.js';

/**
 * A therapist's own profile — master spec §8.7.
 *
 * THERE IS NO ID IN ANY OF THESE FUNCTIONS. The profile is found from the
 * authenticated user's own token, so a therapist cannot read or write another
 * therapist's record by changing a value in a URL. That is not a UI decision;
 * there is simply no parameter to tamper with.
 */

const raw = (name) => mongoose.connection.db.collection(name);

/**
 * Practice stats — simple counts only.
 *
 * §8.7 warns explicitly that charts, trends and analytics belong in the admin
 * portal, and that putting them here would duplicate the admin dashboard inside
 * the therapist portal. These are three numbers and nothing else.
 *
 * `bookings` and `sessions` do not exist yet, so they are read through the raw
 * driver: MongoDB answers 0 and [] for a collection that was never created, and
 * these switch on by themselves when slice 6 and slice 9 ship.
 */
async function practiceStats(userId) {
  const bookings = await raw(FUTURE_COLLECTIONS.bookings)
    .find({ therapistId: userId }, { projection: { _id: 1, clientId: 1, status: 1 } })
    .toArray();

  const activeClients = bookings.filter((booking) => booking.status === 'active').length;

  // Distinct clients, not bookings — someone who left and came back is one
  // person helped, not two.
  const totalClientsHelped = new Set(
    bookings.map((booking) => String(booking.clientId)),
  ).size;

  const sessionsCompleted = await raw(FUTURE_COLLECTIONS.sessions).countDocuments({
    bookingId: { $in: bookings.map((booking) => booking._id) },
    status: 'completed',
  });

  return { activeClients, totalClientsHelped, sessionsCompleted };
}

async function loadOwnProfile(userId) {
  const profile = await TherapistProfile.findOne({ userId });

  if (!profile) {
    // An approved therapist always has one — approval creates both records in a
    // transaction (chunk 4.3). Reaching this means something is genuinely wrong.
    throw new AppError(PROFILE_NOT_FOUND_MESSAGE, 404, 'PROFILE_NOT_FOUND');
  }

  return profile;
}

function present(profile, stats) {
  const view = {};
  for (const field of THERAPIST_DISPLAY_FIELDS) {
    view[field] = profile[field];
  }

  return {
    ...view,
    // Named for what §8.7 calls it, rather than exposing a raw timestamp field.
    memberSince: profile.createdAt,
    stats,
  };
}

export async function getOwnProfile(userId) {
  const profile = await loadOwnProfile(userId);
  return present(profile, await practiceStats(userId));
}

/**
 * Update the two fields a therapist owns.
 *
 * The schema has already refused any other field by name. This applies only
 * what is on the allowlist, so even a future caller that skipped validation
 * cannot write outside it.
 */
export async function updateOwnProfile(userId, changes) {
  const profile = await loadOwnProfile(userId);

  const applied = {};
  for (const field of THERAPIST_EDITABLE_FIELDS) {
    if (field in changes) applied[field] = changes[field];
  }

  if (Object.keys(applied).length === 0) {
    throw new AppError(NOTHING_TO_UPDATE_MESSAGE, 400, 'NOTHING_TO_UPDATE');
  }

  // A photo URL is submitted as ordinary text after an upload, so nothing stops
  // someone posting a link to anywhere. Every client who sees this therapist on
  // the matching page would then load it — leaking their IP at best, rendering
  // hostile content at worst. Same guard the application form uses (chunk 3.2).
  if ('photoUrl' in applied && !isOwnCloudinaryUrl(applied.photoUrl)) {
    throw new AppError(FOREIGN_PHOTO_MESSAGE, 422, 'INVALID_PHOTO_URL');
  }

  Object.assign(profile, applied);
  await profile.save();

  return {
    changedFields: Object.keys(applied),
    profile: present(profile, await practiceStats(userId)),
  };
}
