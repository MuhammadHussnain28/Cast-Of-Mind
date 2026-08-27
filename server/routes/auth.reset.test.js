import crypto from 'node:crypto';
import { jest } from '@jest/globals';
import request from 'supertest';

// The email service is replaced BEFORE anything imports it, so no real mail is
// ever sent during `npm test` and the reset link can be read from the captured
// call. jest.unstable_mockModule is the ESM equivalent of jest.mock, and every
// import below it must be dynamic for the mock to take effect.
const sentEmails = [];

jest.unstable_mockModule('../services/email/email.service.js', () => ({
  sendEmail: jest.fn(async () => ({ delivered: true })),
  sendPasswordResetEmail: jest.fn(async (to, resetUrl) => {
    sentEmails.push({ to, resetUrl });
    return { delivered: true };
  }),
}));

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { hashPassword } = await import('../utils/password.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { REFRESH_COOKIE_NAME } = await import('../constants/auth.js');
const {
  loginRateLimiter,
  sessionRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter,
} = await import('./auth.routes.js');
const { startMemoryMongo, stopMemoryMongo } = await import('../test/mongoMemory.js');

const OLD_PASSWORD = 'correct-horse-battery-staple';
const NEW_PASSWORD = 'a-brand-new-password-2026';
const EMAIL = 'client@example.com';
const INACTIVE_EMAIL = 'inactive@example.com';

const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const SAME_REPLY = {
  message: 'If that email address has an account, a password reset link is on its way.',
};
const INVALID_TOKEN_BODY = {
  error: {
    message: 'This reset link is invalid or has expired. Please request a new one.',
    code: 'RESET_TOKEN_INVALID',
  },
};

let userId;

function resetRateLimits() {
  [loginRateLimiter, sessionRateLimiter, forgotPasswordRateLimiter, resetPasswordRateLimiter]
    .forEach((limiter) => LOOPBACK_KEYS.forEach((key) => limiter.resetKey(key)));
}

const forgot = (email) => request(app).post('/api/v1/auth/forgot-password').send({ email });
const reset = (token, password) =>
  request(app).post('/api/v1/auth/reset-password').send({ token, password });
const login = (email, password) =>
  request(app).post('/api/v1/auth/login').send({ email, password });

// The service sends in the background, so the request can return before the
// (mocked) send has run. This waits for it rather than sleeping a fixed time.
async function waitForEmail() {
  for (let i = 0; i < 50; i += 1) {
    if (sentEmails.length > 0) return sentEmails[sentEmails.length - 1];
    await new Promise((resolve) => { setTimeout(resolve, 10); });
  }
  return undefined;
}

function tokenFromUrl(resetUrl) {
  return new URL(resetUrl).searchParams.get('token');
}

async function requestReset(email = EMAIL) {
  sentEmails.length = 0;
  resetRateLimits();
  await forgot(email);
  const mail = await waitForEmail();
  return tokenFromUrl(mail.resetUrl);
}

beforeAll(async () => {
  await startMemoryMongo();
  await User.init();
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(async () => {
  resetRateLimits();
  sentEmails.length = 0;

  await User.deleteMany({});

  const passwordHash = await hashPassword(OLD_PASSWORD);
  const user = await User.create({
    email: EMAIL, passwordHash, role: ROLES.CLIENT, status: USER_STATUS.ACTIVE,
  });
  userId = user._id.toString();

  await User.create({
    email: INACTIVE_EMAIL, passwordHash, role: ROLES.THERAPIST, status: USER_STATUS.INACTIVE,
  });
});

describe('POST /auth/forgot-password — the reply never reveals anything', () => {
  it('returns the same body for an address that exists', async () => {
    const res = await forgot(EMAIL);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(SAME_REPLY);
  });

  it('returns the IDENTICAL body for an address that does not exist', async () => {
    const known = await forgot(EMAIL);
    resetRateLimits();
    const unknown = await forgot('nobody@example.com');

    expect(unknown.status).toBe(known.status);
    expect(unknown.body).toEqual(known.body);
    expect(unknown.body).toEqual(SAME_REPLY);
  });

  it('returns the identical body for a deactivated account', async () => {
    const res = await forgot(INACTIVE_EMAIL);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(SAME_REPLY);
  });

  it('sends no email for an unknown address', async () => {
    await forgot('nobody@example.com');
    await new Promise((resolve) => { setTimeout(resolve, 150); });

    expect(sentEmails).toHaveLength(0);
  });

  it('sends no email for a deactivated account', async () => {
    // They would reset successfully and still be unable to log in — confusing
    // and pointless.
    await forgot(INACTIVE_EMAIL);
    await new Promise((resolve) => { setTimeout(resolve, 150); });

    expect(sentEmails).toHaveLength(0);
  });

  it('returns quickly, without waiting for the email to be sent', async () => {
    // If the send were awaited, a real address would take a few hundred
    // milliseconds and an unknown one would return instantly. An attacker could
    // time the difference to discover which emails have accounts.
    const started = Date.now();
    await forgot(EMAIL);
    expect(Date.now() - started).toBeLessThan(400);
  });
});

describe('the reset token', () => {
  it('is stored HASHED, never raw', async () => {
    const token = await requestReset();

    const stored = await User.findById(userId).select('+resetTokenHash +resetTokenExpiresAt');
    const expected = crypto.createHash('sha256').update(token).digest('hex');

    expect(stored.resetTokenHash).toBe(expected);
    expect(stored.resetTokenHash).not.toBe(token);
    expect(JSON.stringify(stored.toObject())).not.toContain(token);
  });

  it('expires 30 minutes out', async () => {
    await requestReset();

    const stored = await User.findById(userId).select('+resetTokenExpiresAt');
    const minutes = (stored.resetTokenExpiresAt - Date.now()) / 60000;

    expect(minutes).toBeGreaterThan(29);
    expect(minutes).toBeLessThan(31);
  });

  it('is a fresh value each time, and asking again kills the previous link', async () => {
    const first = await requestReset();
    const second = await requestReset();

    expect(second).not.toBe(first);

    // The first email's link no longer works.
    const res = await reset(first, NEW_PASSWORD);
    expect(res.status).toBe(400);
    expect(res.body).toEqual(INVALID_TOKEN_BODY);
  });

  it('goes out in a link pointing at the reset page', async () => {
    await requestReset();
    const mail = sentEmails[0];

    expect(mail.to).toBe(EMAIL);
    expect(mail.resetUrl).toContain('/reset-password?token=');
    expect(tokenFromUrl(mail.resetUrl)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('POST /auth/reset-password — the happy path', () => {
  it('changes the password', async () => {
    const token = await requestReset();

    const res = await reset(token, NEW_PASSWORD);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/password has been changed/i);
  });

  it('the OLD password stops working', async () => {
    const token = await requestReset();
    await reset(token, NEW_PASSWORD);

    resetRateLimits();
    const res = await login(EMAIL, OLD_PASSWORD);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('the NEW password works', async () => {
    const token = await requestReset();
    await reset(token, NEW_PASSWORD);

    resetRateLimits();
    const res = await login(EMAIL, NEW_PASSWORD);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(EMAIL);
  });

  it('stores the new password hashed, never in readable form', async () => {
    const token = await requestReset();
    await reset(token, NEW_PASSWORD);

    const stored = await User.findById(userId).select('+passwordHash');

    expect(stored.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(stored.passwordHash).not.toContain(NEW_PASSWORD);
  });

  it('leaves the email and role untouched', async () => {
    const token = await requestReset();
    await reset(token, NEW_PASSWORD);

    const stored = await User.findById(userId);

    expect(stored.email).toBe(EMAIL);
    expect(stored.role).toBe(ROLES.CLIENT);
    expect(stored.status).toBe(USER_STATUS.ACTIVE);
  });
});

describe('the token is SINGLE-USE', () => {
  it('cannot be used a second time', async () => {
    const token = await requestReset();

    const first = await reset(token, NEW_PASSWORD);
    expect(first.status).toBe(200);

    const second = await reset(token, 'yet-another-password-99');
    expect(second.status).toBe(400);
    expect(second.body).toEqual(INVALID_TOKEN_BODY);
  });

  it('clears the stored token on success', async () => {
    const token = await requestReset();
    await reset(token, NEW_PASSWORD);

    const stored = await User.findById(userId).select('+resetTokenHash +resetTokenExpiresAt');

    expect(stored.resetTokenHash).toBeNull();
    expect(stored.resetTokenExpiresAt).toBeNull();
  });

  it('a second attempt does not change the password again', async () => {
    const token = await requestReset();
    await reset(token, NEW_PASSWORD);
    await reset(token, 'yet-another-password-99');

    resetRateLimits();
    expect((await login(EMAIL, NEW_PASSWORD)).status).toBe(200);
    resetRateLimits();
    expect((await login(EMAIL, 'yet-another-password-99')).status).toBe(401);
  });
});

describe('a reset ends every signed-in session', () => {
  it('clears the refresh token, so an attacker signed in as this user is thrown out', async () => {
    resetRateLimits();
    const session = await login(EMAIL, OLD_PASSWORD);
    const cookie = (session.headers['set-cookie'] || [])[0];
    const refreshToken = cookie.split(';')[0].split('=').slice(1).join('=');

    const before = await User.findById(userId).select('+refreshTokenHash');
    expect(before.refreshTokenHash).not.toBeNull();

    const token = await requestReset();
    await reset(token, NEW_PASSWORD);

    const after = await User.findById(userId).select('+refreshTokenHash +refreshTokenExpiresAt');
    expect(after.refreshTokenHash).toBeNull();
    expect(after.refreshTokenExpiresAt).toBeNull();

    // The live session really is dead.
    resetRateLimits();
    const refreshAttempt = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=${refreshToken}`);

    expect(refreshAttempt.status).toBe(401);
  });
});

describe('bad tokens are refused, and all look the same', () => {
  it('rejects an expired token', async () => {
    const token = await requestReset();

    await User.updateOne(
      { _id: userId },
      { $set: { resetTokenExpiresAt: new Date(Date.now() - 1000) } },
    );

    const res = await reset(token, NEW_PASSWORD);

    expect(res.status).toBe(400);
    expect(res.body).toEqual(INVALID_TOKEN_BODY);
  });

  it('an expired token leaves the old password working', async () => {
    const token = await requestReset();
    await User.updateOne(
      { _id: userId },
      { $set: { resetTokenExpiresAt: new Date(Date.now() - 1000) } },
    );
    await reset(token, NEW_PASSWORD);

    resetRateLimits();
    expect((await login(EMAIL, OLD_PASSWORD)).status).toBe(200);
  });

  it('rejects a token that was never issued', async () => {
    const res = await reset('a'.repeat(64), NEW_PASSWORD);

    expect(res.status).toBe(400);
    expect(res.body).toEqual(INVALID_TOKEN_BODY);
  });

  it('rejects one user\'s token being used against another account', async () => {
    // The token identifies the account on its own — there is no user id in the
    // request to tamper with. This proves the lookup is by token, not by input.
    const otherHash = await hashPassword(OLD_PASSWORD);
    await User.create({
      email: 'other@example.com', passwordHash: otherHash, role: ROLES.CLIENT,
    });

    const token = await requestReset();
    await reset(token, NEW_PASSWORD);

    const other = await User.findOne({ email: 'other@example.com' }).select('+passwordHash');
    expect(other.passwordHash).toBe(otherHash);
  });

  it('rejects a malformed token before touching the database', async () => {
    for (const bad of ['nope', '', 'ZZZZ', 'a'.repeat(63), 'a'.repeat(65)]) {
      const res = await reset(bad, NEW_PASSWORD);
      expect(res.status).toBe(422);
    }
  });

  it('rejects a token belonging to an account deactivated after the request', async () => {
    const token = await requestReset();
    await User.updateOne({ _id: userId }, { $set: { status: USER_STATUS.INACTIVE } });

    const res = await reset(token, NEW_PASSWORD);

    expect(res.status).toBe(400);
    expect(res.body).toEqual(INVALID_TOKEN_BODY);
  });
});

describe('the new password must satisfy the rule', () => {
  it('rejects anything under 8 characters', async () => {
    const token = await requestReset();
    const res = await reset(token, '1234567');

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('accepts exactly 8 characters', async () => {
    const token = await requestReset();
    const res = await reset(token, '12345678');

    expect(res.status).toBe(200);
  });

  it('rejects a password over 72 bytes, which bcrypt would silently truncate', async () => {
    const token = await requestReset();
    const res = await reset(token, 'a'.repeat(73));

    expect(res.status).toBe(422);
  });

  it('counts BYTES not characters, so multi-byte input cannot slip past', async () => {
    const token = await requestReset();
    // 25 emoji at 4 bytes each = 100 bytes, but only 25 characters.
    const res = await reset(token, '😀'.repeat(25));

    expect(res.status).toBe(422);
  });

  it('refuses to re-use the current password', async () => {
    const token = await requestReset();
    const res = await reset(token, OLD_PASSWORD);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PASSWORD_UNCHANGED');
  });
});

describe('rate limiting', () => {
  it('blocks a flood of reset requests after 5 tries', async () => {
    // This endpoint sends real mail to an address the caller picks, so it is a
    // tool for flooding a stranger's inbox.
    for (let i = 0; i < 5; i += 1) {
      expect((await forgot(EMAIL)).status).toBe(200);
    }

    const blocked = await forgot(EMAIL);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  }, 30000);

  it('blocks repeated reset-password attempts after 10', async () => {
    for (let i = 0; i < 10; i += 1) {
      await reset('a'.repeat(64), NEW_PASSWORD);
    }

    const blocked = await reset('a'.repeat(64), NEW_PASSWORD);
    expect(blocked.status).toBe(429);
  }, 30000);
});

describe('the flow works for every role, admin included', () => {
  it.each([ROLES.CLIENT, ROLES.THERAPIST, ROLES.ADMIN])('resets a %s password', async (role) => {
    const email = `${role}-reset@example.com`;
    await User.create({
      email, passwordHash: await hashPassword(OLD_PASSWORD), role,
    });

    sentEmails.length = 0;
    resetRateLimits();
    await forgot(email);
    const mail = await waitForEmail();
    const token = tokenFromUrl(mail.resetUrl);

    expect((await reset(token, NEW_PASSWORD)).status).toBe(200);

    resetRateLimits();
    expect((await login(email, NEW_PASSWORD)).status).toBe(200);
  });
});
