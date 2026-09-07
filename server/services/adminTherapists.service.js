import mongoose from 'mongoose';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { containsIgnoringCase, nameClauses } from '../utils/search.js';
import { forgotPassword } from './auth.service.js';
import { sendEmailChangedNotices } from './email/email.service.js';
import { FUTURE_COLLECTIONS } from '../constants/adminStats.js';
import {
  EDITABLE_PROFILE_FIELDS,
  EDITABLE_USER_FIELDS,
  EMAIL_TAKEN_MESSAGE,
  NOTHING_TO_UPDATE_MESSAGE,
  RESET_SENT_MESSAGE,
  RESET_SKIPPED_INACTIVE_MESSAGE,
  REVIEWS_LIMIT,
  STATUS_FILTER_ALL,
  THERAPIST_NOT_FOUND_MESSAGE,
} from '../constants/adminTherapists.js';

/**
 * Therapist management — master spec §9.3.
 *
 * NOTHING IN THIS FILE READS `messages`, `journals` OR `privateNotes`, and
 * nothing ever should. §11 records that an admin conversation viewer was
 * proposed as the safe alternative to plain-text passwords and the client
 * decided against building it. Misconduct is reported by email and phone and
 * handled off-platform. A test asserts the detail response carries no such keys.
 */

const raw = (name) => mongoose.connection.db.collection(name);

/**
 * Counts that belong to collections which do not exist yet.
 *
 * Same approach as the dashboard: the raw driver answers 0 and [] for a
 * collection that was never created, so these read zero today and switch on by
 * themselves when slice 6 and chunk 10.3 ship.
 */
