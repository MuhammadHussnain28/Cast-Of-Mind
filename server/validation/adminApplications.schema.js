import { z } from 'zod';
import { APPLICATION_STATUS_VALUES } from '../models/TherapistApplication.js';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SEARCH_MAX_LENGTH,
  STATUS_FILTER_ALL,
  DOCUMENT_FIELD_VALUES,
  REJECTION_REASON_MAX,
} from '../constants/adminApplications.js';

// Query strings arrive as text, so page and limit are coerced. Every bound is
// enforced here rather than in the service: an unbounded `limit` is how a list
// endpoint becomes a way to pull the whole collection in one request.
export const listApplicationsQuerySchema = z.object({
  status: z
    .enum([...APPLICATION_STATUS_VALUES, STATUS_FILTER_ALL], {
      error: 'Status must be pending, approved, rejected, or all.',
    })
    .default(STATUS_FILTER_ALL),

  q: z.string().trim().max(SEARCH_MAX_LENGTH).default(''),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

// Checked before the query runs. Without it a malformed id throws a Mongoose
// CastError, which the global handler reports as an unknown 500 — the same fix
// chunk 3.2 made on the public status endpoint.
export const applicationIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'That is not a valid application reference.');

export const documentFieldSchema = z.enum(DOCUMENT_FIELD_VALUES, {
  error: 'Unknown document.',
});

// The reason is optional (§9.2) and internal — nobody is emailed it.
export const rejectApplicationSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(REJECTION_REASON_MAX, `Keep the reason under ${REJECTION_REASON_MAX} characters.`)
    .optional()
    .default(''),
});
