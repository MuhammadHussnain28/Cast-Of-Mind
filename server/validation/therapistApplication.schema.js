import { z } from 'zod';
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
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_BYTES } from '../utils/password.js';
import {
  THERAPIST_TYPE_MAX,
  MIN_YEARS_EXPERIENCE,
  MAX_YEARS_EXPERIENCE,
  MIN_APPLICANT_AGE,
} from '../models/TherapistApplication.js';
import { isOwnCloudinaryUrl } from '../utils/cloudinaryUrl.js';

// Request rules for POST /api/v1/therapist-applications — master spec §23.
//
// The model validates all of this too. That is not duplication for its own
// sake: this layer rejects bad input with a 422 and a per-field message before
// anything touches the database, and the model is the last line of defence for
// any caller that bypasses a route.
//
// Every limit is IMPORTED, never retyped. If the tag list or the password floor
// changes, both layers move together and cannot drift apart.

const TITLES = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];
const CREDENTIAL_TYPES = ['Diploma/Degree', 'Certificate', 'License'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Required free text with a maximum length. */
function text(label, max) {
  return z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);
}

/** Optional free text — an empty string is allowed and means "not given". */
function optionalText(label, max) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .optional()
    .default('');
}

/** A file URL that must point at our own Cloudinary account. */
function uploadUrl(label, { required }) {
  const base = z
    .string({ error: `${label} is required.` })
    .trim()
    .refine(isOwnCloudinaryUrl, `${label} must be uploaded through this form.`);

  if (required) return base;

  // Optional uploads accept an empty string, but anything non-empty still has
  // to be one of ours.
  return z
    .string()
    .trim()
    .refine((v) => v === '' || isOwnCloudinaryUrl(v), `${label} must be uploaded through this form.`)
    .optional()
    .default('');
}

/** Fixed-list multi-select: count, membership, and no duplicates. */
function fixedList({ allowed, min, max, label }) {
  return z
    .array(z.enum(allowed, { error: `Choose ${label} from the list provided.` }), {
      error: `Select ${min} to ${max} ${label}.`,
    })
    .min(min, `Select at least ${min} ${label}.`)
    .max(max, `Select no more than ${max} ${label}.`)
    .refine((values) => new Set(values).size === values.length, `Choose ${max} different ${label}.`);
}

const daySchema = z.object({
  enabled: z.boolean().default(false),
  start: z.string().trim().optional().default(''),
  end: z.string().trim().optional().default(''),
});

const workingHoursSchema = z
  .object({
    ...Object.fromEntries(DAYS.map((day) => [day, daySchema.optional().default({})])),
    note: z.string().trim().max(500, 'Availability note must be 500 characters or fewer.').optional().default(''),
  })
  .superRefine((hours, ctx) => {
    const enabled = DAYS.filter((day) => hours[day]?.enabled);

    if (enabled.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['workingHours'],
        message: 'Select at least one day you are available.',
      });
      return;
    }

    for (const day of enabled) {
      const { start, end } = hours[day];

      if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
        ctx.addIssue({
          code: 'custom',
          path: [day],
          message: `Enter a start and end time for ${day} in 24-hour format, for example 09:00.`,
        });
        continue;
      }

      // Rejecting end <= start catches the common typo. Genuinely overnight
      // availability goes in the note field, and the message says so rather
      // than leaving the applicant stuck.
      if (end <= start) {
        ctx.addIssue({
          code: 'custom',
          path: [day],
          message: `End time must be after start time on ${day}. For hours that cross midnight, use the notes field.`,
        });
      }
    }
  });

