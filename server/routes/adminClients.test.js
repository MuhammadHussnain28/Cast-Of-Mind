import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { createEmailServiceMock } from '../test/emailServiceMock.js';

const sendPasswordResetEmail = jest.fn(async () => ({ delivered: true }));

jest.unstable_mockModule('../services/email/email.service.js', () =>
  createEmailServiceMock({ sendPasswordResetEmail }),
);

/**
 * Stripe is faked, so no test touches a real account, spends quota or cancels
 * anything. Faking it is also the only way to assert the ordering this chunk
 * turns on — that a failed Stripe call leaves our record untouched.
 *
 * Always configured. Jest builds an ESM mock's namespace once, so
 * `isStripeConfigured` cannot be flipped between cases in one suite; the
 * unconfigured branch is noted where it would have been tested.
 */
const stripeUpdate = jest.fn(async () => ({ id: 'sub_test', cancel_at_period_end: true }));
const stripeCancel = jest.fn(async () => ({ id: 'sub_test', status: 'canceled' }));

jest.unstable_mockModule('../config/stripe.js', () => ({
  stripe: { subscriptions: { update: stripeUpdate, cancel: stripeCancel } },
  isStripeConfigured: true,
  isTestKey: true,
  default: { subscriptions: { update: stripeUpdate, cancel: stripeCancel } },
}));

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { TherapistProfile } = await import('../models/TherapistProfile.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { hashPassword } = await import('../utils/password.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { SUBSCRIPTION_STATUS, SUBSCRIPTION_AMOUNT_MINOR, BOOKING_STATUS, CANCELLED_BY } =
  await import('../constants/payments.js');
const { loginRateLimiter, sessionRateLimiter } = await import('./auth.routes.js');
const { adminRateLimiter } = await import('./admin.routes.js');
const { startMemoryMongo, stopMemoryMongo } = await import('../test/mongoMemory.js');

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const BASE = '/api/v1/admin/clients';
const DAY = 24 * 60 * 60 * 1000;
const GONE_ID = '64b7f0c2a1b2c3d4e5f60718';

const EMAILS = {
  [ROLES.CLIENT]: 'ac-client@example.com',
  [ROLES.THERAPIST]: 'ac-therapist@example.com',
  [ROLES.ADMIN]: 'ac-admin@example.com',
};

const NO_TOKEN = Symbol('no token');
const tokens = {};
let passwordHash;
let therapist;

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
const post = (path, token) => auth(request(app).post(path).send({}), token);

async function createTherapist() {
  const user = await User.create({
    email: `ther-${Math.random().toString(36).slice(2, 10)}@example.com`,
    passwordHash,
    role: ROLES.THERAPIST,
    status: USER_STATUS.ACTIVE,
  });

  const profile = await TherapistProfile.create({
    userId: user._id,
    applicationId: new mongoose.Types.ObjectId(),
    title: 'Dr.',
    firstName: 'Priya',
    lastName: 'Raman',
    gender: 'female',
    dateOfBirth: new Date('1985-04-02'),
    photoUrl: 'https://res.cloudinary.com/x/image/upload/v1/p.jpg',
    streetAddress: '1 Quay Street',
    city: 'Galway',
    stateProvince: 'Connacht',
    zipPostal: 'H91',
    country: 'Ireland',
    timezone: 'Europe/Dublin',
    languages: ['English'],
    workingHours: { monday: { enabled: true, start: '09:00', end: '17:00' } },
    therapistType: 'Clinical Psychologist',
    credentialType: 'License',
    credentialInitials: 'PhD',
    yearsExperience: 9,
    educationSummary: 'Doctorate in clinical psychology.',
    currentWorkSituation: 'Private practice.',
    specialtyTags: ['Anxiety', 'Depression', 'Grief'],
    treatmentOrientations: ['CBT'],
    bio: 'Works with anxiety and low mood.',
    licensingStatus: 'Licensed in Ireland.',
    disciplinaryActions: false,
    malpracticeInsurance: true,
    certificateUrl1: 'https://res.cloudinary.com/x/image/authenticated/s--a--/v1/c.pdf',
    status: USER_STATUS.ACTIVE,
  });

  return { user, profile };
}

/** A real client: the four documents the payment transaction creates. */
async function createClient(overrides = {}) {
  const email = overrides.email ?? `c-${Math.random().toString(36).slice(2, 10)}@example.com`;

  const user = await User.create({
    email,
    passwordHash,
    role: ROLES.CLIENT,
    status: overrides.accountStatus ?? USER_STATUS.ACTIVE,
  });

  const profile = await ClientProfile.create({
    userId: user._id,
    type: overrides.type ?? 'individual',
    country: 'Ireland',
    city: 'Dublin',
    relationshipStatus: 'Single',
    concernTags: overrides.concernTags ?? ['Anxiety', 'Stress', 'Sleep Issues or Insomnia'],
    therapistGenderPreference: 'no_preference',
    ...(overrides.type === 'couple'
      ? {
          coupleData: {
            partner1: { name: overrides.partner1 ?? 'Marta', age: 34, gender: 'female' },
            partner2: { name: overrides.partner2 ?? 'Joris', age: 36, gender: 'male' },
          },
        }
      : { name: overrides.name ?? 'Aoife Byrne', age: 31, gender: 'female' }),
  });

  let booking = null;
  let subscription = null;

  if (overrides.subscription !== null) {
    booking = await Booking.create({
      clientId: user._id,
      therapistId: therapist.user._id,
      status: BOOKING_STATUS.ACTIVE,
    });

    subscription = await Subscription.create({
      bookingId: booking._id,
      clientId: user._id,
      status: overrides.subscription ?? SUBSCRIPTION_STATUS.ACTIVE,
      amount: SUBSCRIPTION_AMOUNT_MINOR,
      currentPeriodEnd: new Date(Date.now() + (overrides.periodEndIn ?? 20 * DAY)),
      nextBillingDate: new Date(Date.now() + (overrides.periodEndIn ?? 20 * DAY)),
      // Unique per fixture: `platformSubscriptionId` carries a partial unique
      // index (6.1), so a shared literal collides on the second client.
      platformSubscriptionId:
        'platformSubscriptionId' in overrides
          ? overrides.platformSubscriptionId
          : `sub_${Math.random().toString(36).slice(2, 12)}`,
      ...(overrides.subscription === SUBSCRIPTION_STATUS.CANCELLED
        ? { cancelledAt: new Date(), cancelledBy: CANCELLED_BY.CLIENT }
        : {}),
    });
  }

  return { user, profile, booking, subscription, email };
}

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([User.init(), ClientProfile.init(), TherapistProfile.init(), Booking.init()]);

  passwordHash = await hashPassword(PASSWORD);

  for (const role of Object.values(ROLES)) {
    await User.create({ email: EMAILS[role], passwordHash, role, status: USER_STATUS.ACTIVE });

    resetRateLimits();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: EMAILS[role], password: PASSWORD });

    tokens[role] = res.body.accessToken;
  }

  therapist = await createTherapist();
}, 120000);

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(() => {
  resetRateLimits();
  stripeUpdate.mockClear();
  sendPasswordResetEmail.mockClear();
});

