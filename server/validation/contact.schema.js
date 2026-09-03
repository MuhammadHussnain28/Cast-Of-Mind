import { z } from 'zod';
import {
  CONTACT_SUBJECTS,
  MESSAGE_MIN,
  MESSAGE_MAX,
  NAME_MAX,
} from '../constants/contact.js';

export const contactSchema = z.object({
  name: z
    .string({ error: 'Tell us your name so we know who we are replying to.' })
    .trim()
    .min(1, 'Tell us your name so we know who we are replying to.')
    .max(NAME_MAX, 'That name is longer than we can store.'),

  email: z
    .string({ error: 'We need an email address to reply to.' })
    .trim()
    .toLowerCase()
    .pipe(z.email('Check the email address — it needs an @ and a domain.')),

  // Optional. An unknown value is rejected rather than silently corrected, so a
  // tampered payload never reaches the email body.
  subject: z
    .enum(CONTACT_SUBJECTS, { error: 'Choose one of the listed subjects.' })
    .optional(),

  message: z
    .string({ error: 'Write your message before sending.' })
    .trim()
    .min(MESSAGE_MIN, `Add a little more — at least ${MESSAGE_MIN} characters.`)
    .max(MESSAGE_MAX, `Please keep it under ${MESSAGE_MAX} characters.`),

  // Honeypot. Hidden from people, irresistible to bots. Anything here means the
  // submission is discarded — see contact.service.js.
  website: z.string().max(200).optional(),
});
