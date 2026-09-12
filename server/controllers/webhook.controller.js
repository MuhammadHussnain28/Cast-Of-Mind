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
 *   3. route    — act, only if this is the first time we have seen it
 *
 * Processing is synchronous. A job queue is not in the stack, and at this
 * volume the handler finishes in milliseconds — well inside Stripe's timeout.
 * If a handler ever grows slow enough to matter, that is the point to add one.
 */
export const handlePaymentWebhook = asyncHandler(async (req, res) => {
  // Throws a 400 on a bad or missing signature. Nothing below runs unverified.
  const event = verifyStripeEvent(req.body, req.get(SIGNATURE_HEADER));

  const { duplicate } = await recordEvent(event);

  if (duplicate) {
    // Already in the ledger. Stripe resends freely, so this is an ordinary
    // event rather than a fault — 200 and nothing else, so it is not retried.
    console.log(`[webhook] ${event.id} already processed — ignored`);
    res.status(200).json({ received: true, duplicate: true });
    return;
  }

  // A throw here becomes a 500, which shows in Stripe's dashboard as a failed
  // delivery. That is deliberate: silently returning 200 would hide a payment
  // we failed to act on. See the note in the service about why the retry alone
  // is not enough, and what 6.4 has to do about it.
  // AWAITED. The handler creates four documents in a transaction, and an
  // un-awaited promise would return 200 before that finished — so a failure
  // would be invisible to Stripe and the request would look successful.
  await routeEvent(event);

  res.status(200).json({ received: true });
});

export default { handlePaymentWebhook };
