import { z } from 'zod';
import {
  SESSION_NOTE_MAX,
  MEETING_LINK_MESSAGE,
  SESSION_SCOPE,
  SESSION_SCOPE_VALUES,
  SESSIONS_PAGE_SIZE,
  SESSIONS_MAX_PAGE_SIZE,
} from '../constants/sessions.js';
import { isAllowedMeetingLink } from '../utils/meetingLink.js';

// The request carries a wall-clock date and time only. The zone is read from the
// therapist's profile, so `timezone` or `scheduledAt` here is refused, not ignored.

const date = z
  .string({ message: 'Choose a date.' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date.');

const time = z
  .string({ message: 'Choose a time.' })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Choose a time, like 15:00.');

const zoomLink = z
  .string({ message: MEETING_LINK_MESSAGE })
  .trim()
  .refine(isAllowedMeetingLink, MEETING_LINK_MESSAGE);

// Empty or null clears the note.
const note = z
  .string()
  .trim()
  .max(SESSION_NOTE_MAX, `A note must be ${SESSION_NOTE_MAX} characters or fewer.`)
  .nullable()
  .optional();

export const createSessionSchema = z.strictObject({
  bookingId: z.string({ message: 'Choose a client.' }).trim().min(1, 'Choose a client.').max(64),
  date,
  time,
  zoomLink,
  note,
});

export const updateSessionSchema = z
  .strictObject({
    date: date.optional(),
    time: time.optional(),
    zoomLink: zoomLink.optional(),
    note,
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'Nothing to change.' })
  .refine((body) => (body.date === undefined) === (body.time === undefined), {
    message: 'Send the date and the time together.',
    path: ['time'],
  });

export const listSessionsQuerySchema = z.object({
  scope: z.enum(SESSION_SCOPE_VALUES).optional().default(SESSION_SCOPE.UPCOMING),
  cursor: z.string().min(1).max(255).optional(),
  limit: z.coerce
    .number()
    .int('Limit must be a whole number.')
    .min(1, 'Limit must be at least 1.')
    .max(SESSIONS_MAX_PAGE_SIZE, `Limit must be ${SESSIONS_MAX_PAGE_SIZE} or fewer.`)
    .optional()
    .default(SESSIONS_PAGE_SIZE),
});
