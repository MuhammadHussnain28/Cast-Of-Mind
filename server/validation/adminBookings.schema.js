import { z } from 'zod';
import { STATUS_FILTER_ALL } from '../constants/adminClients.js';
import { SUBSCRIPTION_STATUS_FILTERS } from './adminClients.schema.js';
import {
  DEFAULT_DIRECTION,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  MAX_PAGE_SIZE,
  SEARCH_MAX_LENGTH,
  SORT_DIRECTIONS,
  SORT_KEY_VALUES,
} from '../constants/adminBookings.js';

export const listBookingsQuerySchema = z.object({
  status: z
    .enum(SUBSCRIPTION_STATUS_FILTERS, {
      error: `Status must be one of: ${SUBSCRIPTION_STATUS_FILTERS.join(', ')}.`,
    })
    .default(STATUS_FILTER_ALL),
  q: z.string().trim().max(SEARCH_MAX_LENGTH).default(''),
  // Refused, not ignored: a sort the admin asked for and silently did not get
  // would present a list in an order it claims not to be in.
  sort: z
    .enum(SORT_KEY_VALUES, { error: `Sort must be one of: ${SORT_KEY_VALUES.join(', ')}.` })
    .default(DEFAULT_SORT),
  direction: z
    .enum(SORT_DIRECTIONS, { error: 'Direction must be asc or desc.' })
    .default(DEFAULT_DIRECTION),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
