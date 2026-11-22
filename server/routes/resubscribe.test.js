import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';
import { createEmailServiceMock } from '../test/emailServiceMock.js';

// Chunk 11.4 — the expired state and re-subscribing (§13). The SAME booking, a
// NEW subscription row, and nothing a client wrote is ever lost. Signatures are
// REAL; Stripe's API and email are faked, so nothing reaches the network.

const WEBHOOK_SECRET = 'whsec_test_secret_for_signing_only_not_real';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_for_tests';
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

const createSession = jest.fn();
const listSessions = jest.fn();
const retrieveSub = jest.fn();
const cancelSub = jest.fn();

jest.unstable_mockModule('../config/stripe.js', () => {
  const signer = new Stripe('sk_test_dummy_for_tests');
  const fake = {
    webhooks: signer.webhooks,
    checkout: { sessions: { create: createSession, list: listSessions } },
    subscriptions: { retrieve: retrieveSub, cancel: cancelSub, update: jest.fn() },
    billingPortal: { sessions: { create: jest.fn() } },
  };
  return { stripe: fake, isStripeConfigured: true, isTestKey: true, default: fake };
});

const sendWelcomeBackEmail = jest.fn(async () => ({ delivered: true }));
jest.unstable_mockModule('../services/email/email.service.js', () =>
  createEmailServiceMock({ sendWelcomeBackEmail }),
);

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { TherapistProfile } = await import('../models/TherapistProfile.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { Message } = await import('../models/Message.js');
const { PaymentEvent } = await import('../models/PaymentEvent.js');
const { webhookRateLimiter } = await import('./webhook.routes.js');
const { loginRateLimiter } = await import('./auth.routes.js');
const { clientRateLimiter, resubscribeRateLimiter } = await import('./client.routes.js');
const { STRIPE_EVENT } = await import('../constants/webhooks.js');
const { SUBSCRIPTION_STATUS, CANCELLED_BY } = await import('../constants/payments.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { hashPassword } = await import('../utils/password.js');
const lifecycle = await import('../services/subscriptionLifecycle.service.js');
const { welcomeBackEmail } = await import('../services/email/templates/subscriptionChange.js');

const signer = new Stripe('sk_test_dummy_for_tests');
const PASSWORD = 'correct-horse-battery-staple';
const DAY = 24 * 60 * 60 * 1000;
const LOOPBACK = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const OLD_SUB = 'sub_old_1';
const NEW_SUB = 'sub_back_1';
const CUSTOMER = 'cus_back_1';
const STRIPE_URL = 'https://checkout.stripe.com/c/pay/cs_test_back';
const SECRET_WORDS = 'I have been feeling so much lighter lately';

let world;
let counter = 0;

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([PaymentEvent.init(), Subscription.init(), User.init(), Booking.init()]);
}, 60000);

beforeEach(async () => {
  sendWelcomeBackEmail.mockReset();
  sendWelcomeBackEmail.mockResolvedValue({ delivered: true });
  createSession.mockReset();
  createSession.mockResolvedValue({ id: 'cs_test_back', url: STRIPE_URL });
  listSessions.mockReset();
  listSessions.mockResolvedValue({ data: [] });
  retrieveSub.mockReset();
  retrieveSub.mockResolvedValue({ id: NEW_SUB, current_period_end: Math.floor((Date.now() + 30 * DAY) / 1000) });
  cancelSub.mockReset();
  cancelSub.mockResolvedValue({ id: NEW_SUB, status: 'canceled' });
  LOOPBACK.forEach((key) =>
    [webhookRateLimiter, loginRateLimiter, clientRateLimiter, resubscribeRateLimiter].forEach((l) => l.resetKey?.(key)),
  );
  world = await seedWorld();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await clearCollections();
});
afterAll(stopMemoryMongo);

