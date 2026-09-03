import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { uploadFile } from '../services/upload.service.js';
import { UPLOAD_KIND_VALUES } from '../constants/uploads.js';

// POST /api/v1/uploads
//
// Thin: reads the request, hands the buffer to the service, returns the result.
// The `kind` cannot be validated by the usual validate(schema) middleware,
// because multer has to parse the multipart body before any text field exists.

export const createUpload = asyncHandler(async (req, res) => {
  const kind = typeof req.body?.kind === 'string' ? req.body.kind.trim() : '';

  if (!UPLOAD_KIND_VALUES.includes(kind)) {
    throw new AppError(
      `Upload type must be one of: ${UPLOAD_KIND_VALUES.join(', ')}.`,
      422,
      'UPLOAD_REJECTED',
    );
  }

  if (!req.file) {
    throw new AppError('No file was received. Please choose a file and try again.', 400, 'UPLOAD_REJECTED');
  }

  const result = await uploadFile({ buffer: req.file.buffer, kind });

  res.status(201).json(result);
});

export default { createUpload };
