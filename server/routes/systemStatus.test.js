import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { createEmailServiceMock } from '../test/emailServiceMock.js';

// Every vendor is faked: no test touches Stripe, Cloudinary or Resend, and each
// fake is a jest.fn so a case can make it fail, hang or answer differently.
const stripeRetrieve = jest.fn();
const cloudinaryPing = jest.fn();
const domainsList = jest.fn();

jest.unstable_mockModule('../services/email/email.service.js', () => createEmailServiceMock());

jest.unstable_mockModule('../config/stripe.js', () => ({
  stripe: { accounts: { retrieve: stripeRetrieve } },
  isStripeConfigured: true,
  isTestKey: true,
  default: { accounts: { retrieve: stripeRetrieve } },
}));

jest.unstable_mockModule('../config/cloudinary.js', () => ({
  cloudinary: { api: { ping: cloudinaryPing } },
  isCloudinaryConfigured: true,
  default: { api: { ping: cloudinaryPing } },
}));

jest.unstable_mockModule('resend', () => ({
  Resend: class {
    constructor() {
      this.domains = { list: domainsList };
    }
  },
}));

const { default: app } = await import('../app.js');
const { default: env } = await import('../config/env.js');
const { User } = await import('../models/User.js');
const { hashPassword } = await import('../utils/password.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { SERVICE_STATE, SERVICE_DETAIL, PROBE_TIMEOUT_MS } = await import(
  '../constants/systemStatus.js'
);
const { senderDomain } = await import('../services/systemStatus.service.js');
const { loginRateLimiter, sessionRateLimiter } = await import('./auth.routes.js');
const { adminRateLimiter } = await import('./admin.routes.js');
const { startMemoryMongo, stopMemoryMongo } = await import('../test/mongoMemory.js');

const URL = '/api/v1/admin/system-status';
const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const EMAILS = {
  [ROLES.CLIENT]: 'ss-client@example.com',
  [ROLES.THERAPIST]: 'ss-therapist@example.com',
  [ROLES.ADMIN]: 'ss-admin@example.com',
};
// Planted in vendor failures: none of it may reach the response or the log.
const SECRET = 'sk_test_SECRET_acct_internal-host.example';

const tokens = {};
const original = {};
let warn;

function resetRateLimits() {
  LOOPBACK_KEYS.forEach((key) => {
    loginRateLimiter.resetKey(key);
    sessionRateLimiter.resetKey(key);
    adminRateLimiter.resetKey(key);
  });
}

async function status(token = tokens[ROLES.ADMIN]) {
  const req = request(app).get(URL);
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
}

const service = (res, key) => res.body.services.find((entry) => entry.key === key);

function useEmail({ key = 're_test_key', from }) {
  env.resendApiKey = key;
  env.emailFrom = from;
}

beforeAll(async () => {
  await startMemoryMongo();
  await User.init();
  const passwordHash = await hashPassword(PASSWORD);

  for (const role of Object.values(ROLES)) {
    await User.create({ email: EMAILS[role], passwordHash, role, status: USER_STATUS.ACTIVE });
    resetRateLimits();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: EMAILS[role], password: PASSWORD });
    tokens[role] = res.body.accessToken;
  }

  original.resendApiKey = env.resendApiKey;
  original.emailFrom = env.emailFrom;
}, 120000);

afterAll(async () => {
  env.resendApiKey = original.resendApiKey;
  env.emailFrom = original.emailFrom;
  await stopMemoryMongo();
});

