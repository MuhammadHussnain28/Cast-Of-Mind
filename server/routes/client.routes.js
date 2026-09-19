import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireClient } from '../middleware/requireRole.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { requireActiveSubscription } from '../middleware/requireActiveSubscription.js';
import { getMe } from '../controllers/clientPortal.controller.js';
import { CLIENT_RATE_LIMIT } from '../constants/clientPortal.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { uploadSingleFile } from '../middleware/upload.js';
import { listWorksheetsQuerySchema } from '../validation/worksheets.schema.js';
import { clientList, clientDownload, clientSubmit } from '../controllers/worksheet.controller.js';
import { WORKSHEET_UPLOAD_RATE_LIMIT } from '../constants/worksheets.js';
import { journalEntrySchema, journalQuerySchema } from '../validation/journal.schema.js';
import { listMine, create, update, remove } from '../controllers/journal.controller.js';
import { JOURNAL_WRITE_RATE_LIMIT } from '../constants/journal.js';

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
 * EVERYTHING BELOW THIS LINE REQUIRES A LIVE SUBSCRIPTION (§13).
 *
 * Mounted on the router rather than repeated per route, so chat (7.2), the
 * worksheets (8.5), the journal (8.6) and the session hub (9.4) are all gated
 * by default. A new client route cannot ship ungated by forgetting an argument;
 * it would have to be deliberately mounted above this line.
 */
router.use(requireActiveSubscription);

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
