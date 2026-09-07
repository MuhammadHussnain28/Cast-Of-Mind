import { z } from 'zod';
import {
  SPECIALTY_TAGS,
  SPECIALTY_TAGS_MIN,
  SPECIALTY_TAGS_MAX,
} from '../constants/specialtyTags.js';
import { THERAPIST_TYPE_MAX } from '../models/TherapistProfile.js';
import { USER_STATUS } from '../constants/roles.js';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SEARCH_MAX_LENGTH,
  STATUS_FILTER_ALL,
} from '../constants/adminTherapists.js';

export const listTherapistsQuerySchema = z.object({
  status: z
    .enum([...Object.values(USER_STATUS), STATUS_FILTER_ALL], {
      error: 'Status must be active, inactive, or all.',
    })
    .default(STATUS_FILTER_ALL),
  q: z.string().trim().max(SEARCH_MAX_LENGTH).default(''),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export const therapistIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'That is not a valid therapist reference.');

/**
 * The edit payload.
 *
 * `.strict()` matters more than it looks: without it, an attempt to change a
 * bio or the working hours would be silently dropped and the admin would be
 * told it saved. Refusing names the field instead.
 *
 * Every constraint mirrors the model, and the tag limits are imported from the
 * same constants the model reads — so the two layers cannot drift into
 * disagreeing about what a valid therapist looks like.
 */
export const updateTherapistSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address.')),
    title: z.enum(['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.']),
    firstName: z.string().trim().min(1, 'A first name is required.').max(100),
    lastName: z.string().trim().min(1, 'A last name is required.').max(100),
    therapistType: z
      .string()
      .trim()
      .min(1, 'A professional title is required.')
      .max(THERAPIST_TYPE_MAX, `Keep this under ${THERAPIST_TYPE_MAX} characters.`),
    credentialType: z.enum(['Diploma/Degree', 'Certificate', 'License']),
    credentialInitials: z.string().trim().min(1, 'Credential initials are required.').max(100),
    // Optional on the application, so it stays optional here — but an empty
    // string is a real value meaning "none recorded", not a missing field.
    licenseNumber: z.string().trim().max(100),
    specialtyTags: z
      .array(z.enum(SPECIALTY_TAGS, { error: 'That is not one of the approved tags.' }))
      .min(SPECIALTY_TAGS_MIN, `Choose at least ${SPECIALTY_TAGS_MIN} tags.`)
      .max(SPECIALTY_TAGS_MAX, `Choose no more than ${SPECIALTY_TAGS_MAX} tags.`)
      .refine((tags) => new Set(tags).size === tags.length, {
        // Three copies of one tag passes a count check while leaving the
        // therapist with effectively one specialty — quietly narrowing matching.
        message: 'Each specialty can only be chosen once.',
      }),
  })
  .partial()
  .strict();