async function seedWorld({ status = SUBSCRIPTION_STATUS.EXPIRED } = {}) {
  counter += 1;
  const therapistUser = await User.create({
    email: `t${counter}@example.com`,
    passwordHash: 'x'.repeat(60),
    role: ROLES.THERAPIST,
    status: USER_STATUS.ACTIVE,
  });
  const therapist = await TherapistProfile.create({
    userId: therapistUser._id,
    applicationId: new mongoose.Types.ObjectId(),
    title: 'Dr.',
    firstName: 'Maya',
    lastName: 'Iversen',
    gender: 'female',
    dateOfBirth: new Date('1985-04-02'),
    photoUrl: 'https://res.cloudinary.com/demo/image/upload/v1/p.jpg',
    streetAddress: '4 Harbour Lane',
    city: 'Galway',
    stateProvince: 'Connacht',
    zipPostal: 'H91',
    country: 'IE',
    timezone: 'Europe/Dublin',
    therapistType: 'Clinical Psychologist',
    credentialType: 'Diploma/Degree',
    credentialInitials: 'PhD',
    yearsExperience: 9,
    educationSummary: 'PhD in clinical psychology.',
    currentWorkSituation: 'Private practice.',
    languages: ['English'],
    specialtyTags: ['Anxiety', 'Grief', 'Stress'],
    treatmentOrientations: ['CBT'],
    bio: 'Works with anxiety and grief.',
    licensingStatus: 'Licensed in Ireland.',
    disciplinaryActions: false,
    malpracticeInsurance: true,
    workingHours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: false, start: '', end: '' },
      wednesday: { enabled: false, start: '', end: '' },
      thursday: { enabled: false, start: '', end: '' },
      friday: { enabled: false, start: '', end: '' },
      saturday: { enabled: false, start: '', end: '' },
      sunday: { enabled: false, start: '', end: '' },
    },
    certificateUrl1: 'https://res.cloudinary.com/demo/image/authenticated/s--x--/v1/c.pdf',
    status: USER_STATUS.ACTIVE,
  });

  const email = `back${counter}@example.com`;
  const client = await User.create({
    email,
    passwordHash: await hashPassword(PASSWORD),
    role: ROLES.CLIENT,
    status: USER_STATUS.ACTIVE,
  });
  await ClientProfile.create({
    userId: client._id,
    type: 'individual',
    country: 'Ireland',
    city: 'Galway',
    relationshipStatus: 'Single',
    concernTags: ['Anxiety', 'Stress', 'Grief'],
    therapistGenderPreference: 'no_preference',
    name: 'Aoife Byrne',
    age: 31,
    gender: 'female',
    timezone: 'Europe/Dublin',
  });
  const booking = await Booking.create({ clientId: client._id, therapistId: therapistUser._id, status: 'active' });
  const periodEnd = new Date(Date.now() - 2 * DAY);
  const subscription = await Subscription.create({
    bookingId: booking._id,
    clientId: client._id,
    status,
    startDate: new Date(periodEnd.getTime() - 30 * DAY),
    currentPeriodEnd: status === SUBSCRIPTION_STATUS.ACTIVE ? new Date(Date.now() + 20 * DAY) : periodEnd,
    nextBillingDate: status === SUBSCRIPTION_STATUS.ACTIVE ? new Date(Date.now() + 20 * DAY) : periodEnd,
    sessionsRemaining: 0,
    platformSubscriptionId: OLD_SUB,
    platformCustomerId: CUSTOMER,
  });

  // A history: three messages, two journal entries, one worksheet, two held
  // sessions and one that never happened (not counted).
  await Message.create([
    { bookingId: booking._id, senderId: client._id, text: SECRET_WORDS },
    { bookingId: booking._id, senderId: therapistUser._id, text: 'I am so glad to hear that.' },
    { bookingId: booking._id, senderId: client._id, text: 'Thank you for everything so far.' },
  ]);
  const db = mongoose.connection.db;
  await db.collection('journals').insertMany([
    { bookingId: booking._id, clientId: client._id, text: 'Entry one', createdAt: new Date() },
    { bookingId: booking._id, clientId: client._id, text: 'Entry two', createdAt: new Date() },
  ]);
  await db.collection('worksheets').insertOne({ bookingId: booking._id, title: 'Thought record', status: 'completed' });
  await db.collection('sessions').insertMany([
    { bookingId: booking._id, status: 'completed', scheduledAt: new Date(Date.now() - 20 * DAY) },
    { bookingId: booking._id, status: 'completed', scheduledAt: new Date(Date.now() - 13 * DAY) },
    { bookingId: booking._id, status: 'cancelled', scheduledAt: new Date(Date.now() - 6 * DAY) },
  ]);

  return { therapistUser, therapist, client, email, booking, subscription };
}

