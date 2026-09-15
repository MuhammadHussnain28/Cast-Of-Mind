import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/User.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { Booking } from '../models/Booking.js';
import { Subscription } from '../models/Subscription.js';
import { hashPassword } from '../utils/password.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { SUBSCRIPTION_STATUS, SUBSCRIPTION_AMOUNT_MINOR } from '../constants/payments.js';
import { PORTAL_ACCESS, CLIENT_THERAPIST_FIELDS } from '../constants/clientPortal.js';
import { resolveAccess } from '../middleware/requireActiveSubscription.js';
import { loginRateLimiter, sessionRateLimiter } from './auth.routes.js';
import { clientRateLimiter } from './client.routes.js';
import { startMemoryMongo, stopMemoryMongo } from '../test/mongoMemory.js';

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const ME = '/api/v1/client/me';
const GATED = '/api/v1/dev/client-gated';

const EMAILS = {
  [ROLES.CLIENT]: 'portal-client@example.com',
  [ROLES.THERAPIST]: 'portal-therapist@example.com',
  [ROLES.ADMIN]: 'portal-admin@example.com',
};
const OTHER_CLIENT_EMAIL = 'portal-other-client@example.com';

const NO_TOKEN = Symbol('no token');
const tokens = {};
const users = {};
let therapistProfileId;

function resetRateLimits() {
  LOOPBACK_KEYS.forEach((key) => {
    loginRateLimiter.resetKey(key);
    sessionRateLimiter.resetKey(key);
    clientRateLimiter.resetKey(key);
  });
}

const auth = (req, token = tokens[ROLES.CLIENT]) =>
  token === NO_TOKEN ? req : req.set('Authorization', `Bearer ${token}`);

const getMe = (token) => auth(request(app).get(ME), token);
const getGated = (token) => auth(request(app).get(GATED), token);

async function signIn(email) {
  resetRateLimits();
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD });
  return res.body.accessToken;
}

const DAY = 24 * 60 * 60 * 1000;
const future = (days = 20) => new Date(Date.now() + days * DAY);
const past = (days = 5) => new Date(Date.now() - days * DAY);

