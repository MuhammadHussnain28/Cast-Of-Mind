import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireClient } from '../middleware/requireRole.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { requireActiveSubscription } from '../middleware/requireActiveSubscription.js';
import {
  getMe,
  saveTimezone,
  openBillingPortal,
  cancelSubscription,
  reactivateSubscription,
  resubscribe,
  billingHistory,
} from '../controllers/clientPortal.controller.js';
import {
  BILLING_PORTAL_RATE_LIMIT,
  CANCEL_RATE_LIMIT,
  RESUBSCRIBE_RATE_LIMIT,
} from '../constants/subscriptionLifecycle.js';
import { clientTimezoneSchema, billingHistoryQuerySchema } from '../validation/clientPortal.schema.js';
import { CLIENT_RATE_LIMIT } from '../constants/clientPortal.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { uploadSingleFile } from '../middleware/upload.js';
import { listWorksheetsQuerySchema } from '../validation/worksheets.schema.js';
import { clientList, clientDownload, clientSubmit } from '../controllers/worksheet.controller.js';
import { WORKSHEET_UPLOAD_RATE_LIMIT } from '../constants/worksheets.js';
import { journalEntrySchema, journalQuerySchema } from '../validation/journal.schema.js';
import { listMine, create, update, remove } from '../controllers/journal.controller.js';
import { JOURNAL_WRITE_RATE_LIMIT } from '../constants/journal.js';
import { submitReviewSchema } from '../validation/reviews.schema.js';
import { REVIEW_RATE_LIMIT } from '../constants/reviews.js';
// The WRITE half only. The read half (adminReviews.service.js) must never be
// reachable from this router — routes/reviews.test.js walks the imports.
import { submitReviewController, declineReviewController } from '../controllers/reviews.controller.js';

// Everything under /api/v1/client — the signed-in client's own portal (§7).
//
// Guards on the ROUTER, as with the admin and therapist mounts: every route a
// later chunk adds inherits them, and a mistyped path is refused before it
// reaches the 404 handler, so the portal's surface cannot be mapped by
// comparing 403s against 404s.
//
// Singular '/client' for the same reason '/therapist' is: it is a singleton for
// the authenticated user, not a collection, so the plural-resources convention
// does not apply.

const router = express.Router();

export const clientRateLimiter = createRateLimiter(CLIENT_RATE_LIMIT);

router.use(clientRateLimiter, requireAuth, requireClient);

/**
 * DELIBERATELY OUTSIDE THE SUBSCRIPTION GATE.
 *
 * This is the endpoint that REPORTS access, so it has to answer for a client
 * whose subscription has ended. Behind the gate it would return a bare 403 and
 * the browser could not tell "your subscription ended" from "something broke" —
 * leaving the re-subscribe screen (slice 12) with nothing to render and an
 * anxious person looking at an error.
 *
 * It leaks nothing a client may not see: it is their own account, their own
 * questionnaire answers, the therapist they already chose, and the state of
 * their own subscription.
 */
router.get('/me', getMe);

/**
 * ALSO OUTSIDE THE GATE, and for a sharper reason (10.3).
 *
 * §9.6 asks for a rating when a subscription ENDS — so the people who can leave
 * one are exactly the people the gate turns away. Behind it, no client could
 * ever rate. The service decides eligibility itself (cancelled or expired) and
 * resolves the therapist from the client's own booking; the body is stars and
 * optional words, nothing else.
 */
export const reviewRateLimiter = createRateLimiter(REVIEW_RATE_LIMIT);
router.post('/reviews', reviewRateLimiter, validate(submitReviewSchema), submitReviewController);
// "No thanks" (11.6) — outside the gate for the same reason as the rating.
router.post('/reviews/decline', reviewRateLimiter, declineReviewController);

/**
 * ALSO OUTSIDE THE GATE (11.4): re-subscribing is for exactly the people the gate
 * refuses. The service allows it only once access has ENDED and the therapist
 * is still active. No body is read — the booking comes from the token.
 */
export const resubscribeRateLimiter = createRateLimiter(RESUBSCRIBE_RATE_LIMIT);
router.post('/subscription/resubscribe', resubscribeRateLimiter, resubscribe);

/**
 * EVERYTHING BELOW THIS LINE REQUIRES A LIVE SUBSCRIPTION (§13).
 *
 * Mounted on the router rather than repeated per route, so chat (7.2), the
 * worksheets (8.5), the journal (8.6) and the session hub (9.4) are all gated
 * by default. A new client route cannot ship ungated by forgetting an argument;
 * it would have to be deliberately mounted above this line.
 */
router.use(requireActiveSubscription);

// The browser's own timezone (9.2), saved quietly when it changes.
router.patch('/timezone', validate(clientTimezoneSchema), saveTimezone);

// "Update your card" (11.2): a Stripe Customer Portal link. Gated, so past_due
// (in grace) reaches it and an ended subscription does not. No body is read.
export const billingPortalRateLimiter = createRateLimiter(BILLING_PORTAL_RATE_LIMIT);
router.post('/billing/portal', billingPortalRateLimiter, openBillingPortal);

// Billing history (11.5) — gated, the client's own rows only, from the ledger.
router.get('/billing/history', validateQuery(billingHistoryQuerySchema), billingHistory);

// Cancel and reactivate (11.3). Gated: a cancelled plan still inside its paid
// time reads "ending" and reaches both; an ended one reaches neither. No body
// is read — the subscription comes from the token.
export const cancelRateLimiter = createRateLimiter(CANCEL_RATE_LIMIT);
router.post('/subscription/cancel', cancelRateLimiter, cancelSubscription);
router.post('/subscription/reactivate', cancelRateLimiter, reactivateSubscription);

// Worksheets (8.5) — gated above. The booking comes from the token, never the URL.
export const clientWorksheetUploadRateLimiter = createRateLimiter(WORKSHEET_UPLOAD_RATE_LIMIT);

router.get('/worksheets', validateQuery(listWorksheetsQuerySchema), clientList);
router.get('/worksheets/:worksheetId/file/:which', clientDownload);
router.post(
  '/worksheets/:worksheetId/submit',
  clientWorksheetUploadRateLimiter,
  uploadSingleFile,
  clientSubmit,
);

/**
 * Journal (8.6) — gated above. The booking comes from the token, never the URL.
 *
 * NOTHING HERE TOUCHES `privateNotes`. The journal controller and service do
 * not import that model or its service, so a note cannot reach a client
 * response even by mistake — there is no code path to filter. §8.5/8.6 requires
 * that separation to be architectural, and a test proves this file's import
 * graph never reaches it.
 */
export const journalWriteRateLimiter = createRateLimiter(JOURNAL_WRITE_RATE_LIMIT);

router.get('/journal', validateQuery(journalQuerySchema), listMine);
router.post('/journal', journalWriteRateLimiter, validate(journalEntrySchema), create);
router.patch('/journal/:entryId', journalWriteRateLimiter, validate(journalEntrySchema), update);
router.delete('/journal/:entryId', remove);

export default router;
