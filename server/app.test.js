import { jest } from '@jest/globals';

// No database is connected in this file, so the health check must say so —
// with a 503, not a crash. The healthy path is in routes/health.test.js.
// The vendors are faked: a test must never reach the real Resend or Cloudinary.
jest.unstable_mockModule('./config/cloudinary.js', () => ({
  cloudinary: { api: { ping: jest.fn().mockResolvedValue({ status: 'ok' }) } },
  isCloudinaryConfigured: true,
  default: {},
}));
jest.unstable_mockModule('resend', () => ({
  Resend: class {
    constructor() {
      this.domains = { list: jest.fn().mockResolvedValue({ data: { data: [] }, error: null }) };
      this.emails = { send: jest.fn() };
    }
  },
}));

const { default: request } = await import('supertest');
const { default: app } = await import('./app.js');

describe('GET /api/v1/health', () => {
  it('reports the database down with a 503 when it is not connected', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('down');
    expect(res.body.services.database).toBe('down');
    expect(Object.keys(res.body).sort()).toEqual(['checkedAt', 'services', 'status']);
  });
});
