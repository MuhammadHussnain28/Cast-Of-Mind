import { jest } from '@jest/globals';
import request from 'supertest';
import { createEmailServiceMock } from '../test/emailServiceMock.js';

// Email is faked so the suite never sends anything, and so the "a failed send
// does not undo the approval" path can be forced.
const sendTherapistWelcomeEmail = jest.fn(async () => ({ delivered: true }));

// Every export is supplied by the shared factory, so adding a new sender to the
// email service does not break this suite — see test/emailServiceMock.js.
jest.unstable_mockModule('../services/email/email.service.js', () =>
  createEmailServiceMock({ sendTherapistWelcomeEmail }),
);

const { default: app } = await import('../app.js');
const { default: env } = await import('../config/env.js');
const { User } = await import('../models/User.js');
const { TherapistProfile } = await import('../models/TherapistProfile.js');
const { TherapistApplication } = await import('../models/TherapistApplication.js');
const { hashPassword, comparePassword } = await import('../utils/password.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { loginRateLimiter, sessionRateLimiter } = await import('./auth.routes.js');
const { adminRateLimiter } = await import('./admin.routes.js');
const { startMemoryReplSet, stopMemoryMongo } = await import('../test/mongoMemory.js');

const ADMIN_PASSWORD = 'correct-horse-battery-staple';
// The password the applicant chose on the form. The whole point of approval is
// that THIS still works afterwards — nothing is regenerated.
const APPLICANT_PASSWORD = 'a-password-only-the-applicant-knows';
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];

const EMAILS = {
  [ROLES.CLIENT]: 'approve-client@example.com',
  [ROLES.THERAPIST]: 'approve-therapist@example.com',
  [ROLES.ADMIN]: 'approve-admin@example.com',
};

const CLOUD = `https://res.cloudinary.com/${env.cloudinaryCloudName || 'testcloud'}`;
const tokens = {};

function resetRateLimits() {
  LOOPBACK_KEYS.forEach((key) => {
    loginRateLimiter.resetKey(key);
    sessionRateLimiter.resetKey(key);
    adminRateLimiter.resetKey(key);
  });
}

function post(path, token = tokens[ROLES.ADMIN], body = {}) {
  const req = request(app).post(path).send(body);
  return token === null ? req : req.set('Authorization', `Bearer ${token}`);
}

let applicantPasswordHash;

async function createApplication(overrides = {}) {
  return TherapistApplication.create({
    title: 'Dr.',
    firstName: 'Ada',
    lastName: 'Lovelace',
    gender: 'female',
    dateOfBirth: new Date('1985-03-02'),
    email: `applicant-${Math.random().toString(36).slice(2, 10)}@example.com`,
    passwordHash: applicantPasswordHash,
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
      wednesday: { enabled: true, start: '10:00', end: '16:00' },
      note: 'Occasional evenings by arrangement.',
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
  });
}

beforeAll(async () => {
  // A REPLICA SET, not a standalone instance: transactions do not exist without
  // one, so the rollback test below would otherwise pass while proving nothing.
  await startMemoryReplSet();
  await User.init();
  await TherapistProfile.init();
  await TherapistApplication.init();

  applicantPasswordHash = await hashPassword(APPLICANT_PASSWORD);
  const adminHash = await hashPassword(ADMIN_PASSWORD);

  for (const role of Object.values(ROLES)) {
    await User.create({
      email: EMAILS[role],
      passwordHash: adminHash,
      role,
      status: USER_STATUS.ACTIVE,
    });

    resetRateLimits();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: EMAILS[role], password: ADMIN_PASSWORD });

    tokens[role] = res.body.accessToken;
  }
}, 120000);

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(() => {
  resetRateLimits();
  sendTherapistWelcomeEmail.mockClear();
  sendTherapistWelcomeEmail.mockImplementation(async () => ({ delivered: true }));
});