async function tokenFor(email) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD });
  return res.body.accessToken;
}
const as = async (method, path, email = world.email) =>
  request(app)[method](path).set('Authorization', `Bearer ${await tokenFor(email)}`);
const quiet = () => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  return jest.spyOn(console, 'error').mockImplementation(() => {});
};

function paidEvent({ id, subscription = NEW_SUB, metadata } = {}) {
  counter += 1;
  const event = {
    id: id ?? `evt_back_${Date.now()}_${counter}`,
    object: 'event',
    type: STRIPE_EVENT.CHECKOUT_COMPLETED,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `cs_back_${counter}`,
        object: 'checkout.session',
        payment_status: 'paid',
        amount_total: 20000,
        currency: 'eur',
        customer: CUSTOMER,
        subscription,
        metadata: metadata ?? {
          kind: 'resubscribe',
          bookingId: String(world.booking._id),
          clientId: String(world.client._id),
        },
      },
    },
  };
  return event;
}

function send(event) {
  const payload = JSON.stringify(event);
  const header = signer.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
  return request(app)
    .post('/api/v1/webhooks/payment')
    .set('stripe-signature', header)
    .set('Content-Type', 'application/json')
    .send(payload);
}

describe('expired: login still works, the portal does not', () => {
  it('signs in, is refused the portal, and is told what is kept', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: world.email, password: PASSWORD });
    expect(login.status).toBe(200);

    expect((await as('get', '/api/v1/client/journal')).status).toBe(403);

    const me = (await as('get', '/api/v1/client/me')).body;
    expect(me.access).toBe('ended');
    expect(me.kept).toEqual({ messages: 3, journalEntries: 2, worksheets: 1, sessions: 2 });
    expect(me.canResubscribe).toBe(true);
    expect(me.therapist.firstName).toBe('Maya');
  });

  it('reports counts only — never a word of what was written', async () => {
    const me = await as('get', '/api/v1/client/me');
    expect(JSON.stringify(me.body)).not.toContain(SECRET_WORDS);
    expect(JSON.stringify(me.body)).not.toMatch(/Entry one|Thought record/);
  });

  it('an active client is told nothing of the kind', async () => {
    await Subscription.updateOne({ _id: world.subscription._id }, {
      $set: { status: SUBSCRIPTION_STATUS.ACTIVE, currentPeriodEnd: new Date(Date.now() + 20 * DAY) },
    });
    const me = (await as('get', '/api/v1/client/me')).body;
    expect(me.kept).toBeNull();
    expect(me.canResubscribe).toBe(false);
  });

  // §13: ALL DATA IS PRESERVED. Expiry by the sweep touches the subscription only.
  it('expiry deletes nothing', async () => {
    quiet();
    await Subscription.updateOne({ _id: world.subscription._id }, {
      $set: { status: SUBSCRIPTION_STATUS.CANCELLED, cancelledAt: new Date(), cancelledBy: CANCELLED_BY.CLIENT },
    });
    const db = mongoose.connection.db;
    const before = await Promise.all(['messages', 'journals', 'worksheets', 'sessions', 'bookings'].map((c) => db.collection(c).countDocuments()));

    expect((await lifecycle.expireEndedCancellations()).expired).toBe(1);

    const after = await Promise.all(['messages', 'journals', 'worksheets', 'sessions', 'bookings'].map((c) => db.collection(c).countDocuments()));
    expect(after).toEqual(before);
    expect((await Booking.findById(world.booking._id)).status).toBe('active');
  });
});

