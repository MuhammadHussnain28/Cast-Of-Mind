import { jest } from '@jest/globals';
import request from 'supertest';

// Cloudinary is faked so the suite never touches a real account and never
// depends on whether this machine happens to have credentials in .env.
const privateDownloadUrl = jest.fn(
  (publicId, format) => `https://api.cloudinary.com/v1_1/test/image/download?id=${publicId}.${format}`,
);

jest.unstable_mockModule('../config/cloudinary.js', () => ({
  isCloudinaryConfigured: true,
  cloudinary: { utils: { private_download_url: privateDownloadUrl } },
  default: { utils: { private_download_url: privateDownloadUrl } },
}));

const { default: app } = await import('../app.js');
const { default: env } = await import('../config/env.js');
const { User } = await import('../models/User.js');
const { TherapistApplication } = await import('../models/TherapistApplication.js');
const { hashPassword } = await import('../utils/password.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { loginRateLimiter, sessionRateLimiter } = await import('./auth.routes.js');
const { adminRateLimiter } = await import('./admin.routes.js');
const { startMemoryMongo, stopMemoryMongo } = await import('../test/mongoMemory.js');

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];

// isOwnCloudinaryUrl pins a URL to the configured cloud name, so the fixtures
// have to use whatever this environment is set to — otherwise the URL guard
// correctly rejects them and every document assertion fails for the wrong
// reason. Falls back when Cloudinary is not configured at all.
const CLOUD_NAME = env.cloudinaryCloudName || 'testcloud';

const EMAILS = {
  [ROLES.CLIENT]: 'apps-client@example.com',
  [ROLES.THERAPIST]: 'apps-therapist@example.com',
  [ROLES.ADMIN]: 'apps-admin@example.com',
};

const LIST = '/api/v1/admin/applications';
const CLOUD = `https://res.cloudinary.com/${CLOUD_NAME}`;

// A sentinel, because a default parameter would quietly substitute the admin
// token when a test means to send none — which is how a "no token is refused"
// test passes while proving nothing.
const NO_TOKEN = Symbol('no token');

const tokens = {};
const ids = {};

function resetRateLimits() {
  LOOPBACK_KEYS.forEach((key) => {
    loginRateLimiter.resetKey(key);
    sessionRateLimiter.resetKey(key);
    adminRateLimiter.resetKey(key);
  });
}

function get(path, token = tokens[ROLES.ADMIN]) {
  const req = request(app).get(path);
  return token === NO_TOKEN ? req : req.set('Authorization', `Bearer ${token}`);
}

/** A complete, valid application, overridden per case. */
function applicationFixture(overrides = {}) {
  return {
    title: 'Dr.',
    firstName: 'Ada',
    lastName: 'Lovelace',
    gender: 'female',
    dateOfBirth: new Date('1985-03-02'),
    email: 'ada@example.com',
    passwordHash: '$2b$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012',
    photoUrl: `${CLOUD}/image/upload/v1/cast-of-mind/therapist-photos/photo.jpg`,
    streetAddress: '12 Analytical Way',
    city: 'London',
    stateProvince: 'Greater London',
    zipPostal: 'W1A 1AA',
    country: 'United Kingdom',
    timezone: 'Europe/London',
    languages: ['English'],
    workingHours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      note: '',
    },
    therapistType: 'Clinical Psychologist',
    credentialType: 'License',
    credentialInitials: 'PhD',
    yearsExperience: 9,
    educationSummary: 'PhD in clinical psychology.',
    currentWorkSituation: 'Private practice.',
    licenseNumber: 'LIC-1',
    taxpayerIdNumber: 'TAX-9',
    specialtyTags: ['Anxiety', 'Depression', 'Grief'],
    treatmentOrientations: ['CBT', 'Mindfulness'],
    bio: 'I work with adults on anxiety and grief.',
    licensingStatus: 'Licensed in the UK.',
    disciplinaryActions: false,
    malpracticeInsurance: true,
    certificateUrl1: `${CLOUD}/image/authenticated/s--sig--/v1/cast-of-mind/certificates/c1.pdf`,
    certificatePublicId1: 'cast-of-mind/certificates/c1',
    ...overrides,
  };
}

