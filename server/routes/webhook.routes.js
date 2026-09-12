import express from 'express';
import { handlePaymentWebhook } from '../controllers/webhook.controller.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import {
  WEBHOOK_RATE_LIMIT_MAX,
  WEBHOOK_RATE_LIMIT_MESSAGE,
  WEBHOOK_RATE_LIMIT_WINDOW_MS,
} from '../constants/webhooks.js';

/**
 * Counts FAILURES ONLY — see constants/webhooks.js for why.
 *
 * A verified webhook returns 200 and never accumulates, so Stripe can send a
 * month's worth of renewals in one burst without being throttled. Only requests
 * that fail signature verification count toward the limit.
 *
 * Exported so tests can reset the counter between cases.
 */
export const webhookRateLimiter = createRateLimiter({
  windowMs: WEBHOOK_RATE_LIMIT_WINDOW_MS,
  max: WEBHOOK_RATE_LIMIT_MAX,
  message: WEBHOOK_RATE_LIMIT_MESSAGE,
  skipSuccessfulRequests: true,
});

const router = express.Router();

// No validate() middleware: the body is a raw Buffer at this point, and the
// signature is what establishes trust. Parsing it before verification would
// destroy the bytes the signature is computed over.
router.post('/payment', webhookRateLimiter, handlePaymentWebhook);

export default router;
