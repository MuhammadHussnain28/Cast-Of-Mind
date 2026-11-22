import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import { startMemoryReplSet, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';
import { createEmailServiceMock } from '../test/emailServiceMock.js';

const WEBHOOK_SECRET = 'whsec_test_secret_for_signing_only_not_real';

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_for_tests';
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

// Signatures are REAL (generateTestHeaderString), but the Stripe API is faked —
// nothing here reaches the network.
const retrieveSubscriptionMock = jest.fn();

jest.unstable_mockModule('../config/stripe.js', () => {
  const signer = new Stripe('sk_test_dummy_for_tests');
  const fake = {
    webhooks: signer.webhooks,
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
const { webhookRateLimiter } = await import('./webhook.routes.js');
const { STRIPE_EVENT } = await import('../constants/webhooks.js');
const { SUBSCRIPTION_AMOUNT_MINOR, SESSIONS_PER_CYCLE } = await import('../constants/payments.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { comparePassword } = await import('../utils/password.js');

const signer = new Stripe('sk_test_dummy_for_tests');
const ENDPOINT = '/api/v1/webhooks/payment';

beforeAll(async () => {
  // A REAL REPLICA SET. Transactions do not exist on a standalone instance, so
  // a rollback test there would pass while proving nothing — every write simply
  // succeeds. Same reasoning as chunk 4.3.
  await startMemoryReplSet();
  await Promise.all([
    User.init(),
    Subscription.init(),
    Booking.init(),
    PaymentEvent.init(),
    PendingCheckout.init(),
  ]);
}, 60000);

beforeEach(() => {
  sendClientWelcomeEmail.mockClear();
  sendClientWelcomeEmail.mockResolvedValue({ delivered: true });
  retrieveSubscriptionMock.mockReset();
  retrieveSubscriptionMock.mockResolvedValue({
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  });
  webhookRateLimiter.resetKey?.('::ffff:127.0.0.1');
  webhookRateLimiter.resetKey?.('127.0.0.1');
});

afterEach(clearCollections);
afterAll(stopMemoryMongo);

let counter = 0;

async function seedTherapist(overrides = {}) {
  counter += 1;
  const user = await User.create({
    email: `therapist${counter}@example.com`,
    passwordHash: 'x'.repeat(60),
    role: ROLES.THERAPIST,
    status: USER_STATUS.ACTIVE,
  });

  const profile = await TherapistProfile.create({
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
    ...overrides,
  });

  return { user, profile };
}

const individual = (overrides = {}) => ({
  type: 'individual',
  country: 'Ireland',
  city: 'Galway',
  relationshipStatus: 'Single',
  concernTags: ['Anxiety', 'Stress', 'Grief'],
  therapistGenderPreference: 'female',
  name: 'Aoife Byrne',
  age: 31,
  gender: 'female',
  ...overrides,
});

const couple = () => ({
  type: 'couple',
  country: 'Netherlands',
  city: 'Utrecht',
  relationshipStatus: 'Married',
  concernTags: ['Marriage Issues', 'Family Issues'],
  therapistGenderPreference: 'no_preference',
  coupleData: {
    partner1: { name: 'Marta', age: 38, gender: 'female' },
    partner2: { name: 'Joris', age: 41, gender: 'male' },
  },
});

async function seedDraft(profileId, { email = 'aoife@example.com', questionnaire } = {}) {
  return PendingCheckout.create({
    email,
    therapistProfileId: profileId,
    questionnaire: questionnaire ?? individual(),
    expiresAt: PendingCheckout.expiryFromNow(),
  });
}

function makeEvent(draft, overrides = {}) {
  counter += 1;
  return {
    id: `evt_test_${Date.now()}_${counter}`,
    object: 'event',
    type: STRIPE_EVENT.CHECKOUT_COMPLETED,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `cs_test_${counter}`,
        object: 'checkout.session',
        payment_status: 'paid',
        amount_total: 20000,
        currency: 'eur',
        customer: `cus_test_${counter}`,
        subscription: `sub_test_${counter}`,
        client_reference_id: draft?.reference ?? 'missing',
        ...overrides,
      },
    },
  };
}

function send(event) {
  const payload = JSON.stringify(event);
  const header = signer.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });

  return request(app)
    .post(ENDPOINT)
    .set('stripe-signature', header)
    .set('Content-Type', 'application/json')
    .send(payload);
}

describe('account creation — the happy path', () => {
  it('creates exactly four documents and consumes the draft', async () => {
    const { user: therapistUser, profile } = await seedTherapist();
    const draft = await seedDraft(profile._id);

    const response = await send(makeEvent(draft));
    expect(response.status).toBe(200);

    const client = await User.findOne({ email: 'aoife@example.com' });
    expect(client.role).toBe(ROLES.CLIENT);
    expect(client.status).toBe(USER_STATUS.ACTIVE);

    const clientProfile = await ClientProfile.findOne({ userId: client._id });
    expect(clientProfile.name).toBe('Aoife Byrne');
    expect(clientProfile.concernTags).toEqual(['Anxiety', 'Stress', 'Grief']);

    const booking = await Booking.findOne({ clientId: client._id });
    // The therapist's USER id, not the profile id — both portals query it so.
    expect(String(booking.therapistId)).toBe(String(therapistUser._id));
    expect(booking.status).toBe('active');

    const subscription = await Subscription.findOne({ clientId: client._id });
    expect(String(subscription.bookingId)).toBe(String(booking._id));
    expect(subscription.status).toBe('active');
    expect(subscription.sessionsRemaining).toBe(SESSIONS_PER_CYCLE);

    // The draft is consumed inside the transaction.
    expect(await PendingCheckout.countDocuments()).toBe(0);
  });

  it('stores €250 as 25000 minor units in EUR', async () => {
    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id);

    await send(makeEvent(draft));

    const subscription = await Subscription.findOne();
    expect(subscription.amount).toBe(SUBSCRIPTION_AMOUNT_MINOR);
    expect(subscription.amount).toBe(25000);
    expect(subscription.currency).toBe('EUR');
  });

  it('records both Stripe identifiers', async () => {
    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id);
    const event = makeEvent(draft);

    await send(event);

    const subscription = await Subscription.findOne();
    expect(subscription.platformSubscriptionId).toBe(event.data.object.subscription);
    expect(subscription.platformCustomerId).toBe(event.data.object.customer);
  });

  // The date the client is shown as "Next payment", and what slice 11 emails on.
  it('takes the period end from Stripe rather than computing it', async () => {
    const stripeEnd = Math.floor(Date.now() / 1000) + 17 * 24 * 60 * 60;
    retrieveSubscriptionMock.mockResolvedValue({ current_period_end: stripeEnd });

    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id);

    await send(makeEvent(draft));

    const subscription = await Subscription.findOne();
    expect(Math.floor(subscription.currentPeriodEnd.getTime() / 1000)).toBe(stripeEnd);
    expect(subscription.nextBillingDate.getTime()).toBe(subscription.currentPeriodEnd.getTime());
  });

  it('falls back to one month when Stripe cannot be reached', async () => {
    retrieveSubscriptionMock.mockRejectedValue(new Error('Stripe unreachable'));

    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id);

    await send(makeEvent(draft));

    const subscription = await Subscription.findOne();
    const days = (subscription.currentPeriodEnd - subscription.startDate) / (24 * 60 * 60 * 1000);

    expect(days).toBeGreaterThan(26);
    expect(days).toBeLessThan(32);
    // The account is still created — a billing date that is approximately right
    // beats refusing an account somebody has paid for.
    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(1);
  });
});