describe('the guards', () => {
  test('refuses every route without a token, and with a client or therapist token', async () => {
    const { profile } = await createClient();
    const paths = [
      BASE,
      `${BASE}/${profile._id}`,
      `${BASE}/${profile._id}/cancel-subscription`,
      `${BASE}/${profile._id}/deactivate`,
      `${BASE}/${profile._id}/reactivate`,
      `${BASE}/${profile._id}/reset-password`,
    ];

    for (const token of [NO_TOKEN, tokens[ROLES.CLIENT], tokens[ROLES.THERAPIST]]) {
      for (const path of paths) {
        resetRateLimits();
        const res = await get(path, token);
        expect([401, 403, 404]).toContain(res.status);
        expect(res.status).not.toBe(200);
      }
    }
  });

  test('the 403 body never names the required role', async () => {
    const res = await get(BASE, tokens[ROLES.THERAPIST]);
    const body = JSON.stringify(res.body).toLowerCase();

    expect(res.status).toBe(403);
    expect(body).not.toContain('admin');
    expect(body).not.toContain('therapist');
  });
});

describe('the list', () => {
  test('returns clients with email, therapist and subscription status', async () => {
    const { email } = await createClient({ name: 'Grace Hopper' });

    const res = await get(BASE);
    const row = res.body.data.find((c) => c.email === email);

    expect(res.status).toBe(200);
    expect(row.displayName).toBe('Grace Hopper');
    expect(row.subscriptionStatus).toBe('active');
    expect(row.therapist.name).toBe('Dr. Priya Raman');
    expect(row.accountStatus).toBe('active');
  });

  test('NAMES A COUPLE WITH BOTH PARTNERS — one account, two people', async () => {
    const { email } = await createClient({ type: 'couple', partner1: 'Marta', partner2: 'Joris' });

    const res = await get(BASE);
    const row = res.body.data.find((c) => c.email === email);

    expect(row.displayName).toBe('Marta and Joris');
    expect(row.type).toBe('couple');
  });

  test('searches by name, by either partner name, and by email', async () => {
    const solo = await createClient({ name: 'Katherine Johnson' });
    const couple = await createClient({ type: 'couple', partner1: 'Ines', partner2: 'Tomasz' });

    for (const term of ['katherine', 'johnson', solo.email]) {
      resetRateLimits();
      const res = await get(`${BASE}?q=${encodeURIComponent(term)}`);
      expect(res.body.data.some((c) => c.email === solo.email)).toBe(true);
    }

    for (const term of ['ines', 'tomasz']) {
      resetRateLimits();
      const res = await get(`${BASE}?q=${encodeURIComponent(term)}`);
      expect(res.body.data.some((c) => c.email === couple.email)).toBe(true);
    }
  });

  test('escapes regex metacharacters in the search term', async () => {
    const res = await get(`${BASE}?q=${encodeURIComponent('.*')}`);
    expect(res.body.data).toHaveLength(0);
  });

  test('filters by subscription status and still counts every bucket', async () => {
    const active = await createClient();
    const pastDue = await createClient({ subscription: SUBSCRIPTION_STATUS.PAST_DUE });

    const res = await get(`${BASE}?status=past_due`);
    const emails = res.body.data.map((c) => c.email);

    expect(emails).toContain(pastDue.email);
    expect(emails).not.toContain(active.email);
    expect(res.body.meta.counts.active).toBeGreaterThan(0);
    expect(res.body.meta.counts.past_due).toBeGreaterThan(0);
  });

  test('finds a client with no subscription at all under "none"', async () => {
    const orphan = await createClient({ subscription: null });

    const res = await get(`${BASE}?status=none`);

    expect(res.body.data.some((c) => c.email === orphan.email)).toBe(true);
    expect(res.body.meta.counts.none).toBeGreaterThan(0);
  });

  test('paginates, and reports the total for the filtered set', async () => {
    await createClient();
    await createClient();

    const res = await get(`${BASE}?page=1&limit=1`);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.total).toBeGreaterThan(1);
    expect(res.body.meta.pages).toBeGreaterThan(1);
  });

  test('refuses an unknown status filter and an absurd page size', async () => {
    expect((await get(`${BASE}?status=banana`)).status).toBe(422);
    resetRateLimits();
    expect((await get(`${BASE}?limit=5000`)).status).toBe(422);
  });

  test('NO USER ID, AND NO MESSAGE PREVIEW, ANYWHERE IN THE LIST', async () => {
    const { user } = await createClient();

    const res = await get(BASE);
    const body = JSON.stringify(res.body);

    expect(body).not.toContain(String(user._id));
    expect(body).not.toContain(String(therapist.user._id));
    expect(body.toLowerCase()).not.toContain('passwordhash');
  });
});

