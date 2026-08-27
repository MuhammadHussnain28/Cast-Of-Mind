import crypto from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import env from '../config/env.js';
import { User } from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from '../constants/auth.js';
import { loginRateLimiter } from './auth.routes.js';
import { startMemoryMongo, stopMemoryMongo } from '../test/mongoMemory.js';

const PASSWORD = 'correct-horse-battery-staple';
const WRONG_PASSWORD = 'wrong-password-here';
const CLIENT_EMAIL = 'client@example.com';
const INACTIVE_EMAIL = 'inactive@example.com';

// Every supertest request comes from the same loopback address, so without a
// reset the first test would spend the whole allowance for the rest of the file.
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];

function resetRateLimit() {
  LOOPBACK_KEYS.forEach((key) => loginRateLimiter.resetKey(key));
}

function loginWith(body) {
  return request(app).post('/api/v1/auth/login').send(body);
}

function getRefreshCookie(res) {
  const cookies = res.headers['set-cookie'] || [];
  return cookies.find((c) => c.startsWith(`${REFRESH_COOKIE_NAME}=`));
}

function cookieValue(cookieString) {
  return cookieString.split(';')[0].split('=').slice(1).join('=');
}

beforeAll(async () => {
  await startMemoryMongo();
  await User.init();

  const passwordHash = await hashPassword(PASSWORD);

  await User.create({
    email: CLIENT_EMAIL,
    passwordHash,
    role: ROLES.CLIENT,
    status: USER_STATUS.ACTIVE,
  });

  await User.create({
    email: INACTIVE_EMAIL,
    passwordHash,
    role: ROLES.THERAPIST,
    status: USER_STATUS.INACTIVE,
  });
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(() => {
  resetRateLimit();
});

describe('POST /api/v1/auth/login — success', () => {
  it('returns an access token and the role the frontend needs to redirect', async () => {
    const res = await loginWith({ email: CLIENT_EMAIL, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.body.user).toEqual({
      id: expect.any(String),
      email: CLIENT_EMAIL,
      role: ROLES.CLIENT,
    });
  });

  it('signs an access token carrying the user id and role, expiring in 15 minutes', async () => {
    const res = await loginWith({ email: CLIENT_EMAIL, password: PASSWORD });
    const payload = jwt.verify(res.body.accessToken, env.jwtAccessSecret);

    expect(payload.sub).toBe(res.body.user.id);
    expect(payload.role).toBe(ROLES.CLIENT);
    expect(payload.exp - payload.iat).toBe(15 * 60);
    // A JWT is readable by anyone holding it, so it must carry no personal data.
    expect(payload.email).toBeUndefined();
  });

  it('accepts a differently-cased and padded email', async () => {
    const res = await loginWith({ email: '  Client@EXAMPLE.com  ', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(CLIENT_EMAIL);
  });

  it('never puts the refresh token in the response body', async () => {
    const res = await loginWith({ email: CLIENT_EMAIL, password: PASSWORD });
    const refreshToken = cookieValue(getRefreshCookie(res));

    expect(JSON.stringify(res.body)).not.toContain(refreshToken);
    expect(res.body.refreshToken).toBeUndefined();
  });

  it('never leaks a password or any hash in the response', async () => {
    const res = await loginWith({ email: CLIENT_EMAIL, password: PASSWORD });
    const body = JSON.stringify(res.body);

    expect(body).not.toContain(PASSWORD);
    expect(body).not.toContain('$2b$');
    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain('refreshTokenHash');
  });
});

describe('the refresh token cookie', () => {
  it('is httpOnly, scoped to the auth path, and lasts 7 days', async () => {
    const res = await loginWith({ email: CLIENT_EMAIL, password: PASSWORD });
    const cookie = getRefreshCookie(res);

    expect(cookie).toBeDefined();
    // httpOnly is what stops JavaScript — and therefore an XSS payload — reading it.
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(new RegExp(`Path=${REFRESH_COOKIE_PATH}`, 'i'));
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Max-Age=604800/i);
  });

  it('is not marked Secure in development, or the cookie would never be set over http', async () => {
    const res = await loginWith({ email: CLIENT_EMAIL, password: PASSWORD });

    expect(env.isProduction).toBe(false);
    expect(getRefreshCookie(res)).not.toMatch(/Secure/i);
  });
});

describe('what the database stores', () => {
  it('stores the refresh token HASHED, never raw', async () => {
    const res = await loginWith({ email: CLIENT_EMAIL, password: PASSWORD });
    const refreshToken = cookieValue(getRefreshCookie(res));

    const stored = await User.findOne({ email: CLIENT_EMAIL })
      .select('+refreshTokenHash +refreshTokenExpiresAt');

    const expected = crypto.createHash('sha256').update(refreshToken).digest('hex');

    expect(stored.refreshTokenHash).toBe(expected);
    // The raw token must not appear anywhere on the record.
    expect(stored.refreshTokenHash).not.toBe(refreshToken);
    expect(JSON.stringify(stored.toObject())).not.toContain(refreshToken);
  });

  it('records an expiry roughly 7 days out', async () => {
    await loginWith({ email: CLIENT_EMAIL, password: PASSWORD });

    const stored = await User.findOne({ email: CLIENT_EMAIL }).select('+refreshTokenExpiresAt');
    const days = (stored.refreshTokenExpiresAt - Date.now()) / (24 * 60 * 60 * 1000);

    expect(days).toBeGreaterThan(6.9);
    expect(days).toBeLessThan(7.1);
  });

  it('replaces the previous refresh hash on a new login (one session per user)', async () => {
    // Confirmed design, decision #4: logging in on a new device silently ends
    // the session on the old one.
    const first = await loginWith({ email: CLIENT_EMAIL, password: PASSWORD });
    const afterFirst = await User.findOne({ email: CLIENT_EMAIL }).select('+refreshTokenHash');

    resetRateLimit();
    const second = await loginWith({ email: CLIENT_EMAIL, password: PASSWORD });
    const afterSecond = await User.findOne({ email: CLIENT_EMAIL }).select('+refreshTokenHash');

    expect(cookieValue(getRefreshCookie(first))).not.toBe(cookieValue(getRefreshCookie(second)));
    expect(afterSecond.refreshTokenHash).not.toBe(afterFirst.refreshTokenHash);
  });
});

describe('failed logins are indistinguishable', () => {
  const expectedBody = {
    error: { message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' },
  };

  it('rejects a wrong password', async () => {
    const res = await loginWith({ email: CLIENT_EMAIL, password: WRONG_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(expectedBody);
  });

  it('rejects an unknown email with the EXACT same reply', async () => {
    const unknown = await loginWith({ email: 'nobody@example.com', password: PASSWORD });
    const wrongPassword = await loginWith({ email: CLIENT_EMAIL, password: WRONG_PASSWORD });

    expect(unknown.status).toBe(wrongPassword.status);
    expect(unknown.body).toEqual(wrongPassword.body);
    expect(unknown.body).toEqual(expectedBody);
  });

  it('rejects a deactivated account with the same reply, revealing nothing', async () => {
    const res = await loginWith({ email: INACTIVE_EMAIL, password: PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(expectedBody);
    // The words "inactive" or "disabled" must never appear — they would confirm
    // that this email has an account on a mental health platform.
    expect(JSON.stringify(res.body).toLowerCase()).not.toMatch(/inactive|disabled|deactivat/);
  });

  it('sets no cookie and issues no token on failure', async () => {
    const res = await loginWith({ email: CLIENT_EMAIL, password: WRONG_PASSWORD });

    expect(getRefreshCookie(res)).toBeUndefined();
    expect(res.body.accessToken).toBeUndefined();
  });

  it('does not touch the stored refresh token on a failed attempt', async () => {
    await loginWith({ email: CLIENT_EMAIL, password: PASSWORD });
    const before = await User.findOne({ email: CLIENT_EMAIL }).select('+refreshTokenHash');

    resetRateLimit();
    await loginWith({ email: CLIENT_EMAIL, password: WRONG_PASSWORD });
    const after = await User.findOne({ email: CLIENT_EMAIL }).select('+refreshTokenHash');

    expect(after.refreshTokenHash).toBe(before.refreshTokenHash);
  });

  it('takes a similar amount of time whether or not the email exists', async () => {
    // Proves the dummy-hash comparison is really running. Without it, the
    // unknown-email path would skip bcrypt entirely and return in a few
    // milliseconds, letting an attacker discover which emails are registered.
    const timeOf = async (body) => {
      const started = Date.now();
      await loginWith(body);
      return Date.now() - started;
    };

    const unknown = await timeOf({ email: 'nobody@example.com', password: PASSWORD });
    resetRateLimit();
    const wrongPassword = await timeOf({ email: CLIENT_EMAIL, password: WRONG_PASSWORD });

    // Both must pay the bcrypt cost. A skipped comparison would land near 0ms.
    expect(unknown).toBeGreaterThan(50);
    expect(wrongPassword).toBeGreaterThan(50);
  });
});

describe('input validation', () => {
  it('rejects a malformed email before any database work', async () => {
    const res = await loginWith({ email: 'not-an-email', password: PASSWORD });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a missing password', async () => {
    const res = await loginWith({ email: CLIENT_EMAIL });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a non-string password instead of crashing', async () => {
    const res = await loginWith({ email: CLIENT_EMAIL, password: { $ne: null } });

    expect(res.status).toBe(422);
  });

  it('rejects a NoSQL injection attempt in the email field', async () => {
    const res = await loginWith({ email: { $ne: null }, password: PASSWORD });

    expect(res.status).toBe(422);
    expect(res.body.accessToken).toBeUndefined();
  });
});

describe('rate limiting', () => {
  it('blocks further attempts after 10 tries from the same address', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const res = await loginWith({ email: CLIENT_EMAIL, password: WRONG_PASSWORD });
      expect(res.status).toBe(401);
    }

    const blocked = await loginWith({ email: CLIENT_EMAIL, password: WRONG_PASSWORD });

    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  }, 30000);

  it('blocks a correct password too once the limit is hit', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await loginWith({ email: CLIENT_EMAIL, password: WRONG_PASSWORD });
    }

    const blocked = await loginWith({ email: CLIENT_EMAIL, password: PASSWORD });

    expect(blocked.status).toBe(429);
  }, 30000);
});
