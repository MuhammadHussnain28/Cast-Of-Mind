import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { AppError } from '../utils/AppError.js';
import { clientDisplayName } from '../utils/clientDisplayName.js';
import {
  resolveAccess,
  findCurrentSubscription,
} from '../middleware/requireActiveSubscription.js';
import {
  THERAPIST_CLIENT_FIELDS,
  CLIENT_NOT_FOUND_MESSAGE,
  CLIENT_NOT_FOUND_CODE,
} from '../constants/therapistClients.js';

/**
 * One client's workspace context — master spec §8.2 to §8.6.
 *
 * THE privateNotes BOUNDARY IS HERE. This file never imports, queries or joins
 * `privateNotes`. It is named because this is the therapist's own client
 * screen, which is exactly where a future "show a note preview in the header"
 * would look harmless. §8.5 requires the separation to be architectural.
 *
 * THE bookingId COMES FROM THE URL, SO IT IS ATTACKER-CONTROLLED. Ownership is
 * proved against the stored booking on every request and never inferred from
 * the caller's role. There is no other protection in front of this.
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
 * EVERY REFUSAL IS THE SAME 404.
 *
 * A booking that does not exist, an id that is not an ObjectId at all, and a
 * booking belonging to a DIFFERENT THERAPIST all end here with one message and
 * one code. Answering 403 for the third would confirm the id is real, and
 * comparing 403s against 404s is how a booking id space gets mapped.
 *
 * A test asserts the three response bodies are byte-identical.
 */
const notFound = () => new AppError(CLIENT_NOT_FOUND_MESSAGE, 404, CLIENT_NOT_FOUND_CODE);

// Membership, proved against the stored booking. Shared with worksheets (8.4).
export async function loadOwnBooking(bookingId, therapistUserId) {
  if (!mongoose.isValidObjectId(bookingId)) throw notFound();

  const booking = await Booking.findById(bookingId);
  if (!booking) throw notFound();

  if (String(booking.therapistId) !== String(therapistUserId)) throw notFound();

  return booking;
}

/**
 * A couple is ONE account holding TWO people (§6), so both partners travel.
 * Naming only partner 1 would quietly erase the other from their own therapy,
 * and a therapist working with a couple needs both ages and both genders.
 */
function presentClient(profile) {
  if (!profile) return null;

  const base = { name: clientDisplayName(profile), ...pick(profile, THERAPIST_CLIENT_FIELDS) };

  if (profile.type !== 'couple') return { ...base, partners: null };

  const partners = [profile.coupleData?.partner1, profile.coupleData?.partner2]
    .filter(Boolean)
    .map((partner) => ({
      name: partner.name ?? null,
      age: partner.age ?? null,
      gender: partner.gender ?? null,
    }));

  // `age` and `gender` are individual-only fields and are meaningless on a
  // couple — they are sent as explicit nulls, never as undefined, so the
  // browser never has to guess which shape it is holding.
  return { ...base, age: null, gender: null, partners };
}

export async function getTherapistClient(bookingId, therapistUserId) {
  const booking = await loadOwnBooking(bookingId, therapistUserId);

  const [profile, subscription] = await Promise.all([
    ClientProfile.findOne({ userId: booking.clientId }),
    findCurrentSubscription(booking.clientId),
  ]);

  return {
    bookingId: String(booking._id),

    // An ENDED booking still loads. 8.1's list shows only active ones, but 7.2
    // already decided a therapist keeps read access to a finished relationship
    // because the record is clinically theirs. The screen says which it is.
    bookingStatus: booking.status,
    matchedAt: booking.matchedAt,

    client: presentClient(profile),

    // BOTH the stored status and the resolved access, the call 7.1 made:
    // `access` decides what renders, `status` is what the screen says out loud.
    // One without the other means the UI guesses or the copy lies.
    subscription: subscription
      ? { status: subscription.status, access: resolveAccess(subscription) }
      : null,
  };
}

export default getTherapistClient;