describe('account creation — a couple is ONE account', () => {
  // §6, confirmed by Asad: one user, one profile, one booking, one subscription.
  it('creates one user and one profile with both partners nested', async () => {
    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id, {
      email: 'pair@example.com',
      questionnaire: couple(),
    });

    await send(makeEvent(draft));

    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(1);
    expect(await ClientProfile.countDocuments()).toBe(1);
    expect(await Booking.countDocuments()).toBe(1);
    expect(await Subscription.countDocuments()).toBe(1);

    const clientProfile = await ClientProfile.findOne();
    expect(clientProfile.type).toBe('couple');
    expect(clientProfile.coupleData.partner1.name).toBe('Marta');
    expect(clientProfile.coupleData.partner2.name).toBe('Joris');
    expect(clientProfile.name).toBeUndefined();
  });
});

describe('account creation — the credentials', () => {
  /**
   * The strongest assertion in the chunk: the client can actually get in.
   *
   * Everything else could pass while the emailed password did not match the
   * stored hash, and nobody would find out until a real person was locked out
   * of something they had paid for. Same check chunk 4.3 made for therapists.
   */
  it('emails a password that genuinely logs the client in', async () => {
    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id);

    await send(makeEvent(draft));

    expect(sendClientWelcomeEmail).toHaveBeenCalledTimes(1);
    const [to, payload] = sendClientWelcomeEmail.mock.calls[0];

    expect(to).toBe('aoife@example.com');
    expect(payload.temporaryPassword).toHaveLength(16);
    expect(payload.name).toBe('Aoife Byrne');
    expect(payload.therapistName).toContain('Maya');

    // Through the real login endpoint, not a direct hash comparison.
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'aoife@example.com', password: payload.temporaryPassword });

    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe(ROLES.CLIENT);
  });

  it('never stores the password in readable form', async () => {
    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id);

    await send(makeEvent(draft));

    const { temporaryPassword } = sendClientWelcomeEmail.mock.calls[0][1];

    const raw = await mongoose.connection.db
      .collection('users')
      .findOne({ email: 'aoife@example.com' });

    expect(raw.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(JSON.stringify(raw)).not.toContain(temporaryPassword);
    expect(await comparePassword(temporaryPassword, raw.passwordHash)).toBe(true);
  });

  it('greets a couple by the first partner', async () => {
    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id, {
      email: 'pair@example.com',
      questionnaire: couple(),
    });

    await send(makeEvent(draft));

    expect(sendClientWelcomeEmail.mock.calls[0][1].name).toBe('Marta');
  });
});

