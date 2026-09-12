import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import { startMemoryReplSet, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';
import { createEmailServiceMock } from '../test/emailServiceMock.js';

/**
 * THE WHOLE PAYMENT JOURNEY, IN ONE FILE.
 *
 * Chunks 6.2 to 6.5 each test their own piece thoroughly. Nothing tested the
 * SEAMS between them — that the session created by the checkout endpoint is the
 * one the webhook can find, that the reference travelling to Stripe is the one
 * the draft is keyed by, and that /welcome can then see the account.
 *
 * This walks the real path end to end: create a session, sign a real webhook
 * for that session, and assert exactly one account exists. Then replay the
 * webhook and assert it is still exactly one.
 *
 * Real signatures, real transaction, real replica set. Only Stripe's network
 * calls are faked.
 */

const WEBHOOK_SECRET = 'whsec_journey_secret_for_signing_only';

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_for_tests';
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

let sessionCounter = 0;
const createSessionMock = jest.fn();
const retrieveSubscriptionMock = jest.fn();

jest.unstable_mockModule('../config/stripe.js', () => {
  const signer = new Stripe('sk_test_dummy_for_tests');
  const fake = {
    webhooks: signer.webhooks,
    checkout: { sessions: { create: createSessionMock } },
    subscriptions: { retrieve: retrieveSubscriptionMock },
  };
  return { stripe: fake, isStripeConfigured: true, isTestKey: true, default: fake };
});

const sendClientWelcomeEmail = jest.fn(async () => ({ delivered: true }));
jest.unstable_mockModule('../services/email/email.service.js', () =>
  createEmailServiceMock({ sendClientWelcomeEmail }),
);

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { TherapistProfile } = await import('../models/TherapistProfile.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { PendingCheckout } = await import('../models/PendingCheckout.js');
const { PaymentEvent } = await import('../models/PaymentEvent.js');
const { checkoutRateLimiter, sessionStatusRateLimiter } = await import('./checkout.routes.js');
const { webhookRateLimiter } = await import('./webhook.routes.js');
const { STRIPE_EVENT } = await import('../constants/webhooks.js');
const { SESSION_STATUS } = await import('../constants/checkout.js');
const { SUBSCRIPTION_AMOUNT_MINOR } = await import('../constants/payments.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');

const signer = new Stripe('sk_test_dummy_for_tests');
const CHECKOUT = '/api/v1/checkout/create-session';
const WEBHOOK = '/api/v1/webhooks/payment';
const STATUS = '/api/v1/checkout/session-status';

beforeAll(async () => {
  await startMemoryReplSet();
  await Promise.all([User.init(), Subscription.init(), Booking.init(), PaymentEvent.init(), PendingCheckout.init()]);
}, 60000);

beforeEach(() => {
  sendClientWelcomeEmail.mockClear();
  sendClientWelcomeEmail.mockResolvedValue({ delivered: true });

  retrieveSubscriptionMock.mockReset();
  retrieveSubscriptionMock.mockResolvedValue({
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  });

  // Each call returns a distinct session, the way Stripe does.
  createSessionMock.mockReset();
  createSessionMock.mockImplementation(async () => {
    sessionCounter += 1;
    return {
      id: `cs_test_journey${sessionCounter}`,
      url: `https://checkout.stripe.com/c/pay/cs_test_journey${sessionCounter}`,
    };
  });

  for (const limiter of [checkoutRateLimiter, sessionStatusRateLimiter, webhookRateLimiter]) {
    limiter.resetKey?.('::ffff:127.0.0.1');
    limiter.resetKey?.('127.0.0.1');
  }
});

afterEach(clearCollections);
afterAll(stopMemoryMongo);

let seed = 0;

async function seedTherapist() {
  seed += 1;
  const user = await User.create({
    email: `journey-therapist${seed}@example.com`,
    passwordHash: 'x'.repeat(60),
    role: ROLES.THERAPIST,
    status: USER_STATUS.ACTIVE,
  });

  return TherapistProfile.create({
    userId: user._id,
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
}

const individual = () => ({
  type: 'individual',
  country: 'Ireland',
  city: 'Galway',
  relationshipStatus: 'Single',
  concernTags: ['Anxiety', 'Stress', 'Grief'],
  therapistGenderPreference: 'female',
  name: 'Aoife Byrne',
  age: 31,
  gender: 'female',
});

const couple = () => ({
  type: 'couple',
  country: 'Netherlands',
  city: 'Utrecht',
  relationshipStatus: 'Married',
  concernTags: ['Marriage Issues'],
  therapistGenderPreference: 'no_preference',
  coupleData: {
    partner1: { name: 'Marta', age: 38, gender: 'female' },
    partner2: { name: 'Joris', age: 41, gender: 'male' },
  },
});

/** Step 1 of the journey: the browser asks for a payment page. */
async function startCheckout(therapist, { email = 'aoife@example.com', questionnaire } = {}) {
  const response = await request(app)
    .post(CHECKOUT)
    .send({
      email,
      therapistProfileId: String(therapist._id),
      questionnaire: questionnaire ?? individual(),
    });

  const sessionArgs = createSessionMock.mock.calls.at(-1)?.[0];
  // mock.results holds the PROMISE the implementation returned, and it resolves
  // to the whole session object — the id is one field of it.
  const created = await createSessionMock.mock.results.at(-1)?.value;

  return { response, sessionArgs, sessionId: created?.id };
}

/** Step 2: Stripe tells us the money arrived. Real signature over real bytes. */
function fireWebhook(session, { eventId } = {}) {
  seed += 1;
  const event = {
    id: eventId ?? `evt_journey_${Date.now()}_${seed}`,
    object: 'event',
    type: STRIPE_EVENT.CHECKOUT_COMPLETED,
    created: Math.floor(Date.now() / 1000),
    data: { object: session },
  };

  const payload = JSON.stringify(event);
  const header = signer.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });

  return request(app)
    .post(WEBHOOK)
    .set('stripe-signature', header)
    .set('Content-Type', 'application/json')
    .send(payload);
}

/** The paid session Stripe would send back, built from what we actually sent it. */
const paidSession = (sessionArgs, sessionId) => ({
  id: sessionId,
  object: 'checkout.session',
  payment_status: 'paid',
  amount_total: SUBSCRIPTION_AMOUNT_MINOR,
  currency: 'eur',
  customer: 'cus_journey',
  subscription: `sub_${sessionId}`,
  // THE SEAM: the reference we handed Stripe is the one that comes back.
  client_reference_id: sessionArgs.client_reference_id,
});

describe('the payment journey — completed once', () => {
  it('creates exactly one account, and only from the completed attempt', async () => {
    const therapist = await seedTherapist();

    const { response, sessionArgs, sessionId } = await startCheckout(therapist);
    expect(response.status).toBe(201);

    // Nothing exists yet. The browser has a URL and that is all.
    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(0);
    expect(await Subscription.countDocuments()).toBe(0);
    expect(await PendingCheckout.countDocuments()).toBe(1);

    const webhook = await fireWebhook(paidSession(sessionArgs, sessionId));
    expect(webhook.status).toBe(200);

    // Exactly one of each, and the draft is consumed.
    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(1);
    expect(await ClientProfile.countDocuments()).toBe(1);
    expect(await Booking.countDocuments()).toBe(1);
    expect(await Subscription.countDocuments()).toBe(1);
    expect(await PendingCheckout.countDocuments()).toBe(0);
    expect(await PaymentEvent.countDocuments()).toBe(1);
    expect(sendClientWelcomeEmail).toHaveBeenCalledTimes(1);
  });

  it('lets the client sign in with the password that was emailed', async () => {
    const therapist = await seedTherapist();
    const { sessionArgs, sessionId } = await startCheckout(therapist);
    await fireWebhook(paidSession(sessionArgs, sessionId));

    const { temporaryPassword } = sendClientWelcomeEmail.mock.calls[0][1];

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'aoife@example.com', password: temporaryPassword });

    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe(ROLES.CLIENT);
  });

  it('carries a couple through as one account', async () => {
    const therapist = await seedTherapist();
    const { sessionArgs, sessionId } = await startCheckout(therapist, {
      email: 'pair@example.com',
      questionnaire: couple(),
    });

    await fireWebhook(paidSession(sessionArgs, sessionId));

    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(1);
    expect(await ClientProfile.countDocuments()).toBe(1);

    const profile = await ClientProfile.findOne();
    expect(profile.coupleData.partner1.name).toBe('Marta');
    expect(profile.coupleData.partner2.name).toBe('Joris');
  });
});

