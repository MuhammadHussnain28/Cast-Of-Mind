import express from 'express';
import {
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validation/auth.schema.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import {
  LOGIN_RATE_LIMIT_WINDOW_MS,
  LOGIN_RATE_LIMIT_MAX,
  LOGIN_RATE_LIMIT_MESSAGE,
  SESSION_RATE_LIMIT_WINDOW_MS,
  SESSION_RATE_LIMIT_MAX,
  SESSION_RATE_LIMIT_MESSAGE,
  FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS,
  FORGOT_PASSWORD_RATE_LIMIT_MAX,
  FORGOT_PASSWORD_RATE_LIMIT_MESSAGE,
  RESET_PASSWORD_RATE_LIMIT_WINDOW_MS,
  RESET_PASSWORD_RATE_LIMIT_MAX,
  RESET_PASSWORD_RATE_LIMIT_MESSAGE,
} from '../constants/auth.js';

// Slows down password guessing. Exported so tests can clear the counter between
// cases — otherwise the first test to run would use up the allowance for all
// the others, since every request in a test file comes from the same IP.
export const loginRateLimiter = createRateLimiter({
  windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
  max: LOGIN_RATE_LIMIT_MAX,
  message: LOGIN_RATE_LIMIT_MESSAGE,
});

// Separate and far more generous than the login limiter. A signed-in user hits
// refresh about four times an hour and several open tabs multiply that, so a
// tight limit here would break ordinary use rather than stop an attack.
export const sessionRateLimiter = createRateLimiter({
  windowMs: SESSION_RATE_LIMIT_WINDOW_MS,
  max: SESSION_RATE_LIMIT_MAX,
  message: SESSION_RATE_LIMIT_MESSAGE,
});

// The strictest limit on the platform. This endpoint sends real email to an
// address the caller chooses, which makes it a tool for flooding a stranger's
// inbox as much as a route for guessing anything.
export const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS,
  max: FORGOT_PASSWORD_RATE_LIMIT_MAX,
  message: FORGOT_PASSWORD_RATE_LIMIT_MESSAGE,
});

export const resetPasswordRateLimiter = createRateLimiter({
  windowMs: RESET_PASSWORD_RATE_LIMIT_WINDOW_MS,
  max: RESET_PASSWORD_RATE_LIMIT_MAX,
  message: RESET_PASSWORD_RATE_LIMIT_MESSAGE,
});

const router = express.Router();

// Order matters: rate limit first, so a flood of junk requests is rejected
// before any validation or database work happens.
router.post('/login', loginRateLimiter, validate(loginSchema), login);

// Authenticated by the refresh COOKIE, not the access token — so no
// `requireAuth` here. The whole point is to be callable once the access token
// has already expired.
router.post('/refresh', sessionRateLimiter, refresh);
router.post('/logout', sessionRateLimiter, logout);

// Authenticated by the ACCESS token in the Authorization header.
router.get('/me', sessionRateLimiter, requireAuth, me);

// Deliberately unauthenticated: someone who cannot log in is exactly who needs
// these. The reset token itself is the credential. Works identically for all
// three roles, admin included — master spec §11 Account Recovery.
router.post(
  '/forgot-password',
  forgotPasswordRateLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  '/reset-password',
  resetPasswordRateLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);

export default router;
