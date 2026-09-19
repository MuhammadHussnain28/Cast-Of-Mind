import { z } from 'zod';
import {
  WORKSHEET_TITLE_MAX,
  WORKSHEETS_PAGE_SIZE,
  WORKSHEETS_MAX_PAGE_SIZE,
  WORKSHEET_FILE_KINDS,
} from '../constants/worksheets.js';

// Multipart text fields. The booking id is checked for ownership in the service.
export const assignWorksheetSchema = z.object({
  bookingId: z.string({ message: 'Choose a client.' }).trim().min(1, 'Choose a client.').max(64),
  title: z
    .string({ message: 'Give the worksheet a title.' })
    .trim()
    .min(1, 'Give the worksheet a title.')
    .max(WORKSHEET_TITLE_MAX, `A title must be ${WORKSHEET_TITLE_MAX} characters or fewer.`),
});

export const listWorksheetsQuerySchema = z.object({
  cursor: z.string().min(1).max(255).optional(),
  limit: z.coerce
    .number()
    .int('Limit must be a whole number.')
    .min(1, 'Limit must be at least 1.')
    .max(WORKSHEETS_MAX_PAGE_SIZE, `Limit must be ${WORKSHEETS_MAX_PAGE_SIZE} or fewer.`)
    .optional()
    .default(WORKSHEETS_PAGE_SIZE),
});

export const worksheetFileKindSchema = z.enum(Object.values(WORKSHEET_FILE_KINDS));
