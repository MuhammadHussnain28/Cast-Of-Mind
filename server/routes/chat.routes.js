import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { requireActiveSubscriptionForClients } from '../middleware/requireActiveSubscription.js';
import { ROLES } from '../constants/roles.js';
import { CHAT_SEND_RATE_LIMIT, CHAT_READ_RATE_LIMIT } from '../constants/chat.js';
import { sendMessageSchema, listMessagesQuerySchema } from '../validation/chat.schema.js';
import {
  getMessages,
  postMessage,
  postRead,
  getUnreadCount,
} from '../controllers/chat.controller.js';

// Everything under /api/v1/chat — master spec §14.
//
// THE ONE SURFACE BOTH ROLES SHARE, which is why it is not under /client or
// /therapist. Client and therapist read and write the same bookingId-scoped
// thread from opposite sides.
//
// Three layers, in order, and none of them is redundant:
//   1. requireAuth                        — who is this
//   2. requireRole(CLIENT, THERAPIST)     — the admin has no chat access at all
//   3. requireActiveSubscriptionForClients — §13, clients only
//   4. membership, per request, in the service — the one that actually protects
//      a conversation, because the bookingId comes from the URL
//
// Layer 2 is worth stating: §11 records that an admin conversation viewer was
// proposed and the client DECIDED AGAINST BUILDING IT. The admin is refused
// here by role, so there is no route through which chat content could reach
// them even by mistake.

const router = express.Router();

export const chatReadRateLimiter = createRateLimiter(CHAT_READ_RATE_LIMIT);
export const chatSendRateLimiter = createRateLimiter(CHAT_SEND_RATE_LIMIT);

router.use(
  chatReadRateLimiter,
  requireAuth,
  requireRole(ROLES.CLIENT, ROLES.THERAPIST),
  requireActiveSubscriptionForClients,
);

// Declared before the '/:bookingId' routes so "unread-count" is never read as a
// booking id — Express matches in definition order.
router.get('/unread-count', getUnreadCount);

router.get('/:bookingId/messages', validateQuery(listMessagesQuerySchema), getMessages);

router.post(
  '/:bookingId/messages',
  chatSendRateLimiter,
  validate(sendMessageSchema),
  postMessage,
);

router.post('/:bookingId/read', postRead);

export default router;
