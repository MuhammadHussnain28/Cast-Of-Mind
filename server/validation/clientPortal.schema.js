import { z } from 'zod';
import { isValidTimeZone } from '../utils/timezone.js';

// The client's own browser zone (9.2). Stored as sent once it is a real IANA zone.
export const clientTimezoneSchema = z.strictObject({
  timezone: z
    .string({ message: 'Send a timezone.' })
    .trim()
    .min(1, 'Send a timezone.')
    .max(100)
    .refine(isValidTimeZone, 'That is not a timezone we recognise.'),
});
