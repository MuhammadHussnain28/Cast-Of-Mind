import express from 'express';
import env from '../config/env.js';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import contactRoutes from './contact.routes.js';
import uploadRoutes from './upload.routes.js';
import therapistApplicationRoutes from './therapistApplication.routes.js';
import devRoutes from './dev.routes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/contact', contactRoutes);
router.use('/uploads', uploadRoutes);
router.use('/therapist-applications', therapistApplicationRoutes);

// TODO: REMOVE BEFORE LAUNCH — see routes/dev.routes.js.
//
// Guard-testing routes, mounted only outside production. On the live site these
// paths simply do not exist and fall through to the 404 handler.
if (!env.isProduction) {
  router.use('/dev', devRoutes);
}

export default router;
