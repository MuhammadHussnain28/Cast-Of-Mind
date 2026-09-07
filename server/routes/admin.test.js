import request from 'supertest';
import app from '../app.js';
import { User } from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { ADMIN_IDLE_TIMEOUT_MS, ADMIN_IDLE_WARNING_MS } from '../constants/admin.js';
import { loginRateLimiter, sessionRateLimiter } from './auth.routes.js';
import { adminRateLimiter } from './admin.routes.js';
import { startMemoryMongo, stopMemoryMongo } from '../test/mongoMemory.js';

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];

const EMAILS = {
  [ROLES.CLIENT]: 'admin-test-client@example.com',
  [ROLES.THERAPIST]: 'admin-test-therapist@example.com',
  [ROLES.ADMIN]: 'admin-test-admin@example.com',
};

const SESSION = '/api/v1/admin/session';

const tokens = {};

function resetRateLimits() {
  LOOPBACK_KEYS.forEach((key) => {
    loginRateLimiter.resetKey(key);
    sessionRateLimiter.resetKey(key);
    adminRateLimiter.resetKey(key);
  });
}

function get(path, token) {
  const req = request(app).get(path);
  return token === undefined ? req : req.set('Authorization', `Bearer ${token}`);
}

/** Runs `fn` with console.log captured, and returns everything it printed. */
async function captureLog(fn) {
  const lines = [];
  const original = console.log;
  console.log = (...args) => lines.push(args.join(' '));
  try {
    await fn();
  } finally {
    console.log = original;
  }
  return lines;
}

const adminLines = (lines) => lines.filter((line) => line.startsWith('[admin]'));

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
    // A real token from a real login, not one hand-signed by the test.
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: EMAILS[role], password: PASSWORD });

    tokens[role] = res.body.accessToken;
  }
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(() => {
  resetRateLimits();
});

