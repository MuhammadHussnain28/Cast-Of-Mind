// Authentication settings — master spec §11.

// Short access token limits the damage if one is ever stolen. It is returned in
// the response body and held in memory by the browser only, never in
// localStorage or persisted Redux.
export const ACCESS_TOKEN_TTL = '15m';

// Refresh token lives in an httpOnly cookie, so JavaScript cannot read it.
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_SECONDS * 1000;

// The 7-day clock is ABSOLUTE, measured from login — it does NOT restart on
// refresh. Confirmed by the developer, 2026-08-24, following master spec §11
// step 6: "After 7 days, the refresh token expires and the user must log in
// again." A sliding window would quietly turn that into "never, as long as you
// keep visiting". Rotation therefore issues each new token with only the time
// that REMAINS, and `refreshTokenExpiresAt` on the user record is never moved.

export const REFRESH_COOKIE_NAME = 'refreshToken';

// Scoped so the browser only ever sends this cookie to auth routes
// (/login now, /refresh and /logout in chunk 1.3). It is never attached to
// ordinary API calls, which shrinks where it can leak.
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

// ONE message for every failed login. Unknown email, wrong password, and a
// deactivated account must be indistinguishable — anything else lets an
// attacker discover which emails have accounts here. On a mental health
// platform, "this address is a patient of ours" is itself sensitive.
// Confirmed by the developer, 2026-08-24.
export const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.';
export const INVALID_CREDENTIALS_CODE = 'INVALID_CREDENTIALS';

// Brute-force protection on the login route.
export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_RATE_LIMIT_MAX = 10;
export const LOGIN_RATE_LIMIT_MESSAGE = 'Too many login attempts. Please try again in a few minutes.';

// Refresh, logout, and /me. Generous on purpose: a normal signed-in user hits
// refresh roughly four times an hour, and several open tabs multiply that.
// The point here is to stop abuse, not to interrupt ordinary use.
export const SESSION_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const SESSION_RATE_LIMIT_MAX = 60;
export const SESSION_RATE_LIMIT_MESSAGE = 'Too many requests. Please try again in a few minutes.';

// One message for every reason a session cannot be continued: no cookie, bad
// signature, expired, revoked by logout, superseded by a login elsewhere, or the
// account was deactivated. The client's only useful response is the same in
// every case — send the user to the login page.
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';
export const SESSION_EXPIRED_CODE = 'SESSION_EXPIRED';

// Split from the above so the frontend interceptor in chunk 1.6 can tell
// "try refreshing" apart from "give up and go to login". This leaks nothing:
// whoever holds the token can already read its expiry, since a JWT is only
// base64 and not encrypted.
export const TOKEN_EXPIRED_CODE = 'TOKEN_EXPIRED';
export const UNAUTHENTICATED_CODE = 'UNAUTHENTICATED';
export const UNAUTHENTICATED_MESSAGE = 'You need to be signed in to do that.';

// Returned when a signed-in user's role does not permit the action.
// Deliberately vague: telling a client "admins only" hands out a map of the
// admin surface for free. They cannot act on the detail anyway — a client can
// never become an admin.
export const FORBIDDEN_MESSAGE = 'You do not have access to this.';
export const FORBIDDEN_CODE = 'FORBIDDEN';

// --- Password reset (chunk 1.5) ---

// 30 minutes. Developer's decision, 2026-08-24, choosing 30 over 15.
//
// The token is 256-bit random and single-use, so brute force is not the threat.
// A short window limits how long a LEAKED email stays useful - a shared inbox, a
// borrowed phone, a link sitting in browser history. Against that, real people
// are slow: email can take minutes to arrive, and someone who steps away should
// not come back to a dead link. 30 balances the two.
export const RESET_TOKEN_TTL_MINUTES = 30;
export const RESET_TOKEN_TTL_MS = RESET_TOKEN_TTL_MINUTES * 60 * 1000;

// One reply for every case: address exists, does not exist, or belongs to a
// deactivated account. Anything else turns this endpoint into a tool for
// discovering who has an account here - and on a mental health platform, "this
// person is a patient of ours" is itself sensitive information.
export const FORGOT_PASSWORD_MESSAGE =
  'If that email address has an account, a password reset link is on its way.';

// Deliberately does not distinguish "wrong token" from "expired token" from
// "already used". An attacker guessing tokens learns nothing from the
// difference. The message still tells an honest user exactly what to do next.
export const RESET_TOKEN_INVALID_MESSAGE =
  'This reset link is invalid or has expired. Please request a new one.';
export const RESET_TOKEN_INVALID_CODE = 'RESET_TOKEN_INVALID';

export const PASSWORD_RESET_SUCCESS_MESSAGE =
  'Your password has been changed. You can now sign in with it.';

// Strict on purpose. This endpoint sends real email to an address the caller
// chooses, which makes it a weapon for flooding a stranger's inbox as much as a
// route for guessing anything.
export const FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const FORGOT_PASSWORD_RATE_LIMIT_MAX = 5;
export const FORGOT_PASSWORD_RATE_LIMIT_MESSAGE =
  'Too many reset requests. Please try again in a few minutes.';

export const RESET_PASSWORD_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RESET_PASSWORD_RATE_LIMIT_MAX = 10;
export const RESET_PASSWORD_RATE_LIMIT_MESSAGE =
  'Too many attempts. Please try again in a few minutes.';