async function practiceFigures(userId) {
  const [activeClients, ratings] = await Promise.all([
    raw(FUTURE_COLLECTIONS.bookings).countDocuments({ therapistId: userId, status: 'active' }),
    raw(FUTURE_COLLECTIONS.reviews)
      .aggregate([
        { $match: { therapistId: userId } },
        { $group: { _id: null, average: { $avg: '$stars' }, count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const average = ratings[0]?.average ?? null;

  return {
    activeClients,
    // null, never 0 — no ratings and a rating of zero are different statements,
    // and the second one is a judgement on a person.
    averageRating: average === null ? null : Math.round(average * 10) / 10,
    reviewCount: ratings[0]?.count ?? 0,
  };
}

export async function listTherapists({ status, q, page, limit }) {
  const filter = {};
  if (status !== STATUS_FILTER_ALL) filter.status = status;

  if (q) {
    // The email lives on `users`, so matching addresses are resolved first and
    // folded in as user ids rather than joined in the query.
    const matchingUsers = await User.find({
      role: ROLES.THERAPIST,
      email: containsIgnoringCase(q),
    })
      .select('_id')
      .lean();

    filter.$or = [...nameClauses(q), { userId: { $in: matchingUsers.map((u) => u._id) } }];
  }

  const skip = (page - 1) * limit;

  const [profiles, total, grouped] = await Promise.all([
    TherapistProfile.find(filter)
      .select('userId title firstName lastName therapistType country specialtyTags status createdAt')
      .populate('userId', 'email status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TherapistProfile.countDocuments(filter),
    TherapistProfile.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const counts = { active: 0, inactive: 0 };
  for (const row of grouped) {
    if (row._id in counts) counts[row._id] = row.count;
  }

  const data = await Promise.all(
    profiles.map(async (profile) => {
      const { activeClients, averageRating } = await practiceFigures(profile.userId?._id);

      return {
        _id: profile._id,
        title: profile.title,
        firstName: profile.firstName,
        lastName: profile.lastName,
        therapistType: profile.therapistType,
        country: profile.country,
        specialtyTags: profile.specialtyTags,
        status: profile.status,
        email: profile.userId?.email ?? null,
        createdAt: profile.createdAt,
        activeClients,
        averageRating,
      };
    }),
  );

  return {
    data,
    meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)), counts },
  };
}

async function loadProfile(id) {
  const profile = await TherapistProfile.findById(id).populate('userId', 'email status role');

  if (!profile) {
    throw new AppError(THERAPIST_NOT_FOUND_MESSAGE, 404, 'THERAPIST_NOT_FOUND');
  }

  return profile;
}

export async function getTherapist(id) {
  const profile = await loadProfile(id);
  const userId = profile.userId?._id;

  const [figures, reviews] = await Promise.all([
    practiceFigures(userId),
    raw(FUTURE_COLLECTIONS.reviews)
      .find({ therapistId: userId }, { projection: { stars: 1, text: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(REVIEWS_LIMIT)
      .toArray(),
  ]);

  const plain = profile.toObject();
  // The populated user is replaced by the two fields the screen needs. Sending
  // the whole record would carry the refresh token fields toward the browser.
  delete plain.userId;

  return {
    ...plain,
    email: profile.userId?.email ?? null,
    accountStatus: profile.userId?.status ?? null,
    ...figures,
    reviews: reviews.map((review) => ({
      id: review._id.toString(),
      stars: review.stars,
      text: review.text ?? '',
      createdAt: review.createdAt,
    })),
  };
}

/**
 * Edit the admin-controlled fields.
 *
 * A transaction because the email lives on `users` and everything else on the
 * profile. Half-applied — the login address changed but the name not — is a
 * state nobody could reason about afterwards.
 */
export async function updateTherapist(id, changes) {
  const profile = await loadProfile(id);
  const user = profile.userId;

  const profileChanges = {};
  for (const field of EDITABLE_PROFILE_FIELDS) {
    if (field in changes) profileChanges[field] = changes[field];
  }

  const emailChanging =
    EDITABLE_USER_FIELDS.includes('email') &&
    'email' in changes &&
    changes.email !== user.email;

  if (Object.keys(profileChanges).length === 0 && !emailChanging) {
    throw new AppError(NOTHING_TO_UPDATE_MESSAGE, 400, 'NOTHING_TO_UPDATE');
  }

  const previousEmail = user.email;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (emailChanging) {
        const clash = await User.findOne({ email: changes.email })
          .select('_id')
          .session(session);

        if (clash && clash._id.toString() !== user._id.toString()) {
          throw new AppError(EMAIL_TAKEN_MESSAGE, 409, 'EMAIL_TAKEN');
        }

        await User.updateOne(
          { _id: user._id },
          { $set: { email: changes.email } },
          { session },
        );
      }

      if (Object.keys(profileChanges).length > 0) {
        Object.assign(profile, profileChanges);
        await profile.save({ session });
      }
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError(EMAIL_TAKEN_MESSAGE, 409, 'EMAIL_TAKEN');
    }
    throw error;
  } finally {
    await session.endSession();
  }

  // AFTER the commit. Both addresses are told, so the old inbox can raise an
  // alarm if the change was wrong and the new one knows it is now the sign-in
  // address — without it a therapist is locked out with no way to find out why.
  // Failure here never undoes the edit.
  if (emailChanging) {
    try {
      await sendEmailChangedNotices({
        previousEmail,
        newEmail: changes.email,
        firstName: profile.firstName,
      });
    } catch (error) {
      console.error('Email-change notice failed:', error?.message ?? error);
    }
  }

  return {
    changedFields: [...Object.keys(profileChanges), ...(emailChanging ? ['email'] : [])],
    therapist: await getTherapist(id),
  };
}

/**
 * Deactivate or reactivate.
 *
 * BOTH RECORDS MOVE TOGETHER, and that is the whole point. `users.status`
 * decides whether they can sign in; `therapistProfiles.status` decides whether
 * matching can still offer them to a client. Flipping only the first produces
 * the worst state available: a therapist clients can still be matched with, who
 * cannot log in to answer them.
 */
export async function setTherapistStatus(id, status) {
  const profile = await loadProfile(id);
  const user = profile.userId;

  if (profile.status === status && user.status === status) {
    return { alreadyInState: true, status, therapist: await getTherapist(id) };
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await User.updateOne({ _id: user._id }, { $set: { status } }, { session });
      profile.status = status;
      await profile.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return { alreadyInState: false, status, therapist: await getTherapist(id) };
}

/**
 * Trigger the standard password reset.
 *
 * Calls the SAME function the public forgot-password endpoint uses, so there is
 * exactly one reset path in the codebase and no admin-only shortcut that could
 * drift from it. The admin never sees, sets or chooses a password — §11: hashes
 * are one-way and recovery is by reset, never retrieval.
 */
export async function resetTherapistPassword(id) {
  const profile = await loadProfile(id);
  const user = profile.userId;

  if (user.status !== USER_STATUS.ACTIVE) {
    return { sent: false, message: RESET_SKIPPED_INACTIVE_MESSAGE };
  }

  await forgotPassword(user.email);

  return { sent: true, message: RESET_SENT_MESSAGE };
}
