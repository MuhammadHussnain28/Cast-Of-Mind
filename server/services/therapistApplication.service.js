import mongoose from 'mongoose';
import env from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword } from '../utils/password.js';
import { User } from '../models/User.js';
import { TherapistApplication, APPLICATION_STATUS } from '../models/TherapistApplication.js';
import { sendEmail } from './email/email.service.js';
import { applicationReceivedEmail } from './email/templates/applicationReceived.js';
import { newApplicationEmail } from './email/templates/newApplication.js';
import {
  DUPLICATE_EMAIL_MESSAGE,
  DUPLICATE_EMAIL_CODE,
  APPLICATION_NOT_FOUND_MESSAGE,
  INVALID_ID_MESSAGE,
} from '../constants/therapistApplications.js';

// Therapist application submission — master spec §23, §10.4.
//
// PRIVACY: nothing here logs the applicant's password, taxpayer id, address, or
// document URLs. Only the application id and whether an email was sent.

/**
 * Fire off an email without letting a delivery failure break the caller.
 *
 * THE APPLICATION IS ALREADY SAVED by the time these run. Losing a real,
 * complete 34-field application because Resend hiccuped would be far worse than
 * a missing notification — and the admin sees every application in the portal
 * regardless, so email is a convenience, not the record.
 */
async function sendQuietly(label, payload) {
  try {
    await sendEmail(payload);
    return true;
  } catch (error) {
    console.error(`Application email failed (${label}):`, error?.message ?? error);
    return false;
  }
}

/**
 * Create a therapist application.
 *
 * @param {object} input Already validated and coerced by the Zod schema.
 * @returns {Promise<{ id: string, status: string, submittedAt: Date }>}
 */
export async function submitApplication(input) {
  const { password, ...fields } = input;
  const email = fields.email;

  // One rejection for BOTH cases — an existing account of any role, and a
  // pending application. Separate messages would tell a stranger which, and
  // "this address belongs to a client" is exactly the fact chunk 1.2 was built
  // to protect. Queried in parallel; neither result changes the reply.
  const [existingUser, pendingApplication] = await Promise.all([
    User.findOne({ email }).select('_id').lean(),
    TherapistApplication.findOne({ email, status: APPLICATION_STATUS.PENDING })
      .select('_id')
      .lean(),
  ]);

  if (existingUser || pendingApplication) {
    throw new AppError(DUPLICATE_EMAIL_MESSAGE, 409, DUPLICATE_EMAIL_CODE);
  }

  // Hashed here, at the boundary. The plaintext came in on the request and goes
  // no further: the model has no field that could hold it.
  const passwordHash = await hashPassword(password);

  let application;

  try {
    application = await TherapistApplication.create({
      ...fields,
      passwordHash,
      status: APPLICATION_STATUS.PENDING,
    });
  } catch (error) {
    // The partial unique index on (email where status: pending) is the real
    // guard against two submissions racing past the check above. Both would
    // pass the read, and only one can win the write.
    if (error?.code === 11000) {
      throw new AppError(DUPLICATE_EMAIL_MESSAGE, 409, DUPLICATE_EMAIL_CODE);
    }
    throw error;
  }

  const applicationId = application._id.toString();

  const applicantMail = applicationReceivedEmail({
    firstName: application.firstName,
    applicationId,
  });

  const adminMail = newApplicationEmail({
    firstName: application.firstName,
    lastName: application.lastName,
    title: application.title,
    therapistType: application.therapistType,
    country: application.country,
    specialtyTags: application.specialtyTags,
    applicationId,
  });

  await Promise.all([
    sendQuietly('applicant confirmation', {
      to: email,
      subject: applicantMail.subject,
      html: applicantMail.html,
      text: applicantMail.text,
    }),
    sendQuietly('admin notification', {
      // CONTACT_TO is the business inbox; approved 2026-09-02 rather than adding
      // a second variable pointing at the same place. Falls back to the
      // applicant in development so the terminal fallback still has a recipient.
      to: env.contactTo || email,
      subject: adminMail.subject,
      html: adminMail.html,
      text: adminMail.text,
    }),
  ]);

  console.log(`Therapist application received: ${applicationId}`);

  return {
    id: applicationId,
    status: application.status,
    submittedAt: application.submittedAt,
  };
}

/**
 * Public status check.
 *
 * Returns the status and nothing else — no name, no email, no field of the
 * application itself. MongoDB ObjectIds embed a timestamp and a counter, so
 * they are partly guessable; anything richer here would be a leak to whoever
 * guessed one.
 *
 * @param {string} id
 * @returns {Promise<{ status: string, submittedAt: Date, reviewedAt: Date|null }>}
 */
export async function getApplicationStatus(id) {
  // Checked before the query: an unparseable id makes Mongoose throw a
  // CastError, which the global handler would report as an unknown 500.
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(INVALID_ID_MESSAGE, 400, 'INVALID_APPLICATION_ID');
  }

  const application = await TherapistApplication.findById(id)
    .select('status submittedAt reviewedAt')
    .lean();

  if (!application) {
    throw new AppError(APPLICATION_NOT_FOUND_MESSAGE, 404, 'APPLICATION_NOT_FOUND');
  }

  return {
    status: application.status,
    submittedAt: application.submittedAt,
    reviewedAt: application.reviewedAt ?? null,
  };
}
