import { z } from 'zod';
import { CLIENT_LIST_PAGE_SIZE, CLIENT_LIST_MAX_PAGE_SIZE } from '../constants/therapistClients.js';

/**
 * The client list's query string — master spec §8.1.
 *
 * `.strict()` is deliberately not used, matching the chat schemas: unknown keys
 * are stripped rather than refused. There is nothing here worth smuggling, and
 * a 422 naming the offending key is a probe an attacker can walk.
 */
export const listClientsQuerySchema = z.object({
  // Opaque to the caller. Bounded here so a megabyte of junk never reaches the
  // decoder, which is the same guard listMessagesQuerySchema applies.
  cursor: z.string().min(1).max(255).optional(),

  limit: z.coerce
    .number()
    .int('Limit must be a whole number.')
    .min(1, 'Limit must be at least 1.')
    .max(CLIENT_LIST_MAX_PAGE_SIZE, `Limit must be ${CLIENT_LIST_MAX_PAGE_SIZE} or fewer.`)
    .optional()
    .default(CLIENT_LIST_PAGE_SIZE),
});

export default { listClientsQuerySchema };
