import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { validateQuery } from '../middleware/validate.js';
import { requireActiveSubscriptionForClients } from '../middleware/requireActiveSubscription.js';
import { ROLES } from '../constants/roles.js';
import { SESSIONS_READ_RATE_LIMIT } from '../constants/sessions.js';
import { listSessionsQuerySchema } from '../validation/sessions.schema.js';
import { list } from '../controllers/session.controller.js';

// /api/v1/sessions — READ ONLY, shared by client and therapist (§7.4, §8.4).
// Writes live under /therapist/sessions. Same guards as chat: admin refused,
// expired client refused, then booking membership proved in the service.

const router = express.Router();

export const sessionsReadRateLimiter = createRateLimiter(SESSIONS_READ_RATE_LIMIT);

router.use(
  sessionsReadRateLimiter,
  requireAuth,
  requireRole(ROLES.CLIENT, ROLES.THERAPIST),
  requireActiveSubscriptionForClients,
);

router.get('/:bookingId', validateQuery(listSessionsQuerySchema), list);

export default router;
