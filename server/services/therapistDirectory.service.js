import mongoose from 'mongoose';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { USER_STATUS } from '../constants/roles.js';
import { PUBLIC_THERAPIST_DETAIL_FIELDS } from '../constants/matching.js';

/**
 * The public therapist profile behind /therapist/:id.
 *
 * Separate from the matching service because it answers a different question —
 * "show me this one person" rather than "who fits" — but it shares the same
 * allowlist discipline: an unauthenticated endpoint names what may leave.
 *
 * The id is the PROFILE id, never the user id, so nothing here is a key into
 * the users collection.
 */
export async function getPublicTherapist(id) {
  if (!mongoose.isValidObjectId(id)) return null;

  const projection = PUBLIC_THERAPIST_DETAIL_FIELDS.reduce(
    (fields, name) => ({ ...fields, [name]: 1 }),
    {},
  );

  const [therapist] = await TherapistProfile.aggregate([
    // Inactive therapists are not browsable: a client must never reach a
    // profile they cannot actually be matched with.
    { $match: { _id: new mongoose.Types.ObjectId(id), status: USER_STATUS.ACTIVE } },
    { $project: { _id: 0, id: { $toString: '$_id' }, ...projection } },
  ]);

  return therapist ?? null;
}

export default { getPublicTherapist };
