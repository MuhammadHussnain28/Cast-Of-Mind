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

// `therapistApplications` — a submitted 5-step application awaiting admin review.
// Master spec Section 10.4, fields per Section 23.
//
// THE APPLICANT IS NOT A USER. They have no `users` record and cannot log in.
// On approval, slice 4 reads this document to create `users` + `therapistProfiles`
// in one transaction; this document itself is retained permanently as a record.
//
// Kept separate from `therapistProfiles` on purpose: an applicant is not a
// therapist, and merging them would fill the profile collection with pending and
// rejected records that the matching engine would have to filter out for ever.
//
// NOTE ON THE FIELD COUNT: the spec calls this "33 fields". Adding up Section 23's
// own per-step table gives 34 (30 mandatory, 4 optional), and 35 storage slots
// once `disciplinaryDetails` is counted separately from the yes/no it hangs off.
// Every field in the per-step tables is present below.

const TITLES = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];
const CREDENTIAL_TYPES = ['Diploma/Degree', 'Certificate', 'License'];

export const APPLICATION_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const APPLICATION_STATUS_VALUES = Object.freeze(Object.values(APPLICATION_STATUS));

export const THERAPIST_TYPE_MAX = 50;
export const MIN_YEARS_EXPERIENCE = 2; // from the eligibility notice, Section 23
export const MAX_YEARS_EXPERIENCE = 70;
export const MIN_APPLICANT_AGE = 18;

// Tag count limits come from the constants files, which already own them —
// one source of truth, so the model and the form cannot disagree.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/; // 24-hour HH:MM

const DAYS = Object.freeze([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

/**
 * Validator factory for the two fixed-list multi-selects.
 *
 * Checks three things, and the third is the one a naive implementation misses:
 * count, membership of the master list, and NO DUPLICATES. Without the duplicate
 * check, ['Anxiety','Anxiety','Anxiety'] satisfies "3 to 4 tags" while leaving
 * the therapist with effectively one specialty, quietly breaking matching.
 */
function fixedListValidator({ allowed, min, max, label }) {
  const allowedSet = new Set(allowed);

  return {
    validator(values) {
      if (!Array.isArray(values)) return false;
      if (values.length < min || values.length > max) return false;
      if (new Set(values).size !== values.length) return false;
      return values.every((value) => allowedSet.has(value));
    },
    message: `Select ${min} to ${max} different ${label}, each from the approved list.`,
  };
}

// One day's availability. Times are wall-clock strings in the therapist's own
// timezone (stored separately as an IANA identifier), NOT timestamps — so the
// UTC storage rule does not apply here. "09:00 on Mondays" is a recurring local
// intention, not a moment in time.
const daySchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    start: { type: String, default: null },
    end: { type: String, default: null },
  },
  { _id: false },
);

const workingHoursFields = DAYS.reduce((fields, day) => {
  fields[day] = { type: daySchema, default: () => ({}) };
  return fields;
}, {});

const workingHoursSchema = new mongoose.Schema(
  {
    ...workingHoursFields,
    // Free text escape hatch, so no therapist is blocked by a rigid grid —
    // overnight availability, alternating weeks, "by arrangement".
    note: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: false },
);

