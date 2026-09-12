import { z } from 'zod';
import {
  CLIENT_TYPE,
  CLIENT_TYPE_VALUES,
  CLIENT_GENDERS,
  THERAPIST_GENDER_PREFERENCE_VALUES,
  RELATIONSHIP_STATUSES,
  CONCERN_TAGS,
  CONCERN_TAGS_MIN,
  CONCERN_TAGS_MAX,
  MIN_CLIENT_AGE,
  MAX_CLIENT_AGE,
  CLIENT_NAME_MAX,
  CLIENT_PLACE_MAX,
} from '../constants/clientProfile.js';

/**
 * The checkout payload.
 *
 * SHAPE CONTRACT FOR CHUNK 6.5: partners arrive NESTED under `coupleData`,
 * exactly as `clientProfiles` stores them (§10.2). The Redux slice holds
 * `partner1` / `partner2` flat because that is what a form binds to, so 6.5
 * writes the mapper between the two — the translation the log has been
 * carrying since 5.3.
 *
 * MIRRORS `server/models/ClientProfile.js`. Every limit is imported rather than
 * retyped, so this layer and the model cannot drift. The model is still the
 * last word: the service runs the real ClientProfile validators over these
 * answers before storing anything.
 */

const ageField = z.coerce
  .number({ message: 'Enter an age.' })
  .int('Age must be a whole number.')
  .min(MIN_CLIENT_AGE, `Age must be at least ${MIN_CLIENT_AGE}.`)
  .max(MAX_CLIENT_AGE, `Age must be ${MAX_CLIENT_AGE} or under.`);

const nameField = z
  .string()
  .trim()
  .min(1, 'Enter a name.')
  .max(CLIENT_NAME_MAX, `Name must be ${CLIENT_NAME_MAX} characters or fewer.`);

const placeField = (label) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(CLIENT_PLACE_MAX, `${label} must be ${CLIENT_PLACE_MAX} characters or fewer.`);

const partnerField = z.object({
  name: nameField,
  age: ageField,
  gender: z.enum(CLIENT_GENDERS, { message: 'Choose a gender from the list.' }),
});

const questionnaireSchema = z
  .object({
    type: z.enum(CLIENT_TYPE_VALUES, { message: 'Tell us who this is for.' }),
    country: placeField('Country'),
    city: placeField('City'),
    relationshipStatus: z.enum(RELATIONSHIP_STATUSES, {
      message: 'Choose a relationship status from the list.',
    }),

    // THE ONLY FIELD THAT DRIVES MATCHING (§15). Stored 1–4; the screen asks
    // for 3–4. Enforcing the storage floor here is deliberate — someone who
    // genuinely has one concern must not be blocked at a gate §6 does not set.
    concernTags: z
      .array(z.enum(CONCERN_TAGS, { message: 'Choose concerns from the approved list.' }))
      .min(CONCERN_TAGS_MIN, 'Choose at least one concern.')
      .max(CONCERN_TAGS_MAX, `Choose no more than ${CONCERN_TAGS_MAX} concerns.`)
      .refine((tags) => new Set(tags).size === tags.length, 'Each concern can only be chosen once.'),

    therapistGenderPreference: z.enum(THERAPIST_GENDER_PREFERENCE_VALUES, {
      message: 'Choose a therapist preference from the list.',
    }),

    // Individual only
    name: nameField.optional(),
    age: ageField.optional(),
    gender: z.enum(CLIENT_GENDERS, { message: 'Choose a gender from the list.' }).optional(),

    // Couple only — nested, per the contract above.
    coupleData: z
      .object({ partner1: partnerField, partner2: partnerField })
      .optional(),
  })
  .superRefine((value, ctx) => {
    // The branch guard, mirroring ClientProfile's pre-validate hook. A document
    // carrying both shapes is one where nobody can say which is true.
    if (value.type === CLIENT_TYPE.INDIVIDUAL) {
      for (const field of ['name', 'age', 'gender']) {
        if (value[field] === undefined) {
          ctx.addIssue({ code: 'custom', path: [field], message: 'Required for an individual.' });
        }
      }
      if (value.coupleData !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['coupleData'],
          message: 'An individual must not carry couple details.',
        });
      }
    }

    if (value.type === CLIENT_TYPE.COUPLE) {
      if (value.coupleData === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['coupleData'],
          message: 'Details for both partners are required.',
        });
      }
      for (const field of ['name', 'age', 'gender']) {
        if (value[field] !== undefined) {
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: 'A couple must not carry individual details — both partners live in coupleData.',
          });
        }
      }
    }
  });

export const checkoutSchema = z.object({
  // Becomes the login email at 6.4, and Stripe prefills it on the hosted page.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Enter your email address.')
    .max(254, 'That email address is too long.')
    .pipe(z.email({ message: 'Enter a valid email address.' })),

  // The therapistProfiles id, which is what /matching and /therapists/:id
  // return. Never a users id — nothing hands a stranger a key into `users`.
  therapistProfileId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, 'Choose a therapist from your matches.'),

  questionnaire: questionnaireSchema,
});

export default checkoutSchema;

/**
 * The /welcome status query.
 *
 * Stripe checkout session ids look like `cs_test_a1f8...` — a fixed prefix and
 * a long random tail. Pinned to that shape so junk is refused before it reaches
 * a database query.
 */
export const sessionStatusQuerySchema = z.object({
  sessionId: z
    .string()
    .trim()
    .regex(/^cs_[A-Za-z0-9_]{8,255}$/, 'That is not a valid checkout session.'),
});
