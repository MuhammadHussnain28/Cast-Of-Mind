import { z } from 'zod';
import {
  SPECIALTY_TAGS,
  SPECIALTY_TAGS_MAX,
} from '../constants/specialtyTags.js';
import {
  GENDER_PREFERENCE,
  GENDER_PREFERENCE_VALUES,
  MATCHING_MAX_PAGE_SIZE,
  MATCHING_PAGE_SIZE,
} from '../constants/matching.js';
import { CONCERN_TAGS_MIN } from '../constants/clientProfile.js';

/**
 * THE SHAPE ACCEPTS EXACTLY TWO ANSWERS, AND THAT IS THE POINT.
 *
 * Country, timezone, availability and treatment orientations must never filter
 * (§15). The surest way to keep it that way is for the endpoint not to receive
 * them: unknown keys are stripped, so a future frontend cannot start sending a
 * filter that a future backend then starts honouring.
 */
export const matchingSchema = z.object({
  concernTags: z
    .array(z.enum(SPECIALTY_TAGS, { message: 'Choose concerns from the approved list.' }))
    .min(CONCERN_TAGS_MIN, 'Choose at least one concern.')
    .max(SPECIALTY_TAGS_MAX, `Choose no more than ${SPECIALTY_TAGS_MAX} concerns.`)
    .refine((tags) => new Set(tags).size === tags.length, 'Each concern can only be chosen once.'),

  // Optional: absent means the same as "no preference" — gender is ignored.
  therapistGenderPreference: z
    .enum(GENDER_PREFERENCE_VALUES, { message: 'Unknown therapist preference.' })
    .optional()
    .default(GENDER_PREFERENCE.NO_PREFERENCE),

  limit: z.coerce.number().int().min(1).max(MATCHING_MAX_PAGE_SIZE).optional()
    .default(MATCHING_PAGE_SIZE),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export default matchingSchema;
