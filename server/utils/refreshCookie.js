import env from '../config/env.js';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_MS,
} from '../constants/auth.js';

// The refresh cookie is set in three places (login, refresh) and cleared in one
// (logout). Those options live HERE, once.
//
// The reason this is not inlined at each call site: `res.clearCookie` only works
// when `path`, `sameSite`, and `secure` match the cookie that was set exactly.
// If one call site drifts from another, logout returns a cheerful 200 while the
// cookie quietly stays in the browser — a bug that looks like nothing is wrong.

function cookieOptions() {
  return {
    // JavaScript in the browser cannot read this cookie. That is what protects
    // the 7-day credential from an XSS attack.
    httpOnly: true,

    // HTTPS only in production. Left off in development because localhost is
    // plain HTTP and the cookie would otherwise never be set at all.
    secure: env.isProduction,

    // 'lax' works while the site and API share a registrable domain
    // (castofmind.com and api.castofmind.com), and on localhost where the port
    // does not matter.
    //
    // TODO (chunk 12.5 — deployment): if the API ends up on a DIFFERENT domain,
    // for example cast-of-mind.onrender.com serving castofmind.com, this must
    // become sameSite: 'none' with secure: true. Otherwise the browser silently
    // drops the cookie and every refresh fails, with nothing in the logs to
    // explain why. This is the one line to change.
    sameSite: 'lax',

    // Scoped so the browser only ever sends this cookie to auth routes. It is
    // never attached to ordinary API calls, which shrinks where it can leak.
    path: REFRESH_COOKIE_PATH,
  };
}

/**
 * @param {number} maxAgeMs How long the browser should keep it. On rotation this
 *   is the time REMAINING in the absolute 7-day window, not a fresh 7 days — so
 *   the cookie never outlives the record in the database.
 */
export function setRefreshCookie(res, token, maxAgeMs = REFRESH_TOKEN_TTL_MS) {
  res.cookie(REFRESH_COOKIE_NAME, token, { ...cookieOptions(), maxAge: maxAgeMs });
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions());
}

export function readRefreshCookie(req) {
  return req.cookies?.[REFRESH_COOKIE_NAME];
}