describe('the detail', () => {
  test('carries the intake answers, the therapist and the subscription', async () => {
    const { profile } = await createClient();

    const res = await get(`${BASE}/${profile._id}`);

    expect(res.status).toBe(200);
    expect(res.body.concernTags).toEqual(['Anxiety', 'Stress', 'Sleep Issues or Insomnia']);
    expect(res.body.relationshipStatus).toBe('Single');
    expect(res.body.therapistGenderPreference).toBe('no_preference');
    expect(res.body.therapist.id).toBe(String(therapist.profile._id));
    expect(res.body.subscription.amount).toBe(SUBSCRIPTION_AMOUNT_MINOR);
    expect(res.body.access).toBe('active');
  });

  test('shows both partners of a couple', async () => {
    const { profile } = await createClient({ type: 'couple' });

    const res = await get(`${BASE}/${profile._id}`);

    expect(res.body.coupleData.partner1.name).toBe('Marta');
    expect(res.body.coupleData.partner2.name).toBe('Joris');
    expect(res.body.displayName).toBe('Marta and Joris');
  });

  test('THE STRIPE SUBSCRIPTION ID IS SHOWN, THE CUSTOMER AND SESSION IDS ARE NOT', async () => {
    const { profile, subscription } = await createClient();
    await Subscription.updateOne(
      { _id: subscription._id },
      { $set: { platformCustomerId: 'cus_SECRETCUSTOMER', checkoutSessionId: 'cs_SECRETSESSION' } },
    );

    const res = await get(`${BASE}/${profile._id}`);
    const body = JSON.stringify(res.body);

    expect(res.body.subscription.platformSubscriptionId).toBe(subscription.platformSubscriptionId);
    expect(body).not.toContain('cus_SECRETCUSTOMER');
    expect(body).not.toContain('cs_SECRETSESSION');
  });

  test('reports "ending" for a cancelled subscription still inside its paid period', async () => {
    const { profile } = await createClient({
      subscription: SUBSCRIPTION_STATUS.CANCELLED,
      periodEndIn: 10 * DAY,
    });

    const res = await get(`${BASE}/${profile._id}`);

    expect(res.body.subscription.status).toBe('cancelled');
    expect(res.body.access).toBe('ending');
  });

  test('reports "ended" once a cancelled period has passed', async () => {
    const { profile, subscription } = await createClient({
      subscription: SUBSCRIPTION_STATUS.CANCELLED,
    });
    await Subscription.updateOne(
      { _id: subscription._id },
      { $set: { currentPeriodEnd: new Date(Date.now() - DAY) } },
    );

    const res = await get(`${BASE}/${profile._id}`);

    expect(res.body.access).toBe('ended');
  });

  test('lists older subscriptions as history, newest current', async () => {
    const { profile, user, booking } = await createClient();
    await Subscription.create({
      bookingId: booking._id,
      clientId: user._id,
      status: SUBSCRIPTION_STATUS.EXPIRED,
      amount: SUBSCRIPTION_AMOUNT_MINOR,
      startDate: new Date(Date.now() - 90 * DAY),
      currentPeriodEnd: new Date(Date.now() - 60 * DAY),
      nextBillingDate: new Date(Date.now() - 60 * DAY),
      createdAt: new Date(Date.now() - 90 * DAY),
    });

    const res = await get(`${BASE}/${profile._id}`);

    expect(res.body.subscription.status).toBe('active');
    expect(res.body.subscriptionHistory).toHaveLength(1);
    expect(res.body.subscriptionHistory[0].status).toBe('expired');
  });

  test('a missing client is 404 and a malformed id is 400', async () => {
    expect((await get(`${BASE}/${GONE_ID}`)).status).toBe(404);
    resetRateLimits();
    expect((await get(`${BASE}/not-an-id`)).status).toBe(400);
  });

  test('NO USER ID AND NO PASSWORD HASH REACH THE DETAIL RESPONSE', async () => {
    const { profile, user } = await createClient();

    const res = await get(`${BASE}/${profile._id}`);
    const body = JSON.stringify(res.body);

    expect(body).not.toContain(String(user._id));
    expect(body).not.toContain(String(therapist.user._id));
    expect(body.toLowerCase()).not.toContain('passwordhash');
    expect(body.toLowerCase()).not.toContain('refreshtoken');
  });
});