describe('account creation — the email never undoes the account', () => {
  it('keeps the account when the welcome email fails', async () => {
    sendClientWelcomeEmail.mockRejectedValue(new Error('Resend is down'));

    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id);

    const response = await send(makeEvent(draft));

    expect(response.status).toBe(200);
    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(1);
    expect(await Subscription.countDocuments()).toBe(1);
    expect(await PendingCheckout.countDocuments()).toBe(0);
  });

  it('sends nothing when the transaction rolls back', async () => {
    const { profile } = await seedTherapist({ status: USER_STATUS.INACTIVE });
    const draft = await seedDraft(profile._id);

    await send(makeEvent(draft));

    expect(sendClientWelcomeEmail).not.toHaveBeenCalled();
  });
});

describe('account creation — rollback leaves nothing behind', () => {
  /**
   * A half-created account is the failure this transaction exists to prevent:
   * a client who has paid, can log in, and whose portal cannot say who their
   * therapist is. Every one of the four is asserted separately.
   */
  it('creates none of the four when a write fails midway', async () => {
    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id);

    // Fail on the LAST of the four, so the first three have already been
    // written inside the transaction and must be rolled back.
    const spy = jest
      .spyOn(Subscription, 'create')
      .mockRejectedValueOnce(new Error('subscription write failed'));

    const response = await send(makeEvent(draft));
    expect(response.status).toBe(500);

    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(0);
    expect(await ClientProfile.countDocuments()).toBe(0);
    expect(await Booking.countDocuments()).toBe(0);
    expect(await Subscription.countDocuments()).toBe(0);

    // The draft survives, so a retry can still succeed.
    expect(await PendingCheckout.countDocuments()).toBe(1);

    spy.mockRestore();
  });

  it('lets a retry succeed cleanly after a rollback', async () => {
    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id);

    const spy = jest
      .spyOn(Subscription, 'create')
      .mockRejectedValueOnce(new Error('transient failure'));

    await send(makeEvent(draft));
    spy.mockRestore();

    const response = await send(makeEvent(draft));

    expect(response.status).toBe(200);
    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(1);
    expect(await Subscription.countDocuments()).toBe(1);
    expect(await PendingCheckout.countDocuments()).toBe(0);
  });
});

