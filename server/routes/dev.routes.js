import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  requireClient,
  requireTherapist,
  requireAdmin,
} from '../middleware/requireRole.js';
import { requireActiveSubscription } from '../middleware/requireActiveSubscription.js';

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

// The subscription access gate (§13), so it can be tried by hand: set a
// client's subscription to `expired` in the database and this flips from 200 to
// 403 SUBSCRIPTION_ENDED. No real client route is gated yet — chat (7.2) is the
// first — and this is the only way to exercise it outside the test suite.
router.get('/client-gated', requireAuth, requireClient, requireActiveSubscription, (req, res) => {
  res.status(200).json({
    message: 'Guard passed.',
    user: { id: req.user.id, role: req.user.role },
    access: req.portalAccess,
  });
});

export default router;
