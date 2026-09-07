import mongoose from 'mongoose';
import {
  SPECIALTY_TAGS,
  SPECIALTY_TAGS_MIN,
  SPECIALTY_TAGS_MAX,
} from '../constants/specialtyTags.js';
import {
  TREATMENT_ORIENTATIONS,
  TREATMENT_ORIENTATIONS_MIN,
  TREATMENT_ORIENTATIONS_MAX,
} from '../constants/treatmentOrientations.js';
import { workingHoursSchema, validateWorkingHours } from './workingHours.js';
import { fixedListValidator } from './fixedListValidator.js';
import { USER_STATUS } from '../constants/roles.js';

// `therapistProfiles` — a working, approved therapist. Master spec §10.3.
//
// This is what the matching engine reads and what clients see. It exists only
// for therapists who have been approved: an applicant is not a therapist, which
// is why applications live in their own collection (§10.4). Nothing pending or
// rejected ever appears here, so the matching engine never has to filter.
//
// Created ONLY by the approval flow, inside the two-document transaction with
// `users`. There is no manual "add therapist" — deliberately excluded per §9.2.

const TITLES = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];
const CREDENTIAL_TYPES = ['Diploma/Degree', 'Certificate', 'License'];

export const THERAPIST_TYPE_MAX = 50;

const therapistProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one profile per therapist
      index: true,
    },

    // SPEC ADDITION (chunk 4.3, approved 2026-09-04). Not in §10.3.
    //
    // The permanent link back to the application this therapist came from.
    // §10.3 stores the document URLs but not the Cloudinary public ids needed
    // to sign a viewing URL for them, and those ids live on the retained
    // application. Matching on email instead would break the moment an admin
    // edits a therapist's email, which §9.3 explicitly allows.
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TherapistApplication',
      required: true,
      index: true,
    },

    // ---------- Identity ----------
    title: { type: String, required: true, enum: TITLES },
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName: { type: String, required: true, trim: true, maxlength: 100 },
    // Drives the gender-preference soft sort in matching (§15). Never a filter.
    gender: { type: String, required: true, enum: GENDERS },
    dateOfBirth: { type: Date, required: true },
    photoUrl: { type: String, required: true, trim: true },

    // ---------- Location ----------
    // Collected for the record and for timezone display. Country is NEVER a
    // matching filter (§15) — clients match with therapists anywhere.
    streetAddress: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    stateProvince: { type: String, required: true, trim: true, maxlength: 100 },
    zipPostal: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, maxlength: 100 },
    timezone: { type: String, required: true, trim: true, maxlength: 100 },

    // ---------- Professional ----------
    therapistType: {
      type: String,
      required: true,
      trim: true,
      maxlength: THERAPIST_TYPE_MAX,
    },
    credentialType: { type: String, required: true, enum: CREDENTIAL_TYPES },
    credentialInitials: { type: String, required: true, trim: true, maxlength: 100 },
    licenseNumber: { type: String, trim: true, maxlength: 100, default: '' },
    // Sensitive (§21). Admin-only; never sent to a client-facing endpoint.
    taxpayerIdNumber: { type: String, trim: true, maxlength: 100, default: '' },
    yearsExperience: { type: Number, required: true, min: 0, max: 70 },
    educationSummary: { type: String, required: true, trim: true, maxlength: 4000 },
    currentWorkSituation: { type: String, required: true, trim: true, maxlength: 2000 },
    languages: {
      type: [String],
      required: true,
      validate: {
        validator: (values) =>
          Array.isArray(values) &&
          values.length > 0 &&
          new Set(values).size === values.length,
        message: 'List at least one language, with no repeats.',
      },
    },

    // ---------- Practice ----------
    // THE ONLY FIELD THAT DRIVES MATCHING (§15). Values must stay byte-identical
    // to the master list — a reworded tag silently stops matching anyone.
    specialtyTags: {
      type: [String],
      required: true,
      index: true,
      validate: fixedListValidator({
        allowed: SPECIALTY_TAGS,
        min: SPECIALTY_TAGS_MIN,
        max: SPECIALTY_TAGS_MAX,
        label: 'specialty tags',
      }),
    },
    // Display only. Never a matching filter (§15).
    treatmentOrientations: {
      type: [String],
      required: true,
      validate: fixedListValidator({
        allowed: TREATMENT_ORIENTATIONS,
        min: TREATMENT_ORIENTATIONS_MIN,
        max: TREATMENT_ORIENTATIONS_MAX,
        label: 'treatment orientations',
      }),
    },
    bio: { type: String, required: true, trim: true, maxlength: 1200 },
    licensingStatus: { type: String, required: true, trim: true, maxlength: 500 },
    disciplinaryActions: { type: Boolean, required: true },
    disciplinaryDetails: { type: String, trim: true, maxlength: 2000, default: '' },

    // ---------- Compliance ----------
    malpracticeInsurance: { type: Boolean, required: true },
    insuranceDetails: { type: String, trim: true, maxlength: 1000, default: '' },

    // ---------- Availability ----------
    // Shown to clients at the top of the chat (§7.1), which is why it is
    // structured rather than free text.
    workingHours: { type: workingHoursSchema, required: true },

    // ---------- Documents ----------
    // Copied from the application. These are `authenticated` Cloudinary assets;
    // the public ids needed to sign a viewing URL stay on the application, which
    // is what applicationId above is for.
    certificateUrl1: { type: String, required: true, trim: true },
    certificateUrl2: { type: String, trim: true, default: '' },
    licenseDocUrl: { type: String, trim: true, default: '' },

    status: {
      type: String,
      required: true,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      index: true,
    },
  },
  {
    // §10.3 names only createdAt, but updatedAt costs nothing and the admin can
    // edit several of these fields (§9.3) — knowing when is worth having.
    timestamps: true,

    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

therapistProfileSchema.pre('validate', function checkWorkingHours() {
  validateWorkingHours(this);
});

// Matching reads active therapists whose specialty tags overlap the client's
// concern tags (§15), so those two fields are queried together every time.
therapistProfileSchema.index({ status: 1, specialtyTags: 1 });

export const TherapistProfile = mongoose.model('TherapistProfile', therapistProfileSchema);

export default TherapistProfile;