describe('account creation — refusals', () => {
  it('creates nothing for a deactivated therapist', async () => {
    const { profile } = await seedTherapist({ status: USER_STATUS.INACTIVE });
    const draft = await seedDraft(profile._id);

    const response = await send(makeEvent(draft));

    expect(response.status).toBe(500);
    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(0);
    expect(await Booking.countDocuments()).toBe(0);
    expect(await Subscription.countDocuments()).toBe(0);
    // Kept, so the payment can be resolved by hand rather than lost.
    expect(await PendingCheckout.countDocuments()).toBe(1);
  });

  // The draft's 26-hour TTL expired before the webhook arrived. Unrecoverable
  // automatically, so it must be loud rather than silent — somebody has paid.
  it('fails loudly when the draft is gone and no account exists', async () => {
    await seedTherapist();

    const response = await send(makeEvent(null));

    expect(response.status).toBe(500);
    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(0);
    // The ledger still holds the event, so it can be rebuilt by hand.
    expect(await PaymentEvent.countDocuments()).toBe(1);
  });

  it('ignores a completed but unpaid session', async () => {
    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id);

    const response = await send(makeEvent(draft, { payment_status: 'unpaid' }));

    expect(response.status).toBe(200);
    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(0);
    expect(await PendingCheckout.countDocuments()).toBe(1);
  });
});

describe('account creation — idempotency', () => {
  /**
   * The gap chunk 6.3 recorded: the ledger row is written before the handler
   * runs, so a retry after a handler failure is skipped as a duplicate EVENT.
   * The guard therefore has to live here, keyed on the subscription — which
   * exists only if the whole transaction committed.
   */
  it('does not create a second account when the same payment arrives twice', async () => {
    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id);
    const event = makeEvent(draft);

    await send(event);
    // A different event id carrying the SAME subscription — the case a
    // ledger-based duplicate check would let straight through.
    const second = { ...event, id: `${event.id}_resent` };
    const response = await send(second);

    expect(response.status).toBe(200);
    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(1);
    expect(await ClientProfile.countDocuments()).toBe(1);
    expect(await Booking.countDocuments()).toBe(1);
    expect(await Subscription.countDocuments()).toBe(1);
    expect(sendClientWelcomeEmail).toHaveBeenCalledTimes(1);
  });

  // THE GAP 11.1 CLOSED. The SAME event, failed once, then retried by Stripe.
  // Before 11.1 the retry was a ledger "duplicate" and skipped: paid, no account.
  it('creates the account when the SAME event is retried after a failure', async () => {
    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id);
    const event = makeEvent(draft);

    const spy = jest.spyOn(Subscription, 'create').mockRejectedValueOnce(new Error('transient failure'));
    const failed = await send(event);
    spy.mockRestore();
    expect(failed.status).toBe(500);

    const retried = await send(event);

    expect(retried.status).toBe(200);
    expect(retried.body.duplicate).toBe(true);
    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(1);
    expect(await Subscription.countDocuments()).toBe(1);
    expect(await PaymentEvent.countDocuments()).toBe(1);
    expect(sendClientWelcomeEmail).toHaveBeenCalledTimes(1);
  });

  it('creates one account when the identical event arrives twice at once', async () => {
    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id);
    const event = makeEvent(draft);

    const responses = await Promise.all([send(event), send(event)]);

    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(1);
    expect(await Subscription.countDocuments()).toBe(1);
    expect(sendClientWelcomeEmail).toHaveBeenCalledTimes(1);
  });

  it('does not create a second account when the identical event is replayed', async () => {
    const { profile } = await seedTherapist();
    const draft = await seedDraft(profile._id);
    const event = makeEvent(draft);

    await send(event);
    await send(event);

    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(1);
    expect(await Subscription.countDocuments()).toBe(1);
    expect(await PaymentEvent.countDocuments()).toBe(1);
  });
});
