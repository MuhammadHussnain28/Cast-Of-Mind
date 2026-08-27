import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/tokens.js';
import {
  TOKEN_EXPIRED_CODE,
  UNAUTHENTICATED_CODE,
  UNAUTHENTICATED_MESSAGE,
} from '../constants/auth.js';

// Reads and verifies the ACCESS token on a protected route, and puts the user
// on the request. This is the FIRST half of protection — it answers "who is
// this?", not "are they allowed?". Pair it with a guard from requireRole.js:
//
//   router.get('/admin/clients', requireAuth, requireAdmin, handler);
//
// Built during chunk 1.3 (as `authenticate`) because GET /auth/me could not
// exist without it, and renamed here in chunk 1.4 to sit naturally beside
// requireAdmin.
//
// Role checks are server-side on every protected route. Hiding a button in the
// UI is not access control — master spec §11 and §18.

function readBearerToken(req) {
  const header = req.headers.authorization;

  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

export function requireAuth(req, res, next) {
  const token = readBearerToken(req);

  if (!token) {
    return next(new AppError(UNAUTHENTICATED_MESSAGE, 401, UNAUTHENTICATED_CODE));
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    // An expired token is reported separately from a broken one so the frontend
    // interceptor in chunk 1.6 knows to try /auth/refresh rather than dumping
    // the user on the login page. This leaks nothing: whoever holds the token
    // can already read its expiry, because a JWT is base64, not encrypted.
    const isExpired = err.name === 'TokenExpiredError';

    return next(new AppError(
      isExpired ? 'Your session needs refreshing.' : UNAUTHENTICATED_MESSAGE,
      401,
      isExpired ? TOKEN_EXPIRED_CODE : UNAUTHENTICATED_CODE,
    ));
  }

  // Only what the token actually proves. Anything needing current data — the
  // email, whether the account is still active — must read the database.
  req.user = { id: payload.sub, role: payload.role };

  return next();
}
