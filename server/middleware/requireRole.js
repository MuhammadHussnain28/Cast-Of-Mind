import { AppError } from '../utils/AppError.js';
import { ROLES } from '../constants/roles.js';
import {
  FORBIDDEN_MESSAGE,
  FORBIDDEN_CODE,
  UNAUTHENTICATED_MESSAGE,
  UNAUTHENTICATED_CODE,
} from '../constants/auth.js';

// The SECOND half of protection. `requireAuth` answers "who is this?"; these
// answer "are they allowed?". Always used as a pair:
//
//   router.get('/admin/clients', requireAuth, requireAdmin, handler);
//
// Master spec §11 and §18: role checks are enforced server-side on every
// protected route. A hidden button in the UI is not access control — anyone can
// call the API directly with curl.

/**
 * Allow only the listed roles through.
 *
 * @param {...string} allowedRoles One or more values from ROLES.
 */
export function requireRole(...allowedRoles) {
  // Catches a typo at STARTUP rather than at request time. Without this,
  // requireRole('admins') would simply reject everyone forever, and the route
  // would look protected while being permanently broken.
  const unknown = allowedRoles.filter((role) => !Object.values(ROLES).includes(role));
  if (allowedRoles.length === 0 || unknown.length > 0) {
    throw new Error(
      `requireRole() called with invalid role(s): ${unknown.join(', ') || '(none given)'}`,
    );
  }

  return (req, res, next) => {
    // FAIL CLOSED. If `requireAuth` was left off the route by mistake, req.user
    // is undefined — and this must refuse, never wave the request through.
    //
    // This is the single most important line in the file. A guard that passes
    // when it is misused is worse than no guard at all, because the route LOOKS
    // protected in the code and nobody goes back to check it.
    if (!req.user || !req.user.role) {
      return next(new AppError(UNAUTHENTICATED_MESSAGE, 401, UNAUTHENTICATED_CODE));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(FORBIDDEN_MESSAGE, 403, FORBIDDEN_CODE));
    }

    return next();
  };
}

// The three roles from master spec §3. A route needing two roles at once — say
// therapist or admin — uses requireRole(ROLES.THERAPIST, ROLES.ADMIN) directly
// rather than getting a new named guard.
export const requireClient = requireRole(ROLES.CLIENT);
export const requireTherapist = requireRole(ROLES.THERAPIST);
export const requireAdmin = requireRole(ROLES.ADMIN);
