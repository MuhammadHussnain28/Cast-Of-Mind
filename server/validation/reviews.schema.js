import { z } from 'zod';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  REVIEW_TEXT_MAX,
  STARS_MAX,
  STARS_MIN,
} from '../constants/reviews.js';

/**
 * What a client sends: the stars, and optionally some words. NOTHING ELSE.
 *
 * `.strict()` refuses any other key rather than dropping it. The therapist a
 * review is about comes from the client's own booking on the server; a request
 * naming a `therapistId` is an attempt to rate somebody else, and it gets a 422
 * with nothing written.
 */
export const submitReviewSchema = z
  .object({
    stars: z
      .number({ error: 'Choose a rating from one to five stars.' })
      .int('A rating is a whole number of stars.')
      .min(STARS_MIN, 'Choose a rating from one to five stars.')
      .max(STARS_MAX, 'Choose a rating from one to five stars.'),
    text: z
      .string()
      .trim()
      .max(REVIEW_TEXT_MAX, `Please keep it under ${REVIEW_TEXT_MAX.toLocaleString('en-GB')} characters.`)
      .optional(),
  })
  .strict();

export const listReviewsQuerySchema = z.object({
  // The therapist's PROFILE id — the handle every admin screen uses.
  therapistId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'That is not a valid therapist reference.')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
