import express from 'express';
import {
  submitApplication,
  getApplicationStatus,
} from '../controllers/therapistApplication.controller.js';
import { validate } from '../middleware/validate.js';
import { therapistApplicationSchema } from '../validation/therapistApplication.schema.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import {
  SUBMIT_RATE_LIMIT_WINDOW_MS,
  SUBMIT_RATE_LIMIT_MAX,
  SUBMIT_RATE_LIMIT_MESSAGE,
  STATUS_RATE_LIMIT_WINDOW_MS,
  STATUS_RATE_LIMIT_MAX,
  STATUS_RATE_LIMIT_MESSAGE,
} from '../constants/therapistApplications.js';

// PUBLIC AND UNAUTHENTICATED — an applicant has no account until an admin
// approves them (§10.4), so there is no token to check on either route.

// Submitting writes a document and sends two emails. A real applicant does it
// once. Exported so tests can reset the counter.
export const submitRateLimiter = createRateLimiter({
  windowMs: SUBMIT_RATE_LIMIT_WINDOW_MS,
  max: SUBMIT_RATE_LIMIT_MAX,
  message: SUBMIT_RATE_LIMIT_MESSAGE,
});

// Far more generous: it is one cheap read, and someone waiting on a decision
// will refresh it.
export const statusRateLimiter = createRateLimiter({
  windowMs: STATUS_RATE_LIMIT_WINDOW_MS,
  max: STATUS_RATE_LIMIT_MAX,
  message: STATUS_RATE_LIMIT_MESSAGE,
});

const router = express.Router();

// Rate limit before validation, so a flood is rejected before a 34-field
// payload is parsed.
router.post('/', submitRateLimiter, validate(therapistApplicationSchema), submitApplication);

router.get('/:id/status', statusRateLimiter, getApplicationStatus);

export default router;
