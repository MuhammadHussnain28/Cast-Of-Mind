import { z } from 'zod'

/**
 * Mirrors server/validation/contact.schema.js. The server is the authority —
 * this exists so someone gets told what is wrong before a round trip, never
 * instead of the server check.
 */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tell us your name so we know who we are replying to.')
    .max(120, 'That name is longer than we can store.'),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Check the email address — it needs an @ and a domain.')),

  subject: z.string().optional(),

  message: z
    .string()
    .trim()
    .min(10, 'Add a little more — at least 10 characters.')
    .max(4000, 'Please keep it under 4000 characters.'),
})