beforeEach(() => {
  resetRateLimits();
  stripeRetrieve.mockReset().mockResolvedValue({ id: 'acct_test' });
  cloudinaryPing.mockReset().mockResolvedValue({ status: 'ok' });
  domainsList.mockReset().mockResolvedValue({
    data: { data: [{ name: 'castofmind.com', status: 'verified' }] },
    error: null,
  });
  useEmail({ from: 'Cast of Mind <noreply@castofmind.com>' });
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('the guards', () => {
  test('refuses no token, a client and a therapist', async () => {
    expect((await status(null)).status).toBe(401);
    expect((await status(tokens[ROLES.CLIENT])).status).toBe(403);
    expect((await status(tokens[ROLES.THERAPIST])).status).toBe(403);
    expect(stripeRetrieve).not.toHaveBeenCalled();
  });
});

describe('a healthy platform', () => {
  test('reports all four services working, in a fixed order, uncached', async () => {
    const res = await status();

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.services.map((entry) => entry.key)).toEqual([
      'database',
      'payments',
      'email',
      'storage',
    ]);
    res.body.services.forEach((entry) => {
      expect(entry.state).toBe(SERVICE_STATE.OPERATIONAL);
      expect(typeof entry.latencyMs).toBe('number');
      expect(Object.keys(entry).sort()).toEqual(['detail', 'key', 'latencyMs', 'state']);
    });
    expect(service(res, 'payments').detail).toBe(SERVICE_DETAIL.TEST_MODE);
    expect(service(res, 'email').detail).toBe(SERVICE_DETAIL.DOMAIN_VERIFIED);
    expect(Number.isNaN(Date.parse(res.body.checkedAt))).toBe(false);
  });

  test('checks each vendor exactly once per request — no loop, no retry', async () => {
    await status();
    expect(stripeRetrieve).toHaveBeenCalledTimes(1);
    expect(cloudinaryPing).toHaveBeenCalledTimes(1);
    expect(domainsList).toHaveBeenCalledTimes(1);
  });
});

describe('failures stay contained and say nothing', () => {
  test('a database failure marks only the database down', async () => {
    jest
      .spyOn(mongoose.connection.db, 'command')
      .mockRejectedValueOnce(new Error(SECRET));

    const res = await status();

    expect(service(res, 'database')).toEqual({
      key: 'database',
      state: SERVICE_STATE.DOWN,
      detail: null,
      latencyMs: null,
    });
    expect(service(res, 'payments').state).toBe(SERVICE_STATE.OPERATIONAL);
    expect(JSON.stringify(res.body)).not.toContain('SECRET');
  });

  test('a Stripe error is down, and its message is neither returned nor logged', async () => {
    stripeRetrieve.mockRejectedValueOnce(Object.assign(new Error(SECRET), { name: 'StripeAuthenticationError' }));

    const res = await status();

    expect(service(res, 'payments').state).toBe(SERVICE_STATE.DOWN);
    expect(JSON.stringify(res.body)).not.toContain('SECRET');
    const logged = warn.mock.calls.flat().join(' ');
    expect(logged).toContain('StripeAuthenticationError');
    expect(logged).not.toContain('SECRET');
  });

  test('a Cloudinary rejection with no error name is still down, logged as unknown', async () => {
    cloudinaryPing.mockRejectedValueOnce({ error: { message: SECRET, http_code: 401 } });

    const res = await status();

    expect(service(res, 'storage').state).toBe(SERVICE_STATE.DOWN);
    expect(warn.mock.calls.flat().join(' ')).toContain('UnknownError');
    expect(JSON.stringify(res.body)).not.toContain('SECRET');
  });

  test('a Cloudinary answer other than ok is down', async () => {
    cloudinaryPing.mockResolvedValueOnce({ status: 'degraded' });
    expect(service(await status(), 'storage').state).toBe(SERVICE_STATE.DOWN);
  });

  test(
    'a vendor that never answers is down after the timeout, without holding the others',
    async () => {
      stripeRetrieve.mockImplementationOnce(() => new Promise(() => {}));

      const started = Date.now();
      const res = await status();

      expect(Date.now() - started).toBeGreaterThanOrEqual(PROBE_TIMEOUT_MS - 50);
      expect(service(res, 'payments').state).toBe(SERVICE_STATE.DOWN);
      expect(warn.mock.calls.flat().join(' ')).toContain('ProbeTimeout');
      expect(service(res, 'storage').state).toBe(SERVICE_STATE.OPERATIONAL);
    },
    20000,
  );
});

describe('email', () => {
  test('no API key is not configured, and Resend is never called', async () => {
    useEmail({ key: null, from: 'Cast of Mind <noreply@castofmind.com>' });

    const email = service(await status(), 'email');

    expect(email).toEqual({
      key: 'email',
      state: SERVICE_STATE.NOT_CONFIGURED,
      detail: null,
      latencyMs: null,
    });
    expect(domainsList).not.toHaveBeenCalled();
  });

  test("Resend's shared test sender needs attention (blocker 7)", async () => {
    useEmail({ from: 'Cast of Mind <onboarding@resend.dev>' });
    const email = service(await status(), 'email');
    expect(email.state).toBe(SERVICE_STATE.ATTENTION);
    expect(email.detail).toBe(SERVICE_DETAIL.TEST_SENDER);
  });

  test('a sender domain Resend has not verified needs attention', async () => {
    domainsList.mockResolvedValueOnce({
      data: { data: [{ name: 'castofmind.com', status: 'pending' }] },
      error: null,
    });
    const email = service(await status(), 'email');
    expect(email.state).toBe(SERVICE_STATE.ATTENTION);
    expect(email.detail).toBe(SERVICE_DETAIL.DOMAIN_UNVERIFIED);
  });

  test('a sender domain missing from the account needs attention', async () => {
    domainsList.mockResolvedValueOnce({
      data: { data: [{ name: 'elsewhere.org', status: 'verified' }] },
      error: null,
    });
    expect(service(await status(), 'email').detail).toBe(SERVICE_DETAIL.DOMAIN_UNVERIFIED);
  });

  test('a lookalike domain does not count as verified', async () => {
    useEmail({ from: 'Cast of Mind <noreply@notcastofmind.com>' });
    expect(service(await status(), 'email').state).toBe(SERVICE_STATE.ATTENTION);
  });

  test('a sender on a subdomain of a verified domain is working', async () => {
    useEmail({ from: 'Cast of Mind <noreply@mail.castofmind.com>' });
    expect(service(await status(), 'email').state).toBe(SERVICE_STATE.OPERATIONAL);
  });

  test('a sending-only key is working but unverifiable — unless it is on the test sender', async () => {
    const restricted = { data: null, error: { name: 'restricted_api_key', message: SECRET } };

    domainsList.mockResolvedValueOnce(restricted);
    const email = service(await status(), 'email');
    expect(email.state).toBe(SERVICE_STATE.OPERATIONAL);
    expect(email.detail).toBe(SERVICE_DETAIL.SENDING_KEY);

    useEmail({ from: 'Cast of Mind <onboarding@resend.dev>' });
    domainsList.mockResolvedValueOnce(restricted);
    expect(service(await status(), 'email').detail).toBe(SERVICE_DETAIL.TEST_SENDER);
  });

  test('an invalid key is down, and Resend’s message is not logged', async () => {
    domainsList.mockResolvedValueOnce({
      data: null,
      error: { name: 'invalid_api_key', message: SECRET },
    });

    const res = await status();

    expect(service(res, 'email').state).toBe(SERVICE_STATE.DOWN);
    const logged = warn.mock.calls.flat().join(' ');
    expect(logged).toContain('invalid_api_key');
    expect(logged).not.toContain('SECRET');
  });

  test('senderDomain reads the address inside the display name', () => {
    expect(senderDomain('Cast of Mind <noreply@CastOfMind.com>')).toBe('castofmind.com');
    expect(senderDomain('noreply@castofmind.com')).toBe('castofmind.com');
    expect(senderDomain('no address here')).toBeNull();
    expect(senderDomain(undefined)).toBeNull();
  });
});