/** Replace the client's subscription with one in the given state. */
async function setSubscription(overrides) {
  await Subscription.deleteMany({ clientId: users[ROLES.CLIENT]._id });
  if (overrides === null) return null;

  const booking = await Booking.findOne({ clientId: users[ROLES.CLIENT]._id });

  return Subscription.create({
    bookingId: booking._id,
    clientId: users[ROLES.CLIENT]._id,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    amount: SUBSCRIPTION_AMOUNT_MINOR,
    startDate: past(10),
    currentPeriodEnd: future(),
    nextBillingDate: future(),
    ...overrides,
  });
}

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([
    User.init(),
    ClientProfile.init(),
    TherapistProfile.init(),
    Booking.init(),
    Subscription.init(),
  ]);

  const passwordHash = await hashPassword(PASSWORD);

  for (const role of Object.values(ROLES)) {
    users[role] = await User.create({
      email: EMAILS[role],
      passwordHash,
      role,
      status: USER_STATUS.ACTIVE,
    });
    tokens[role] = await signIn(EMAILS[role]);
  }

  users.other = await User.create({
    email: OTHER_CLIENT_EMAIL,
    passwordHash,
    role: ROLES.CLIENT,
    status: USER_STATUS.ACTIVE,
  });
  tokens.other = await signIn(OTHER_CLIENT_EMAIL);

  await ClientProfile.create({
    userId: users[ROLES.CLIENT]._id,
    type: 'individual',
    name: 'Rosa',
    age: 34,
    gender: 'female',
    country: 'IE',
    city: 'Galway',
    relationshipStatus: 'Single',
    concernTags: ['Anxiety', 'Grief', 'Stress'],
    therapistGenderPreference: 'female',
  });

  const therapistProfile = await TherapistProfile.create({
    userId: users[ROLES.THERAPIST]._id,
    applicationId: new mongoose.Types.ObjectId(),
    title: 'Dr.',
    firstName: 'Priya',
    lastName: 'Raman',
    gender: 'female',
    dateOfBirth: new Date('1984-06-11'),
    photoUrl: 'https://res.cloudinary.com/demo/image/upload/priya.jpg',
    streetAddress: '14 Marine Road',
    city: 'Kochi',
    stateProvince: 'Kerala',
    zipPostal: '682001',
    country: 'IN',
    timezone: 'Asia/Kolkata',
    therapistType: 'Clinical Psychologist',
    credentialType: 'Diploma/Degree',
    credentialInitials: 'PhD',
    licenseNumber: 'LIC-99812',
    taxpayerIdNumber: 'TAX-55512',
    yearsExperience: 11,
    educationSummary: 'PhD in clinical psychology.',
    currentWorkSituation: 'Private practice.',
    languages: ['English', 'Malayalam'],
    specialtyTags: ['Anxiety', 'Grief', 'Trauma and/or Abuse'],
    treatmentOrientations: ['CBT', 'EMDR'],
    bio: 'I work with adults on anxiety, grief and trauma.',
    licensingStatus: 'Licensed in India.',
    disciplinaryActions: false,
    malpracticeInsurance: true,
    workingHours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: false, start: '', end: '' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '13:00' },
      saturday: { enabled: false, start: '', end: '' },
      sunday: { enabled: false, start: '', end: '' },
      note: 'Evenings by arrangement.',
    },
    certificateUrl1: 'https://res.cloudinary.com/demo/image/authenticated/s--abc--/cert.pdf',
    certificatePublicId1: 'cast-of-mind/certs/abc',
  });
  therapistProfileId = String(therapistProfile._id);

  await Booking.create({
    clientId: users[ROLES.CLIENT]._id,
    therapistId: users[ROLES.THERAPIST]._id,
  });
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(async () => {
  resetRateLimits();
  await setSubscription({});
});

// ---------------------------------------------------------------------------
// resolveAccess — the state machine on its own (§13)
// ---------------------------------------------------------------------------

describe('resolveAccess', () => {
  const now = new Date('2026-09-12T12:00:00Z');

  it('allows an active subscription', () => {
    expect(resolveAccess({ status: SUBSCRIPTION_STATUS.ACTIVE }, now)).toBe(PORTAL_ACCESS.ACTIVE);
  });

  it('allows past_due — a grace period, not a lockout', () => {
    expect(resolveAccess({ status: SUBSCRIPTION_STATUS.PAST_DUE }, now)).toBe(
      PORTAL_ACCESS.PAST_DUE,
    );
  });

  it('allows a cancelled subscription while the paid period is still running', () => {
    const subscription = {
      status: SUBSCRIPTION_STATUS.CANCELLED,
      currentPeriodEnd: new Date('2026-09-30T00:00:00Z'),
    };
    expect(resolveAccess(subscription, now)).toBe(PORTAL_ACCESS.ENDING);
  });

  it('ends a cancelled subscription once the paid period has passed', () => {
    const subscription = {
      status: SUBSCRIPTION_STATUS.CANCELLED,
      currentPeriodEnd: new Date('2026-09-01T00:00:00Z'),
    };
    expect(resolveAccess(subscription, now)).toBe(PORTAL_ACCESS.ENDED);
  });

  it('ends a cancelled subscription carrying no period end', () => {
    expect(resolveAccess({ status: SUBSCRIPTION_STATUS.CANCELLED }, now)).toBe(PORTAL_ACCESS.ENDED);
  });

  it('ends an expired subscription', () => {
    expect(resolveAccess({ status: SUBSCRIPTION_STATUS.EXPIRED }, now)).toBe(PORTAL_ACCESS.ENDED);
  });

  it('ends when there is no subscription at all — fails closed', () => {
    expect(resolveAccess(null, now)).toBe(PORTAL_ACCESS.ENDED);
    expect(resolveAccess(undefined, now)).toBe(PORTAL_ACCESS.ENDED);
  });

  it('ends on an unrecognised status rather than falling through to access', () => {
    expect(resolveAccess({ status: 'something-new' }, now)).toBe(PORTAL_ACCESS.ENDED);
  });
});