describe('approval — the two-document transaction', () => {
  test('creates BOTH the user and the profile', async () => {
    const application = await createApplication();

    const res = await post(`/api/v1/admin/applications/${application._id}/approve`);
    expect(res.status).toBe(200);

    const user = await User.findOne({ email: application.email });
    const profile = await TherapistProfile.findOne({ userId: user._id });

    expect(user).not.toBeNull();
    expect(user.role).toBe(ROLES.THERAPIST);
    expect(user.status).toBe(USER_STATUS.ACTIVE);

    expect(profile).not.toBeNull();
    expect(profile.applicationId.toString()).toBe(application._id.toString());
    expect(profile.status).toBe(USER_STATUS.ACTIVE);
  });

  test('copies the application across faithfully, working hours included', async () => {
    const application = await createApplication();
    await post(`/api/v1/admin/applications/${application._id}/approve`);

    const user = await User.findOne({ email: application.email });
    const profile = await TherapistProfile.findOne({ userId: user._id });

    expect(profile.specialtyTags).toEqual(['Anxiety', 'Depression', 'Grief']);
    expect(profile.treatmentOrientations).toEqual(['CBT', 'Mindfulness']);
    expect(profile.languages).toEqual(['English', 'French']);
    expect(profile.workingHours.monday.start).toBe('09:00');
    expect(profile.workingHours.wednesday.end).toBe('16:00');
    expect(profile.workingHours.note).toBe('Occasional evenings by arrangement.');
    expect(profile.certificateUrl1).toBe(application.certificateUrl1);
    expect(profile.taxpayerIdNumber).toBe('TAX-9');
  });

  test('marks the application approved and stamps reviewedAt', async () => {
    const application = await createApplication();
    await post(`/api/v1/admin/applications/${application._id}/approve`);

    const after = await TherapistApplication.findById(application._id);
    expect(after.status).toBe('approved');
    expect(after.reviewedAt).toBeInstanceOf(Date);
  });

  test('THE APPLICANT CAN LOG IN with the password they chose on the form', async () => {
    const application = await createApplication();
    await post(`/api/v1/admin/applications/${application._id}/approve`);

    resetRateLimits();
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: application.email, password: APPLICANT_PASSWORD });

    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe(ROLES.THERAPIST);

    // Nothing was regenerated — the stored hash still verifies the original.
    const user = await User.findOne({ email: application.email }).select('+passwordHash');
    expect(await comparePassword(APPLICANT_PASSWORD, user.passwordHash)).toBe(true);
  });
});

