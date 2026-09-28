import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  verifyStripeEvent,
  recordEvent,
  routeEvent,
} from '../services/stripeWebhook.service.js';
import { SIGNATURE_HEADER } from '../constants/webhooks.js';

/**
 * POST /api/v1/webhooks/payment — Stripe's callback. Public by necessity.
 *
 * Unauthenticated because Stripe holds no token of ours. THE SIGNATURE IS THE
 * AUTHENTICATION: an unverified request is rejected before a single field of
 * the payload is read.
 *
 * The order below is the whole design:
 *   1. verify   — reject anything unsigned or tampered with
 *   2. record   — log EVERY verified event before acting on it
 *   3. route    — act, EVERY time, duplicates included (see below)
 *
 * Processing is synchronous. A job queue is not in the stack, and at this
 * volume the handler finishes in milliseconds — well inside Stripe's timeout.
 * If a handler ever grows slow enough to matter, that is the point to add one.
 */
export const handlePaymentWebhook = asyncHandler(async (req, res) => {
  // Throws a 400 on a bad or missing signature. Nothing below runs unverified.
  const event = verifyStripeEvent(req.body, req.get(SIGNATURE_HEADER));

  const { duplicate } = await recordEvent(event);

  // A DUPLICATE IS ROUTED TOO (11.1). The ledger row is written before the
  // handler runs, so if the handler failed, Stripe's retry arrives as a
  // "duplicate". Skipping it lost that payment for good. Every handler guards
  // at its effect, so running one twice changes nothing.
  if (duplicate) console.log(`[webhook] ${event.id} seen before — re-checking its effect`);

  // A throw here becomes a 500, which shows in Stripe's dashboard as a failed
  // delivery, and Stripe retries it. Silently returning 200 would hide a
  // payment we failed to act on.
  // AWAITED. The handler creates four documents in a transaction, and an
  // un-awaited promise would return 200 before that finished — so a failure
  // would be invisible to Stripe and the request would look successful.
  await routeEvent(event);

  res.status(200).json(duplicate ? { received: true, duplicate: true } : { received: true });
});

export default { handlePaymentWebhook };
