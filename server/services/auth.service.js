import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

import {
  signAccessToken,
  signRefreshToken,
  hashRefreshToken,
  verifyRefreshToken,
  refreshTokenHashMatches,
  generateResetToken,
  hashResetToken,
  resetTokenHashMatches,
} from '../utils/tokens.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { sendPasswordResetEmail } from './email/email.service.js';
import env from '../config/env.js';
import { USER_STATUS } from '../constants/roles.js';
import {
  INVALID_CREDENTIALS_MESSAGE,
  INVALID_CREDENTIALS_CODE,
  REFRESH_TOKEN_TTL_MS,
  SESSION_EXPIRED_MESSAGE,
  SESSION_EXPIRED_CODE,
  RESET_TOKEN_TTL_MS,
  RESET_TOKEN_INVALID_MESSAGE,
  RESET_TOKEN_INVALID_CODE,
} from '../constants/auth.js';

// A real bcrypt hash of a random string nobody knows. Used ONLY to burn the same
// amount of CPU when the email does not exist.
//
// Without it, a login for an unknown email returns in about 1ms while a wrong
// password takes about 250ms, because only the second one runs bcrypt. That gap
// is easy to measure from outside, and it turns the login form into a tool for
// discovering which email addresses have accounts here. The project rules
// require the same message AND the same timing for both cases.
//
// This value is not a secret and does not need to be. Its only job is to cost
// the same as a real comparison.
const TIMING_DUMMY_HASH = '$2b$12$JOKd8AB9C3h4yJVOTT31/Og4QPwpK4rNRP3D2GPbYUzXqMAxoLkCq';

function invalidCredentials() {
  return new AppError(INVALID_CREDENTIALS_MESSAGE, 401, INVALID_CREDENTIALS_CODE);
}

// One error for every reason a session cannot continue: no cookie, bad
// signature, expired, revoked by logout, replaced by a login somewhere else, or
// the account was deactivated. Separate messages would tell an attacker holding
// a stolen token exactly which wall they hit, and the client's response is the
// same in every case anyway — send the user to the login page.
function sessionExpired() {
  return new AppError(SESSION_EXPIRED_MESSAGE, 401, SESSION_EXPIRED_CODE);
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };
}

/**
 * Log a user in.
 *
 * Every failure path throws the identical error: unknown email, wrong password,
 * and deactivated account are indistinguishable from outside.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
 */
export async function login({ email, password }) {
  // passwordHash is select:false on the model, so it must be asked for by name.
  const user = await User.findOne({ email }).select('+passwordHash');

  // Always run exactly one bcrypt comparison, whether or not the user exists.
  const hashToCheck = user ? user.passwordHash : TIMING_DUMMY_HASH;
  const passwordMatches = await comparePassword(password, hashToCheck);

  // One combined check, one error. Deliberately not three separate branches:
  // separate branches invite someone to later "improve" one of them with a more
  // helpful message, which is exactly the leak this prevents.
  if (!user || !passwordMatches || user.status !== USER_STATUS.ACTIVE) {
    throw invalidCredentials();
  }

  const accessToken = signAccessToken({ userId: user._id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id });

  // Only the HASH of the refresh token is stored, so a database leak hands out
  // no usable sessions. Writing it also REPLACES any previous value: one active
  // session per user, confirmed by Asad. Logging in on a new device silently
  // ends the session on the old one.
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        refreshTokenHash: hashRefreshToken(refreshToken),
        refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    },
  );

  return {
    accessToken,
    refreshToken,
    // Only what the frontend needs to route the user to the right portal.
    user: publicUser(user),
  };
}

/**
 * Exchange a refresh token for a new access token, and rotate the refresh token.
 *
 * WHY ROTATION MATTERS. Without it, a stolen refresh token keeps working
 * silently for the whole 7 days and nobody ever finds out. With it, the old
 * token dies the instant it is used — so if a thief uses yours, YOUR next
 * refresh fails and you get logged out. That is irritating, but it is a visible
 * symptom instead of silence. And when you log back in, your new token
 * overwrites theirs, which locks them out.
 *
 * NOT IMPLEMENTED, deliberately: reuse detection. A correctly signed token whose
 * hash does not match the stored one is evidence of theft, and the strong answer
 * is to kill the session outright. That is not done here because two browser
 * tabs would trigger it by accident — each refreshes independently, so the
 * second one presents the token the first just replaced and an honest user gets
 * thrown out. Doing it safely needs a grace window or an extra field, and the
 * `users` schema is fixed by master spec §10.1. Revisit at chunk 12.3.
 *
 * @param {string|undefined} rawToken The value of the refresh cookie.
 */
