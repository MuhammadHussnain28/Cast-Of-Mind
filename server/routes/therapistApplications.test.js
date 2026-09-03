import { jest } from '@jest/globals';
import request from 'supertest';

// Email is faked, so the suite sends nothing real and the delivered payloads
// can be inspected directly.
const sendEmail = jest.fn();
jest.unstable_mockModule('../services/email/email.service.js', () => ({
  sendEmail,
  sendPasswordResetEmail: jest.fn(),
}));

const { default: app } = await import('../app.js');
const { submitRateLimiter, statusRateLimiter } = await import('./therapistApplication.routes.js');
const { TherapistApplication, APPLICATION_STATUS } = await import(
  '../models/TherapistApplication.js'
);
const { User } = await import('../models/User.js');
const { ROLES } = await import('../constants/roles.js');
const { hashPassword, comparePassword } = await import('../utils/password.js');
const { DUPLICATE_EMAIL_MESSAGE } = await import('../constants/therapistApplications.js');
const { default: env } = await import('../config/env.js');
const { startMemoryMongo, stopMemoryMongo, clearCollections } = await import(
  '../test/mongoMemory.js'
);

const CLOUD = env.cloudinaryCloudName || 'testcloud';
const photo = `https://res.cloudinary.com/${CLOUD}/image/upload/v1/cast-of-mind/therapist-photos/abc.jpg`;
const cert = `https://res.cloudinary.com/${CLOUD}/image/authenticated/v1/cast-of-mind/certificates/def.pdf`;

beforeAll(async () => {
  await startMemoryMongo();
  await TherapistApplication.init();
  await User.init();
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

afterEach(async () => {
  await clearCollections();
});

beforeEach(() => {
  sendEmail.mockReset();
  sendEmail.mockResolvedValue({ delivered: true });
  submitRateLimiter.resetKey('::ffff:127.0.0.1');
  submitRateLimiter.resetKey('127.0.0.1');
  statusRateLimiter.resetKey('::ffff:127.0.0.1');
  statusRateLimiter.resetKey('127.0.0.1');
});

function validBody(overrides = {}) {
  return {
    title: 'Dr.',
    firstName: 'Amara',
    lastName: 'Okafor',
    gender: 'female',
    dateOfBirth: '1985-04-17',
    email: 'amara@example.com',
    password: 'a-good-long-password',
    photoUrl: photo,

    streetAddress: '14 Rue des Lilas',
    city: 'Lyon',
    stateProvince: 'Auvergne-Rhone-Alpes',
    zipPostal: '69003',
    country: 'France',
    timezone: 'Europe/Paris',
    languages: ['English', 'French'],
    workingHours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '10:00', end: '18:30' },
      note: '',
    },

    therapistType: 'Clinical Psychologist',
    credentialType: 'Diploma/Degree',
    credentialInitials: 'PhD',
    yearsExperience: 9,
    educationSummary: 'PhD in Clinical Psychology, Universite Lumiere Lyon 2.',
    currentWorkSituation: 'Private practice, part time.',

    specialtyTags: ['Anxiety', 'Depression', 'Grief'],
    treatmentOrientations: ['CBT', 'EMDR'],
    bio: 'I work with adults navigating anxiety, low mood and bereavement.',
    licensingStatus: 'Licensed to practise in France.',
    disciplinaryActions: false,

    malpracticeInsurance: true,
    certificateUrl1: cert,

    ...overrides,
  };
}

const post = (body) => request(app).post('/api/v1/therapist-applications').send(body);

