import express from 'express';
import { getHealth } from '../controllers/health.controller.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { HEALTH_RATE_LIMIT } from '../constants/systemStatus.js';

// Public, for uptime monitors (12.4). Rate limited, and the probes behind it
// are cached, so nobody can spend Resend's or Cloudinary's API quota through it.
export const healthRateLimiter = createRateLimiter(HEALTH_RATE_LIMIT);

const router = express.Router();

router.get('/', healthRateLimiter, getHealth);

export default router;
