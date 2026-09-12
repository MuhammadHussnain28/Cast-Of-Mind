import express from 'express';
import env from '../config/env.js';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import contactRoutes from './contact.routes.js';
import uploadRoutes from './upload.routes.js';
import therapistApplicationRoutes from './therapistApplication.routes.js';
import adminRoutes from './admin.routes.js';
import therapistRoutes from './therapist.routes.js';
import matchingRoutes from './matching.routes.js';
import therapistsRoutes from './therapists.routes.js';
import checkoutRoutes from './checkout.routes.js';
import webhookRoutes from './webhook.routes.js';
import devRoutes from './dev.routes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/contact', contactRoutes);
router.use('/uploads', uploadRoutes);
router.use('/therapist-applications', therapistApplicationRoutes);
router.use('/admin', adminRoutes);
router.use('/therapist', therapistRoutes);
router.use('/matching', matchingRoutes);
// Plural and public — the singular '/therapist' above is the authenticated
// route where a therapist manages their own profile.
router.use('/therapists', therapistsRoutes);
router.use('/checkout', checkoutRoutes);
// Raw-bodied — see the parser mounted for this path in app.js.
router.use('/webhooks', webhookRoutes);

// TODO: REMOVE BEFORE LAUNCH — see routes/dev.routes.js.
//
// Guard-testing routes, mounted only outside production. On the live site these
// paths simply do not exist and fall through to the 404 handler.
if (!env.isProduction) {
  router.use('/dev', devRoutes);
}

export default router;
