import { z } from 'zod'
import { SPECIALTY_TAGS, SPECIALTY_TAGS_MIN, SPECIALTY_TAGS_MAX } from '../../data/specialtyTags.js'
import {
  TREATMENT_ORIENTATIONS,
  TREATMENT_ORIENTATIONS_MIN,
  TREATMENT_ORIENTATIONS_MAX,
} from '../../data/treatmentOrientations.js'

/**
 * Client-side rules for the therapist application.
 *
 * MIRRORS `server/validation/therapistApplication.schema.js`. The two cannot
 * share a file across the client/server split, so if a rule changes in one it
 * must change in the other. The server is the authority; this layer exists to
 * catch mistakes before a 34-field form is posted.
 */

export const TITLES = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.']

export const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export const DAYS = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
]

export const CREDENTIAL_TYPES = ['Diploma/Degree', 'Certificate', 'License']

export const THERAPIST_TYPE_MAX = 50
export const BIO_MAX = 1200
export const MIN_YEARS_EXPERIENCE = 2
export const MAX_YEARS_EXPERIENCE = 70

export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_BYTES = 72
export const MIN_APPLICANT_AGE = 18

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

const required = (label, max) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`)

export const stepOneSchema = z.object({
  title: z.enum(TITLES, { message: 'Choose a title.' }),
  firstName: required('First name', 80),
  lastName: required('Last name', 80),
  gender: z.enum(
    GENDERS.map((g) => g.value),
    { message: 'Choose an option.' },
  ),

  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required.')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Enter a valid date.')
    .refine((v) => new Date(v).getTime() < Date.now(), 'Date of birth must be in the past.')
    .refine((v) => {
      const eighteenth = new Date(v)
      eighteenth.setFullYear(eighteenth.getFullYear() + MIN_APPLICANT_AGE)
      return eighteenth.getTime() <= Date.now()
    }, `You must be at least ${MIN_APPLICANT_AGE} to apply.`),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required.')
    .pipe(z.email('Check the email address — it needs an @ and a domain.')),

  // Byte-counted, not character-counted: bcrypt truncates past 72 bytes and one
  // accented letter costs several.
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
    .refine(
      (v) => new TextEncoder().encode(v).length <= MAX_PASSWORD_BYTES,
      'That password is too long. Try a shorter one.',
    ),

  photoUrl: z.string().min(1, 'Add a profile photo before continuing.'),
})

const daySchema = z.object({
  enabled: z.boolean(),
  start: z.string(),
  end: z.string(),
})

export const stepTwoSchema = z.object({
  streetAddress: required('Street address', 200),
  city: required('City', 100),
  stateProvince: required('State or province', 100),
  zipPostal: required('Zip or postal code', 20),
  country: required('Country', 100),
  timezone: required('Timezone', 64),

  languages: z
    .array(z.string().trim().min(1))
    .min(1, 'Add at least one language you work in.')
    .max(20, 'That is more than 20 languages.')
    .refine((v) => new Set(v).size === v.length, 'Remove the duplicate languages.'),

  workingHours: z
    .object({
      ...Object.fromEntries(DAYS.map((d) => [d.key, daySchema])),
      note: z.string().trim().max(500, 'Keep the note under 500 characters.'),
    })
    .superRefine((hours, ctx) => {
      const enabled = DAYS.filter((d) => hours[d.key]?.enabled)

      if (enabled.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['root'],
          message: 'Turn on at least one day you are available.',
        })
        return
      }

      for (const day of enabled) {
        const { start, end } = hours[day.key]

        if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
          ctx.addIssue({
            code: 'custom',
            path: [day.key],
            message: `Add a start and end time for ${day.label}.`,
          })
          continue
        }

        // Overnight availability goes in the note, and the message says so
        // rather than leaving someone stuck on a rule they cannot satisfy.
        if (end <= start) {
          ctx.addIssue({
            code: 'custom',
            path: [day.key],
            message: `${day.label} ends before it starts. For hours crossing midnight, use the note below.`,
          })
        }
      }
    }),
})

/** Fixed-list multi-select: count, membership, and no duplicates. */
function fixedList({ allowed, min, max, label }) {
  return z
    .array(z.enum(allowed, { message: `Choose ${label} from the list provided.` }))
    .min(min, `Choose at least ${min} ${label}.`)
    .max(max, `Choose no more than ${max} ${label}.`)
    .refine((v) => new Set(v).size === v.length, `Remove the duplicate ${label}.`)
}

export const stepThreeSchema = z.object({
  therapistType: required('Therapist type', THERAPIST_TYPE_MAX),
  credentialType: z.enum(CREDENTIAL_TYPES, { message: 'Choose a credential type.' }),
  credentialInitials: required('Credential initials', 60),

  // Arrives from a number input as a string, so it is coerced before the
  // numeric rules run — otherwise every value fails as "not a number".
  yearsExperience: z
    .union([z.string(), z.number()])
    .refine((v) => String(v).trim() !== '', 'Years of experience is required.')
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v), 'Enter a number.')
    .refine((v) => Number.isInteger(v), 'Enter a whole number of years.')
    .refine((v) => v >= MIN_YEARS_EXPERIENCE, `We ask for at least ${MIN_YEARS_EXPERIENCE} years.`)
    .refine((v) => v <= MAX_YEARS_EXPERIENCE, 'Enter a realistic number of years.'),

  educationSummary: required('Summary of education', 4000),
  currentWorkSituation: required('Current work situation', 1000),

  licenseNumber: z.string().trim().max(100, 'Keep it under 100 characters.'),
  taxpayerIdNumber: z.string().trim().max(100, 'Keep it under 100 characters.'),
})

// Kept as a plain shape so both stepFourSchema and applicationSchema build from
// the identical rules. superRefine returns a wrapped schema whose `.shape` is
// undefined, so reaching through it would silently drop these constraints.
const stepFourFields = {
    specialtyTags: fixedList({
      allowed: SPECIALTY_TAGS,
      min: SPECIALTY_TAGS_MIN,
      max: SPECIALTY_TAGS_MAX,
      label: 'specialty tags',
    }),
    treatmentOrientations: fixedList({
      allowed: TREATMENT_ORIENTATIONS,
      min: TREATMENT_ORIENTATIONS_MIN,
      max: TREATMENT_ORIENTATIONS_MAX,
      label: 'treatment orientations',
    }),
    bio: required('Bio', BIO_MAX),
    licensingStatus: required('Licensing status', 500),
    disciplinaryActions: z.enum(['yes', 'no'], { message: 'Please answer yes or no.' }),
    disciplinaryDetails: z.string().trim().max(2000, 'Keep it under 2000 characters.'),
}

/** Details are required only when the answer is yes. */
function refineDisciplinary(data, ctx) {
  if (data.disciplinaryActions === 'yes' && data.disciplinaryDetails.trim().length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['disciplinaryDetails'],
      message: 'Tell us what happened and when.',
    })
  }
}

export const stepFourSchema = z.object(stepFourFields).superRefine(refineDisciplinary)

export const stepFiveSchema = z.object({
  malpracticeInsurance: z.enum(['yes', 'no'], { message: 'Please answer yes or no.' }),
  insuranceDetails: z.string().trim().max(1000, 'Keep it under 1000 characters.'),

  certificateUrl1: z.string().min(1, 'Upload at least one certificate.'),
  certificatePublicId1: z.string(),

  certificateUrl2: z.string(),
  certificatePublicId2: z.string(),

  licenseDocUrl: z.string(),
  licenseDocPublicId: z.string(),
})

/** Field names per step — used to validate only the visible step. */
export const STEP_FIELDS = {
  1: ['title', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'email', 'password', 'photoUrl'],
  2: [
    'streetAddress',
    'city',
    'stateProvince',
    'zipPostal',
    'country',
    'timezone',
    'languages',
    'workingHours',
  ],
  3: [
    'therapistType',
    'credentialType',
    'credentialInitials',
    'yearsExperience',
    'educationSummary',
    'currentWorkSituation',
    'licenseNumber',
    'taxpayerIdNumber',
  ],
  4: [
    'specialtyTags',
    'treatmentOrientations',
    'bio',
    'licensingStatus',
    'disciplinaryActions',
    'disciplinaryDetails',
  ],
  5: [
    'malpracticeInsurance',
    'insuranceDetails',
    'certificateUrl1',
    'certificateUrl2',
    'licenseDocUrl',
  ],
}

/** How many steps the form has. The review screen sits after the last one. */
export const TOTAL_STEPS = 5

export const applicationSchema = stepOneSchema.merge(
  z.object({
    streetAddress: stepTwoSchema.shape.streetAddress,
    city: stepTwoSchema.shape.city,
    stateProvince: stepTwoSchema.shape.stateProvince,
    zipPostal: stepTwoSchema.shape.zipPostal,
    country: stepTwoSchema.shape.country,
    timezone: stepTwoSchema.shape.timezone,
    languages: stepTwoSchema.shape.languages,
    workingHours: stepTwoSchema.shape.workingHours,

    therapistType: stepThreeSchema.shape.therapistType,
    credentialType: stepThreeSchema.shape.credentialType,
    credentialInitials: stepThreeSchema.shape.credentialInitials,
    yearsExperience: stepThreeSchema.shape.yearsExperience,
    educationSummary: stepThreeSchema.shape.educationSummary,
    currentWorkSituation: stepThreeSchema.shape.currentWorkSituation,
    licenseNumber: stepThreeSchema.shape.licenseNumber,
    taxpayerIdNumber: stepThreeSchema.shape.taxpayerIdNumber,

    ...stepFourFields,
    ...stepFiveSchema.shape,
  }),
).superRefine(refineDisciplinary)

export const emptyWorkingHours = {
  ...Object.fromEntries(
    DAYS.map((d) => [
      d.key,
      { enabled: ['saturday', 'sunday'].includes(d.key) ? false : true, start: '09:00', end: '17:00' },
    ]),
  ),
  note: '',
}

export const emptyApplication = {
  title: '',
  firstName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
  email: '',
  password: '',
  photoUrl: '',
  streetAddress: '',
  city: '',
  stateProvince: '',
  zipPostal: '',
  country: '',
  timezone: '',
  languages: [],
  workingHours: emptyWorkingHours,

  therapistType: '',
  credentialType: '',
  credentialInitials: '',
  yearsExperience: '',
  educationSummary: '',
  currentWorkSituation: '',
  licenseNumber: '',
  taxpayerIdNumber: '',

  specialtyTags: [],
  treatmentOrientations: [],
  bio: '',
  licensingStatus: '',
  disciplinaryActions: '',
  disciplinaryDetails: '',

  malpracticeInsurance: '',
  insuranceDetails: '',
  certificateUrl1: '',
  certificatePublicId1: '',
  certificateUrl2: '',
  certificatePublicId2: '',
  licenseDocUrl: '',
  licenseDocPublicId: '',
}
