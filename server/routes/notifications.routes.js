import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { validateQuery } from '../middleware/validate.js';
import {
  listController,
  readController,
  readAllController,
} from '../controllers/notification.controller.js';
import { listNotificationsQuerySchema } from '../validation/notifications.schema.js';
import { NOTIFICATION_RATE_LIMIT } from '../constants/notifications.js';

/**
 * The notification bell — master spec §8.8.
 *
 * NOT ROLE-GUARDED, deliberately. Only therapists are given notifications in v1
 * (approved 2026-09-23), so a client signing in here gets an empty list rather
 * than a 403 — an empty feed is the truth for them, and a refusal would
 * advertise a feature they do not have. Every route is scoped to the token's
 * own user, so there is nothing to reach anyway.
 */

const router = express.Router();

export const notificationRateLimiter = createRateLimiter(NOTIFICATION_RATE_LIMIT);

router.use(notificationRateLimiter, requireAuth);

router.get('/', validateQuery(listNotificationsQuerySchema), listController);
router.post('/read-all', readAllController);
// After /read-all, so the literal path is never swallowed by the :id route.
router.post('/:id/read', readController);

export default router;
