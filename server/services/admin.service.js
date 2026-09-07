import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { SESSION_EXPIRED_CODE, SESSION_EXPIRED_MESSAGE } from '../constants/auth.js';
import { ADMIN_IDLE_TIMEOUT_MS, ADMIN_IDLE_WARNING_MS } from '../constants/admin.js';

/**
 * What the admin shell needs on load: who is signed in, and how long the portal
 * may sit idle.
 *
 * Re-reads the database rather than trusting the token. The guards do no lookup
 * by design (chunk 1.2), so a deactivated or demoted admin keeps a valid token
 * for up to 15 more minutes — this is where that actually bites.
 */
export async function getAdminSession(userId) {
  const user = await User.findById(userId).select('email role status');

  const stillAdmin =
    user && user.status === USER_STATUS.ACTIVE && user.role === ROLES.ADMIN;

  if (!stillAdmin) {
    throw new AppError(SESSION_EXPIRED_MESSAGE, 401, SESSION_EXPIRED_CODE);
  }

  return {
    email: user.email,
    role: user.role,
    idleTimeoutMs: ADMIN_IDLE_TIMEOUT_MS,
    idleWarningMs: ADMIN_IDLE_WARNING_MS,
  };
}