describe('cancelling a subscription', () => {
  test('sets Stripe to stop at the period end, then records it here', async () => {
    const { profile, subscription } = await createClient();

    const res = await post(`${BASE}/${profile._id}/cancel-subscription`);

    expect(res.status).toBe(200);
    expect(res.body.cancelled).toBe(true);
    expect(stripeUpdate).toHaveBeenCalledWith(subscription.platformSubscriptionId, {
      cancel_at_period_end: true,
    });

    const stored = await Subscription.findById(subscription._id);
    expect(stored.status).toBe(SUBSCRIPTION_STATUS.CANCELLED);
    expect(stored.cancelledBy).toBe(CANCELLED_BY.ADMIN);
    expect(stored.cancelledAt).toBeInstanceOf(Date);
  });

  test('KEEPS ACCESS: the period end is not moved, and the gate still says "ending"', async () => {
    const { profile, subscription } = await createClient({ periodEndIn: 12 * DAY });
    const before = (await Subscription.findById(subscription._id)).currentPeriodEnd;

    const res = await post(`${BASE}/${profile._id}/cancel-subscription`);

    expect(res.body.client.access).toBe('ending');
    expect((await Subscription.findById(subscription._id)).currentPeriodEnd).toEqual(before);
  });

  test('A FAILED STRIPE CALL WRITES NOTHING — the card must never outlive our record', async () => {
    const { profile, subscription } = await createClient();
    stripeUpdate.mockRejectedValueOnce(new Error('No such subscription: sub_missing'));

    const res = await post(`${BASE}/${profile._id}/cancel-subscription`);

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('STRIPE_CANCEL_FAILED');
    const stored = await Subscription.findById(subscription._id);
    expect(stored.status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
    expect(stored.cancelledAt).toBeUndefined();
  });

  test('STRIPE IS CALLED BEFORE OUR RECORD MOVES, not merely alongside it', async () => {
    const { profile, subscription } = await createClient();
    let statusWhenStripeWasCalled;

    // Reading the row from inside the fake is what makes this an ORDER
    // assertion rather than a timing one — the same lesson 7.3 learned when
    // "persists before it emits" passed against an inverted implementation.
    stripeUpdate.mockImplementationOnce(async () => {
      statusWhenStripeWasCalled = (await Subscription.findById(subscription._id)).status;
      return { id: 'sub_test', cancel_at_period_end: true };
    });

    await post(`${BASE}/${profile._id}/cancel-subscription`);

    expect(statusWhenStripeWasCalled).toBe(SUBSCRIPTION_STATUS.ACTIVE);
    expect((await Subscription.findById(subscription._id)).status).toBe(
      SUBSCRIPTION_STATUS.CANCELLED,
    );
  });

  test("Stripe's own error text never reaches the caller", async () => {
    const { profile } = await createClient();
    stripeUpdate.mockRejectedValueOnce(new Error('No such subscription: sub_missing'));

    const res = await post(`${BASE}/${profile._id}/cancel-subscription`);

    expect(JSON.stringify(res.body)).not.toContain('No such subscription');
  });

  // The sibling branch — "no Stripe key configured at all" — is NOT tested here
  // and the gap is deliberate. Jest's ESM mock builds the module namespace once,
  // so `isStripeConfigured` cannot be flipped between cases in one suite, and
  // that branch is unreachable in production anyway: config/env.js refuses to
  // start without a Stripe key. It exists only so a developer without one gets
  // a clear notice instead of a crash, and it is checked by hand.

  test('records it with a notice when the subscription has no Stripe reference', async () => {
    const { profile } = await createClient({ platformSubscriptionId: undefined });

    const res = await post(`${BASE}/${profile._id}/cancel-subscription`);

    expect(res.body.cancelled).toBe(true);
    expect(res.body.notice).toMatch(/no Stripe reference/i);
    expect(stripeUpdate).not.toHaveBeenCalled();
  });

  test('IS IDEMPOTENT, AND KEEPS THE FIRST cancelledAt', async () => {
    const { profile, subscription } = await createClient();

    await post(`${BASE}/${profile._id}/cancel-subscription`);
    const first = (await Subscription.findById(subscription._id)).cancelledAt;

    resetRateLimits();
    const second = await post(`${BASE}/${profile._id}/cancel-subscription`);

    expect(second.status).toBe(200);
    expect(second.body.alreadyCancelled).toBe(true);
    expect(second.body.cancelled).toBe(false);
    expect((await Subscription.findById(subscription._id)).cancelledAt).toEqual(first);
    expect(stripeUpdate).toHaveBeenCalledTimes(1);
  });

  // 11.3: a past-due plan is stopped at Stripe AT ONCE. "At period end" left
  // Stripe retrying the card of someone the admin had already cancelled.
  test('cancels a past_due subscription at Stripe immediately, so no retry can charge them', async () => {
    const { profile, subscription } = await createClient({
      subscription: SUBSCRIPTION_STATUS.PAST_DUE,
    });
    stripeCancel.mockClear();
    stripeUpdate.mockClear();

    const res = await post(`${BASE}/${profile._id}/cancel-subscription`);

    expect(res.body.cancelled).toBe(true);
    expect(stripeCancel).toHaveBeenCalledTimes(1);
    expect(stripeUpdate).not.toHaveBeenCalled();
    expect((await Subscription.findById(subscription._id)).status).toBe(
      SUBSCRIPTION_STATUS.CANCELLED,
    );
  });

  test('refuses an expired subscription, and a client who has none', async () => {
    const expired = await createClient({ subscription: SUBSCRIPTION_STATUS.EXPIRED });
    const none = await createClient({ subscription: null });

    const first = await post(`${BASE}/${expired.profile._id}/cancel-subscription`);
    resetRateLimits();
    const second = await post(`${BASE}/${none.profile._id}/cancel-subscription`);

    expect(first.status).toBe(409);
    expect(first.body.error.code).toBe('SUBSCRIPTION_ALREADY_ENDED');
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('NO_SUBSCRIPTION');
    expect(stripeUpdate).not.toHaveBeenCalled();
  });
});

describe('deactivate and reactivate', () => {
  test('stops them signing in, and lets them back when reactivated', async () => {
    const { profile, user, email } = await createClient();

    await post(`${BASE}/${profile._id}/deactivate`);
    expect((await User.findById(user._id)).status).toBe(USER_STATUS.INACTIVE);

    resetRateLimits();
    const blocked = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: PASSWORD });
    expect(blocked.status).toBe(401);

    resetRateLimits();
    await post(`${BASE}/${profile._id}/reactivate`);
    expect((await User.findById(user._id)).status).toBe(USER_STATUS.ACTIVE);
  });

  test('DOES NOT TOUCH THE SUBSCRIPTION — deactivating does not stop the billing', async () => {
    const { profile, subscription } = await createClient();

    await post(`${BASE}/${profile._id}/deactivate`);

    const stored = await Subscription.findById(subscription._id);
    expect(stored.status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
    expect(stored.cancelledAt).toBeUndefined();
  });

  test('is idempotent', async () => {
    const { profile } = await createClient();

    await post(`${BASE}/${profile._id}/deactivate`);
    resetRateLimits();
    const again = await post(`${BASE}/${profile._id}/deactivate`);

    expect(again.status).toBe(200);
    expect(again.body.alreadyInState).toBe(true);
  });
});

