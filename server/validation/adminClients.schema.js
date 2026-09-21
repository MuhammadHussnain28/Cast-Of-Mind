import { z } from 'zod';
import { SUBSCRIPTION_STATUS_VALUES } from '../constants/payments.js';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SEARCH_MAX_LENGTH,
  STATUS_FILTER_ALL,
} from '../constants/adminClients.js';

// Includes `none` — a client whose subscription row is gone or was never
// written is exactly the broken state worth being able to find. Shared with the
// bookings overview (10.2), so both screens offer the same buckets.
export const SUBSCRIPTION_STATUS_FILTERS = Object.freeze([
  ...SUBSCRIPTION_STATUS_VALUES,
  'none',
  STATUS_FILTER_ALL,
]);

export const listClientsQuerySchema = z.object({
  status: z
    .enum(SUBSCRIPTION_STATUS_FILTERS, {
      error: `Status must be one of: ${SUBSCRIPTION_STATUS_FILTERS.join(', ')}.`,
    })
    .default(STATUS_FILTER_ALL),
  q: z.string().trim().max(SEARCH_MAX_LENGTH).default(''),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export const clientIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'That is not a valid client reference.');
