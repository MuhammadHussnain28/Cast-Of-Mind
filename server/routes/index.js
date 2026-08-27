import express from 'express';
import env from '../config/env.js';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import devRoutes from './dev.routes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// TODO: REMOVE BEFORE LAUNCH — see routes/dev.routes.js.
//
// Guard-testing routes, mounted only outside production. On the live site these
// paths simply do not exist and fall through to the 404 handler.
if (!env.isProduction) {
  router.use('/dev', devRoutes);
}

export default router;
