import express from 'express';
import { submitContact } from '../controllers/contact.controller.js';
import { validate } from '../middleware/validate.js';
import { contactSchema } from '../validation/contact.schema.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import {
  CONTACT_RATE_LIMIT_WINDOW_MS,
  CONTACT_RATE_LIMIT_MAX,
  CONTACT_RATE_LIMIT_MESSAGE,
} from '../constants/contact.js';

// This endpoint sends real mail to an address we control, so the limit is about
// stopping someone flooding the business inbox. Exported so tests can reset it.
export const contactRateLimiter = createRateLimiter({
  windowMs: CONTACT_RATE_LIMIT_WINDOW_MS,
  max: CONTACT_RATE_LIMIT_MAX,
  message: CONTACT_RATE_LIMIT_MESSAGE,
});

const router = express.Router();

// Rate limit before validation, so a flood is rejected before any work.
router.post('/', contactRateLimiter, validate(contactSchema), submitContact);

export default router;
