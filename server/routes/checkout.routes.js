import express from 'express';
import { createSession, sessionStatus } from '../controllers/checkout.controller.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { checkoutSchema, sessionStatusQuerySchema } from '../validation/checkout.schema.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import {
  CHECKOUT_RATE_LIMIT_MAX,
  CHECKOUT_RATE_LIMIT_MESSAGE,
  CHECKOUT_RATE_LIMIT_WINDOW_MS,
  SESSION_STATUS_RATE_LIMIT_MAX,
  SESSION_STATUS_RATE_LIMIT_MESSAGE,
  SESSION_STATUS_RATE_LIMIT_WINDOW_MS,
} from '../constants/checkout.js';

// Public and unauthenticated — see the controller. Strict, because every call
// writes a record and hits an external API. Exported so tests can reset it.
export const checkoutRateLimiter = createRateLimiter({
  windowMs: CHECKOUT_RATE_LIMIT_WINDOW_MS,
  max: CHECKOUT_RATE_LIMIT_MAX,
  message: CHECKOUT_RATE_LIMIT_MESSAGE,
});

// Far looser than the checkout limiter: /welcome polls this every couple of
// seconds for under a minute, and throttling an honest visitor mid-signup would
// leave them staring at an error after paying €200.
export const sessionStatusRateLimiter = createRateLimiter({
  windowMs: SESSION_STATUS_RATE_LIMIT_WINDOW_MS,
  max: SESSION_STATUS_RATE_LIMIT_MAX,
  message: SESSION_STATUS_RATE_LIMIT_MESSAGE,
});

const router = express.Router();

// The limiter runs BEFORE validation, so a flood of junk is turned away before
// any parsing or database work happens.
router.post('/create-session', checkoutRateLimiter, validate(checkoutSchema), createSession);

// Read-only. The query string carries the session id rather than the path,
// because requestLogger logs req.path and deliberately never the query — a
// payment session id has no business in our own logs.
router.get(
  '/session-status',
  sessionStatusRateLimiter,
  validateQuery(sessionStatusQuerySchema),
  sessionStatus,
);

export default router;
