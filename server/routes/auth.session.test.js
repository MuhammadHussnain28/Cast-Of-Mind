import crypto from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import env from '../config/env.js';
import { User } from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from '../constants/auth.js';
import { cleanupExpiredRefreshTokens } from '../services/auth.service.js';
import { loginRateLimiter, sessionRateLimiter } from './auth.routes.js';
import { startMemoryMongo, stopMemoryMongo } from '../test/mongoMemory.js';

const PASSWORD = 'correct-horse-battery-staple';
const EMAIL = 'client@example.com';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];

function resetRateLimits() {
  LOOPBACK_KEYS.forEach((key) => {
    loginRateLimiter.resetKey(key);
    sessionRateLimiter.resetKey(key);
  });
}

function getRefreshCookie(res) {
  const cookies = res.headers['set-cookie'] || [];
  return cookies.find((c) => c.startsWith(`${REFRESH_COOKIE_NAME}=`));
}

function cookieValue(res) {
  const cookie = getRefreshCookie(res);
  return cookie ? cookie.split(';')[0].split('=').slice(1).join('=') : undefined;
}

// The cookie is sent back by hand rather than with supertest's agent, so each
// test states exactly which token it is presenting.
function asCookie(token) {
  return `${REFRESH_COOKIE_NAME}=${token}`;
}

function doLogin() {
  return request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD });
}

function doRefresh(token) {
  const req = request(app).post('/api/v1/auth/refresh');
  return token === undefined ? req : req.set('Cookie', asCookie(token));
}

function doLogout(token) {
  const req = request(app).post('/api/v1/auth/logout');
  return token === undefined ? req : req.set('Cookie', asCookie(token));
}

function doMe(accessToken) {
  const req = request(app).get('/api/v1/auth/me');
  return accessToken === undefined ? req : req.set('Authorization', `Bearer ${accessToken}`);
}

let userId;

