import rateLimit from 'express-rate-limit';

// Factory — not applied to any route yet. Each route that needs it later
// calls this with its own limits, e.g. createRateLimiter({ max: 5 }) for login.
export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests, please try again later.',
} = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message, code: 'RATE_LIMITED' } },
  });
}