describe('the password reset', () => {
  test('sends the standard reset email and returns no password of any kind', async () => {
    const { profile, email } = await createClient();

    const res = await post(`${BASE}/${profile._id}/reset-password`);

    expect(res.body.sent).toBe(true);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    // Positional (email, resetUrl) — the same call the public endpoint makes.
    expect(sendPasswordResetEmail.mock.calls[0][0]).toBe(email);
    expect(JSON.stringify(res.body).toLowerCase()).not.toContain('password"');
  });

  test('skips a deactivated client and says why', async () => {
    const { profile } = await createClient({ accountStatus: USER_STATUS.INACTIVE });

    const res = await post(`${BASE}/${profile._id}/reset-password`);

    expect(res.body.sent).toBe(false);
    expect(res.body.message).toMatch(/deactivated/i);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe('the §11 boundary', () => {
  test('NO CLIENT ENDPOINT HERE CARRIES CHAT, JOURNAL OR NOTE CONTENT', async () => {
    const { profile } = await createClient();

    const responses = await Promise.all([get(BASE), get(`${BASE}/${profile._id}`)]);

    for (const res of responses) {
      const lower = JSON.stringify(res.body).toLowerCase();
      expect(lower).not.toContain('privatenote');
      expect(lower).not.toContain('journal');
      expect(lower).not.toContain('"messages"');
      expect(lower).not.toContain('lastmessage');
      expect(lower).not.toContain('preview');
    }
  });
});
