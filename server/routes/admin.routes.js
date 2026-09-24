import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireRole.js';
import { adminActionLog } from '../middleware/adminActionLog.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import {
  getSession,
  getStats,
  getSystemStatusController,
} from '../controllers/admin.controller.js';
import {
  listApplicationsController,
  getApplicationController,
  getApplicationDocumentController,
  approveApplicationController,
  rejectApplicationController,
} from '../controllers/adminApplications.controller.js';
import {
  listTherapistsController,
  getTherapistController,
  updateTherapistController,
  deactivateTherapistController,
  reactivateTherapistController,
  resetTherapistPasswordController,
} from '../controllers/adminTherapists.controller.js';
import {
  listClientsController,
  getClientController,
  cancelClientSubscriptionController,
  deactivateClientController,
  reactivateClientController,
  resetClientPasswordController,
} from '../controllers/adminClients.controller.js';
import { listBookingsController } from '../controllers/adminBookings.controller.js';
import { listReviewsController } from '../controllers/adminReviews.controller.js';
import { listReviewsQuerySchema } from '../validation/reviews.schema.js';
import { validate, validateQuery } from '../middleware/validate.js';
import {
  listApplicationsQuerySchema,
  rejectApplicationSchema,
} from '../validation/adminApplications.schema.js';
import {
  listTherapistsQuerySchema,
  updateTherapistSchema,
} from '../validation/adminTherapists.schema.js';
import { listClientsQuerySchema } from '../validation/adminClients.schema.js';
import { listBookingsQuerySchema } from '../validation/adminBookings.schema.js';
import {
  ADMIN_RATE_LIMIT_MAX,
  ADMIN_RATE_LIMIT_MESSAGE,
  ADMIN_RATE_LIMIT_WINDOW_MS,
} from '../constants/admin.js';

// Everything under /api/v1/admin.
//
// The guards sit on the ROUTER, not on individual routes. Every screen slice 4
// adds from here inherits them, so a new admin route cannot be shipped
// unprotected by forgetting a middleware argument. A mistyped path under this
// mount hits the guard too, and is refused before it can reach the 404 handler.

const router = express.Router();

// Exported so tests can reset the counter between cases.
export const adminRateLimiter = createRateLimiter({
  windowMs: ADMIN_RATE_LIMIT_WINDOW_MS,
  max: ADMIN_RATE_LIMIT_MAX,
  message: ADMIN_RATE_LIMIT_MESSAGE,
});

// Order matters. The limiter rejects a flood before any work happens, and the
// action log runs before the guards so refused attempts are recorded too.
router.use(adminRateLimiter, adminActionLog, requireAuth, requireAdmin);

router.get('/session', getSession);

// The dashboard overview — §9.1. Counts and one trend, nothing derived.
router.get('/stats', getStats);

// Dashboard system status card (10.6): one check per service, on request only.
router.get('/system-status', getSystemStatusController);

// Therapist applications — master spec §9.2.
router.get(
  '/applications',
  validateQuery(listApplicationsQuerySchema),
  listApplicationsController,
);
router.get('/applications/:id', getApplicationController);

// Streams the file through this server rather than redirecting. An
// `authenticated` Cloudinary URL carries a permanent signature, so handing one
// to the browser would grant access that outlives the session and cannot be
// revoked — see utils/cloudinaryDelivery.js.
router.get('/applications/:id/documents/:field', getApplicationDocumentController);

// Approval creates the therapist's users + therapistProfiles records in one
// transaction — see services/adminApprovals.service.js.
router.post('/applications/:id/approve', approveApplicationController);
router.post('/applications/:id/reject', validate(rejectApplicationSchema), rejectApplicationController);

// Therapist management — master spec §9.3.
//
// NOTHING HERE READS messages, journals OR privateNotes. §11 records that an
// admin conversation viewer was proposed and the client decided against it.
router.get(
  '/therapists',
  validateQuery(listTherapistsQuerySchema),
  listTherapistsController,
);
router.get('/therapists/:id', getTherapistController);
router.patch('/therapists/:id', validate(updateTherapistSchema), updateTherapistController);
router.post('/therapists/:id/deactivate', deactivateTherapistController);
router.post('/therapists/:id/reactivate', reactivateTherapistController);

// Triggers the SAME reset flow as the public endpoint. The admin never sees or
// chooses a password — §11, hashes are one-way.
router.post('/therapists/:id/reset-password', resetTherapistPasswordController);

// Client management — master spec §9.4.
//
// `:id` IS THE CLIENT PROFILE ID, matching /admin/therapists/:id, and the
// therapist's user id never appears in any response here.
//
// NOTHING BELOW READS messages, journals OR privateNotes, and there is
// deliberately no route that could — §11. `routes/privateNotes.test.js` walks
// the import graph from this file and proves it rather than trusting this note.
router.get('/clients', validateQuery(listClientsQuerySchema), listClientsController);
router.get('/clients/:id', getClientController);

// §13's admin override. Sets Stripe to stop at the end of the paid period
// FIRST, then writes our record — see services/adminClients.service.js for why
// that order is not interchangeable. Immediate expiry is slice 11.
router.post('/clients/:id/cancel-subscription', cancelClientSubscriptionController);

// Stops them signing in. It does NOT stop the billing — the subscription is a
// separate thing and has to be cancelled separately.
router.post('/clients/:id/deactivate', deactivateClientController);
router.post('/clients/:id/reactivate', reactivateClientController);

router.post('/clients/:id/reset-password', resetClientPasswordController);

// Bookings and subscriptions overview — master spec §9.5. Read-only: who is
// paired with whom, and the state of each pairing's newest subscription. Every
// action lives on the client's own screen, one click away.
router.get('/bookings', validateQuery(listBookingsQuerySchema), listBookingsController);

// End-of-subscription reviews — master spec §9.6. ADMIN-ONLY: this router is
// the only one that may reach adminReviews.service.js, and a test walks every
// other router's imports to prove none can. `?therapistId=` is a PROFILE id.
router.get('/reviews', validateQuery(listReviewsQuerySchema), listReviewsController);

export default router;