// ---------------------------------------------------------------------------
// The gate, over the full request path
// ---------------------------------------------------------------------------

describe('the subscription gate on a protected route', () => {
  it('lets an active client through', async () => {
    const res = await getGated();
    expect(res.status).toBe(200);
    expect(res.body.access).toBe(PORTAL_ACCESS.ACTIVE);
  });

  it('lets a past_due client through', async () => {
    await setSubscription({ status: SUBSCRIPTION_STATUS.PAST_DUE });
    const res = await getGated();
    expect(res.status).toBe(200);
    expect(res.body.access).toBe(PORTAL_ACCESS.PAST_DUE);
  });

  it('lets a cancelled client through until their paid period ends', async () => {
    await setSubscription({
      status: SUBSCRIPTION_STATUS.CANCELLED,
      cancelledAt: past(1),
      currentPeriodEnd: future(9),
    });
    const res = await getGated();
    expect(res.status).toBe(200);
    expect(res.body.access).toBe(PORTAL_ACCESS.ENDING);
  });

  it('blocks a cancelled client once their paid period has passed', async () => {
    await setSubscription({
      status: SUBSCRIPTION_STATUS.CANCELLED,
      cancelledAt: past(40),
      startDate: past(40),
      currentPeriodEnd: past(2),
      nextBillingDate: past(2),
    });
    const res = await getGated();
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('SUBSCRIPTION_ENDED');
  });

  it('blocks an expired client', async () => {
    await setSubscription({ status: SUBSCRIPTION_STATUS.EXPIRED });
    const res = await getGated();
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('SUBSCRIPTION_ENDED');
  });

  it('blocks a client with no subscription record at all', async () => {
    await setSubscription(null);
    const res = await getGated();
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('SUBSCRIPTION_ENDED');
  });

  it('reads the NEWEST subscription, so a re-subscribe restores access', async () => {
    await setSubscription({
      status: SUBSCRIPTION_STATUS.EXPIRED,
      startDate: past(70),
      currentPeriodEnd: past(40),
      nextBillingDate: past(40),
    });
    expect((await getGated()).status).toBe(403);

    const booking = await Booking.findOne({ clientId: users[ROLES.CLIENT]._id });
    await Subscription.create({
      bookingId: booking._id,
      clientId: users[ROLES.CLIENT]._id,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      amount: SUBSCRIPTION_AMOUNT_MINOR,
      startDate: new Date(),
      currentPeriodEnd: future(),
      nextBillingDate: future(),
    });

    resetRateLimits();
    expect((await getGated()).status).toBe(200);
  });

  it('refuses a therapist and an admin before it ever reaches the gate', async () => {
    expect((await getGated(tokens[ROLES.THERAPIST])).status).toBe(403);
    resetRateLimits();
    expect((await getGated(tokens[ROLES.ADMIN])).status).toBe(403);
  });

  it('refuses a request carrying no token', async () => {
    const res = await getGated(NO_TOKEN);
    expect(res.status).toBe(401);
  });

  it('does not name the subscription platform or an amount in the refusal', async () => {
    await setSubscription({ status: SUBSCRIPTION_STATUS.EXPIRED });
    const body = JSON.stringify((await getGated()).body);
    expect(body).not.toMatch(/stripe|sub_|cus_|20000/i);
  });
});

// ---------------------------------------------------------------------------
// /client/me stays reachable in every state — the decision this chunk turns on
// ---------------------------------------------------------------------------