describe('admin routes — who gets in', () => {
  test('an admin token reaches the session endpoint', async () => {
    const res = await get(SESSION, tokens[ROLES.ADMIN]);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(EMAILS[ROLES.ADMIN]);
    expect(res.body.role).toBe(ROLES.ADMIN);
  });

  test('a client token is refused with 403', async () => {
    const res = await get(SESSION, tokens[ROLES.CLIENT]);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('a therapist token is refused with 403', async () => {
    const res = await get(SESSION, tokens[ROLES.THERAPIST]);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('no token at all is 401, not 403', async () => {
    const res = await get(SESSION);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  test('a junk token is 401', async () => {
    const res = await get(SESSION, 'not-a-real-token');

    expect(res.status).toBe(401);
  });

  test('the 403 body names no role', async () => {
    const res = await get(SESSION, tokens[ROLES.CLIENT]);
    const body = JSON.stringify(res.body).toLowerCase();

    // Telling a client "admins only" hands out a map of the admin surface.
    expect(body).not.toContain('admin');
    expect(body).not.toContain('client');
    expect(body).not.toContain('therapist');
  });
});

describe('admin routes — the guard covers the whole mount', () => {
  // The point of guarding at router level: a path that does not exist is still
  // refused rather than falling through to the 404 handler and telling an
  // outsider which admin paths are real.
  test('an unknown admin path is 403 for a client, not 404', async () => {
    const res = await get('/api/v1/admin/does-not-exist', tokens[ROLES.CLIENT]);

    expect(res.status).toBe(403);
  });

  test('an unknown admin path is 401 with no token, not 404', async () => {
    const res = await get('/api/v1/admin/does-not-exist');

    expect(res.status).toBe(401);
  });

  test('an unknown admin path is 404 for the admin', async () => {
    const res = await get('/api/v1/admin/does-not-exist', tokens[ROLES.ADMIN]);

    expect(res.status).toBe(404);
  });
});

describe('admin session payload', () => {
  test('carries the idle timeout the spec sets, with the warning before it', async () => {
    const res = await get(SESSION, tokens[ROLES.ADMIN]);

    expect(res.body.idleTimeoutMs).toBe(ADMIN_IDLE_TIMEOUT_MS);
    expect(res.body.idleWarningMs).toBe(ADMIN_IDLE_WARNING_MS);
    expect(res.body.idleTimeoutMs).toBe(30 * 60 * 1000);
    expect(res.body.idleWarningMs).toBeLessThan(res.body.idleTimeoutMs);
  });

  test('returns exactly the four expected keys and no hash of any kind', async () => {
    const res = await get(SESSION, tokens[ROLES.ADMIN]);

    expect(Object.keys(res.body).sort()).toEqual([
      'email',
      'idleTimeoutMs',
      'idleWarningMs',
      'role',
    ]);

    const body = JSON.stringify(res.body);
    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain('refreshTokenHash');
    expect(body).not.toContain('$2b$');
  });

  test('a deactivated admin is cut off even while holding a valid token', async () => {
    await User.updateOne(
      { email: EMAILS[ROLES.ADMIN] },
      { status: USER_STATUS.INACTIVE },
    );

    const refused = await get(SESSION, tokens[ROLES.ADMIN]);
    expect(refused.status).toBe(401);
    expect(refused.body.error.code).toBe('SESSION_EXPIRED');

    // Reactivate and confirm the status check is the only thing that changed
    // the outcome — otherwise this would pass even with the check deleted.
    await User.updateOne(
      { email: EMAILS[ROLES.ADMIN] },
      { status: USER_STATUS.ACTIVE },
    );
    resetRateLimits();

    const allowed = await get(SESSION, tokens[ROLES.ADMIN]);
    expect(allowed.status).toBe(200);
  });
});

describe('admin action log', () => {
  test('records who, what, when, the status and the IP', async () => {
    const lines = await captureLog(() => get(SESSION, tokens[ROLES.ADMIN]));
    const [line] = adminLines(lines);

    expect(line).toBeDefined();
    expect(line).toContain('GET /api/v1/admin/session');
    expect(line).toContain('200');
    expect(line).toMatch(/user=[a-f0-9]{24}/);
    expect(line).toMatch(/ip=/);
    // An ISO timestamp, so the record answers "when".
    expect(line).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test('records a refused attempt, naming the account that tried', async () => {
    const lines = await captureLog(() => get(SESSION, tokens[ROLES.CLIENT]));
    const [line] = adminLines(lines);

    expect(line).toBeDefined();
    expect(line).toContain('403');
    // The line is written on response finish, so requireAuth has already
    // identified the caller by then. A refused attempt therefore names the
    // account that made it, which is the point of an accountability log.
    expect(line).toMatch(/user=[a-f0-9]{24}/);
  });

  test('records an unauthenticated attempt as anonymous', async () => {
    const lines = await captureLog(() => get(SESSION));
    const [line] = adminLines(lines);

    expect(line).toBeDefined();
    expect(line).toContain('401');
    expect(line).toContain('user=anonymous');
  });

  test('never writes the query string to the log', async () => {
    // An admin searching a client list would otherwise put that person's name
    // into the server log. Only the path is recorded.
    const lines = await captureLog(() =>
      get(`${SESSION}?q=maria-see-note`, tokens[ROLES.ADMIN]),
    );
    const [line] = adminLines(lines);

    expect(line).toBeDefined();
    expect(line).not.toContain('maria-see-note');
    expect(line).not.toContain('?');
  });

  test('never writes the request body to the log', async () => {
    const lines = await captureLog(() =>
      request(app)
        .post('/api/v1/admin/session')
        .set('Authorization', `Bearer ${tokens[ROLES.ADMIN]}`)
        .send({ note: 'private-clinical-text' }),
    );
    const [line] = adminLines(lines);

    expect(line).toBeDefined();
    expect(line).not.toContain('private-clinical-text');
  });
});
