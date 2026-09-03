import multer from 'multer';
import { AppError } from '../utils/AppError.js';
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_FIELD_NAME,
} from '../constants/uploads.js';

// Multipart parsing for POST /api/v1/uploads.
//
// MEMORY STORAGE, not disk. Two reasons: the buffer has to be in memory anyway
// for the magic-byte check in the service, and writing to a host's local disk
// means a redeploy can leave orphaned files behind on a machine nobody looks at.
//
// The limits below are the FIRST line of defence and run before any of our code
// sees the request. The per-kind size cap is applied afterwards, once we know
// which kind was asked for.

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1, // one file per request — no batch uploads
    fields: 5, // `kind`, plus headroom; stops a multipart field flood
    parts: 10,
  },
});

const singleFile = upload.single(UPLOAD_FIELD_NAME);

/**
 * Wraps multer so its own errors become the project's standard AppError shape.
 *
 * Left raw, a file over the limit surfaces as an unhandled MulterError and the
 * global handler reports it as an unknown 500 — which reads to the applicant as
 * "the site is broken" rather than "that file is too big".
 */
export function uploadSingleFile(req, res, next) {
  singleFile(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_SIZE: `That file is too large. The maximum is ${Math.round(
          MAX_UPLOAD_BYTES / (1024 * 1024),
        )} MB.`,
        LIMIT_FILE_COUNT: 'Please upload one file at a time.',
        LIMIT_UNEXPECTED_FILE: `Send the file in a field named "${UPLOAD_FIELD_NAME}".`,
        LIMIT_PART_COUNT: 'That request contained too many parts.',
        LIMIT_FIELD_COUNT: 'That request contained too many fields.',
      };

      return next(
        new AppError(
          messages[err.code] ?? 'That upload could not be read. Please try again.',
          400,
          'UPLOAD_REJECTED',
        ),
      );
    }

    // Malformed multipart body — a genuine client error, not a server fault.
    return next(new AppError('That upload could not be read. Please try again.', 400, 'UPLOAD_REJECTED'));
  });
}

export default uploadSingleFile;