describe('approval — rollback', () => {
  test('a failure mid-transaction leaves NO partial data behind', async () => {
    const application = await createApplication();

    // Fail after the user is created but before the profile is. This is the
    // exact state the transaction exists to prevent: a therapist who can log in
    // but has no profile is invisible to matching and sees a broken portal.
    const spy = jest
      .spyOn(TherapistProfile, 'create')
      .mockRejectedValueOnce(new Error('storage failed mid-approval'));

    const res = await post(`/api/v1/admin/applications/${application._id}/approve`);
    expect(res.status).toBe(500);

    // The rollback is what is asserted, not just the error.
    expect(await User.countDocuments({ email: application.email })).toBe(0);
    expect(await TherapistProfile.countDocuments({ applicationId: application._id })).toBe(0);

    const after = await TherapistApplication.findById(application._id);
    expect(after.status).toBe('pending');
    expect(after.reviewedAt).toBeNull();

    spy.mockRestore();
  });

  test('no welcome email is sent when the transaction rolls back', async () => {
    const application = await createApplication();
    const spy = jest
      .spyOn(TherapistProfile, 'create')
      .mockRejectedValueOnce(new Error('storage failed mid-approval'));

    await post(`/api/v1/admin/applications/${application._id}/approve`);

    // Telling someone they were approved when they were not is worse than the
    // failure itself, which is why the send happens after the commit.
    expect(sendTherapistWelcomeEmail).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('after a rolled-back attempt, a retry succeeds cleanly', async () => {
    const application = await createApplication();
    const spy = jest
      .spyOn(TherapistProfile, 'create')
      .mockRejectedValueOnce(new Error('storage failed mid-approval'));

    await post(`/api/v1/admin/applications/${application._id}/approve`);
    spy.mockRestore();

    resetRateLimits();
    const retry = await post(`/api/v1/admin/applications/${application._id}/approve`);

    expect(retry.status).toBe(200);
    expect(await User.countDocuments({ email: application.email })).toBe(1);
    expect(await TherapistProfile.countDocuments({ applicationId: application._id })).toBe(1);
  });
});

describe('approval — idempotency and state', () => {
  test('approving twice creates nothing the second time', async () => {
    const application = await createApplication();

    const first = await post(`/api/v1/admin/applications/${application._id}/approve`);
    resetRateLimits();
    const second = await post(`/api/v1/admin/applications/${application._id}/approve`);

    expect(first.status).toBe(200);
    expect(first.body.alreadyApproved).toBe(false);

    expect(second.status).toBe(200);
    expect(second.body.alreadyApproved).toBe(true);
    expect(second.body.userId).toBe(first.body.userId);

    expect(await User.countDocuments({ email: application.email })).toBe(1);
    expect(await TherapistProfile.countDocuments({ applicationId: application._id })).toBe(1);
    expect(sendTherapistWelcomeEmail).toHaveBeenCalledTimes(1);
  });

  test('a rejected application cannot be approved', async () => {
    const application = await createApplication();
    await post(`/api/v1/admin/applications/${application._id}/reject`);

    resetRateLimits();
    const res = await post(`/api/v1/admin/applications/${application._id}/approve`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('APPLICATION_NOT_PENDING');
    expect(await User.countDocuments({ email: application.email })).toBe(0);
  });

  test('an existing account for that email blocks approval, with no partial data', async () => {
    const application = await createApplication();
    await User.create({
      email: application.email,
      passwordHash: applicantPasswordHash,
      role: ROLES.CLIENT,
      status: USER_STATUS.ACTIVE,
    });

    const res = await post(`/api/v1/admin/applications/${application._id}/approve`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
    expect(await TherapistProfile.countDocuments({ applicationId: application._id })).toBe(0);

    const after = await TherapistApplication.findById(application._id);
    expect(after.status).toBe('pending');
  });

  test('a failed welcome email does NOT undo the approval', async () => {
    const application = await createApplication();
    sendTherapistWelcomeEmail.mockRejectedValueOnce(new Error('resend is down'));

    const res = await post(`/api/v1/admin/applications/${application._id}/approve`);

    expect(res.status).toBe(200);
    expect(res.body.emailSent).toBe(false);
    // Losing a whole approval because a notification failed would be far worse
    // than a missing email — the account exists and works.
    expect(await User.countDocuments({ email: application.email })).toBe(1);
    expect(await TherapistProfile.countDocuments({ applicationId: application._id })).toBe(1);
  });

  test('the response carries no password hash', async () => {
    const application = await createApplication();
    const res = await post(`/api/v1/admin/applications/${application._id}/approve`);

    const body = JSON.stringify(res.body);
    expect(body).not.toContain('$2b$');
    expect(body).not.toContain('passwordHash');
  });
});

describe('rejection', () => {
  test('marks rejected, retains the record, and creates NO account', async () => {
    const application = await createApplication();

    const res = await post(`/api/v1/admin/applications/${application._id}/reject`, undefined, {
      reason: 'Insufficient supervised hours.',
    });

    expect(res.status).toBe(200);

    const after = await TherapistApplication.findById(application._id);
    expect(after.status).toBe('rejected');
    expect(after.reviewedAt).toBeInstanceOf(Date);
    expect(after.rejectionReason).toBe('Insufficient supervised hours.');
    // The record is retained permanently (§9.2).
    expect(after).not.toBeNull();

    expect(await User.countDocuments({ email: application.email })).toBe(0);
    expect(await TherapistProfile.countDocuments({ applicationId: application._id })).toBe(0);
  });

  test('sends no email — §16 lists none', async () => {
    const application = await createApplication();
    await post(`/api/v1/admin/applications/${application._id}/reject`);

    expect(sendTherapistWelcomeEmail).not.toHaveBeenCalled();
  });

  test('the reason is optional', async () => {
    const application = await createApplication();
    const res = await post(`/api/v1/admin/applications/${application._id}/reject`);

    expect(res.status).toBe(200);
    const after = await TherapistApplication.findById(application._id);
    expect(after.rejectionReason).toBe('');
  });

  test('an over-long reason is refused', async () => {
    const application = await createApplication();
    const res = await post(`/api/v1/admin/applications/${application._id}/reject`, undefined, {
      reason: 'x'.repeat(1001),
    });

    expect(res.status).toBe(422);
  });

  test('rejecting twice is idempotent and does not overwrite the first decision', async () => {
    const application = await createApplication();
    await post(`/api/v1/admin/applications/${application._id}/reject`, undefined, {
      reason: 'The original reason.',
    });

    resetRateLimits();
    const second = await post(
      `/api/v1/admin/applications/${application._id}/reject`,
      undefined,
      { reason: 'A different reason.' },
    );

    expect(second.status).toBe(200);
    expect(second.body.alreadyRejected).toBe(true);

    const after = await TherapistApplication.findById(application._id);
    expect(after.rejectionReason).toBe('The original reason.');
  });

  test('an approved application cannot be rejected', async () => {
    const application = await createApplication();
    await post(`/api/v1/admin/applications/${application._id}/approve`);

    resetRateLimits();
    const res = await post(`/api/v1/admin/applications/${application._id}/reject`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('APPLICATION_NOT_PENDING');
    // The therapist account stays exactly as it was.
    expect(await User.countDocuments({ email: application.email })).toBe(1);
  });
});

describe('who can approve or reject', () => {
  test('a therapist token cannot approve', async () => {
    const application = await createApplication();
    const res = await post(
      `/api/v1/admin/applications/${application._id}/approve`,
      tokens[ROLES.THERAPIST],
    );

    expect(res.status).toBe(403);
    expect(await User.countDocuments({ email: application.email })).toBe(0);
  });

  test('a client token cannot reject', async () => {
    const application = await createApplication();
    const res = await post(
      `/api/v1/admin/applications/${application._id}/reject`,
      tokens[ROLES.CLIENT],
    );

    expect(res.status).toBe(403);
    const after = await TherapistApplication.findById(application._id);
    expect(after.status).toBe('pending');
  });

  test('no token cannot approve', async () => {
    const application = await createApplication();
    const res = await post(`/api/v1/admin/applications/${application._id}/approve`, null);

    expect(res.status).toBe(401);
    expect(await User.countDocuments({ email: application.email })).toBe(0);
  });

  test('an unknown application is 404', async () => {
    const res = await post('/api/v1/admin/applications/6540000000000000000000aa/approve');
    expect(res.status).toBe(404);
  });
});
