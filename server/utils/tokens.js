import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL_SECONDS } from '../constants/auth.js';

// Token creation, verification, and hashing — master spec §11.
//
// PRIVACY RULE: never log a token. An access token is a working credential for
// 15 minutes; a refresh token is one for up to 7 days.

/**
 * Access token. Carried on every API request, held in browser memory only.
 *
 * The role is embedded so the guards in chunk 1.4 can check permissions without
 * a database round trip on every request. The trade-off, recorded deliberately:
 * if an account is deactivated or its role changed, the old token still says the
 * old thing until it expires — at most 15 minutes. The refresh endpoint re-reads
 * the database, so the cut-off lands there.
 *
 * Nothing else goes in here. No email, no name. A JWT is only base64, not
 * encrypted, so anyone holding it can read the payload.
 */
export function signAccessToken({ userId, role }) {
  return jwt.sign({ role }, env.jwtAccessSecret, {
    subject: String(userId),
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

/**
 * Refresh token. Sent to the browser as an httpOnly cookie and stored hashed in
 * the database so it can be revoked.
 *
 * `expiresInSeconds` exists because the 7-day window is ABSOLUTE, measured from
 * login. On rotation the caller passes the time that REMAINS, not a fresh 7
 * days — otherwise an active user would never have to log in again and the
 * limit in master spec §11 step 6 would mean nothing.
 *
 * `jwtid` gives every token a unique random id. Without it, two tokens issued
 * for the same user in the same second would be byte-identical — same payload,
 * same issued-at second — and rotation would hand back the token it just
 * replaced, silently doing nothing.
 */
export function signRefreshToken({ userId, expiresInSeconds = REFRESH_TOKEN_TTL_SECONDS }) {
  return jwt.sign({}, env.jwtRefreshSecret, {
    subject: String(userId),
    expiresIn: expiresInSeconds,
    jwtid: crypto.randomUUID(),
  });
}

/**
 * Verify an access token. Throws on a bad signature or expiry — callers decide
 * how to respond.
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

/**
 * Verify a refresh token.
 *
 * Signed with a DIFFERENT secret from the access token, which is what stops a
 * 7-day refresh token being presented as a 15-minute access token. `config/env.js`
 * refuses to start if the two secrets match.
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

/**
 * Hash a refresh token for storage.
 *
 * SHA-256, NOT bcrypt — and this is deliberate, not a shortcut.
 *
 * bcrypt silently truncates its input at 72 bytes. A refresh token is a JWT of
 * roughly 200+ characters, and every JWT we issue shares the same header and a
 * near-identical payload prefix. Two different tokens could therefore match on
 * their first 72 bytes, and bcrypt would treat them as the same token. That is a
 * real authentication hole, not a theoretical one.
 *
 * bcrypt's slowness exists to defend low-entropy human passwords against
 * brute force. A refresh token is long and random, so there is nothing to guess.
 * A fast cryptographic hash is the correct tool: it still means a database
 * leak hands out no usable tokens.
 */
export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Compare two token hashes without leaking, through response time, how many
 * leading characters happened to match.
 *
 * `timingSafeEqual` throws if the two buffers differ in length, so the length is
 * checked first. Both values are 64-character SHA-256 hex strings in normal
 * operation; a mismatch in length means the stored value is missing or corrupt,
 * which is simply "does not match".
 */
export function refreshTokenHashMatches(presentedHash, storedHash) {
  if (typeof presentedHash !== 'string' || typeof storedHash !== 'string') {
    return false;
  }

  const a = Buffer.from(presentedHash, 'utf8');
  const b = Buffer.from(storedHash, 'utf8');

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

/**
 * A fresh password-reset token.
 *
 * Random bytes, NOT a JWT. There is nothing to sign here: the database record is
 * the authority, and being able to DELETE that record is exactly what makes the
 * token single-use. A self-contained JWT would stay valid until its own expiry
 * no matter what the database said.
 *
 * 32 bytes is 256 bits of entropy — not guessable, at any rate, ever.
 *
 * Returned raw. Only the caller ever sees this value; the database stores the
 * hash. It must never be logged: for the next 30 minutes it IS the account.
 */
export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a reset token for storage. SHA-256, for the same reason as the refresh
 * token: the input is long and random, so there is nothing for bcrypt's
 * slowness to protect against.
 */
export function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Constant-time comparison of two reset-token hashes.
 */
export function resetTokenHashMatches(presentedHash, storedHash) {
  return refreshTokenHashMatches(presentedHash, storedHash);
}