describe('starting a re-subscribe — no questionnaire, the same booking', () => {
  it('makes a Stripe page with our ids only, the same customer and the same price', async () => {
    const res = await as('post', '/api/v1/client/subscription/resubscribe');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ url: STRIPE_URL });

    const params = createSession.mock.calls[0][0];
    expect(params.mode).toBe('subscription');
    expect(params.customer).toBe(CUSTOMER);
    expect(params.metadata).toEqual({
      kind: 'resubscribe',
      bookingId: String(world.booking._id),
      clientId: String(world.client._id),
    });
    expect(params.line_items[0].price_data).toMatchObject({
      currency: 'eur',
      unit_amount: 25000,
      recurring: { interval: 'month' },
    });
    expect(params.custom_text.submit.message).toMatch(/charged/i);
    expect(params.success_url).toMatch(/\/portal\?welcome_back=1$/);
    // No health data leaves for Stripe.
    expect(JSON.stringify(params)).not.toMatch(/Anxiety|Grief|Aoife/);
  });

  it('two tabs, one page: an open page for this booking is handed back', async () => {
    listSessions.mockResolvedValue({
      data: [{ url: 'https://checkout.stripe.com/c/pay/cs_open', metadata: { kind: 'resubscribe', bookingId: String(world.booking._id) } }],
    });
    const res = await as('post', '/api/v1/client/subscription/resubscribe');

    expect(res.body.url).toBe('https://checkout.stripe.com/c/pay/cs_open');
    expect(createSession).not.toHaveBeenCalled();
  });

  it.each([
    ['active', { status: SUBSCRIPTION_STATUS.ACTIVE, currentPeriodEnd: new Date(Date.now() + 20 * DAY) }],
    ['cancelled but still paid for', {
      status: SUBSCRIPTION_STATUS.CANCELLED,
      cancelledAt: new Date(),
      currentPeriodEnd: new Date(Date.now() + 20 * DAY),
    }],
  ])('refuses while the subscription is %s', async (_label, fields) => {
    await Subscription.updateOne({ _id: world.subscription._id }, { $set: fields });
    const res = await as('post', '/api/v1/client/subscription/resubscribe');

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('STILL_SUBSCRIBED');
    expect(createSession).not.toHaveBeenCalled();
  });

  it('refuses when the therapist has left, and /me hides the button', async () => {
    await TherapistProfile.updateOne({ _id: world.therapist._id }, { $set: { status: USER_STATUS.INACTIVE } });

    const res = await as('post', '/api/v1/client/subscription/resubscribe');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('THERAPIST_UNAVAILABLE');
    expect((await as('get', '/api/v1/client/me')).body.canResubscribe).toBe(false);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("a Stripe failure is our words, and a link that is not Stripe's is refused", async () => {
    quiet();
    createSession.mockRejectedValueOnce(new Error('secret Stripe detail'));
    const failed = await as('post', '/api/v1/client/subscription/resubscribe');
    expect(failed.status).toBe(502);
    expect(JSON.stringify(failed.body)).not.toMatch(/secret Stripe detail/);

    createSession.mockResolvedValueOnce({ id: 'cs_x', url: 'https://checkout.stripe.com.evil.example/pay' });
    expect((await as('post', '/api/v1/client/subscription/resubscribe')).status).toBe(502);
  });

  it('is for clients only, signed in', async () => {
    const therapistLogin = await User.create({
      email: `other-t${counter}@example.com`,
      passwordHash: await hashPassword(PASSWORD),
      role: ROLES.THERAPIST,
      status: USER_STATUS.ACTIVE,
    });
    expect((await as('post', '/api/v1/client/subscription/resubscribe', therapistLogin.email)).status).toBe(403);
    expect((await request(app).post('/api/v1/client/subscription/resubscribe')).status).toBe(401);
  });
});