beforeAll(async () => {
  await startMemoryMongo();
  await User.init();

  const user = await User.create({
    email: EMAIL,
    passwordHash: await hashPassword(PASSWORD),
    role: ROLES.CLIENT,
    status: USER_STATUS.ACTIVE,
  });

  userId = user._id.toString();
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(async () => {
  resetRateLimits();
  // Reset the account between tests — several of them deactivate or log out.
  await User.updateOne(
    { _id: userId },
    { $set: { status: USER_STATUS.ACTIVE, refreshTokenHash: null, refreshTokenExpiresAt: null } },
  );
});

describe('POST /auth/refresh — the happy path', () => {
  it('issues a new access token', async () => {
    const login = await doLogin();
    const res = await doRefresh(cookieValue(login));

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe('string');

    const payload = jwt.verify(res.body.accessToken, env.jwtAccessSecret);
    expect(payload.sub).toBe(userId);
    expect(payload.role).toBe(ROLES.CLIENT);
    expect(payload.exp - payload.iat).toBe(15 * 60);
  });

  it('returns the user so the frontend can still route by role', async () => {
    const login = await doLogin();
    const res = await doRefresh(cookieValue(login));

    expect(res.body.user).toEqual({ id: userId, email: EMAIL, role: ROLES.CLIENT });
  });

  it('rotates the refresh token — a different one comes back', async () => {
    const login = await doLogin();
    const oldToken = cookieValue(login);

    const res = await doRefresh(oldToken);
    const newToken = cookieValue(res);

    expect(newToken).toBeDefined();
    expect(newToken).not.toBe(oldToken);
  });

  it('stores the hash of the NEW token, not the old one', async () => {
    const login = await doLogin();
    const res = await doRefresh(cookieValue(login));
    const newToken = cookieValue(res);

    const stored = await User.findById(userId).select('+refreshTokenHash');
    const expected = crypto.createHash('sha256').update(newToken).digest('hex');

    expect(stored.refreshTokenHash).toBe(expected);
  });

  it('keeps the new cookie httpOnly and path-scoped', async () => {
    const login = await doLogin();
    const cookie = getRefreshCookie(await doRefresh(cookieValue(login)));

    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(new RegExp(`Path=${REFRESH_COOKIE_PATH}`, 'i'));
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('can be called repeatedly, each time invalidating the last token', async () => {
    const login = await doLogin();

    const first = await doRefresh(cookieValue(login));
    expect(first.status).toBe(200);

    const second = await doRefresh(cookieValue(first));
    expect(second.status).toBe(200);

    const third = await doRefresh(cookieValue(second));
    expect(third.status).toBe(200);

    // Every earlier token is now dead.
    expect((await doRefresh(cookieValue(login))).status).toBe(401);
    expect((await doRefresh(cookieValue(first))).status).toBe(401);
  });
});

describe('the 7-day window is absolute, not sliding', () => {
  it('does not push refreshTokenExpiresAt forward on refresh', async () => {
    const login = await doLogin();
    const before = await User.findById(userId).select('+refreshTokenExpiresAt');

    await new Promise((resolve) => { setTimeout(resolve, 1100); });

    const res = await doRefresh(cookieValue(login));
    expect(res.status).toBe(200);

    const after = await User.findById(userId).select('+refreshTokenExpiresAt');

    // Byte-identical. If this ever slides, an active user never logs in again.
    expect(after.refreshTokenExpiresAt.getTime()).toBe(before.refreshTokenExpiresAt.getTime());
  });

  it('gives the new token only the time that remains', async () => {
    const login = await doLogin();

    await new Promise((resolve) => { setTimeout(resolve, 1100); });

    const res = await doRefresh(cookieValue(login));
    const payload = jwt.verify(cookieValue(res), env.jwtRefreshSecret);
    const lifetimeSeconds = payload.exp - payload.iat;

    // Shorter than a full week, because time has passed since login.
    expect(lifetimeSeconds).toBeLessThan(SEVEN_DAYS_MS / 1000);
    expect(lifetimeSeconds).toBeGreaterThan(SEVEN_DAYS_MS / 1000 - 60);
  });

  it('refuses a token whose absolute window has passed, even if the JWT is still valid', async () => {
    // The two expiries are checked independently. This proves the database
    // check stands on its own: the JWT here is perfectly valid and unexpired.
    const login = await doLogin();
    const token = cookieValue(login);

    await User.updateOne(
      { _id: userId },
      { $set: { refreshTokenExpiresAt: new Date(Date.now() - 1000) } },
    );

    expect(jwt.verify(token, env.jwtRefreshSecret).sub).toBe(userId);

    const res = await doRefresh(token);
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/refresh — every failure looks the same', () => {
  const expectedBody = {
    error: { message: 'Your session has expired. Please log in again.', code: 'SESSION_EXPIRED' },
  };

  it('rejects a request with no cookie at all', async () => {
    const res = await doRefresh();

    expect(res.status).toBe(401);
    expect(res.body).toEqual(expectedBody);
  });

  it('rejects a token that has been rotated away (revoked)', async () => {
    const login = await doLogin();
    const oldToken = cookieValue(login);

    await doRefresh(oldToken);
    const res = await doRefresh(oldToken);

    expect(res.status).toBe(401);
    expect(res.body).toEqual(expectedBody);
  });

  it('rejects a refresh after logout', async () => {
    const login = await doLogin();
    const token = cookieValue(login);

    await doLogout(token);
    const res = await doRefresh(token);

    expect(res.status).toBe(401);
    expect(res.body).toEqual(expectedBody);
  });

  it('rejects an expired refresh token', async () => {
    const expired = jwt.sign({}, env.jwtRefreshSecret, {
      subject: userId,
      expiresIn: -60,
      jwtid: crypto.randomUUID(),
    });

    const res = await doRefresh(expired);

    expect(res.status).toBe(401);
    expect(res.body).toEqual(expectedBody);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forged = jwt.sign({}, 'an-attackers-own-secret-value-here', {
      subject: userId,
      expiresIn: '7d',
    });

    const res = await doRefresh(forged);
    expect(res.status).toBe(401);
  });

  it('rejects an ACCESS token presented as a refresh token', async () => {
    // The two secrets differ, which is what makes this fail. config/env.js
    // refuses to start if they ever match.
    const login = await doLogin();

    const res = await doRefresh(login.body.accessToken);
    expect(res.status).toBe(401);
  });

  it('rejects outright junk', async () => {
    expect((await doRefresh('not-a-jwt-at-all')).status).toBe(401);
    expect((await doRefresh('')).status).toBe(401);
  });

  it('rejects a deactivated user, cutting off a live session', async () => {
    const login = await doLogin();

    // Refresh once and keep the token it hands back. Using the ORIGINAL token
    // here would make this test pass for the wrong reason — that token has just
    // been rotated away, so it would be refused as revoked whatever the
    // account's status was.
    const rotated = await doRefresh(cookieValue(login));
    expect(rotated.status).toBe(200);
    const liveToken = cookieValue(rotated);

    await User.updateOne({ _id: userId }, { $set: { status: USER_STATUS.INACTIVE } });

    // The session record is untouched: this token is current and would work.
    const stored = await User.findById(userId).select('+refreshTokenHash');
    const liveHash = crypto.createHash('sha256').update(liveToken).digest('hex');
    expect(stored.refreshTokenHash).toBe(liveHash);

    // Deactivation alone is what ends it.
    const res = await doRefresh(liveToken);
    expect(res.status).toBe(401);
    expect(res.body).toEqual(expectedBody);

    // And it works again the moment the account is reactivated, proving the
    // status check was the only thing standing in the way.
    await User.updateOne({ _id: userId }, { $set: { status: USER_STATUS.ACTIVE } });
    expect((await doRefresh(liveToken)).status).toBe(200);
  });

  it('sets no cookie when it fails', async () => {
    const res = await doRefresh('not-a-jwt-at-all');
    expect(getRefreshCookie(res)).toBeUndefined();
  });
});

describe('POST /auth/logout', () => {
  it('clears the stored token in the database', async () => {
    const login = await doLogin();

    const before = await User.findById(userId).select('+refreshTokenHash +refreshTokenExpiresAt');
    expect(before.refreshTokenHash).not.toBeNull();

    await doLogout(cookieValue(login));

    const after = await User.findById(userId).select('+refreshTokenHash +refreshTokenExpiresAt');
    expect(after.refreshTokenHash).toBeNull();
    expect(after.refreshTokenExpiresAt).toBeNull();
  });

  it('clears the cookie with matching options, so the browser really drops it', async () => {
    const login = await doLogin();
    const res = await doLogout(cookieValue(login));
    const cookie = getRefreshCookie(res);

    expect(cookie).toBeDefined();
    // Path must match the cookie that was set, or the browser keeps the original.
    expect(cookie).toMatch(new RegExp(`Path=${REFRESH_COOKIE_PATH}`, 'i'));
    expect(cookie).toMatch(/HttpOnly/i);
    // An immediate expiry is how a cookie is deleted.
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/i);
  });

  it('does not delete the user account', async () => {
    const login = await doLogin();
    await doLogout(cookieValue(login));

    const user = await User.findById(userId);
    expect(user).not.toBeNull();
    expect(user.email).toBe(EMAIL);
    expect(user.status).toBe(USER_STATUS.ACTIVE);
  });

  it('succeeds with no cookie', async () => {
    const res = await doLogout();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Signed out.' });
  });

  it('succeeds with a junk cookie, revealing nothing', async () => {
    const res = await doLogout('not-a-jwt-at-all');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Signed out.' });
  });

  it('is safe to call twice', async () => {
    const login = await doLogin();
    const token = cookieValue(login);

    expect((await doLogout(token)).status).toBe(200);
    expect((await doLogout(token)).status).toBe(200);
  });

  it('a stale token cannot log out the session that replaced it', async () => {
    // Laptop signs in, then phone signs in (overwriting the stored hash). The
    // laptop logging out must not kill the phone's live session.
    const laptop = await doLogin();
    const laptopToken = cookieValue(laptop);

    resetRateLimits();
    const phone = await doLogin();
    const phoneToken = cookieValue(phone);

    await doLogout(laptopToken);

    const stored = await User.findById(userId).select('+refreshTokenHash');
    expect(stored.refreshTokenHash).not.toBeNull();

    // The phone still works.
    expect((await doRefresh(phoneToken)).status).toBe(200);
  });
});

describe('GET /auth/me', () => {
  it('returns the signed-in user', async () => {
    const login = await doLogin();
    const res = await doMe(login.body.accessToken);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(userId);
    expect(res.body.user.email).toBe(EMAIL);
    expect(res.body.user.role).toBe(ROLES.CLIENT);
  });

  it('never returns a password hash or token hash', async () => {
    const login = await doLogin();
    const res = await doMe(login.body.accessToken);
    const body = JSON.stringify(res.body);

    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain('refreshTokenHash');
    expect(body).not.toContain('$2b$');
  });

  it('rejects a request with no token', async () => {
    const res = await doMe();

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a malformed Authorization header', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('reports an EXPIRED token distinctly, so the client knows to refresh', async () => {
    const expired = jwt.sign({ role: ROLES.CLIENT }, env.jwtAccessSecret, {
      subject: userId,
      expiresIn: -60,
    });

    const res = await doMe(expired);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('rejects a forged token', async () => {
    const forged = jwt.sign({ role: ROLES.ADMIN }, 'an-attackers-own-secret-value-here', {
      subject: userId,
      expiresIn: '15m',
    });

    const res = await doMe(forged);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a REFRESH token presented as an access token', async () => {
    const login = await doLogin();

    const res = await doMe(cookieValue(login));
    expect(res.status).toBe(401);
  });

  it('rejects a user deactivated after their token was issued', async () => {
    const login = await doLogin();
    const accessToken = login.body.accessToken;

    expect((await doMe(accessToken)).status).toBe(200);

    await User.updateOne({ _id: userId }, { $set: { status: USER_STATUS.INACTIVE } });

    // The token still verifies — /me re-reads the database, which is the point.
    const res = await doMe(accessToken);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('SESSION_EXPIRED');
  });
});

describe('cleanup of expired refresh tokens', () => {
  it('clears tokens that have expired', async () => {
    await doLogin();
    await User.updateOne(
      { _id: userId },
      { $set: { refreshTokenExpiresAt: new Date(Date.now() - 1000) } },
    );

    const cleaned = await cleanupExpiredRefreshTokens();
    expect(cleaned).toBe(1);

    const after = await User.findById(userId).select('+refreshTokenHash +refreshTokenExpiresAt');
    expect(after.refreshTokenHash).toBeNull();
    expect(after.refreshTokenExpiresAt).toBeNull();
  });

  it('leaves a live session completely alone', async () => {
    const login = await doLogin();
    const before = await User.findById(userId).select('+refreshTokenHash');

    const cleaned = await cleanupExpiredRefreshTokens();
    expect(cleaned).toBe(0);

    const after = await User.findById(userId).select('+refreshTokenHash');
    expect(after.refreshTokenHash).toBe(before.refreshTokenHash);

    // And the session still works.
    expect((await doRefresh(cookieValue(login))).status).toBe(200);
  });

  it('NEVER deletes a user account', async () => {
    // The failure mode this guards against is a MongoDB TTL index on
    // refreshTokenExpiresAt, which would delete the whole users document.
    await doLogin();
    await User.updateOne(
      { _id: userId },
      { $set: { refreshTokenExpiresAt: new Date(Date.now() - 1000) } },
    );

    const countBefore = await User.countDocuments();
    await cleanupExpiredRefreshTokens();
    const countAfter = await User.countDocuments();

    expect(countAfter).toBe(countBefore);

    const user = await User.findById(userId);
    expect(user).not.toBeNull();
    expect(user.email).toBe(EMAIL);
    expect(user.role).toBe(ROLES.CLIENT);
  });
});