const therapistApplicationSchema = new mongoose.Schema(
  {
    // ---------- Step 1 — Personal details ----------
    title: {
      type: String,
      required: [true, 'Title is required.'],
      enum: { values: TITLES, message: 'Title must be one of: {VALUES}.' },
    },

    firstName: {
      type: String,
      required: [true, 'First name is required.'],
      trim: true,
      maxlength: [80, 'First name must be 80 characters or fewer.'],
    },

    lastName: {
      type: String,
      required: [true, 'Last name is required.'],
      trim: true,
      maxlength: [80, 'Last name must be 80 characters or fewer.'],
    },

    // Feeds the client's gender-preference SOFT SORT in matching (Section 15).
    // It never filters anyone out.
    gender: {
      type: String,
      required: [true, 'Gender is required.'],
      enum: { values: GENDERS, message: 'Gender must be one of: {VALUES}.' },
    },

    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required.'],
      validate: [
        {
          validator: (value) => value instanceof Date && value.getTime() < Date.now(),
          message: 'Date of birth must be in the past.',
        },
        {
          // Sanity floor, not a spec rule. The eligibility notice already implies
          // a postgraduate qualification and two years of practice.
          validator(value) {
            if (!(value instanceof Date)) return false;
            const eighteenthBirthday = new Date(value);
            eighteenthBirthday.setFullYear(eighteenthBirthday.getFullYear() + MIN_APPLICANT_AGE);
            return eighteenthBirthday.getTime() <= Date.now();
          },
          message: `Applicants must be at least ${MIN_APPLICANT_AGE} years old.`,
        },
      ],
    },

    // Becomes their login email on approval. NOT unique across the collection —
    // a rejected applicant may reapply. See the partial index at the foot of
    // this file for the "one live application per address" rule.
    email: {
      type: String,
      required: [true, 'Email is required.'],
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, 'Email must be a valid address.'],
    },

    // There is deliberately NO `password` field on this schema. The applicant's
    // password is hashed at submission time (chunk 3.2) and only the hash is ever
    // written here, so plaintext cannot be stored even by a mistaken caller.
    // Carried over verbatim to the `users` record on approval — the admin never
    // sees it, and it is not editable from the therapist profile (Section 11).
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required.'],
      select: false,
    },

    photoUrl: {
      type: String,
      required: [true, 'Profile photo is required.'],
      trim: true,
    },

    // ---------- Step 2 — Location & availability ----------
    streetAddress: {
      type: String,
      required: [true, 'Street address is required.'],
      trim: true,
      maxlength: 200,
    },

    city: { type: String, required: [true, 'City is required.'], trim: true, maxlength: 100 },

    stateProvince: {
      type: String,
      required: [true, 'State or province is required.'],
      trim: true,
      maxlength: 100,
    },

    zipPostal: {
      type: String,
      required: [true, 'Zip or postal code is required.'],
      trim: true,
      maxlength: 20,
    },

    country: { type: String, required: [true, 'Country is required.'], trim: true, maxlength: 100 },

    // IANA identifier, e.g. "Europe/London". Display only — never a matching
    // filter (Section 15). Used to convert session times for each viewer.
    timezone: {
      type: String,
      required: [true, 'Timezone is required.'],
      trim: true,
      maxlength: 64,
    },

    languages: {
      type: [String],
      required: true,
      validate: {
        validator: (values) =>
          Array.isArray(values) &&
          values.length > 0 &&
          values.length <= 20 &&
          new Set(values).size === values.length &&
          values.every((value) => typeof value === 'string' && value.trim().length > 0),
        message: 'Select at least one language, with no duplicates.',
      },
    },

    workingHours: {
      type: workingHoursSchema,
      required: [true, 'Working hours are required.'],
      default: () => ({}),
    },

    // ---------- Step 3 — Professional background ----------
    // Free text by explicit client decision, not a dropdown — therapists describe
    // their role in their own words (Section 10.3).
    therapistType: {
      type: String,
      required: [true, 'Therapist type is required.'],
      trim: true,
      maxlength: [
        THERAPIST_TYPE_MAX,
        `Therapist type must be ${THERAPIST_TYPE_MAX} characters or fewer.`,
      ],
    },

    credentialType: {
      type: String,
      required: [true, 'Credential type is required.'],
      enum: { values: CREDENTIAL_TYPES, message: 'Credential type must be one of: {VALUES}.' },
    },

    credentialInitials: {
      type: String,
      required: [true, 'Credential initials are required.'],
      trim: true,
      maxlength: 60,
    },

    yearsExperience: {
      type: Number,
      required: [true, 'Years of experience is required.'],
      min: [
        MIN_YEARS_EXPERIENCE,
        `We require at least ${MIN_YEARS_EXPERIENCE} years of counselling experience.`,
      ],
      max: [MAX_YEARS_EXPERIENCE, 'Please enter a realistic number of years.'],
      validate: {
        validator: Number.isInteger,
        message: 'Years of experience must be a whole number.',
      },
    },

    educationSummary: {
      type: String,
      required: [true, 'Summary of education is required.'],
      trim: true,
      maxlength: 4000,
    },

    currentWorkSituation: {
      type: String,
      required: [true, 'Current work situation is required.'],
      trim: true,
      maxlength: 1000,
    },

    licenseNumber: { type: String, trim: true, maxlength: 100, default: '' }, // optional

    // OPTIONAL AND SENSITIVE. A government tax identifier. No client-facing
    // endpoint reads this collection at all; if that ever changes, this field
    // must not travel with it.
    taxpayerIdNumber: { type: String, trim: true, maxlength: 100, default: '' },

    // ---------- Step 4 — Practice & specialties ----------
    // THE ONLY FIELD THAT DRIVES MATCHING (Section 15). Both sides pick from the
    // same frozen 27-item list; a free-text specialty would never match anything.
    specialtyTags: {
      type: [String],
      required: true,
      validate: fixedListValidator({
        allowed: SPECIALTY_TAGS,
        min: SPECIALTY_TAGS_MIN,
        max: SPECIALTY_TAGS_MAX,
        label: 'specialty tags',
      }),
    },

    // DISPLAY ONLY — never used in matching (Section 15, Critical Rules).
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

    bio: {
      type: String,
      required: [true, 'Bio is required.'],
      trim: true,
      maxlength: [1200, 'Bio must be 1200 characters or fewer.'],
    },

    licensingStatus: {
      type: String,
      required: [true, 'Licensing status is required.'],
      trim: true,
      maxlength: 500,
    },

    // Covers the "no disciplinary actions in the past 10 years" requirement.
    // A `true` here does NOT auto-reject — the model records, the admin decides.
    disciplinaryActions: {
      type: Boolean,
      required: [true, 'Please answer the disciplinary actions question.'],
    },

    disciplinaryDetails: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
      required: [
        function requiredWhenDisciplined() {
          return this.disciplinaryActions === true;
        },
        'Please describe the disciplinary action.',
      ],
    },

    // ---------- Step 5 — Compliance & documents ----------
    // As above: a `false` is recorded, not auto-rejected.
    malpracticeInsurance: {
      type: Boolean,
      required: [true, 'Please answer the malpractice insurance question.'],
    },

    insuranceDetails: { type: String, trim: true, maxlength: 1000, default: '' }, // optional

    certificateUrl1: {
      type: String,
      required: [true, 'At least one certificate is required.'],
      trim: true,
    },

    certificateUrl2: { type: String, trim: true, default: '' }, // optional
    licenseDocUrl: { type: String, trim: true, default: '' }, // optional

    // Cloudinary public ids for the authenticated (non-public) documents.
    // The raw URL of an authenticated asset returns nothing on its own; slice 4
    // signs a short-lived delivery URL from the id when the admin opens the
    // application. Stored because deriving an id back out of a URL is brittle.
    certificatePublicId1: { type: String, trim: true, default: '' },
    certificatePublicId2: { type: String, trim: true, default: '' },
    licenseDocPublicId: { type: String, trim: true, default: '' },

    // ---------- Workflow ----------
    status: {
      type: String,
      required: true,
      enum: { values: APPLICATION_STATUS_VALUES, message: 'Status must be one of: {VALUES}.' },
      default: APPLICATION_STATUS.PENDING,
    },

    reviewedAt: { type: Date, default: null },
  },
  {
    // `submittedAt` is the spec's name for the creation time (Section 10.4), so
    // it is mapped rather than duplicated alongside a createdAt.
    timestamps: { createdAt: 'submittedAt', updatedAt: 'updatedAt' },

    toJSON: {
      // Second line of defence behind select:false, so a document fetched with
      // its hidden fields cannot leak the hash through res.json().
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Working hours span several fields at once, so the checks live at document
// level rather than on any single path.
therapistApplicationSchema.pre('validate', function validateWorkingHours() {
  const hours = this.workingHours;

  if (!hours) {
    this.invalidate('workingHours', 'Working hours are required.');
    return;
  }

  const enabledDays = DAYS.filter((day) => hours[day]?.enabled);

  if (enabledDays.length === 0) {
    this.invalidate('workingHours', 'Select at least one day you are available.');
    return;
  }

  for (const day of enabledDays) {
    const { start, end } = hours[day];

    if (!TIME_PATTERN.test(start ?? '') || !TIME_PATTERN.test(end ?? '')) {
      this.invalidate(
        `workingHours.${day}`,
        `Enter a start and end time for ${day} in 24-hour format, for example 09:00.`,
      );
      continue;
    }

    // Rejecting end <= start catches the common typo. Availability that genuinely
    // crosses midnight goes in the note field, and the message says so rather
    // than leaving the applicant stuck.
    if (end <= start) {
      this.invalidate(
        `workingHours.${day}`,
        `End time must be after start time on ${day}. For hours that cross midnight, use the notes field.`,
      );
    }
  }
});

// Admin review list: pending applications, oldest first.
therapistApplicationSchema.index({ status: 1, submittedAt: -1 });

// One LIVE application per address. Rejected and approved records stay, so a
// rejected applicant can reapply and the history is preserved — but two pending
// applications for one email would let the admin approve both, and the second
// approval would then collide on the unique `users.email` index halfway through
// the two-document transaction.
therapistApplicationSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { status: APPLICATION_STATUS.PENDING },
    name: 'one_pending_application_per_email',
  },
);

export const TherapistApplication = mongoose.model(
  'TherapistApplication',
  therapistApplicationSchema,
);

export default TherapistApplication;