beforeAll(async () => {
  await startMemoryMongo();
  await User.init();
  await TherapistApplication.init();

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

    tokens[role] = res.body.accessToken;
  }

  // Three applications, one per status, submitted at known distinct times so
  // the ordering assertion means something.
  const pending = await TherapistApplication.create(
    applicationFixture({ email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' }),
  );
  const approved = await TherapistApplication.create(
    applicationFixture({
      email: 'grace@example.com',
      firstName: 'Grace',
      lastName: 'Hopper',
      status: 'approved',
      certificateUrl2: `${CLOUD}/image/authenticated/s--sig2--/v1/cast-of-mind/certificates/c2.jpg`,
      certificatePublicId2: 'cast-of-mind/certificates/c2',
    }),
  );
  const rejected = await TherapistApplication.create(
    applicationFixture({
      email: 'katherine@example.com',
      firstName: 'Katherine',
      lastName: 'Johnson',
      status: 'rejected',
    }),
  );

  // submittedAt is mapped as the createdAt timestamp, and Mongoose ignores
  // attempts to change createdAt in an update — so this goes through the raw
  // collection. Distinct times, rather than sleeping between creates.
  const raw = TherapistApplication.collection;
  await raw.updateOne({ _id: pending._id }, { $set: { submittedAt: new Date('2026-09-03T10:00:00Z') } });
  await raw.updateOne({ _id: approved._id }, { $set: { submittedAt: new Date('2026-09-02T10:00:00Z') } });
  await raw.updateOne({ _id: rejected._id }, { $set: { submittedAt: new Date('2026-09-01T10:00:00Z') } });

  ids.pending = pending._id.toString();
  ids.approved = approved._id.toString();
  ids.rejected = rejected._id.toString();
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(() => {
  resetRateLimits();
});

describe('applications routes — who gets in', () => {
  const paths = () => [
    LIST,
    `${LIST}/${ids.pending}`,
    `${LIST}/${ids.pending}/documents/certificate1`,
  ];

  test('a client token is refused from every applications route', async () => {
    for (const path of paths()) {
      resetRateLimits();
      const res = await get(path, tokens[ROLES.CLIENT]);
      expect(res.status).toBe(403);
    }
  });

  test('a therapist token is refused from every applications route', async () => {
    for (const path of paths()) {
      resetRateLimits();
      const res = await get(path, tokens[ROLES.THERAPIST]);
      expect(res.status).toBe(403);
    }
  });

  test('no token is 401 on every applications route', async () => {
    for (const path of paths()) {
      resetRateLimits();
      const res = await get(path, NO_TOKEN);
      expect(res.status).toBe(401);
    }
  });
});

describe('applications list', () => {
  test('returns every application, newest first', async () => {
    const res = await get(LIST);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data.map((a) => a.firstName)).toEqual(['Ada', 'Grace', 'Katherine']);
    expect(res.body.meta.total).toBe(3);
  });

  test('carries counts for the badge, unaffected by the current filter', async () => {
    const all = await get(LIST);
    resetRateLimits();
    const filtered = await get(`${LIST}?status=pending`);

    expect(all.body.meta.counts).toEqual({ pending: 1, approved: 1, rejected: 1 });
    // The badge reports the work outstanding, not the chip that is selected.
    expect(filtered.body.meta.counts).toEqual({ pending: 1, approved: 1, rejected: 1 });
    expect(filtered.body.meta.total).toBe(1);
  });

  test.each([
    ['pending', 'Ada'],
    ['approved', 'Grace'],
    ['rejected', 'Katherine'],
  ])('filters by status=%s', async (status, expected) => {
    const res = await get(`${LIST}?status=${status}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].firstName).toBe(expected);
  });

  test('rejects an unknown status rather than ignoring it', async () => {
    const res = await get(`${LIST}?status=maybe`);
    expect(res.status).toBe(422);
  });

  test('paginates', async () => {
    const res = await get(`${LIST}?limit=2&page=2`);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toMatchObject({ page: 2, limit: 2, total: 3, pages: 2 });
  });

  test('refuses an unbounded limit', async () => {
    const res = await get(`${LIST}?limit=100000`);
    expect(res.status).toBe(422);
  });

  test.each([
    ['first name', 'ada'],
    ['last name', 'hopper'],
    ['email', 'katherine@example.com'],
    ['partial email', 'grace@'],
  ])('searches by %s', async (_label, q) => {
    const res = await get(`${LIST}?q=${encodeURIComponent(q)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  test('searches a full name across both name fields', async () => {
    const res = await get(`${LIST}?q=${encodeURIComponent('Ada Lovelace')}`);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].email).toBe('ada@example.com');
  });

  test('ESCAPES regex metacharacters in the search term', async () => {
    // Unescaped, `.*` matches every applicant. It must be treated as literal
    // text, so it matches nobody.
    const res = await get(`${LIST}?q=${encodeURIComponent('.*')}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  test('a catastrophic-backtracking pattern is literal, not evaluated', async () => {
    const res = await get(`${LIST}?q=${encodeURIComponent('(a+)+$')}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  test('never returns a password hash or the applicant private detail', async () => {
    const res = await get(LIST);
    const body = JSON.stringify(res.body);

    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain('$2b$');
    // The list has no use for these, so they are not sent to the browser.
    expect(body).not.toContain('taxpayerIdNumber');
    expect(body).not.toContain('streetAddress');
    expect(body).not.toContain('certificateUrl1');
  });
});

describe('application detail', () => {
  test('returns the full record grouped for review', async () => {
    const res = await get(`${LIST}/${ids.pending}`);

    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe('Ada');
    expect(res.body.taxpayerIdNumber).toBe('TAX-9');
    expect(res.body.streetAddress).toBe('12 Analytical Way');
    expect(res.body.specialtyTags).toEqual(['Anxiety', 'Depression', 'Grief']);
    expect(res.body.workingHours.monday).toMatchObject({ enabled: true, start: '09:00' });
  });

  test('never returns the password hash', async () => {
    const res = await get(`${LIST}/${ids.pending}`);
    const body = JSON.stringify(res.body);

    expect(res.body.passwordHash).toBeUndefined();
    expect(body).not.toContain('$2b$');
  });

  test('NEVER returns a stored document URL', async () => {
    const res = await get(`${LIST}/${ids.pending}`);
    const body = JSON.stringify(res.body);

    // An authenticated Cloudinary URL carries a permanent embedded signature —
    // sending one to the browser grants access that cannot be revoked.
    expect(body).not.toContain('res.cloudinary.com/testcloud/image/authenticated');
    expect(body).not.toContain('certificateUrl1');
    expect(body).not.toContain('certificatePublicId1');
  });

  test('reports which documents exist, without their URLs', async () => {
    const res = await get(`${LIST}/${ids.approved}`);
    const byField = Object.fromEntries(res.body.documents.map((d) => [d.field, d]));

    expect(byField.certificate1).toMatchObject({ present: true, format: 'pdf' });
    expect(byField.certificate2).toMatchObject({ present: true, format: 'jpg' });
    expect(byField.license).toMatchObject({ present: false, format: null });
    expect(byField.certificate1.url).toBeUndefined();
  });

  test('keeps the profile photo URL, which is a public asset', async () => {
    const res = await get(`${LIST}/${ids.pending}`);
    expect(res.body.photoUrl).toContain('/image/upload/');
  });

  test('a malformed id is 400, not a 500', async () => {
    const res = await get(`${LIST}/not-an-id`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_APPLICATION_ID');
  });

  test('an unknown id is 404', async () => {
    const res = await get(`${LIST}/6540000000000000000000aa`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('APPLICATION_NOT_FOUND');
  });
});

describe('document delivery', () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  test('an unknown document field is 400', async () => {
    const res = await get(`${LIST}/${ids.pending}/documents/passport`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('UNKNOWN_DOCUMENT');
  });

  test('a document the application does not carry is 404', async () => {
    const res = await get(`${LIST}/${ids.pending}/documents/license`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('DOCUMENT_MISSING');
  });

  test('streams the file with an inline disposition and no-store caching', async () => {
    const pdf = Buffer.from('%PDF-1.4 fake');
    globalThis.fetch = jest.fn(async () =>
      new Response(pdf, { status: 200, headers: { 'content-type': 'application/pdf' } }),
    );

    const res = await get(`${LIST}/${ids.pending}/documents/certificate1`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toBe('inline; filename="certificate1.pdf"');
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(res.headers['x-content-type-options']).toBe('nosniff');

    // The real bytes arrive, so this is a stream and not a redirect.
    expect(Buffer.from(res.body).toString()).toBe(pdf.toString());

    // The signed URL is generated server-side and never reaches the client —
    // not in the body, and not in a Location header either.
    const requested = globalThis.fetch.mock.calls[0][0];
    expect(requested).toContain('api.cloudinary.com');
    expect(Buffer.from(res.body).toString()).not.toContain('cloudinary');
    expect(JSON.stringify(res.headers)).not.toContain('cloudinary');
    expect(res.headers.location).toBeUndefined();
  });

  test('the filename carries no part of the applicant name', async () => {
    globalThis.fetch = jest.fn(async () =>
      new Response(Buffer.from('x'), {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      }),
    );

    const res = await get(`${LIST}/${ids.pending}/documents/certificate1`);

    expect(res.headers['content-disposition']).not.toMatch(/ada|lovelace/i);
  });

  test('an unexpected upstream content type is not echoed back', async () => {
    // If that path ever served HTML, echoing the type would run someone else's
    // markup on our own origin.
    globalThis.fetch = jest.fn(async () =>
      new Response('<script>alert(1)</script>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );

    const res = await get(`${LIST}/${ids.pending}/documents/certificate1`);

    expect(res.headers['content-type']).toContain('application/octet-stream');
    expect(res.headers['content-type']).not.toContain('text/html');
  });

  test('an upstream failure is a 502, not a leaked Cloudinary error', async () => {
    globalThis.fetch = jest.fn(async () => new Response('nope', { status: 404 }));

    const res = await get(`${LIST}/${ids.pending}/documents/certificate1`);

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('DOCUMENT_UNAVAILABLE');
    expect(JSON.stringify(res.body)).not.toContain('cloudinary');
  });
});
