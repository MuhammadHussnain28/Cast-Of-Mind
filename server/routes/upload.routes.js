import express from 'express';
import { createUpload } from '../controllers/upload.controller.js';
import { uploadSingleFile } from '../middleware/upload.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import {
  UPLOAD_RATE_LIMIT_WINDOW_MS,
  UPLOAD_RATE_LIMIT_MAX,
  UPLOAD_RATE_LIMIT_MESSAGE,
} from '../constants/uploads.js';

// PUBLIC AND UNAUTHENTICATED, and it has to be: a therapist applicant has no
// account until an admin approves them (Section 10.4), so there is no token to
// check. This rate limit is therefore the main thing standing between a stranger
// and the platform's storage quota. Exported so tests can reset its counter.
export const uploadRateLimiter = createRateLimiter({
  windowMs: UPLOAD_RATE_LIMIT_WINDOW_MS,
  max: UPLOAD_RATE_LIMIT_MAX,
  message: UPLOAD_RATE_LIMIT_MESSAGE,
});

const router = express.Router();

// Rate limit FIRST, before multer parses anything — a flood is rejected before
// a single megabyte is read into memory.
router.post('/', uploadRateLimiter, uploadSingleFile, createUpload);

export default router;