describe('POST /therapist-applications — a valid submission', () => {
  it('accepts it and returns an id and status', async () => {
    const res = await post(validBody());

    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^[0-9a-f]{24}$/);
    expect(res.body.status).toBe(APPLICATION_STATUS.PENDING);
    expect(res.body.submittedAt).toBeTruthy();
  });

  it('stores the application as pending', async () => {
    await post(validBody());

    const saved = await TherapistApplication.findOne({ email: 'amara@example.com' });
    expect(saved).not.toBeNull();
    expect(saved.status).toBe(APPLICATION_STATUS.PENDING);
    expect(saved.reviewedAt).toBeNull();
    expect(saved.specialtyTags).toEqual(['Anxiety', 'Depression', 'Grief']);
  });

  it('sends exactly two emails — the applicant and the admin', async () => {
    await post(validBody());

    expect(sendEmail).toHaveBeenCalledTimes(2);
    const recipients = sendEmail.mock.calls.map((c) => c[0].to);
    expect(recipients).toContain('amara@example.com');
    expect(recipients).toContain(env.contactTo || 'amara@example.com');
  });

  it('names the applicant in the admin email subject', async () => {
    await post(validBody());

    const adminCall = sendEmail.mock.calls.find((c) => /New therapist application/.test(c[0].subject));
    expect(adminCall).toBeDefined();
    expect(adminCall[0].subject).toContain('Amara Okafor');
  });

  it('promises no timeline and no outcome in the applicant email', async () => {
    await post(validBody());

    const applicantCall = sendEmail.mock.calls.find((c) => c[0].to === 'amara@example.com');
    const body = `${applicantCall[0].text} ${applicantCall[0].html}`;
    expect(body).not.toMatch(/\b\d+\s*(hours|days|weeks)\b/i);
    expect(body).not.toMatch(/\bapproved\b/i);
    expect(body).not.toMatch(/\bwithin\b/i);
  });

  it('lowercases and trims the email', async () => {
    const res = await post(validBody({ email: '  Amara@Example.COM  ' }));
    expect(res.status).toBe(201);

    const saved = await TherapistApplication.findOne({ email: 'amara@example.com' });
    expect(saved).not.toBeNull();
  });

  it('accepts every optional field left out', async () => {
    const res = await post(validBody());
    expect(res.status).toBe(201);

    const saved = await TherapistApplication.findOne({ email: 'amara@example.com' });
    expect(saved.licenseNumber).toBe('');
    expect(saved.certificateUrl2).toBe('');
    expect(saved.licenseDocUrl).toBe('');
  });

  it('accepts every optional field filled', async () => {
    const res = await post(
      validBody({
        licenseNumber: 'FR-99182',
        taxpayerIdNumber: '1850417123456',
        insuranceDetails: 'AXA, policy 55-2211.',
        certificateUrl2: cert,
        licenseDocUrl: cert,
        certificatePublicId1: 'cast-of-mind/certificates/def',
      }),
    );
    expect(res.status).toBe(201);
  });
});

