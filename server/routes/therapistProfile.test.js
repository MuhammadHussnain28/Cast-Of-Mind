import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/User.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { hashPassword } from '../utils/password.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { THERAPIST_EDITABLE_FIELDS } from '../constants/therapistProfile.js';
import { EDITABLE_PROFILE_FIELDS } from '../constants/adminTherapists.js';
import { loginRateLimiter, sessionRateLimiter } from './auth.routes.js';
import { therapistRateLimiter } from './therapist.routes.js';
import env from '../config/env.js';
import { startMemoryMongo, stopMemoryMongo } from '../test/mongoMemory.js';

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const PROFILE = '/api/v1/therapist/profile';
// isOwnCloudinaryUrl pins a URL to the CONFIGURED cloud name, so the fixtures
// have to use whatever this environment is set to — a hardcoded name is
// correctly rejected, and the photo test then fails for the wrong reason.
const CLOUD = `https://res.cloudinary.com/${env.cloudinaryCloudName || 'testcloud'}`;

const EMAILS = {
  [ROLES.CLIENT]: 'own-client@example.com',
  [ROLES.THERAPIST]: 'own-therapist@example.com',
  [ROLES.ADMIN]: 'own-admin@example.com',
};

const NO_TOKEN = Symbol('no token');
const tokens = {};
const users = {};
let profileId;

function resetRateLimits() {
  LOOPBACK_KEYS.forEach((key) => {
    loginRateLimiter.resetKey(key);
    sessionRateLimiter.resetKey(key);
    therapistRateLimiter.resetKey(key);
  });
}

const auth = (req, token = tokens[ROLES.THERAPIST]) =>
  token === NO_TOKEN ? req : req.set('Authorization', `Bearer ${token}`);

const get = (token) => auth(request(app).get(PROFILE), token);
const patch = (body, token) => auth(request(app).patch(PROFILE).send(body), token);

const ORIGINAL_BIO = 'I work with adults on anxiety and grief.';

