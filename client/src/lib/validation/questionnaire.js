import { z } from 'zod'
import { SPECIALTY_TAGS } from '../../data/specialtyTags.js'
import { RELATIONSHIP_STATUSES } from '../../data/relationshipStatuses.js'
import { emailField } from './rules.js'

/**
 * Client-side rules for the intake questionnaire.
 *
 * MIRRORS `server/models/ClientProfile.js` and `server/constants/clientProfile.js`.
 * The two cannot share a file across the client/server split, so a rule changed
 * in one must change in the other. The server is the authority; this layer exists
 * to catch mistakes before anyone reaches checkout.
 *
 * The tag list itself is NOT mirrored again — it is the same
 * `data/specialtyTags.js` the therapist form uses, covered by the parity test.
 */

export const CLIENT_TYPES = ['individual', 'couple']
export const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say']
export const GENDER_PREFERENCES = ['male', 'female', 'no_preference']

// TWO FLOORS, mirroring server/constants/clientProfile.js.
//
// Storage accepts 1 (§6: "minimum 1"); the screen ASKS for 3-4 (§6, §10.2).
// Validation enforces the storage floor rather than the ask, deliberately:
// someone who genuinely has one concern must not be blocked at a hard gate the
// spec does not require. Chunk 5.4's screen uses ASK_MIN for its slots and copy.
export const CONCERN_TAGS_MIN = 1
export const CONCERN_TAGS_ASK_MIN = 3
export const CONCERN_TAGS_MAX = 4

export const MIN_AGE = 1
export const MAX_AGE = 120
export const NAME_MAX = 80
export const PLACE_MAX = 100

/**
 * A number input hands back a STRING. Chunk 3.5 shipped exactly this bug on the
 * therapist form — every correctly-filled application was rejected with a 422
 * until the payload mapper coerced it. Coerced here so the same mistake cannot
 * be made twice.
 */
const ageField = z
  .coerce
  .number({ message: 'Enter an age.' })
  .int('Age must be a whole number.')
  .min(MIN_AGE, `Age must be at least ${MIN_AGE}.`)
  .max(MAX_AGE, `Age must be ${MAX_AGE} or under.`)

const nameField = z
  .string()
  .trim()
  .min(1, 'Enter a name.')
  .max(NAME_MAX, `Name must be ${NAME_MAX} characters or fewer.`)

const placeField = (label) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(PLACE_MAX, `${label} must be ${PLACE_MAX} characters or fewer.`)

export const partnerSchema = z.object({
  name: nameField,
  age: ageField,
  gender: z.enum(GENDERS, { message: 'Choose a gender.' }),
})

// Count, membership AND no duplicates — the same three checks the model runs.
// Without the third, three copies of one tag satisfies "1 to 4" while leaving
// effectively one concern, which quietly narrows matching with no error anywhere.
export const concernTagsField = z
  .array(z.enum(SPECIALTY_TAGS, { message: 'Choose from the list.' }))
  .min(CONCERN_TAGS_MIN, 'Choose at least one thing you would like help with.')
  .max(CONCERN_TAGS_MAX, `Choose no more than ${CONCERN_TAGS_MAX}.`)
  .refine((tags) => new Set(tags).size === tags.length, 'Each concern can only be chosen once.')

/**
 * One schema per step, keyed by step id. The flow validates only the step being
 * left, so a later step can never block an earlier one.
 */
export const stepSchemas = {
  type: z.object({
    type: z.enum(CLIENT_TYPES, { message: 'Choose who this is for.' }),
  }),

  about: z.object({
    name: nameField,
    age: ageField,
    gender: z.enum(GENDERS, { message: 'Choose a gender.' }),
  }),

  partner1: z.object({ partner1: partnerSchema }),
  partner2: z.object({ partner2: partnerSchema }),

  location: z.object({
    country: placeField('Country'),
    city: placeField('City'),
  }),

  relationship: z.object({
    relationshipStatus: z.enum(RELATIONSHIP_STATUSES, {
      message: 'Choose a relationship status.',
    }),
  }),

  concerns: z.object({ concernTags: concernTagsField }),

  preference: z.object({
    therapistGenderPreference: z.enum(GENDER_PREFERENCES, {
      message: 'Choose one, or say you have no preference.',
    }),
  }),

  contact: z.object({ email: emailField }),
}

const sharedShape = {
  country: placeField('Country'),
  city: placeField('City'),
  relationshipStatus: z.enum(RELATIONSHIP_STATUSES, {
    message: 'Choose a relationship status.',
  }),
  concernTags: concernTagsField,
  therapistGenderPreference: z.enum(GENDER_PREFERENCES, {
    message: 'Choose one, or say you have no preference.',
  }),
  // Collected here, but it is NOT stored on clientProfiles — email belongs to
  // the `users` record created when payment succeeds (§10.1, §10.2).
  email: emailField,
}

export const individualSchema = z.object({
  type: z.literal('individual'),
  name: nameField,
  age: ageField,
  gender: z.enum(GENDERS, { message: 'Choose a gender.' }),
  ...sharedShape,
})

export const coupleSchema = z.object({
  type: z.literal('couple'),
  partner1: partnerSchema,
  partner2: partnerSchema,
  ...sharedShape,
})

/** The whole questionnaire, for the branch that is actually active. */
export function schemaFor(type) {
  return type === 'couple' ? coupleSchema : individualSchema
}

/**
 * Validates one step's fields against the answers held so far.
 * Returns `{ ok, errors }` where errors is the `{ field: message }` shape the
 * Input / Select / RadioGroup primitives already accept.
 */
export function validateStep(stepId, answers) {
  const schema = stepSchemas[stepId]
  if (!schema) return { ok: true, errors: {} }

  const result = schema.safeParse(answers)
  if (result.success) return { ok: true, errors: {} }

  const errors = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.')
    if (!(key in errors)) errors[key] = issue.message
  }
  return { ok: false, errors }
}

/** Blank answers. Both branches are present; only the active one is ever sent. */
export const emptyAnswers = Object.freeze({
  type: '',
  country: '',
  city: '',
  relationshipStatus: '',
  concernTags: [],
  therapistGenderPreference: '',
  email: '',

  // individual
  name: '',
  age: '',
  gender: '',

  // couple
  partner1: { name: '', age: '', gender: '' },
  partner2: { name: '', age: '', gender: '' },
})
