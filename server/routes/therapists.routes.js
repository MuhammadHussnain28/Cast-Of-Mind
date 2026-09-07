import express from 'express';
import { getTherapist } from '../controllers/therapists.controller.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import {
  THERAPIST_DETAIL_RATE_LIMIT_WINDOW_MS,
  THERAPIST_DETAIL_RATE_LIMIT_MAX,
  MATCHING_RATE_LIMIT_MESSAGE,
} from '../constants/matching.js';

// NOTE THE PLURAL. `/therapist` (singular) is the authenticated route where a
// therapist reads and edits their OWN profile (chunk 4.6). This is the public
// directory: anyone may read one active therapist's public profile.
export const therapistDetailRateLimiter = createRateLimiter({
  windowMs: THERAPIST_DETAIL_RATE_LIMIT_WINDOW_MS,
  max: THERAPIST_DETAIL_RATE_LIMIT_MAX,
  message: MATCHING_RATE_LIMIT_MESSAGE,
});

const router = express.Router();

router.get('/:id', therapistDetailRateLimiter, getTherapist);

export default router;
