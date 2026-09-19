import { FILE_TYPES } from './uploads.js';

// Worksheets — master spec §7.2, §8.3, §10.8.

export const WORKSHEET_STATUS = Object.freeze({
  ASSIGNED: 'assigned',
  COMPLETED: 'completed',
});

export const WORKSHEET_STATUS_VALUES = Object.freeze(Object.values(WORKSHEET_STATUS));

export const WORKSHEET_TITLE_MAX = 120;

// Assigned files are PDF/DOCX; 8.5 will add image formats for returned answers.
export const WORKSHEET_FILE_FORMATS = Object.freeze([
  FILE_TYPES.PDF,
  FILE_TYPES.DOCX,
  FILE_TYPES.JPEG,
  FILE_TYPES.PNG,
  FILE_TYPES.WEBP,
]);

export const WORKSHEET_FILE_KINDS = Object.freeze({ ASSIGNED: 'assigned', COMPLETED: 'completed' });

export const WORKSHEETS_PAGE_SIZE = 50;
export const WORKSHEETS_MAX_PAGE_SIZE = 100;

// Our own list, never the upstream's header (4.2's rule).
export const WORKSHEET_CONTENT_TYPES = Object.freeze({
  [FILE_TYPES.PDF]: 'application/pdf',
  [FILE_TYPES.DOCX]: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  [FILE_TYPES.JPEG]: 'image/jpeg',
  [FILE_TYPES.PNG]: 'image/png',
  [FILE_TYPES.WEBP]: 'image/webp',
});

// One refusal for every "not yours / not there" case, as in 8.2.
export const WORKSHEET_NOT_FOUND_MESSAGE = 'We could not find that worksheet.';
export const WORKSHEET_NOT_FOUND_CODE = 'WORKSHEET_NOT_FOUND';

export const BOOKING_ENDED_MESSAGE = 'This booking has ended, so new worksheets cannot be assigned.';
export const BOOKING_ENDED_CODE = 'BOOKING_ENDED';

export const WITHDRAW_REFUSED_MESSAGE =
  'This worksheet has already been returned, so it can no longer be withdrawn.';
export const WITHDRAW_REFUSED_CODE = 'WORKSHEET_ALREADY_RETURNED';

export const FILE_NOT_AVAILABLE_MESSAGE = 'That file is not available.';

// 8.5 — returning and reviewing.
export const ALREADY_REVIEWED_MESSAGE =
  'Your therapist already has this one, so it can no longer be replaced.';
export const ALREADY_REVIEWED_CODE = 'WORKSHEET_REVIEWED';
export const NOT_RETURNED_MESSAGE = 'This worksheet has not been returned yet, so it cannot be marked reviewed.';
export const NOT_RETURNED_CODE = 'WORKSHEET_NOT_RETURNED';

// A therapist assigning to several clients needs more than the public 10/hour.
export const WORKSHEET_UPLOAD_RATE_LIMIT = Object.freeze({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Too many worksheet uploads. Please try again in a little while.',
});