describe('POST /therapist-applications — password handling', () => {
  it('stores only a bcrypt hash, never the plaintext', async () => {
    await post(validBody());

    const saved = await TherapistApplication.findOne({ email: 'amara@example.com' }).select(
      '+passwordHash',
    );

    expect(saved.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(JSON.stringify(saved.toObject())).not.toContain('a-good-long-password');
    expect(await comparePassword('a-good-long-password', saved.passwordHash)).toBe(true);
  });

  it('never returns the password or its hash in the response', async () => {
    const res = await post(validBody());
    const body = JSON.stringify(res.body);

    expect(body).not.toContain('a-good-long-password');
    expect(body).not.toMatch(/\$2[aby]\$/);
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('rejects a password shorter than 8 characters', async () => {
    const res = await post(validBody({ password: 'short12' }));
    expect(res.status).toBe(422);
  });

  it('rejects a password over 72 bytes, counted in bytes not characters', async () => {
    // 25 three-byte characters = 75 bytes, but only 25 characters.
    const res = await post(validBody({ password: 'é'.repeat(40) }));
    expect(res.status).toBe(422);
  });
});

describe('POST /therapist-applications — duplicate email', () => {
  it('rejects when a user account already exists with that email', async () => {
    await User.create({
      email: 'amara@example.com',
      passwordHash: await hashPassword('something-long-enough'),
      role: ROLES.CLIENT,
    });

    const res = await post(validBody());

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe(DUPLICATE_EMAIL_MESSAGE);
    expect(await TherapistApplication.countDocuments()).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('rejects when a pending application already exists', async () => {
    await post(validBody());
    sendEmail.mockClear();

    const res = await post(validBody({ firstName: 'Someone else' }));

    expect(res.status).toBe(409);
    expect(await TherapistApplication.countDocuments()).toBe(1);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  // The privacy point: the reply must not reveal WHICH kind of record exists.
  it('gives a byte-identical reply for an existing account and a pending application', async () => {
    await User.create({
      email: 'client@example.com',
      passwordHash: await hashPassword('something-long-enough'),
      role: ROLES.CLIENT,
    });
    const fromUser = await post(validBody({ email: 'client@example.com' }));

    await post(validBody({ email: 'applicant@example.com' }));
    const fromApplication = await post(validBody({ email: 'applicant@example.com' }));

    expect(fromUser.status).toBe(fromApplication.status);
    expect(fromUser.body).toEqual(fromApplication.body);
  });

  it('never names the role or the record type in the rejection', async () => {
    await User.create({
      email: 'amara@example.com',
      passwordHash: await hashPassword('something-long-enough'),
      role: ROLES.THERAPIST,
    });

    const res = await post(validBody());
    const message = res.body.error.message.toLowerCase();

    expect(message).not.toContain('therapist');
    expect(message).not.toContain('client');
    expect(message).not.toContain('admin');
  });

  it('lets a rejected applicant apply again', async () => {
    await post(validBody());
    await TherapistApplication.updateOne(
      { email: 'amara@example.com' },
      { status: APPLICATION_STATUS.REJECTED, reviewedAt: new Date() },
    );

    const res = await post(validBody());

    expect(res.status).toBe(201);
    // Both records are kept — the history is not overwritten.
    expect(await TherapistApplication.countDocuments({ email: 'amara@example.com' })).toBe(2);
  });

  it('catches a duplicate that races past the pre-check, via the unique index', async () => {
    const [first, second] = await Promise.all([post(validBody()), post(validBody())]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);
    expect(await TherapistApplication.countDocuments()).toBe(1);
  });
});

describe('POST /therapist-applications — uploaded file URLs must be ours', () => {
  it('rejects a photo URL on someone else’s domain', async () => {
    const res = await post(validBody({ photoUrl: 'https://evil.example/tracker.jpg' }));

    expect(res.status).toBe(422);
    expect(await TherapistApplication.countDocuments()).toBe(0);
  });

  it('rejects a certificate URL on someone else’s domain', async () => {
    const res = await post(validBody({ certificateUrl1: 'https://evil.example/x.pdf' }));
    expect(res.status).toBe(422);
  });

  it('rejects an http Cloudinary URL', async () => {
    const res = await post({ ...validBody(), photoUrl: photo.replace('https://', 'http://') });
    expect(res.status).toBe(422);
  });

  it('rejects a Cloudinary URL from a different account', async () => {
    const res = await post(
      validBody({
        photoUrl: 'https://res.cloudinary.com/someone-else/image/upload/v1/a.jpg',
      }),
    );
    expect(res.status).toBe(422);
  });

  it('rejects a hostname that merely ends with the Cloudinary domain', async () => {
    const res = await post(
      validBody({ photoUrl: 'https://res.cloudinary.com.evil.example/a.jpg' }),
    );
    expect(res.status).toBe(422);
  });

  it('rejects a non-URL string', async () => {
    const res = await post(validBody({ photoUrl: 'not-a-url' }));
    expect(res.status).toBe(422);
  });

  it('rejects a foreign URL in an OPTIONAL upload field too', async () => {
    const res = await post(validBody({ licenseDocUrl: 'https://evil.example/licence.pdf' }));
    expect(res.status).toBe(422);
  });
});

describe('POST /therapist-applications — field validation', () => {
  const mandatory = [
    'title',
    'firstName',
    'lastName',
    'gender',
    'dateOfBirth',
    'email',
    'password',
    'photoUrl',
    'streetAddress',
    'city',
    'stateProvince',
    'zipPostal',
    'country',
    'timezone',
    'languages',
    'workingHours',
    'therapistType',
    'credentialType',
    'credentialInitials',
    'yearsExperience',
    'educationSummary',
    'currentWorkSituation',
    'specialtyTags',
    'treatmentOrientations',
    'bio',
    'licensingStatus',
    'disciplinaryActions',
    'malpracticeInsurance',
    'certificateUrl1',
  ];

  it.each(mandatory)('rejects a submission missing %s, with a field-level message', async (field) => {
    const body = validBody();
    delete body[field];

    const res = await post(body);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details.length).toBeGreaterThan(0);
    expect(await TherapistApplication.countDocuments()).toBe(0);
  });

  it('names the offending field in the error details', async () => {
    const body = validBody();
    delete body.bio;

    const res = await post(body);
    const paths = res.body.error.details.map((d) => d.path);
    expect(paths).toContain('bio');
  });

  it('rejects fewer than 3 specialty tags', async () => {
    const res = await post(validBody({ specialtyTags: ['Anxiety', 'Depression'] }));
    expect(res.status).toBe(422);
  });

  it('rejects more than 4 specialty tags', async () => {
    const res = await post(
      validBody({ specialtyTags: ['Anxiety', 'Depression', 'Grief', 'Stress', 'Parenting'] }),
    );
    expect(res.status).toBe(422);
  });

  it('rejects duplicate specialty tags even when the count is in range', async () => {
    const res = await post(validBody({ specialtyTags: ['Anxiety', 'Anxiety', 'Anxiety'] }));
    expect(res.status).toBe(422);
  });

  it('rejects a specialty tag outside the master list', async () => {
    const res = await post(validBody({ specialtyTags: ['Anxiety', 'Depression', 'OCD'] }));
    expect(res.status).toBe(422);
  });

  it('rejects more than 5 treatment orientations', async () => {
    const res = await post(
      validBody({
        treatmentOrientations: ['ACT', 'CBT', 'DBT', 'EMDR', 'Mindfulness', 'Art Therapy'],
      }),
    );
    expect(res.status).toBe(422);
  });

  it('rejects zero treatment orientations', async () => {
    const res = await post(validBody({ treatmentOrientations: [] }));
    expect(res.status).toBe(422);
  });

  it('rejects a therapist type over 50 characters', async () => {
    const res = await post(validBody({ therapistType: 'x'.repeat(51) }));
    expect(res.status).toBe(422);
  });

  it('accepts a therapist type of exactly 50 characters', async () => {
    const res = await post(validBody({ therapistType: 'x'.repeat(50) }));
    expect(res.status).toBe(201);
  });

  it('rejects fewer than 2 years of experience', async () => {
    const res = await post(validBody({ yearsExperience: 1 }));
    expect(res.status).toBe(422);
  });

  it('rejects a malformed email', async () => {
    const res = await post(validBody({ email: 'not-an-email' }));
    expect(res.status).toBe(422);
  });

  it('rejects a NoSQL injection attempt in the email field', async () => {
    const res = await post(validBody({ email: { $ne: null } }));
    expect(res.status).toBe(422);
  });

  it('rejects an applicant under 18', async () => {
    const sixteen = new Date();
    sixteen.setFullYear(sixteen.getFullYear() - 16);
    const res = await post(validBody({ dateOfBirth: sixteen.toISOString() }));
    expect(res.status).toBe(422);
  });

  it('requires disciplinary details when the answer is yes', async () => {
    const res = await post(validBody({ disciplinaryActions: true }));

    expect(res.status).toBe(422);
    const paths = res.body.error.details.map((d) => d.path);
    expect(paths).toContain('disciplinaryDetails');
  });

  it('accepts a disclosed disciplinary action with details', async () => {
    const res = await post(
      validBody({ disciplinaryActions: true, disciplinaryDetails: 'Formal warning 2014.' }),
    );
    expect(res.status).toBe(201);
  });

  it('accepts an applicant with no malpractice insurance rather than auto-rejecting', async () => {
    const res = await post(validBody({ malpracticeInsurance: false }));
    expect(res.status).toBe(201);
  });

  it('rejects working hours with no day enabled', async () => {
    const res = await post(validBody({ workingHours: { monday: { enabled: false } } }));
    expect(res.status).toBe(422);
  });

  it('rejects an end time before the start time', async () => {
    const res = await post(
      validBody({ workingHours: { monday: { enabled: true, start: '17:00', end: '09:00' } } }),
    );

    expect(res.status).toBe(422);
    const messages = res.body.error.details.map((d) => d.message).join(' ');
    expect(messages).toMatch(/midnight/i);
  });

  it('rejects a non 24-hour time', async () => {
    const res = await post(
      validBody({ workingHours: { monday: { enabled: true, start: '9am', end: '5pm' } } }),
    );
    expect(res.status).toBe(422);
  });

  it('ignores an unknown extra field rather than failing the whole submission', async () => {
    const res = await post(validBody({ favouriteColour: 'sage' }));

    expect(res.status).toBe(201);
    const saved = await TherapistApplication.findOne({ email: 'amara@example.com' }).lean();
    expect(saved.favouriteColour).toBeUndefined();
  });
});

describe('POST /therapist-applications — email failures do not lose the application', () => {
  it('still returns 201 and keeps the record when both emails fail', async () => {
    sendEmail.mockRejectedValue(new Error('Resend is down'));

    const res = await post(validBody());

    expect(res.status).toBe(201);
    expect(await TherapistApplication.countDocuments()).toBe(1);
  });
});

describe('GET /therapist-applications/:id/status', () => {
  async function createOne() {
    const res = await post(validBody());
    return res.body.id;
  }

  it('returns the status', async () => {
    const id = await createOne();
    const res = await request(app).get(`/api/v1/therapist-applications/${id}/status`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(APPLICATION_STATUS.PENDING);
    expect(res.body.submittedAt).toBeTruthy();
    expect(res.body.reviewedAt).toBeNull();
  });

  // MongoDB ids are partly guessable, so this must reveal nothing else.
  it('returns ONLY status and dates — no name, email, or any other field', async () => {
    const id = await createOne();
    const res = await request(app).get(`/api/v1/therapist-applications/${id}/status`);

    expect(Object.keys(res.body).sort()).toEqual(['reviewedAt', 'status', 'submittedAt']);

    const body = JSON.stringify(res.body).toLowerCase();
    expect(body).not.toContain('amara');
    expect(body).not.toContain('example.com');
    expect(body).not.toContain('cloudinary');
    expect(body).not.toContain('anxiety');
  });

  it('reflects a status change after review', async () => {
    const id = await createOne();
    await TherapistApplication.updateOne(
      { _id: id },
      { status: APPLICATION_STATUS.APPROVED, reviewedAt: new Date() },
    );

    const res = await request(app).get(`/api/v1/therapist-applications/${id}/status`);
    expect(res.body.status).toBe(APPLICATION_STATUS.APPROVED);
    expect(res.body.reviewedAt).toBeTruthy();
  });

  // A junk id would otherwise throw a Mongoose CastError and surface as a 500.
  it('returns 400, not 500, for a malformed id', async () => {
    const res = await request(app).get('/api/v1/therapist-applications/not-an-id/status');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_APPLICATION_ID');
  });

  it('returns 404 for a well-formed id that does not exist', async () => {
    const res = await request(app).get(
      '/api/v1/therapist-applications/507f1f77bcf86cd799439011/status',
    );

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('APPLICATION_NOT_FOUND');
  });

  it('never leaks a stack trace', async () => {
    const res = await request(app).get('/api/v1/therapist-applications/not-an-id/status');
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js:\d+/);
  });
});

describe('rate limiting', () => {
  it('blocks the 6th submission in an hour', async () => {
    for (let i = 0; i < 5; i += 1) {
      const res = await post(validBody({ email: `applicant${i}@example.com` }));
      expect(res.status).toBe(201);
    }

    const blocked = await post(validBody({ email: 'applicant6@example.com' }));
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });

  it('counts rejected submissions towards the limit too', async () => {
    for (let i = 0; i < 5; i += 1) {
      await post({ email: 'nope' });
    }

    const blocked = await post(validBody());
    expect(blocked.status).toBe(429);
  });

  it('allows many more status checks than submissions', async () => {
    const id = await createIdOutsideLimiter();

    for (let i = 0; i < 20; i += 1) {
      const res = await request(app).get(`/api/v1/therapist-applications/${id}/status`);
      expect(res.status).toBe(200);
    }
  });

  async function createIdOutsideLimiter() {
    const res = await post(validBody());
    return res.body.id;
  }
});