export const therapistApplicationSchema = z
  .object({
    // ---------- Step 1 — Personal details ----------
    title: z.enum(TITLES, { error: 'Choose a title.' }),
    firstName: text('First name', 80),
    lastName: text('Last name', 80),
    gender: z.enum(GENDERS, { error: 'Choose a gender.' }),

    dateOfBirth: z
      .string({ error: 'Date of birth is required.' })
      .trim()
      .refine((v) => !Number.isNaN(Date.parse(v)), 'Enter a valid date of birth.')
      .transform((v) => new Date(v))
      .refine((d) => d.getTime() < Date.now(), 'Date of birth must be in the past.')
      .refine((d) => {
        const eighteenth = new Date(d);
        eighteenth.setFullYear(eighteenth.getFullYear() + MIN_APPLICANT_AGE);
        return eighteenth.getTime() <= Date.now();
      }, `Applicants must be at least ${MIN_APPLICANT_AGE} years old.`),

    email: z
      .string({ error: 'Email is required.' })
      .trim()
      .toLowerCase()
      .pipe(z.email('Check the email address — it needs an @ and a domain.')),

    // The plaintext arrives here and NOWHERE ELSE. The service hashes it
    // immediately and the model has no field to store it in.
    //
    // The byte cap is not cosmetic: bcrypt silently truncates past 72 bytes, so
    // two different long passwords could otherwise hash identically. Counted in
    // bytes because one accented letter or emoji costs several.
    password: z
      .string({ error: 'Choose a password.' })
      .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
      .refine(
        (value) => Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES,
        `Password is too long (maximum ${MAX_PASSWORD_BYTES} bytes).`,
      ),

    photoUrl: uploadUrl('Profile photo', { required: true }),

    // ---------- Step 2 — Location & availability ----------
    streetAddress: text('Street address', 200),
    city: text('City', 100),
    stateProvince: text('State or province', 100),
    zipPostal: text('Zip or postal code', 20),
    country: text('Country', 100),
    timezone: text('Timezone', 64),

    languages: z
      .array(z.string().trim().min(1, 'Language names cannot be blank.').max(60), {
        error: 'Select at least one language.',
      })
      .min(1, 'Select at least one language.')
      .max(20, 'Select no more than 20 languages.')
      .refine((v) => new Set(v).size === v.length, 'Remove the duplicate languages.'),

    workingHours: workingHoursSchema,

    // ---------- Step 3 — Professional background ----------
    therapistType: text('Therapist type', THERAPIST_TYPE_MAX),
    credentialType: z.enum(CREDENTIAL_TYPES, { error: 'Choose a credential type.' }),
    credentialInitials: text('Credential initials', 60),

    yearsExperience: z
      .number({ error: 'Years of experience is required.' })
      .int('Years of experience must be a whole number.')
      .min(MIN_YEARS_EXPERIENCE, `We require at least ${MIN_YEARS_EXPERIENCE} years of counselling experience.`)
      .max(MAX_YEARS_EXPERIENCE, 'Please enter a realistic number of years.'),

    educationSummary: text('Summary of education', 4000),
    currentWorkSituation: text('Current work situation', 1000),
    licenseNumber: optionalText('License number', 100),
    taxpayerIdNumber: optionalText('Taxpayer identification number', 100),

    // ---------- Step 4 — Practice & specialties ----------
    // THE ONLY FIELD THAT DRIVES MATCHING (§15).
    specialtyTags: fixedList({
      allowed: SPECIALTY_TAGS,
      min: SPECIALTY_TAGS_MIN,
      max: SPECIALTY_TAGS_MAX,
      label: 'specialty tags',
    }),

    // Display only — never used in matching.
    treatmentOrientations: fixedList({
      allowed: TREATMENT_ORIENTATIONS,
      min: TREATMENT_ORIENTATIONS_MIN,
      max: TREATMENT_ORIENTATIONS_MAX,
      label: 'treatment orientations',
    }),

    bio: text('Bio', 1200),
    licensingStatus: text('Licensing status', 500),

    disciplinaryActions: z.boolean({ error: 'Please answer the disciplinary actions question.' }),
    disciplinaryDetails: optionalText('Disciplinary details', 2000),

    // ---------- Step 5 — Compliance & documents ----------
    malpracticeInsurance: z.boolean({ error: 'Please answer the malpractice insurance question.' }),
    insuranceDetails: optionalText('Insurance details', 1000),

    certificateUrl1: uploadUrl('Certificate', { required: true }),
    certificateUrl2: uploadUrl('Second certificate', { required: false }),
    licenseDocUrl: uploadUrl('License document', { required: false }),

    // Cloudinary ids for the authenticated documents, returned by the upload
    // endpoint alongside each URL. Slice 4 signs a viewing URL from these.
    certificatePublicId1: optionalText('Certificate reference', 200),
    certificatePublicId2: optionalText('Second certificate reference', 200),
    licenseDocPublicId: optionalText('License document reference', 200),
  })

  // Unknown keys are dropped rather than rejected, so a future form field
  // cannot 422 the whole submission before the backend knows about it.
  
  .superRefine((data, ctx) => {
    if (data.disciplinaryActions === true && data.disciplinaryDetails.trim().length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['disciplinaryDetails'],
        message: 'Please describe the disciplinary action.',
      });
    }
  });

export default therapistApplicationSchema;
