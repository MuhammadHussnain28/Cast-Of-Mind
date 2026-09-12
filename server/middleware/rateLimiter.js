import rateLimit from 'express-rate-limit';

// Factory — not applied to any route yet. Each route that needs it later
// calls this with its own limits, e.g. createRateLimiter({ max: 5 }) for login.
export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests, please try again later.',
  // Count only requests that FAILED. Added in chunk 6.3 for the payment
  // webhook: Stripe sends from a handful of IPs, so a per-IP counter is
  // effectively a global one, and throttling a burst of genuine renewals could
  // make Stripe disable the endpoint. Off everywhere else.
  skipSuccessfulRequests = false,
} = {}) {
  return rateLimit({
    windowMs,
    max,
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message, code: 'RATE_LIMITED' } },
  });
}
