import mongoose from 'mongoose';
import { TherapistApplication, APPLICATION_STATUS } from '../models/TherapistApplication.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { sendTherapistWelcomeEmail } from '../services/email/email.service.js';
import {
  APPLICATION_NOT_FOUND_MESSAGE,
  EMAIL_TAKEN_MESSAGE,
  NOT_PENDING_APPROVE_MESSAGE,
  NOT_PENDING_REJECT_MESSAGE,
} from '../constants/adminApplications.js';

/**
 * Approval and rejection — master spec §9.2.
 *
 * THE TRANSACTION IS THE WHOLE POINT OF THIS FILE. §10 requires `users` and
 * `therapistProfiles` to be created atomically: a therapist who can log in but
 * has no profile is invisible to matching and sees a broken portal, and a
 * profile with no login is a ghost clients can pick but never reach. Both are
 * worse than the approval simply failing.
 *
 * The application's own status moves inside the same transaction. Left outside,
 * a crash between the two could create a live therapist while the application
 * still read `pending` — and the next admin would approve them a second time.
 *
 * Requires a replica set. Atlas is one; a standalone mongod is not, which is
 * why the tests for this file run against MongoMemoryReplSet.
 */

/** Everything the profile copies across from the application. */
function profileFromApplication(application, userId) {
  return {
    userId,
    applicationId: application._id,

    title: application.title,
    firstName: application.firstName,
    lastName: application.lastName,
    gender: application.gender,
    dateOfBirth: application.dateOfBirth,
    photoUrl: application.photoUrl,

    streetAddress: application.streetAddress,
    city: application.city,
    stateProvince: application.stateProvince,
    zipPostal: application.zipPostal,
    country: application.country,
    timezone: application.timezone,

    therapistType: application.therapistType,
    credentialType: application.credentialType,
    credentialInitials: application.credentialInitials,
    licenseNumber: application.licenseNumber,
    taxpayerIdNumber: application.taxpayerIdNumber,
    yearsExperience: application.yearsExperience,
    educationSummary: application.educationSummary,
    currentWorkSituation: application.currentWorkSituation,
    languages: application.languages,

    specialtyTags: application.specialtyTags,
    treatmentOrientations: application.treatmentOrientations,
    bio: application.bio,
    licensingStatus: application.licensingStatus,
    disciplinaryActions: application.disciplinaryActions,
    disciplinaryDetails: application.disciplinaryDetails,

    malpracticeInsurance: application.malpracticeInsurance,
    insuranceDetails: application.insuranceDetails,

    workingHours: application.workingHours,

    certificateUrl1: application.certificateUrl1,
    certificateUrl2: application.certificateUrl2,
    licenseDocUrl: application.licenseDocUrl,

    status: USER_STATUS.ACTIVE,
  };
}

async function loadApplicationForReview(id) {
  // passwordHash is select:false and is needed to carry the credential across,
  // so it is asked for explicitly. It never leaves this function.
  const application = await TherapistApplication.findById(id).select('+passwordHash');

  if (!application) {
    throw new AppError(APPLICATION_NOT_FOUND_MESSAGE, 404, 'APPLICATION_NOT_FOUND');
  }

  return application;
}

/**
 * Approve an application: create the therapist's login and profile together,
 * mark the application approved, then send the welcome email.
 */
export async function approveApplication(id) {
  const application = await loadApplicationForReview(id);

  // Idempotent rather than an error. An admin who double-clicks Approve would
  // otherwise get a failure immediately after a success, which reads as though
  // something broke. Nothing is created the second time.
  if (application.status === APPLICATION_STATUS.APPROVED) {
    const existing = await TherapistProfile.findOne({ applicationId: application._id })
      .select('userId')
      .lean();

    return {
      alreadyApproved: true,
      applicationId: application._id.toString(),
      userId: existing?.userId?.toString() ?? null,
      reviewedAt: application.reviewedAt,
      emailSent: false,
    };
  }

  if (application.status !== APPLICATION_STATUS.PENDING) {
    throw new AppError(NOT_PENDING_APPROVE_MESSAGE, 409, 'APPLICATION_NOT_PENDING');
  }

  const session = await mongoose.startSession();
  let createdUserId = null;

  try {
    await session.withTransaction(async () => {
      // Re-checked inside the transaction. Someone may have been created
      // between the read above and this write; the unique index on users.email
      // is the real guarantee, and this only turns it into a clearer error.
      const clash = await User.findOne({ email: application.email })
        .select('_id')
        .session(session);

      if (clash) {
        throw new AppError(EMAIL_TAKEN_MESSAGE, 409, 'EMAIL_TAKEN');
      }

      // THE PASSWORD IS CARRIED ACROSS AS A HASH, NOT REGENERATED. The
      // applicant chose it on the form (§11); nobody has the plaintext, the
      // admin included.
      const [user] = await User.create(
        [
          {
            email: application.email,
            passwordHash: application.passwordHash,
            role: ROLES.THERAPIST,
            status: USER_STATUS.ACTIVE,
          },
        ],
        { session },
      );

      await TherapistProfile.create([profileFromApplication(application, user._id)], {
        session,
      });

      application.status = APPLICATION_STATUS.APPROVED;
      application.reviewedAt = new Date();
      await application.save({ session });

      createdUserId = user._id;
    });
  } catch (error) {
    // A duplicate key here means the unique index caught a race the check
    // above missed. Reported as the same clean 409 rather than a 500.
    if (error?.code === 11000) {
      throw new AppError(EMAIL_TAKEN_MESSAGE, 409, 'EMAIL_TAKEN');
    }
    throw error;
  } finally {
    await session.endSession();
  }

  // AFTER the commit, never inside it. An email sent inside a transaction that
  // then aborts tells someone they were approved when they were not.
  //
  // A failure here does not undo the approval: the account exists and works,
  // and losing it because Resend hiccuped would be far worse than a missing
  // notification. Same reasoning as the application emails in chunk 3.2.
  let emailSent = false;
  try {
    const result = await sendTherapistWelcomeEmail(application.email, {
      firstName: application.firstName,
    });
    emailSent = Boolean(result?.delivered);
  } catch (error) {
    console.error('Therapist welcome email failed:', error?.message ?? error);
  }

  return {
    alreadyApproved: false,
    applicationId: application._id.toString(),
    userId: createdUserId.toString(),
    reviewedAt: application.reviewedAt,
    emailSent,
  };
}

/**
 * Reject an application. No account is created and the record is retained
 * permanently (§9.2) — a rejected applicant may submit a new application.
 *
 * No email is sent. §16 lists none, and the wording of a rejection to a
 * qualified clinician is the client's decision rather than ours. Recorded as an
 * open item in docs/ongoing.md, because it means an applicant hears nothing.
 */
export async function rejectApplication(id, { reason } = {}) {
  const application = await loadApplicationForReview(id);

  if (application.status === APPLICATION_STATUS.REJECTED) {
    return {
      alreadyRejected: true,
      applicationId: application._id.toString(),
      reviewedAt: application.reviewedAt,
    };
  }

  if (application.status !== APPLICATION_STATUS.PENDING) {
    throw new AppError(NOT_PENDING_REJECT_MESSAGE, 409, 'APPLICATION_NOT_PENDING');
  }

  application.status = APPLICATION_STATUS.REJECTED;
  application.reviewedAt = new Date();
  if (reason) application.rejectionReason = reason;
  await application.save();

  return {
    alreadyRejected: false,
    applicationId: application._id.toString(),
    reviewedAt: application.reviewedAt,
  };
}
