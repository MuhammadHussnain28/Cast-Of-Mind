import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  requireClient,
  requireTherapist,
  requireAdmin,
} from '../middleware/requireRole.js';

// TODO: REMOVE BEFORE LAUNCH — development-only routes.
//
// These exist for one purpose: proving the role guards actually work, by hand
// in Postman as well as in the test suite. They hold no real logic and touch no
// real data.
//
// They are mounted by routes/index.js ONLY when NODE_ENV is not 'production',
// so they cannot appear on the live site even if someone forgets to delete
// them. That gate is the safety net, not the plan — this file is on the
// pre-launch blocker list in docs/ongoing.md and should be deleted outright.

const router = express.Router();

function whoami(req, res) {
  res.status(200).json({
    message: 'Guard passed.',
    user: { id: req.user.id, role: req.user.role },
  });
}

// Any signed-in user, whatever their role.
router.get('/any', requireAuth, whoami);

// One route per role.
router.get('/client', requireAuth, requireClient, whoami);
router.get('/therapist', requireAuth, requireTherapist, whoami);
router.get('/admin', requireAuth, requireAdmin, whoami);

export default router;