describe('the payment journey — abandoned', () => {
  // Someone reaches Stripe and closes the tab. No webhook ever arrives.
  it('leaves no account behind, only a draft that expires', async () => {
    const therapist = await seedTherapist();
    await startCheckout(therapist);

    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(0);
    expect(await ClientProfile.countDocuments()).toBe(0);
    expect(await Booking.countDocuments()).toBe(0);
    expect(await Subscription.countDocuments()).toBe(0);

    const draft = await PendingCheckout.findOne();
    expect(draft.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('the payment journey — the webhook replayed', () => {
  it('still leaves exactly one account when the same event is sent twice', async () => {
    const therapist = await seedTherapist();
    const { sessionArgs, sessionId } = await startCheckout(therapist);
    const session = paidSession(sessionArgs, sessionId);

    const eventId = 'evt_journey_replayed_once';
    await fireWebhook(session, { eventId });
    const replay = await fireWebhook(session, { eventId });

    expect(replay.status).toBe(200);
    expect(replay.body.duplicate).toBe(true);

    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(1);
    expect(await Subscription.countDocuments()).toBe(1);
    expect(await PaymentEvent.countDocuments()).toBe(1);
    expect(sendClientWelcomeEmail).toHaveBeenCalledTimes(1);
  });

  // The harder case: Stripe reports the SAME payment under a NEW event id. The
  // ledger cannot catch this, so the effect-level guard has to.
  it('still leaves exactly one account under a different event id', async () => {
    const therapist = await seedTherapist();
    const { sessionArgs, sessionId } = await startCheckout(therapist);
    const session = paidSession(sessionArgs, sessionId);

    await fireWebhook(session);
    await fireWebhook(session);

    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(1);
    expect(await Subscription.countDocuments()).toBe(1);
    // Two genuinely different events, both correctly recorded.
    expect(await PaymentEvent.countDocuments()).toBe(2);
    expect(sendClientWelcomeEmail).toHaveBeenCalledTimes(1);
  });
});

describe('the payment journey — an already-registered email', () => {
  it('is refused before any money moves', async () => {
    const therapist = await seedTherapist();
    await User.create({
      email: 'aoife@example.com',
      passwordHash: 'x'.repeat(60),
      role: ROLES.CLIENT,
      status: USER_STATUS.ACTIVE,
    });

    const { response } = await startCheckout(therapist);

    expect(response.status).toBe(409);
    expect(createSessionMock).not.toHaveBeenCalled();
    expect(await PendingCheckout.countDocuments()).toBe(0);
  });
});

describe('/welcome asks whether the account is ready', () => {
  it('says processing before the webhook, ready after', async () => {
    const therapist = await seedTherapist();
    const { sessionArgs, sessionId } = await startCheckout(therapist);

    const before = await request(app).get(STATUS).query({ sessionId });
    expect(before.status).toBe(200);
    expect(before.body.status).toBe(SESSION_STATUS.PROCESSING);

    await fireWebhook(paidSession(sessionArgs, sessionId));

    const after = await request(app).get(STATUS).query({ sessionId });
    expect(after.body.status).toBe(SESSION_STATUS.READY);
  });

  it('creates nothing — it only reports', async () => {
    const therapist = await seedTherapist();
    const { sessionId } = await startCheckout(therapist);

    const usersBefore = await User.countDocuments();
    await request(app).get(STATUS).query({ sessionId });
    await request(app).get(STATUS).query({ sessionId });

    expect(await User.countDocuments()).toBe(usersBefore);
    expect(await Subscription.countDocuments()).toBe(0);
    expect(await Booking.countDocuments()).toBe(0);
  });
});
