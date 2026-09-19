import { z } from 'zod';
import {
  JOURNAL_TEXT_MAX,
  NOTE_TEXT_MAX,
  MOOD_TAG_MAX,
  JOURNAL_PAGE_SIZE,
  JOURNAL_MAX_PAGE_SIZE,
} from '../constants/journal.js';

const text = (max, empty) =>
  z.string({ message: empty }).trim().min(1, empty).max(max, `That is longer than ${max} characters.`);

// A mood is optional, and clearing it is sending null — not omitting the key.
const moodTag = z
  .string()
  .trim()
  .max(MOOD_TAG_MAX, `A mood must be ${MOOD_TAG_MAX} characters or fewer.`)
  .nullish()
  .transform((value) => (value ? value : null));

export const journalEntrySchema = z.object({
  text: text(JOURNAL_TEXT_MAX, 'Write something before saving.'),
  moodTag: moodTag.optional().default(null),
});

export const privateNoteSchema = z.object({
  text: text(NOTE_TEXT_MAX, 'Write something before saving.'),
});

export const journalQuerySchema = z.object({
  cursor: z.string().min(1).max(255).optional(),
  limit: z.coerce
    .number()
    .int('Limit must be a whole number.')
    .min(1, 'Limit must be at least 1.')
    .max(JOURNAL_MAX_PAGE_SIZE, `Limit must be ${JOURNAL_MAX_PAGE_SIZE} or fewer.`)
    .optional()
    .default(JOURNAL_PAGE_SIZE),
});
