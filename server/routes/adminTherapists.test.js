import { jest } from '@jest/globals';
import request from 'supertest';
import { createEmailServiceMock } from '../test/emailServiceMock.js';

// Only the two this suite actually observes are held; the rest come from the
// shared factory.
const sendPasswordResetEmail = jest.fn(async () => ({ delivered: true }));
const sendEmailChangedNotices = jest.fn(async () => ({
  oldAddressNotified: true,
  newAddressNotified: true,
}));

// Every export is supplied by the shared factory, so adding a new sender to the
// email service does not break this suite — see test/emailServiceMock.js.
jest.unstable_mockModule('../services/email/email.service.js', () =>
  createEmailServiceMock({ sendPasswordResetEmail, sendEmailChangedNotices }),
);

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { TherapistProfile } = await import('../models/TherapistProfile.js');
const { hashPassword } = await import('../utils/password.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { loginRateLimiter, sessionRateLimiter } = await import('./auth.routes.js');
const { adminRateLimiter } = await import('./admin.routes.js');
const { startMemoryReplSet, stopMemoryMongo } = await import('../test/mongoMemory.js');

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const BASE = '/api/v1/admin/therapists';

const EMAILS = {
  [ROLES.CLIENT]: 'mgmt-client@example.com',
  [ROLES.THERAPIST]: 'mgmt-therapist@example.com',
  [ROLES.ADMIN]: 'mgmt-admin@example.com',
};

const NO_TOKEN = Symbol('no token');
const tokens = {};
let passwordHash;

function resetRateLimits() {
  LOOPBACK_KEYS.forEach((key) => {
    loginRateLimiter.resetKey(key);
    sessionRateLimiter.resetKey(key);
    adminRateLimiter.resetKey(key);
  });
}

const auth = (req, token = tokens[ROLES.ADMIN]) =>
  token === NO_TOKEN ? req : req.set('Authorization', `Bearer ${token}`);

const get = (path, token) => auth(request(app).get(path), token);
const patch = (path, body, token) => auth(request(app).patch(path).send(body), token);
const post = (path, token) => auth(request(app).post(path).send({}), token);

/** A real therapist: a users record and a profile, as approval creates them. */
async function createTherapist(overrides = {}) {
  const email = overrides.email ?? `t-${Math.random().toString(36).slice(2, 10)}@example.com`;

  const user = await User.create({
    email,
    passwordHash,
    role: ROLES.THERAPIST,
    status: USER_STATUS.ACTIVE,
  });

  const profile = await TherapistProfile.create({
    userId: user._id,
    applicationId: new (await import('mongoose')).default.Types.ObjectId(),
    title: 'Dr.',
    firstName: overrides.firstName ?? 'Ada',
    lastName: overrides.lastName ?? 'Lovelace',
    gender: 'female',
    dateOfBirth: new Date('1985-03-02'),
    photoUrl: 'https://res.cloudinary.com/x/image/upload/v1/p.jpg',
    streetAddress: '12 Analytical Way',
    city: 'London',
    stateProvince: 'Greater London',
    zipPostal: 'W1A 1AA',
    country: 'United Kingdom',
    timezone: 'Europe/London',
    languages: ['English'],
    workingHours: { monday: { enabled: true, start: '09:00', end: '17:00' } },
    therapistType: 'Clinical Psychologist',
    credentialType: 'License',
    credentialInitials: 'PhD',
    licenseNumber: 'LIC-1',
    taxpayerIdNumber: 'TAX-9',
    yearsExperience: 9,
    educationSummary: 'PhD in clinical psychology.',
    currentWorkSituation: 'Private practice.',
    specialtyTags: ['Anxiety', 'Depression', 'Grief'],
    treatmentOrientations: ['CBT'],
    bio: 'I work with adults on anxiety and grief.',
    licensingStatus: 'Licensed in the UK.',
    disciplinaryActions: false,
    malpracticeInsurance: true,
    certificateUrl1: 'https://res.cloudinary.com/x/image/authenticated/s--a--/v1/c.pdf',
    status: USER_STATUS.ACTIVE,
  });

  return { user, profile, email };
}

beforeAll(async () => {
  // Editing and status changes are transactional, so this suite needs a replica
  // set — on a standalone instance the rollback assertions would pass while
  // proving nothing.
  await startMemoryReplSet();
  await User.init();
  await TherapistProfile.init();

  passwordHash = await hashPassword(PASSWORD);

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
}, 120000);

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(() => {
  resetRateLimits();
  sendEmailChangedNotices.mockClear();
  sendPasswordResetEmail.mockClear();
});

describe('the list', () => {
  test('returns therapists with their email, status and practice figures', async () => {
    const { email } = await createTherapist({ firstName: 'Grace', lastName: 'Hopper' });

    const res = await get(BASE);
    const row = res.body.data.find((t) => t.email === email);

    expect(res.status).toBe(200);
    expect(row).toBeDefined();
    expect(row.status).toBe('active');
    expect(row.activeClients).toBe(0);
    expect(row.averageRating).toBeNull();
  });

  test('searches by first name, last name and email', async () => {
    const { email } = await createTherapist({ firstName: 'Katherine', lastName: 'Johnson' });

    for (const term of ['katherine', 'johnson', email]) {
      resetRateLimits();
      const res = await get(`${BASE}?q=${encodeURIComponent(term)}`);
      expect(res.body.data.some((t) => t.email === email)).toBe(true);
    }
  });

  test('escapes regex metacharacters in the search term', async () => {
    const res = await get(`${BASE}?q=${encodeURIComponent('.*')}`);
    expect(res.body.data).toHaveLength(0);
  });

  test('filters by status', async () => {
    const { profile, user } = await createTherapist();
    await TherapistProfile.updateOne({ _id: profile._id }, { status: USER_STATUS.INACTIVE });
    await User.updateOne({ _id: user._id }, { status: USER_STATUS.INACTIVE });

    resetRateLimits();
    const res = await get(`${BASE}?status=inactive`);

    expect(res.body.data.every((t) => t.status === 'inactive')).toBe(true);
    expect(res.body.data.some((t) => t._id === profile._id.toString())).toBe(true);
  });

  test('never leaks a password hash or a refresh token', async () => {
    const body = JSON.stringify((await get(BASE)).body);

    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain('refreshTokenHash');
    expect(body).not.toContain('$2b$');
  });
});

describe('the detail', () => {
  test('returns the profile with email, account status and figures', async () => {
    const { profile, email } = await createTherapist();

    const res = await get(`${BASE}/${profile._id}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
    expect(res.body.accountStatus).toBe('active');
    expect(res.body.specialtyTags).toEqual(['Anxiety', 'Depression', 'Grief']);
    expect(res.body.activeClients).toBe(0);
    expect(res.body.averageRating).toBeNull();
    // 10.3: the review LIST pages from GET /admin/reviews; the detail carries
    // the summary — including every star at zero rather than a missing shape.
    expect(res.body.reviewCount).toBe(0);
    expect(res.body.distribution).toEqual({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
    expect(res.body.reviews).toBeUndefined();
  });

  test('CARRIES NO CONVERSATION DATA OF ANY KIND', async () => {
    const { profile } = await createTherapist();
    const res = await get(`${BASE}/${profile._id}`);
    const body = JSON.stringify(res.body).toLowerCase();

    // §11: an admin conversation viewer was proposed and the client decided
    // against building it. This pins that decision rather than trusting it.
    expect(body).not.toContain('message');
    expect(body).not.toContain('journal');
    expect(body).not.toContain('privatenote');
    expect(res.body.messages).toBeUndefined();
    expect(res.body.journals).toBeUndefined();
    expect(res.body.privateNotes).toBeUndefined();
  });

  test('never returns the password hash', async () => {
    const { profile } = await createTherapist();
    const body = JSON.stringify((await get(`${BASE}/${profile._id}`)).body);

    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain('$2b$');
  });

  test('a malformed id is 400 and an unknown one is 404', async () => {
    expect((await get(`${BASE}/nope`)).status).toBe(400);
    resetRateLimits();
    expect((await get(`${BASE}/6540000000000000000000aa`)).status).toBe(404);
  });
});

describe('editing the admin-controlled fields', () => {
  test('edits specialty tags and the change persists', async () => {
    const { profile } = await createTherapist();

    const res = await patch(`${BASE}/${profile._id}`, {
      specialtyTags: ['Trauma and/or Abuse', 'Grief', 'Parenting', 'Anxiety'],
    });

    expect(res.status).toBe(200);

    const after = await TherapistProfile.findById(profile._id);
    expect(after.specialtyTags).toEqual([
      'Trauma and/or Abuse',
      'Grief',
      'Parenting',
      'Anxiety',
    ]);
  });

  test('edits name, title and credentials together', async () => {
    const { profile } = await createTherapist();

    await patch(`${BASE}/${profile._id}`, {
      title: 'Prof.',
      firstName: 'Augusta',
      lastName: 'King',
      therapistType: 'Counselling Psychologist',
      credentialType: 'Certificate',
      credentialInitials: 'MSc',
      licenseNumber: 'LIC-77',
    });

    const after = await TherapistProfile.findById(profile._id);
    expect(after.title).toBe('Prof.');
    expect(after.firstName).toBe('Augusta');
    expect(after.therapistType).toBe('Counselling Psychologist');
    expect(after.credentialInitials).toBe('MSc');
    expect(after.licenseNumber).toBe('LIC-77');
  });

  test('REFUSES a field the admin may not edit, rather than ignoring it', async () => {
    const { profile } = await createTherapist();

    // Silently dropping this would tell the admin it saved when it did not.
    const res = await patch(`${BASE}/${profile._id}`, { bio: 'Rewritten by the admin.' });

    expect(res.status).toBe(422);

    const after = await TherapistProfile.findById(profile._id);
    expect(after.bio).toBe('I work with adults on anxiety and grief.');
  });

  test.each([
    ['workingHours', { workingHours: { monday: { enabled: false } } }],
    ['photoUrl', { photoUrl: 'https://res.cloudinary.com/x/image/upload/v1/other.jpg' }],
    ['status', { status: 'inactive' }],
    ['taxpayerIdNumber', { taxpayerIdNumber: 'TAX-CHANGED' }],
  ])('refuses %s', async (_label, payload) => {
    const { profile } = await createTherapist();
    const res = await patch(`${BASE}/${profile._id}`, payload);
    expect(res.status).toBe(422);
  });

  test('rejects a tag outside the master list, and duplicates', async () => {
    const { profile } = await createTherapist();

    const unknown = await patch(`${BASE}/${profile._id}`, {
      specialtyTags: ['Anxiety', 'Depression', 'Sadness'],
    });
    resetRateLimits();
    const duplicated = await patch(`${BASE}/${profile._id}`, {
      specialtyTags: ['Anxiety', 'Anxiety', 'Anxiety'],
    });

    expect(unknown.status).toBe(422);
    expect(duplicated.status).toBe(422);
  });

  test('changes the login email and notifies BOTH addresses', async () => {
    const { profile, email, user } = await createTherapist();

    const res = await patch(`${BASE}/${profile._id}`, { email: 'moved@example.com' });

    expect(res.status).toBe(200);
    expect(await User.findById(user._id).then((u) => u.email)).toBe('moved@example.com');

    expect(sendEmailChangedNotices).toHaveBeenCalledWith(
      expect.objectContaining({ previousEmail: email, newEmail: 'moved@example.com' }),
    );
  });

  test('a duplicate email is a clean 409 and nothing is applied', async () => {
    const { profile } = await createTherapist();
    const other = await createTherapist();

    const res = await patch(`${BASE}/${profile._id}`, {
      email: other.email,
      firstName: 'ShouldNotPersist',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');

    // The transaction is what guarantees this: the name must not survive a
    // rejected email change.
    const after = await TherapistProfile.findById(profile._id);
    expect(after.firstName).toBe('Ada');
  });

  test('a failed notice does not undo the edit', async () => {
    const { profile } = await createTherapist();
    sendEmailChangedNotices.mockRejectedValueOnce(new Error('resend is down'));

    const res = await patch(`${BASE}/${profile._id}`, { email: 'still-saved@example.com' });

    expect(res.status).toBe(200);
    expect(await User.findOne({ email: 'still-saved@example.com' })).not.toBeNull();
  });

  test('an empty edit is refused', async () => {
    const { profile } = await createTherapist();
    expect((await patch(`${BASE}/${profile._id}`, {})).status).toBe(400);
  });
});

describe('deactivate and reactivate', () => {
  test('deactivating flips BOTH the user and the profile', async () => {
    const { profile, user } = await createTherapist();

    const res = await post(`${BASE}/${profile._id}/deactivate`);

    expect(res.status).toBe(200);
    // Only flipping the user would leave a therapist matching can still offer
    // to a client, who cannot log in to answer them.
    expect(await User.findById(user._id).then((u) => u.status)).toBe('inactive');
    expect(await TherapistProfile.findById(profile._id).then((p) => p.status)).toBe('inactive');
  });

  test('A DEACTIVATED THERAPIST CANNOT LOG IN', async () => {
    const { profile, email } = await createTherapist();
    await post(`${BASE}/${profile._id}/deactivate`);

    resetRateLimits();
    const login = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD });

    expect(login.status).toBe(401);
    // The same generic message as any other failure — a distinct one would
    // confirm the address exists.
    expect(login.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('reactivating restores both records and login works again', async () => {
    const { profile, email } = await createTherapist();
    await post(`${BASE}/${profile._id}/deactivate`);
    resetRateLimits();
    await post(`${BASE}/${profile._id}/reactivate`);

    expect(await TherapistProfile.findById(profile._id).then((p) => p.status)).toBe('active');

    resetRateLimits();
    const login = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD });
    expect(login.status).toBe(200);
  });

  test('deactivating twice is idempotent', async () => {
    const { profile } = await createTherapist();
    await post(`${BASE}/${profile._id}/deactivate`);
    resetRateLimits();
    const second = await post(`${BASE}/${profile._id}/deactivate`);

    expect(second.status).toBe(200);
    expect(second.body.alreadyInState).toBe(true);
  });
});

describe('password reset', () => {
  test('sends the standard reset email and returns no password', async () => {
    const { profile, email } = await createTherapist();

    const res = await post(`${BASE}/${profile._id}/reset-password`);

    expect(res.status).toBe(200);
    expect(res.body.sent).toBe(true);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(email, expect.stringContaining('token='));

    // The admin never sees or chooses a password — §11.
    const body = JSON.stringify(res.body).toLowerCase();
    expect(body).not.toContain('password"');
    expect(body).not.toContain('$2b$');
  });

  test('stores only a HASHED reset token', async () => {
    const { profile, user } = await createTherapist();
    await post(`${BASE}/${profile._id}/reset-password`);

    const stored = await User.findById(user._id).select('+resetTokenHash');
    const sentUrl = sendPasswordResetEmail.mock.calls.at(-1)[1];
    const rawToken = new URL(sentUrl).searchParams.get('token');

    expect(stored.resetTokenHash).toBeTruthy();
    expect(stored.resetTokenHash).not.toBe(rawToken);
  });

  test('tells the admin plainly when the therapist is deactivated', async () => {
    const { profile } = await createTherapist();
    await post(`${BASE}/${profile._id}/deactivate`);
    resetRateLimits();

    const res = await post(`${BASE}/${profile._id}/reset-password`);

    expect(res.status).toBe(200);
    expect(res.body.sent).toBe(false);
    expect(res.body.message).toMatch(/deactivated/i);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe('access', () => {
  test.each([
    ['client', ROLES.CLIENT],
    ['therapist', ROLES.THERAPIST],
  ])('a %s token is refused from every route', async (_label, role) => {
    const { profile } = await createTherapist();

    for (const call of [
      () => get(BASE, tokens[role]),
      () => get(`${BASE}/${profile._id}`, tokens[role]),
      () => patch(`${BASE}/${profile._id}`, { firstName: 'Nope' }, tokens[role]),
      () => post(`${BASE}/${profile._id}/deactivate`, tokens[role]),
      () => post(`${BASE}/${profile._id}/reset-password`, tokens[role]),
    ]) {
      resetRateLimits();
      expect((await call()).status).toBe(403);
    }

    // Nothing was changed by any of the refused calls.
    expect(await TherapistProfile.findById(profile._id).then((p) => p.firstName)).toBe('Ada');
  });

  test('no token is 401', async () => {
    const { profile } = await createTherapist();
    expect((await get(`${BASE}/${profile._id}`, NO_TOKEN)).status).toBe(401);
  });
});