export async function refresh(rawToken) {
  if (!rawToken) {
    throw sessionExpired();
  }

  // Signature and expiry first — a forged or stale token never reaches the
  // database.
  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw sessionExpired();
  }

  const user = await User.findById(payload.sub)
    .select('+refreshTokenHash +refreshTokenExpiresAt');

  // Re-read from the database on every refresh. This is where a deactivated
  // account actually loses access: their existing access token keeps working for
  // up to 15 more minutes, and then this check cuts them off.
  if (!user || user.status !== USER_STATUS.ACTIVE) {
    throw sessionExpired();
  }

  // Cleared by logout, or never set. Either way there is no session to continue.
  if (!user.refreshTokenHash || !user.refreshTokenExpiresAt) {
    throw sessionExpired();
  }

  // The stored hash is what makes revocation possible at all. A token can be
  // perfectly valid as a JWT and still be dead here — logged out, or replaced by
  // a login on another device.
  if (!refreshTokenHashMatches(hashRefreshToken(rawToken), user.refreshTokenHash)) {
    throw sessionExpired();
  }

  // The absolute 7-day limit, enforced independently of the JWT's own expiry.
  const remainingMs = user.refreshTokenExpiresAt.getTime() - Date.now();
  if (remainingMs <= 0) {
    throw sessionExpired();
  }

  // The new token gets only the time that REMAINS. Handing out a fresh 7 days
  // here would make the window slide, and an active user would never have to log
  // in again — master spec §11 step 6 says they must, once a week.
  const newRefreshToken = signRefreshToken({
    userId: user._id,
    expiresInSeconds: Math.floor(remainingMs / 1000),
  });

  // Only the hash moves. `refreshTokenExpiresAt` is deliberately NOT touched —
  // that is the whole mechanism keeping the window absolute rather than sliding.
  await User.updateOne(
    { _id: user._id },
    { $set: { refreshTokenHash: hashRefreshToken(newRefreshToken) } },
  );

  return {
    accessToken: signAccessToken({ userId: user._id, role: user.role }),
    refreshToken: newRefreshToken,
    refreshTokenMaxAgeMs: remainingMs,
    user: publicUser(user),
  };
}

/**
 * End the session. Always succeeds — logout is not a place to tell someone
 * whether they had a session in the first place.
 *
 * @param {string|undefined} rawToken The value of the refresh cookie.
 */
export async function logout(rawToken) {
  if (!rawToken) {
    return;
  }

  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    // Junk or expired token: nothing to revoke. The caller still clears the cookie.
    return;
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) {
    return;
  }

  // Only clear the session this token actually belongs to.
  //
  // Consider: someone signs in on their laptop, then on their phone — the phone
  // login overwrote the stored hash. If the laptop then logs out and we cleared
  // by user id alone, it would silently kill the PHONE's live session. Matching
  // the hash first means a stale token can log itself out and nothing else.
  if (!refreshTokenHashMatches(hashRefreshToken(rawToken), user.refreshTokenHash)) {
    return;
  }

  await User.updateOne(
    { _id: user._id },
    { $set: { refreshTokenHash: null, refreshTokenExpiresAt: null } },
  );
}

/**
 * The signed-in user's own basic details, read fresh from the database.
 *
 * Not served from the access token's payload: the token holds only an id and a
 * role, and it can be up to 15 minutes out of date. A deactivated account is
 * caught here.
 */
export async function getMe(userId) {
  const user = await User.findById(userId);

  if (!user || user.status !== USER_STATUS.ACTIVE) {
    throw sessionExpired();
  }

  return {
    ...publicUser(user),
    createdAt: user.createdAt,
  };
}

/**
 * Clear refresh tokens that have passed their expiry.
 *
 * This is housekeeping, not a security control — an expired token is already
 * refused twice over, by the JWT check and by the `refreshTokenExpiresAt` check
 * in `refresh()`. It just stops dead hashes sitting in the database forever.
 *
 * DO NOT REPLACE THIS WITH A MONGODB TTL INDEX. It is the obvious-looking
 * answer and it would be a catastrophe here: the refresh token lives ON the
 * `users` record, so a TTL index on `refreshTokenExpiresAt` would delete THE
 * ENTIRE USER ACCOUNT when the token expired. Every client and therapist,
 * silently gone. This function only ever clears two fields.
 *
 * @returns {Promise<number>} How many users were cleaned.
 */
