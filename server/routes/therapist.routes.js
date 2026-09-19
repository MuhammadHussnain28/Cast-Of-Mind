import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireTherapist } from '../middleware/requireRole.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { updateOwnProfileSchema } from '../validation/therapistProfile.schema.js';
import { listClientsQuerySchema } from '../validation/therapistClients.schema.js';
import { getProfile, updateProfile } from '../controllers/therapistProfile.controller.js';
import { listClients } from '../controllers/therapistClients.controller.js';
import { getClient } from '../controllers/therapistClient.controller.js';
import { uploadSingleFile } from '../middleware/upload.js';
import {
  assignWorksheetSchema,
  listWorksheetsQuerySchema,
} from '../validation/worksheets.schema.js';
import { assign, list, download, withdraw, review } from '../controllers/worksheet.controller.js';
import { WORKSHEET_UPLOAD_RATE_LIMIT } from '../constants/worksheets.js';
import { privateNoteSchema, journalQuerySchema } from '../validation/journal.schema.js';
import { listForClient } from '../controllers/journal.controller.js';
import {
  list as listNotes,
  create as createNote,
  update as updateNote,
  remove as removeNote,
} from '../controllers/privateNotes.controller.js';

// Everything under /api/v1/therapist — the signed-in therapist's own portal.
//
// Guards on the ROUTER, as with the admin mount: every route slice 8 adds here
// inherits them, and a mistyped path is refused before it reaches the 404
// handler. `/therapist/profile` is singular on purpose — it is a singleton for
// the authenticated user, not a collection, so the plural-resources convention
// does not apply.

const router = express.Router();

export const therapistRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests. Please try again in a few minutes.',
});

router.use(therapistRateLimiter, requireAuth, requireTherapist);

router.get('/profile', getProfile);

// Accepts ONLY photoUrl and bio. Every other field is refused by name — see
// validation/therapistProfile.schema.js.
router.patch('/profile', validate(updateOwnProfileSchema), updateProfile);

// The inbox's left-hand list (§8.1). Plural because it IS a collection, unlike
// `/profile` above. Scoped to the caller's own token — there is no therapist id
// in the path to tamper with.
router.get('/clients', validateQuery(listClientsQuerySchema), listClients);

// One client's workspace (§8.2). The id is attacker-controlled, so OWNERSHIP IS
// PROVED IN THE SERVICE against the stored booking — a therapist can never load
// another therapist's client by editing this URL. No schema here: the only
// input is a path parameter the service validates and refuses identically
// whether it is malformed, unknown, or somebody else's.
router.get('/clients/:bookingId', getClient);

// Worksheets (8.4). Ownership is proved in the service; every refusal is a 404.
export const worksheetUploadRateLimiter = createRateLimiter(WORKSHEET_UPLOAD_RATE_LIMIT);

router.post(
  '/worksheets',
  worksheetUploadRateLimiter,
  uploadSingleFile,
  validate(assignWorksheetSchema),
  assign,
);
router.get('/worksheets/:bookingId', validateQuery(listWorksheetsQuerySchema), list);
router.get('/worksheets/:bookingId/:worksheetId/file/:which', download);
router.delete('/worksheets/:bookingId/:worksheetId', withdraw);
router.post('/worksheets/:bookingId/:worksheetId/review', review);

/**
 * Journal and Notes (8.6) — §8.5/8.6's unified workspace, TWO SEPARATE MOUNTS.
 *
 * The tab shows the client's entries beside the therapist's own notes, and the
 * browser fetches them independently. There is deliberately no combined
 * endpoint: one response object carrying both collections is the shape a future
 * refactor could leak to the client side, and physical separation is the whole
 * safety guarantee. Ownership is proved per request; every refusal is a 404.
 */

// The client's own writing, READ ONLY — no write verb exists for it anywhere.
router.get('/journal/:bookingId', validateQuery(journalQuerySchema), listForClient);

// THE THERAPIST'S PRIVATE NOTES. Behind `requireTherapist` on this router, and
// scoped again to the calling therapist inside the service.
router.get('/notes/:bookingId', validateQuery(journalQuerySchema), listNotes);
router.post('/notes/:bookingId', validate(privateNoteSchema), createNote);
router.patch('/notes/:bookingId/:noteId', validate(privateNoteSchema), updateNote);
router.delete('/notes/:bookingId/:noteId', removeNote);

export default router;
