import { spawn } from 'node:child_process';
import http from 'node:http';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import env from '../config/env.js';
import { User } from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { loginRateLimiter, sessionRateLimiter } from './auth.routes.js';
import { startMemoryMongo, stopMemoryMongo } from '../test/mongoMemory.js';

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];

const EMAILS = {
  [ROLES.CLIENT]: 'client@example.com',
  [ROLES.THERAPIST]: 'therapist@example.com',
  [ROLES.ADMIN]: 'admin@example.com',
};

// Each role's route, plus the shared one every signed-in user may reach.
const ROUTE_FOR = {
  [ROLES.CLIENT]: '/api/v1/dev/client',
  [ROLES.THERAPIST]: '/api/v1/dev/therapist',
  [ROLES.ADMIN]: '/api/v1/dev/admin',
};
const ANY_ROUTE = '/api/v1/dev/any';

const tokens = {};

function resetRateLimits() {
  LOOPBACK_KEYS.forEach((key) => {
    loginRateLimiter.resetKey(key);
    sessionRateLimiter.resetKey(key);
  });
}

function get(path, token) {
  const req = request(app).get(path);
  return token === undefined ? req : req.set('Authorization', `Bearer ${token}`);
}

beforeAll(async () => {
  await startMemoryMongo();
  await User.init();

  const passwordHash = await hashPassword(PASSWORD);

  for (const role of Object.values(ROLES)) {
    await User.create({
      email: EMAILS[role],
      passwordHash,
      role,
      status: USER_STATUS.ACTIVE,
    });

    resetRateLimits();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: EMAILS[role], password: PASSWORD });

    // A real token from a real login, not one hand-signed by the test.
    tokens[role] = res.body.accessToken;
  }
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(() => {
  resetRateLimits();
});

describe('the right role gets through', () => {
  it.each(Object.values(ROLES))('a %s reaches their own route', async (role) => {
    const res = await get(ROUTE_FOR[role], tokens[role]);

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe(role);
  });

  it.each(Object.values(ROLES))('a %s reaches the shared signed-in route', async (role) => {
    const res = await get(ANY_ROUTE, tokens[role]);

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe(role);
  });
});

describe('the wrong role gets 403', () => {
  // Every role against every other role's route — nine pairs, six of them blocked.
  const pairs = Object.values(ROLES).flatMap((holder) =>
    Object.values(ROLES)
      .filter((target) => target !== holder)
      .map((target) => [holder, target]),
  );

  it.each(pairs)('a %s is blocked from the %s route', async (holder, target) => {
    const res = await get(ROUTE_FOR[target], tokens[holder]);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: { message: 'You do not have access to this.', code: 'FORBIDDEN' },
    });
  });

  it('the 403 body never names the required role', async () => {
    const res = await get(ROUTE_FOR[ROLES.ADMIN], tokens[ROLES.CLIENT]);
    const body = JSON.stringify(res.body).toLowerCase();

    expect(body).not.toContain('admin');
    expect(body).not.toContain('therapist');
  });
});

describe('no token, or a bad one, gets 401 — never 403', () => {
  // The distinction matters: 401 means "I do not know who you are", 403 means
  // "I know, and the answer is no". The frontend reacts differently to each.
  it('no token at all', async () => {
    const res = await get(ROUTE_FOR[ROLES.ADMIN]);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('a malformed Authorization header', async () => {
    for (const header of ['Bearer', 'Bearer ', 'Token abc', 'abc']) {
      const res = await request(app).get(ANY_ROUTE).set('Authorization', header);
      expect(res.status).toBe(401);
    }
  });

  it('outright junk instead of a token', async () => {
    const res = await get(ANY_ROUTE, 'not-a-jwt-at-all');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('an EXPIRED token — reported distinctly so the client knows to refresh', async () => {
    const expired = jwt.sign({ role: ROLES.ADMIN }, env.jwtAccessSecret, {
      subject: '507f1f77bcf86cd799439011',
      expiresIn: -60,
    });

    const res = await get(ROUTE_FOR[ROLES.ADMIN], expired);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('a token FORGED with the attacker\'s own secret, claiming to be admin', async () => {
    // The whole reason the secret must stay secret. This is the attack the
    // 32-character minimum in config/env.js exists to make infeasible.
    const forged = jwt.sign({ role: ROLES.ADMIN }, 'an-attackers-own-secret-value-here', {
      subject: '507f1f77bcf86cd799439011',
      expiresIn: '15m',
    });

    const res = await get(ROUTE_FOR[ROLES.ADMIN], forged);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('a REFRESH token presented as an access token', async () => {
    resetRateLimits();
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: EMAILS[ROLES.ADMIN], password: PASSWORD });

    const cookie = (login.headers['set-cookie'] || [])[0];
    const refreshToken = cookie.split(';')[0].split('=').slice(1).join('=');

    const res = await get(ROUTE_FOR[ROLES.ADMIN], refreshToken);
    expect(res.status).toBe(401);
  });

  it('a token whose role was tampered with in the payload', async () => {
    // Editing the payload breaks the signature. This is what signing is for.
    const [header, payload, signature] = tokens[ROLES.CLIENT].split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    decoded.role = ROLES.ADMIN;
    const tampered = [
      header,
      Buffer.from(JSON.stringify(decoded)).toString('base64url'),
      signature,
    ].join('.');

    const res = await get(ROUTE_FOR[ROLES.ADMIN], tampered);

    expect(res.status).toBe(401);
  });
});

describe('the dev routes are not mounted in production', () => {
  // Started as a real child process with NODE_ENV=production, so this tests the
  // actual wiring rather than a mocked module.
  it('returns 404 for every dev route when NODE_ENV=production', async () => {
    const port = 5099;
    const child = spawn(
      process.execPath,
      ['-e', `import('./app.js').then((m) => m.default.listen(${port}))`],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: 'production',
          // Production refuses to start without these (config/env.js), and this
          // test is about route mounting, not email configuration. Supplied so
          // the check under test is the only thing that can fail.
          RESEND_API_KEY: process.env.RESEND_API_KEY || 're_test_key_not_used',
          EMAIL_FROM: process.env.EMAIL_FROM || 'Cast of Mind <test@example.com>',
          // Required in production since chunk 2.6. This test is about route
          // mounting, not email configuration, so it just supplies a value.
          CONTACT_TO: process.env.CONTACT_TO || 'test@example.com',
        },
      },
    );

    try {
      // Wait for it to accept connections.
      await new Promise((resolve, reject) => {
        const started = Date.now();
        const poll = () => {
          const req = http.get({ host: '127.0.0.1', port, path: '/api/v1/health' }, (res) => {
            res.resume();
            resolve();
          });
          req.on('error', () => {
            if (Date.now() - started > 15000) reject(new Error('server did not start'));
            else setTimeout(poll, 200);
          });
        };
        poll();
      });

      const status = (path) => new Promise((resolve, reject) => {
        const req = http.get({ host: '127.0.0.1', port, path }, (res) => {
          res.resume();
          resolve(res.statusCode);
        });
        req.on('error', reject);
      });

      // Sanity check: the server really is up and serving normal routes.
      expect(await status('/api/v1/health')).toBe(200);

      // But every dev route is simply absent.
      expect(await status(ANY_ROUTE)).toBe(404);
      expect(await status(ROUTE_FOR[ROLES.CLIENT])).toBe(404);
      expect(await status(ROUTE_FOR[ROLES.THERAPIST])).toBe(404);
      expect(await status(ROUTE_FOR[ROLES.ADMIN])).toBe(404);
    } finally {
      child.kill();
    }
  }, 30000);
});
