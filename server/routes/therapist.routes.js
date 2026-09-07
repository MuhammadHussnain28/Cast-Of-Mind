import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireTherapist } from '../middleware/requireRole.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { updateOwnProfileSchema } from '../validation/therapistProfile.schema.js';
import { getProfile, updateProfile } from '../controllers/therapistProfile.controller.js';

// Everything under /api/v1/therapist — the signed-in therapist's own portal.
//
// Guards on the ROUTER, as with the admin mount: every route slice 8 adds here
// inherits them, and a mistyped path is refused before it reaches the 404
// handler. `/therapist/profile` is singular on purpose — it is a singleton for
// the authenticated user, not a collection, so the plural-resources convention
// does not apply.

const router = express.Router();

export const therapistRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests. Please try again in a few minutes.',
});

router.use(therapistRateLimiter, requireAuth, requireTherapist);

router.get('/profile', getProfile);

// Accepts ONLY photoUrl and bio. Every other field is refused by name — see
// validation/therapistProfile.schema.js.
router.patch('/profile', validate(updateOwnProfileSchema), updateProfile);

export default router;
