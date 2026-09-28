import { Subscription } from '../models/Subscription.js';
import { AppError } from '../utils/AppError.js';
import { SUBSCRIPTION_STATUS } from '../constants/payments.js';
import { ROLES } from '../constants/roles.js';
import { UNAUTHENTICATED_MESSAGE, UNAUTHENTICATED_CODE } from '../constants/auth.js';
import {
  PORTAL_ACCESS,
  PORTAL_ALLOWED_ACCESS,
  SUBSCRIPTION_ENDED_MESSAGE,
  SUBSCRIPTION_ENDED_CODE,
} from '../constants/clientPortal.js';

// THE ACCESS GATE — master spec §13. Portal access is controlled entirely by
// subscription status, checked server-side on every protected client action.
// Hiding navigation in the browser is not access control.
//
// Used as the third link in the chain, never alone:
//
//   router.use(requireAuth, requireClient);
//   router.get('/me', getMe);              // reports access — NOT gated
//   router.use(requireActiveSubscription); // everything after this is gated

/**
 * Resolve a subscription record to one of four access states.
 *
 * The case worth reading twice is `cancelled`. §13 is explicit that a client
 * who cancels keeps full access until the end of the period they already paid
 * for — cutting them off mid-period would be a refund problem as well as a
 * broken promise. So a cancelled subscription is allowed while
 * `currentPeriodEnd` is still ahead, and treated exactly as expired once it has
 * passed. Slice 11 flips the stored status on the same boundary; this comparison
 * is what keeps the two in step in the meantime.
 */
/**
 * When portal access ends, or null while it runs on (active renews itself).
 * THE ONE PLACE this is worked out (11.3): the gate, the sweep, /me and the
 * emails all read it. A cancelled plan runs to the paid period's end — or to
 * the grace end, when it was cancelled while past due. Never mid-paid-period.
 */
export function accessEndsAt(subscription) {
  if (!subscription) return null;
  if (subscription.status === SUBSCRIPTION_STATUS.PAST_DUE) {
    return subscription.graceEndsAt ? new Date(subscription.graceEndsAt) : null;
  }
  if (subscription.status === SUBSCRIPTION_STATUS.CANCELLED) {
    const ends = [subscription.currentPeriodEnd, subscription.graceEndsAt]
      .filter(Boolean)
      .map((value) => new Date(value).getTime());
    return ends.length ? new Date(Math.max(...ends)) : null;
  }
  return null;
}

export function resolveAccess(subscription, now = new Date()) {
  if (!subscription) return PORTAL_ACCESS.ENDED;

  switch (subscription.status) {
    case SUBSCRIPTION_STATUS.ACTIVE:
      return PORTAL_ACCESS.ACTIVE;

    case SUBSCRIPTION_STATUS.PAST_DUE:
      // Allowed on purpose. §13 gives a ~3-day grace period with a banner, not
      // a lockout. Once the grace has run out it reads as ended, even before
      // the sweep (11.2) stores `expired` — the same boundary, checked twice.
      return subscription.graceEndsAt && subscription.graceEndsAt <= now
        ? PORTAL_ACCESS.ENDED
        : PORTAL_ACCESS.PAST_DUE;

    case SUBSCRIPTION_STATUS.CANCELLED: {
      const ends = accessEndsAt(subscription);
      return ends && ends > now ? PORTAL_ACCESS.ENDING : PORTAL_ACCESS.ENDED;
    }

    default:
      return PORTAL_ACCESS.ENDED;
  }
}

/**
 * The client's current subscription.
 *
 * Newest first rather than filtering on status, because a booking may own
 * several over its life (cancel, expire, re-subscribe) and the most recent one
 * is the one that decides access. The partial unique index on
 * `subscriptions.bookingId` guarantees at most one of them is active.
 */
export async function findCurrentSubscription(clientId) {
  return Subscription.findOne({ clientId }).sort({ createdAt: -1 });
}

export async function requireActiveSubscription(req, _res, next) {
  try {
    // FAIL CLOSED, as requireRole does. If requireAuth were left off the route
    // by mistake there is no user to look up, and this must refuse rather than
    // wave the request through — a guard that passes when misused is worse than
    // no guard, because the route still LOOKS protected in the code.
    if (!req.user || !req.user.id) {
      return next(new AppError(UNAUTHENTICATED_MESSAGE, 401, UNAUTHENTICATED_CODE));
    }

    const subscription = await findCurrentSubscription(req.user.id);
    const access = resolveAccess(subscription);

    if (!PORTAL_ALLOWED_ACCESS.includes(access)) {
      // 403 rather than 401: we know exactly who they are, and they can still
      // authenticate (§13 — login works, the portal does not). The code is what
      // the browser uses to show the re-subscribe screen instead of an error.
      return next(new AppError(SUBSCRIPTION_ENDED_MESSAGE, 403, SUBSCRIPTION_ENDED_CODE));
    }

    // Handed on so a controller does not re-query what the gate already read.
    req.subscription = subscription;
    req.portalAccess = access;

    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * The same gate, but only for clients — a therapist passes straight through.
 *
 * Used on `/api/v1/chat`, which both roles share. Developer's decision,
 * 2026-09-13: an expired client loses the conversation with the rest of their
 * portal (§13), but the therapist keeps read access to it, because the thread
 * is their clinical record of the relationship and taking it away because
 * somebody else's card failed would be the wrong party to penalise.
 *
 * Writing is refused separately for an ended booking — see the chat service.
 */
export function requireActiveSubscriptionForClients(req, res, next) {
  if (req.user?.role !== ROLES.CLIENT) return next();
  return requireActiveSubscription(req, res, next);
}

export default requireActiveSubscription;