export async function cleanupExpiredRefreshTokens() {
  const result = await User.updateMany(
    { refreshTokenExpiresAt: { $ne: null, $lt: new Date() } },
    { $set: { refreshTokenHash: null, refreshTokenExpiresAt: null } },
  );

  return result.modifiedCount;
}

/**
 * Start a password reset.
 *
 * ALWAYS resolves, whatever happens. The caller returns the identical message
 * every time — address exists, does not exist, or belongs to a deactivated
 * account. Anything else turns this endpoint into a tool for discovering who has
 * an account here, and on a mental health platform "this person is a patient of
 * ours" is itself sensitive.
 *
 * The email is sent WITHOUT the caller waiting on it (see the note below).
 *
 * @param {string} email
 */
export async function forgotPassword(email) {
  const user = await User.findOne({ email });

  // No account, or a deactivated one. Nothing happens and nothing is said.
  //
  // Deactivated accounts get no email on purpose: they would reset the password
  // successfully and still be unable to log in, which is confusing and useless.
  if (!user || user.status !== USER_STATUS.ACTIVE) {
    return;
  }

  const token = generateResetToken();

  // Only the hash is stored, so a database leak hands out no usable links.
  // Writing it also REPLACES any earlier request: asking twice invalidates the
  // first email, which is what people expect when they click "resend".
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        resetTokenHash: hashResetToken(token),
        resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    },
  );

  const resetUrl = `${env.clientOrigin}/reset-password?token=${token}`;

  // FIRE AND FORGET — deliberately not awaited.
  //
  // Two reasons, and the second is the important one:
  //
  // 1. Talking to Resend takes a few hundred milliseconds. The user does not
  //    need to wait for it, and neither does the HTTP response.
  //
  // 2. TIMING. If this were awaited, a request for a real address would take
  //    ~300ms and one for an unknown address would return instantly. That gap is
  //    measurable from outside, and it would undo the whole point of returning
  //    an identical message — an attacker could simply time the responses to
  //    learn which emails have accounts. This is the same leak that was closed
  //    on the login endpoint in chunk 1.2.
  //
  // A failure is logged and never surfaced: there is nothing useful to tell the
  // caller, and saying "we could not send that" would itself confirm the address
  // exists. The recipient and subject are logged; the URL never is, because for
  // the next 30 minutes it IS the account.
  sendPasswordResetEmail(user.email, resetUrl).catch((err) => {
    console.error(`Password reset email failed for ${user.email}: ${err.message}`);
  });
}

/**
 * Finish a password reset.
 *
 * @param {string} token       The raw token from the emailed link.
 * @param {string} newPassword Already length-checked by the Zod schema.
 */
export async function resetPassword(token, newPassword) {
  const user = await User.findOne({ resetTokenHash: hashResetToken(token) })
    .select('+resetTokenHash +resetTokenExpiresAt +passwordHash');

  if (!user) {
    throw new AppError(RESET_TOKEN_INVALID_MESSAGE, 400, RESET_TOKEN_INVALID_CODE);
  }

  // Belt and braces. The lookup above already matched on the hash; this repeats
  // the comparison in constant time so the code does not depend on how MongoDB
  // happens to compare strings internally.
  if (!resetTokenHashMatches(hashResetToken(token), user.resetTokenHash)) {
    throw new AppError(RESET_TOKEN_INVALID_MESSAGE, 400, RESET_TOKEN_INVALID_CODE);
  }

  if (!user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() <= Date.now()) {
    throw new AppError(RESET_TOKEN_INVALID_MESSAGE, 400, RESET_TOKEN_INVALID_CODE);
  }

  // A deactivated account cannot be reset back into use through this route.
  // Same generic error — a reset link should not become a way to probe status.
  if (user.status !== USER_STATUS.ACTIVE) {
    throw new AppError(RESET_TOKEN_INVALID_MESSAGE, 400, RESET_TOKEN_INVALID_CODE);
  }

  // Re-using the current password would leave the account exactly as exposed as
  // whatever prompted the reset.
  if (await comparePassword(newPassword, user.passwordHash)) {
    throw new AppError(
      'Please choose a password you have not used before.',
      400,
      'PASSWORD_UNCHANGED',
    );
  }

  // One write does three things, so no half-finished state can exist:
  //
  //   1. the new password takes effect
  //   2. the reset token is destroyed — this is what makes it SINGLE-USE
  //   3. the refresh token is cleared, ending every signed-in session
  //
  // Point 3 is the one that matters after a suspected compromise. If someone
  // else was signed in as this user, the reset throws them out. "All refresh
  // tokens" is two fields here, because the design allows only one session per
  // user (master spec §10.1).
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordHash: await hashPassword(newPassword),
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    },
  );
}