beforeAll(async () => {
  await startMemoryMongo();
  await User.init();
  await TherapistProfile.init();

  const passwordHash = await hashPassword(PASSWORD);

  for (const role of Object.values(ROLES)) {
    users[role] = await User.create({
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

  const profile = await TherapistProfile.create({
    userId: users[ROLES.THERAPIST]._id,
    applicationId: new mongoose.Types.ObjectId(),
    title: 'Dr.',
    firstName: 'Ada',
    lastName: 'Lovelace',
    gender: 'female',
    dateOfBirth: new Date('1985-03-02'),
    photoUrl: `${CLOUD}/image/upload/v1/cast-of-mind/therapist-photos/p.jpg`,
    streetAddress: '12 Analytical Way',
    city: 'London',
    stateProvince: 'Greater London',
    zipPostal: 'W1A 1AA',
    country: 'United Kingdom',
    timezone: 'Europe/London',
    languages: ['English', 'French'],
    workingHours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      note: 'Evenings by arrangement.',
    },
    therapistType: 'Clinical Psychologist',
    credentialType: 'License',
    credentialInitials: 'PhD',
    licenseNumber: 'LIC-1',
    taxpayerIdNumber: 'TAX-SECRET',
    yearsExperience: 9,
    educationSummary: 'PhD in clinical psychology.',
    currentWorkSituation: 'Private practice.',
    specialtyTags: ['Anxiety', 'Depression', 'Grief'],
    treatmentOrientations: ['CBT'],
    bio: ORIGINAL_BIO,
    licensingStatus: 'Licensed in the UK.',
    disciplinaryActions: false,
    malpracticeInsurance: true,
    certificateUrl1: `${CLOUD}/image/authenticated/s--a--/v1/c.pdf`,
    status: USER_STATUS.ACTIVE,
  });

  profileId = profile._id;
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(async () => {
  resetRateLimits();
  await TherapistProfile.updateOne(
    { _id: profileId },
    {
      bio: ORIGINAL_BIO,
      photoUrl: `${CLOUD}/image/upload/v1/cast-of-mind/therapist-photos/p.jpg`,
      specialtyTags: ['Anxiety', 'Depression', 'Grief'],
    },
  );
});

describe('THE ALLOWLISTS', () => {
  test('a therapist may edit exactly photo and bio', () => {
    expect([...THERAPIST_EDITABLE_FIELDS].sort()).toEqual(['bio', 'photoUrl']);
  });

  test('the therapist and admin allowlists are DISJOINT', () => {
    // A field editable by both parties, under different rules, is a field whose
    // value nobody owns. This fails the moment a future chunk hands the same
    // field to both.
    const overlap = THERAPIST_EDITABLE_FIELDS.filter((field) =>
      EDITABLE_PROFILE_FIELDS.includes(field),
    );

    expect(overlap).toEqual([]);
  });
});

describe('reading your own profile', () => {
  test('returns the fields §8.7 lists, plus stats and member since', async () => {
    const res = await get();

    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe('Ada');
    expect(res.body.specialtyTags).toEqual(['Anxiety', 'Depression', 'Grief']);
    expect(res.body.languages).toEqual(['English', 'French']);
    expect(res.body.country).toBe('United Kingdom');
    expect(res.body.timezone).toBe('Europe/London');
    expect(res.body.workingHours.monday.start).toBe('09:00');
    expect(res.body.educationSummary).toBe('PhD in clinical psychology.');
    expect(res.body.licensingStatus).toBe('Licensed in the UK.');
    expect(res.body.memberSince).toBeTruthy();
  });

  test('practice stats are three simple counts, all zero before any bookings', async () => {
    const res = await get();

    // §8.7: simple counts only. Charts and trends are admin territory.
    expect(res.body.stats).toEqual({
      activeClients: 0,
      totalClientsHelped: 0,
      sessionsCompleted: 0,
    });
  });

  test('does NOT return the taxpayer id, home address or documents', async () => {
    const body = JSON.stringify((await get()).body);

    // None are on §8.7's display list, and there is no reason to put a tax
    // number back on the wire to render a profile page.
    expect(body).not.toContain('TAX-SECRET');
    expect(body).not.toContain('Analytical Way');
    expect(body).not.toContain('certificateUrl1');
    expect(body).not.toContain('passwordHash');
  });

  test('takes the therapist from the token — there is no id to tamper with', async () => {
    // A second therapist gets their OWN profile from the same URL.
    const other = await User.create({
      email: 'other-therapist@example.com',
      passwordHash: await hashPassword(PASSWORD),
      role: ROLES.THERAPIST,
      status: USER_STATUS.ACTIVE,
    });

    resetRateLimits();
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'other-therapist@example.com', password: PASSWORD });

    resetRateLimits();
    const res = await get(login.body.accessToken);

    // They have no profile, so they get a 404 — never Ada's record.
    expect(res.status).toBe(404);
    await User.deleteOne({ _id: other._id });
  });
});

describe('THE LOCK — what a therapist may change', () => {
  test('the bio saves', async () => {
    const res = await patch({ bio: 'Updated by the therapist.' });

    expect(res.status).toBe(200);
    expect(await TherapistProfile.findById(profileId).then((p) => p.bio)).toBe(
      'Updated by the therapist.',
    );
  });

  test('the photo saves', async () => {
    const photoUrl = `${CLOUD}/image/upload/v1/cast-of-mind/therapist-photos/new.jpg`;
    const res = await patch({ photoUrl });

    expect(res.status).toBe(200);
    expect(await TherapistProfile.findById(profileId).then((p) => p.photoUrl)).toBe(photoUrl);
  });

  test('SPECIALTY TAGS ARE REFUSED — the chunk\'s verify step', async () => {
    const res = await patch({ specialtyTags: ['Addictions', 'Autism', 'Divorce'] });

    expect(res.status).toBe(422);

    // The tags that decide who is matched with this therapist are unchanged.
    expect(await TherapistProfile.findById(profileId).then((p) => p.specialtyTags)).toEqual([
      'Anxiety',
      'Depression',
      'Grief',
    ]);
  });

  test('specialty tags are refused even when sent ALONGSIDE a legitimate bio', async () => {
    // The dangerous shape: a valid edit carrying a locked field. Dropping the
    // tags silently and saving the bio would report success for both.
    const res = await patch({
      bio: 'A legitimate change.',
      specialtyTags: ['Addictions', 'Autism', 'Divorce'],
    });

    expect(res.status).toBe(422);

    const after = await TherapistProfile.findById(profileId);
    expect(after.specialtyTags).toEqual(['Anxiety', 'Depression', 'Grief']);
    // Neither half applied — the whole request is rejected.
    expect(after.bio).toBe(ORIGINAL_BIO);
  });

  test.each([
    ['credentialType', { credentialType: 'Certificate' }],
    ['credentialInitials', { credentialInitials: 'FAKE' }],
    ['firstName', { firstName: 'Augusta' }],
    ['lastName', { lastName: 'King' }],
    ['title', { title: 'Prof.' }],
    ['therapistType', { therapistType: 'Something Else' }],
    ['licenseNumber', { licenseNumber: 'LIC-FAKE' }],
    ['status', { status: 'inactive' }],
    ['workingHours', { workingHours: { monday: { enabled: false } } }],
    ['languages', { languages: ['Klingon'] }],
    ['yearsExperience', { yearsExperience: 40 }],
    ['educationSummary', { educationSummary: 'Rewritten.' }],
    ['userId', { userId: '6540000000000000000000aa' }],
    ['email', { email: 'moved@example.com' }],
  ])('refuses %s', async (_label, payload) => {
    const res = await patch(payload);
    expect(res.status).toBe(422);
  });

  test('a locked field cannot be changed through the model either', async () => {
    await patch({ credentialInitials: 'FAKE' });

    const after = await TherapistProfile.findById(profileId);
    expect(after.credentialInitials).toBe('PhD');
    expect(after.status).toBe('active');
  });

  test('a photo URL pointing anywhere but our own Cloudinary is refused', async () => {
    const res = await patch({ photoUrl: 'https://evil.example/tracker.jpg' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_PHOTO_URL');
  });

  test('an over-long bio is refused', async () => {
    const res = await patch({ bio: 'x'.repeat(1201) });
    expect(res.status).toBe(422);
  });

  test('an empty edit is refused', async () => {
    expect((await patch({})).status).toBe(400);
  });

  test('the response carries no password hash', async () => {
    const body = JSON.stringify((await patch({ bio: 'Anything.' })).body);
    expect(body).not.toContain('$2b$');
    expect(body).not.toContain('passwordHash');
  });
});

describe('access', () => {
  test.each([
    ['client', ROLES.CLIENT],
    ['admin', ROLES.ADMIN],
  ])('a %s token cannot reach the therapist profile', async (_label, role) => {
    expect((await get(tokens[role])).status).toBe(403);
    resetRateLimits();
    expect((await patch({ bio: 'Nope.' }, tokens[role])).status).toBe(403);
  });

  test('no token is 401', async () => {
    expect((await get(NO_TOKEN)).status).toBe(401);
  });

  test('an unknown path under /therapist is guarded, not 404', async () => {
    const res = await request(app)
      .get('/api/v1/therapist/does-not-exist')
      .set('Authorization', `Bearer ${tokens[ROLES.CLIENT]}`);

    expect(res.status).toBe(403);
  });
});