describe('the webhook — a new subscription on the SAME booking', () => {
  it('restores access, with every piece of history still there', async () => {
    quiet();
    const res = await send(paidEvent());
    expect(res.status).toBe(200);

    expect(await Booking.countDocuments()).toBe(1);
    const rows = await Subscription.find({ bookingId: world.booking._id }).sort({ createdAt: 1 }).lean();
    expect(rows).toHaveLength(2);
    expect(rows[0].status).toBe(SUBSCRIPTION_STATUS.EXPIRED);
    expect(rows[1]).toMatchObject({
      status: SUBSCRIPTION_STATUS.ACTIVE,
      sessionsRemaining: 4,
      platformSubscriptionId: NEW_SUB,
      platformCustomerId: CUSTOMER,
      amount: 25000,
    });

    const me = (await as('get', '/api/v1/client/me')).body;
    expect(me.access).toBe('active');
    expect(me.booking.id).toBe(String(world.booking._id));

    // The conversation resumes exactly where it was.
    const chat = await as('get', `/api/v1/chat/${world.booking._id}/messages`);
    expect(chat.status).toBe(200);
    expect(chat.body.data.map((m) => m.text)).toContain(SECRET_WORDS);
    expect(chat.body.data).toHaveLength(3);
    const journal = await as('get', '/api/v1/client/journal');
    expect(journal.status).toBe(200);
  });

  it('welcomes them back once, naming their therapist and the next payment', async () => {
    quiet();
    await send(paidEvent());

    expect(sendWelcomeBackEmail).toHaveBeenCalledTimes(1);
    const [to, details] = sendWelcomeBackEmail.mock.calls[0];
    expect(to).toBe(world.email);
    expect(details.therapistName).toBe('Dr. Maya Iversen');
    expect(details.amount).toBe('€250.00');
    expect(details.nextPayment).toMatch(/\(Dublin time\)$/);
  });

  it('a replay, and a new event for the same Stripe subscription, create nothing more', async () => {
    quiet();
    const event = paidEvent();
    await send(event);
    await send(event);
    await send({ ...event, id: `${event.id}_again` });

    expect(await Subscription.countDocuments()).toBe(2);
    expect(sendWelcomeBackEmail).toHaveBeenCalledTimes(1);
    // A replay must never be mistaken for a second payment: that would cancel
    // the client's real, paid subscription at Stripe.
    expect(cancelSub).not.toHaveBeenCalled();
    expect((await Subscription.findOne({ platformSubscriptionId: NEW_SUB })).status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
  });

  // The index covers `active` rows only, so a cancelled plan still inside its
  // paid time is guarded by the access check alone.
  it('a payment while a cancelled plan is still running is stopped at Stripe', async () => {
    quiet();
    await Subscription.updateOne({ _id: world.subscription._id }, {
      $set: {
        status: SUBSCRIPTION_STATUS.CANCELLED,
        cancelledAt: new Date(),
        currentPeriodEnd: new Date(Date.now() + 10 * DAY),
      },
    });
    await send(paidEvent());

    expect(await Subscription.countDocuments()).toBe(1);
    expect(cancelSub).toHaveBeenCalledWith(NEW_SUB);
  });

  it('two deliveries at once create one row', async () => {
    quiet();
    const event = paidEvent();
    const responses = await Promise.all([send(event), send(event)]);

    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect(await Subscription.countDocuments()).toBe(2);
  });

  it('a second payment for a booking already live is stopped at Stripe at once', async () => {
    const errors = quiet();
    await send(paidEvent());
    await send(paidEvent({ subscription: 'sub_back_2' }));

    expect(await Subscription.countDocuments()).toBe(2);
    expect(cancelSub).toHaveBeenCalledWith('sub_back_2');
    expect(errors.mock.calls.flat().join(' ')).toMatch(/REFUND BY HAND/);
  });

  it('a therapist who left while the page was open: nothing created, billing stopped', async () => {
    quiet();
    await TherapistProfile.updateOne({ _id: world.therapist._id }, { $set: { status: USER_STATUS.INACTIVE } });
    const res = await send(paidEvent());

    expect(res.status).toBe(200);
    expect(await Subscription.countDocuments()).toBe(1);
    expect(cancelSub).toHaveBeenCalledWith(NEW_SUB);
  });

  it("refuses a booking that is not this client's", async () => {
    quiet();
    const res = await send(paidEvent({
      metadata: { kind: 'resubscribe', bookingId: String(world.booking._id), clientId: String(new mongoose.Types.ObjectId()) },
    }));

    expect(res.status).toBe(500);
    expect(await Subscription.countDocuments()).toBe(1);
  });

  // 10.3: one review per subscription, so the new one starts with a clean slate.
  it('the new subscription is not yet reviewable', async () => {
    quiet();
    await send(paidEvent());
    expect((await as('get', '/api/v1/client/me')).body.reviewState).toBe('not_yet');
  });
});

describe('the welcome-back email', () => {
  it('names the therapist and restates the renewal terms, with no pressure', () => {
    const { text, html } = welcomeBackEmail({
      name: '<b>Aoife</b>',
      therapistName: 'Dr. Maya Iversen',
      amount: '€250.00',
      nextPayment: 'Friday 23 October 2026 at 10:00 (Dublin time)',
      portalUrl: 'https://castofmind.com/portal',
    });
    expect(text).toContain('Dr. Maya Iversen');
    expect(text).toMatch(/exactly where you left it/);
    expect(text).toMatch(/cancel before this date/i);
    expect(html).toContain('&lt;b&gt;Aoife&lt;/b&gt;');
    expect(text).not.toMatch(/!|missed you|don't lose|last chance/i);
  });
});