describe('GET /client/me is not behind the gate', () => {
  it('answers for an active client', async () => {
    const res = await getMe();
    expect(res.status).toBe(200);
    expect(res.body.access).toBe(PORTAL_ACCESS.ACTIVE);
  });

  it('answers for an EXPIRED client, so the portal can explain why', async () => {
    await setSubscription({ status: SUBSCRIPTION_STATUS.EXPIRED });
    const res = await getMe();

    expect(res.status).toBe(200);
    expect(res.body.access).toBe(PORTAL_ACCESS.ENDED);
    // The therapist survives an ended subscription — §13 keeps every record so
    // the re-subscribe screen can say who they would be returning to.
    expect(res.body.therapist.firstName).toBe('Priya');
  });

  it('answers for a client with no subscription record', async () => {
    await setSubscription(null);
    const res = await getMe();
    expect(res.status).toBe(200);
    expect(res.body.access).toBe(PORTAL_ACCESS.ENDED);
    expect(res.body.subscription).toBeNull();
  });

  it('reports past_due and cancelled distinctly', async () => {
    await setSubscription({ status: SUBSCRIPTION_STATUS.PAST_DUE });
    expect((await getMe()).body.access).toBe(PORTAL_ACCESS.PAST_DUE);

    resetRateLimits();
    await setSubscription({
      status: SUBSCRIPTION_STATUS.CANCELLED,
      cancelledAt: past(1),
      currentPeriodEnd: future(4),
    });
    const res = await getMe();
    expect(res.body.access).toBe(PORTAL_ACCESS.ENDING);
    // The resolved state and the stored truth are both reported: the portal
    // needs the first to decide what to show, the second to say it honestly.
    expect(res.body.subscription.status).toBe(SUBSCRIPTION_STATUS.CANCELLED);
    expect(res.body.subscription.cancelledAt).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// What /client/me returns, and what it must never return
// ---------------------------------------------------------------------------

describe('GET /client/me payload', () => {
  it('returns the account, profile, booking, therapist and subscription', async () => {
    const { body } = await getMe();

    expect(body.user).toMatchObject({ email: EMAILS[ROLES.CLIENT], role: ROLES.CLIENT });
    expect(body.user.memberSince).toBeTruthy();

    expect(body.profile).toMatchObject({
      type: 'individual',
      name: 'Rosa',
      age: 34,
      country: 'IE',
      city: 'Galway',
      therapistGenderPreference: 'female',
    });
    expect(body.profile.concernTags).toEqual(['Anxiety', 'Grief', 'Stress']);

    expect(body.booking.id).toBeTruthy();
    expect(body.booking.matchedAt).toBeTruthy();

    expect(body.subscription).toMatchObject({
      status: SUBSCRIPTION_STATUS.ACTIVE,
      amount: SUBSCRIPTION_AMOUNT_MINOR,
      currency: 'EUR',
      sessionsRemaining: 4,
    });
    expect(body.subscription.nextBillingDate).toBeTruthy();
  });

  it('returns the therapist basics the portal needs, including working hours', async () => {
    const { body } = await getMe();

    expect(body.therapist).toMatchObject({
      id: therapistProfileId,
      title: 'Dr.',
      firstName: 'Priya',
      lastName: 'Raman',
      therapistType: 'Clinical Psychologist',
      credentialInitials: 'PhD',
      timezone: 'Asia/Kolkata',
    });
    expect(body.therapist.specialtyTags).toEqual(['Anxiety', 'Grief', 'Trauma and/or Abuse']);
    expect(body.therapist.workingHours.monday.start).toBe('09:00');
    expect(body.therapist.workingHours.note).toBe('Evenings by arrangement.');
  });

  it('exposes the therapist PROFILE id, never their user id', async () => {
    const { body } = await getMe();
    expect(body.therapist.id).toBe(therapistProfileId);
    expect(body.therapist.id).not.toBe(String(users[ROLES.THERAPIST]._id));
    expect(body.therapist.userId).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain(String(users[ROLES.THERAPIST]._id));
  });

  it('never returns the therapist fields a client has no business seeing', async () => {
    const { body } = await getMe();

    for (const field of [
      'email',
      'taxpayerIdNumber',
      'licenseNumber',
      'streetAddress',
      'stateProvince',
      'zipPostal',
      'dateOfBirth',
      'educationSummary',
      'currentWorkSituation',
      'licensingStatus',
      'disciplinaryActions',
      'malpracticeInsurance',
      'certificateUrl1',
      'certificatePublicId1',
      'applicationId',
      'status',
    ]) {
      expect(body.therapist[field]).toBeUndefined();
    }

    const serialised = JSON.stringify(body);
    expect(serialised).not.toContain('TAX-55512');
    expect(serialised).not.toContain('LIC-99812');
    expect(serialised).not.toContain('14 Marine Road');
    expect(serialised).not.toContain('authenticated');
  });

  it('never returns a password hash or any session token', async () => {
    const serialised = JSON.stringify((await getMe()).body);
    expect(serialised).not.toMatch(/\$2[aby]\$/);
    expect(serialised).not.toMatch(/passwordHash|refreshTokenHash|resetTokenHash/);
  });

  it('never returns the Stripe identifiers', async () => {
    await setSubscription({
      platformSubscriptionId: 'sub_test_123',
      platformCustomerId: 'cus_test_123',
      checkoutSessionId: 'cs_test_123',
    });

    const { body } = await getMe();
    expect(body.subscription.platformSubscriptionId).toBeUndefined();
    expect(body.subscription.platformCustomerId).toBeUndefined();
    expect(body.subscription.checkoutSessionId).toBeUndefined();
    expect(JSON.stringify(body)).not.toMatch(/sub_test_123|cus_test_123|cs_test_123/);
  });

  it('never mentions private notes, journals or messages', async () => {
    const serialised = JSON.stringify((await getMe()).body);
    expect(serialised).not.toMatch(/privateNote|journal|message/i);
  });

  it('returns only the allowlisted therapist keys, plus the profile id', async () => {
    const { body } = await getMe();
    const allowed = new Set([...CLIENT_THERAPIST_FIELDS, 'id']);
    expect(Object.keys(body.therapist).filter((key) => !allowed.has(key))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Ownership and role guards
// ---------------------------------------------------------------------------

describe('GET /client/me ownership', () => {
  it('serves each client their OWN record — there is no id to tamper with', async () => {
    const mine = await getMe();
    expect(mine.body.user.email).toBe(EMAILS[ROLES.CLIENT]);

    // A second client with no booking gets a clean 404, not somebody else's
    // therapist. The route carries no parameter that could point elsewhere.
    resetRateLimits();
    const theirs = await getMe(tokens.other);
    expect(theirs.status).toBe(404);
    expect(theirs.body.error.code).toBe('NO_ACTIVE_BOOKING');
  });

  it('refuses a therapist, an admin, and an unauthenticated request', async () => {
    expect((await getMe(tokens[ROLES.THERAPIST])).status).toBe(403);
    resetRateLimits();
    expect((await getMe(tokens[ROLES.ADMIN])).status).toBe(403);
    resetRateLimits();
    expect((await getMe(NO_TOKEN)).status).toBe(401);
  });

  it('does not name the required role in the 403', async () => {
    const body = JSON.stringify((await getMe(tokens[ROLES.THERAPIST])).body);
    expect(body).not.toMatch(/client|therapist|admin/i);
  });

  it('refuses an unknown path under the mount rather than 404ing it', async () => {
    // Same reasoning as the admin mount: a 404 here would let an outsider map
    // the portal's surface by comparing it against a 403.
    const res = await auth(request(app).get('/api/v1/client/does-not-exist'), NO_TOKEN);
    expect(res.status).toBe(401);
  });
});
