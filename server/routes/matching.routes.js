import express from 'express';
import { getMatches } from '../controllers/matching.controller.js';
import { validate } from '../middleware/validate.js';
import { matchingSchema } from '../validation/matching.schema.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import {
  MATCHING_RATE_LIMIT_WINDOW_MS,
  MATCHING_RATE_LIMIT_MAX,
  MATCHING_RATE_LIMIT_MESSAGE,
} from '../constants/matching.js';

// Public and unauthenticated — the client has no account until payment
// succeeds (§10.1), so there is no token to check. Exported for test resets.
export const matchingRateLimiter = createRateLimiter({
  windowMs: MATCHING_RATE_LIMIT_WINDOW_MS,
  max: MATCHING_RATE_LIMIT_MAX,
  message: MATCHING_RATE_LIMIT_MESSAGE,
});

const router = express.Router();

router.post('/', matchingRateLimiter, validate(matchingSchema), getMatches);

export default router;
