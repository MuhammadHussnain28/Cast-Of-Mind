import { jest } from '@jest/globals';

// GET /api/v1/health (12.4): public, for uptime monitors. States only, cached,
// rate limited. Resend and Cloudinary are FAKED — the real .env must never be
// reached from a test.

const domainsList = jest.fn();
const cloudinaryPing = jest.fn();

jest.unstable_mockModule('../config/cloudinary.js', () => ({
  cloudinary: { api: { ping: cloudinaryPing } },
  isCloudinaryConfigured: true,
  default: { api: { ping: cloudinaryPing } },
}));

jest.unstable_mockModule('resend', () => ({
  Resend: class {
    constructor() {
      this.domains = { list: domainsList };
      this.emails = { send: jest.fn() };
    }
  },
}));

const { default: request } = await import('supertest');
const { default: mongoose } = await import('mongoose');
const { default: app } = await import('../app.js');
const { default: env } = await import('../config/env.js');
const { healthRateLimiter } = await import('./health.routes.js');
const { getHealthStatus, resetHealthCache } = await import('../services/systemStatus.service.js');
const { HEALTH_CACHE_MS, HEALTH_RATE_LIMIT } = await import('../constants/systemStatus.js');
const { startMemoryMongo, stopMemoryMongo } = await import('../test/mongoMemory.js');

const VERIFIED = { data: { data: [{ name: 'castofmind.com', status: 'verified' }] }, error: null };
const UNVERIFIED = { data: { data: [{ name: 'castofmind.com', status: 'pending' }] }, error: null };

beforeAll(async () => {
  await startMemoryMongo();
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(async () => {
  resetHealthCache();
  env.resendApiKey = 're_fake_key';
  env.emailFrom = 'Cast of Minds <noreply@castofmind.com>';
  domainsList.mockReset().mockResolvedValue(VERIFIED);
  cloudinaryPing.mockReset().mockResolvedValue({ status: 'ok' });
  for (const key of ['::ffff:127.0.0.1', '127.0.0.1', '::1']) await healthRateLimiter.resetKey(key);
});

describe('GET /api/v1/health', () => {
  it('returns the agreed shape, healthy, with a 200', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'healthy',
      checkedAt: expect.any(String),
      services: { database: 'operational', email: 'operational', storage: 'operational' },
    });
    expect(Number.isNaN(Date.parse(res.body.checkedAt))).toBe(false);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('is DEGRADED but still 200 when email needs attention — that must not page anyone', async () => {
    domainsList.mockResolvedValue(UNVERIFIED);
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('degraded');
    expect(res.body.services.email).toBe('attention');
  });

  it('is degraded when storage is down', async () => {
    cloudinaryPing.mockRejectedValue(new Error('unreachable'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'degraded', services: { storage: 'down' } });
  });

  it('reveals no latency, detail codes, payments or vendor text', async () => {
    const res = await request(app).get('/api/v1/health');
    const body = JSON.stringify(res.body).toLowerCase();
    for (const word of ['latency', 'detail', 'payments', 'test_sender', 'domain', 'stripe', 'resend', 'cloudinary']) {
      expect(body).not.toContain(word);
    }
  });

  it('CALLS THE VENDORS ONCE PER CACHE WINDOW, however many callers arrive', async () => {
    const results = await Promise.all([1, 2, 3, 4, 5].map(() => request(app).get('/api/v1/health')));
    expect(results.every((res) => res.status === 200)).toBe(true);
    expect(domainsList).toHaveBeenCalledTimes(1);
    expect(cloudinaryPing).toHaveBeenCalledTimes(1);
  });

  it('probes again once the cache window has passed', async () => {
    const start = Date.now();
    await getHealthStatus(start);
    await getHealthStatus(start + HEALTH_CACHE_MS - 1);
    expect(cloudinaryPing).toHaveBeenCalledTimes(1);
    await getHealthStatus(start + HEALTH_CACHE_MS);
    expect(cloudinaryPing).toHaveBeenCalledTimes(2);
  });

  it('is rate limited', async () => {
    for (let i = 0; i < HEALTH_RATE_LIMIT.max; i += 1) {
      await request(app).get('/api/v1/health').expect(200);
    }
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  }, 30000);

  // Last: it disconnects the database for the rest of the file.
  it('REPORTS DOWN WITH A 503 WHEN THE DATABASE IS GONE', async () => {
    await mongoose.disconnect();
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('down');
    expect(res.body.services.database).toBe('down');
  });
});
