import { z } from 'zod';
import { isValidTimeZone } from '../utils/timezone.js';
import { BILLING_HISTORY_MAX_PAGE } from '../constants/subscriptionLifecycle.js';

// Billing history paging (11.5). Anything else in the query is stripped.
export const billingHistoryQuerySchema = z.object({
  page: z.coerce
    .number()
    .int('Page must be a whole number.')
    .min(1, 'Page must be at least 1.')
    .max(BILLING_HISTORY_MAX_PAGE, `Page must be ${BILLING_HISTORY_MAX_PAGE} or lower.`)
    .optional()
    .default(1),
});

// The client's own browser zone (9.2). Stored as sent once it is a real IANA zone.
export const clientTimezoneSchema = z.strictObject({
  timezone: z
    .string({ message: 'Send a timezone.' })
    .trim()
    .min(1, 'Send a timezone.')
    .max(100)
    .refine(isValidTimeZone, 'That is not a timezone we recognise.'),
});
