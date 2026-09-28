import { jest } from '@jest/globals';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';

// Stripe is faked, so no test touches a real account, spends quota or creates a
// session. Faking it also lets the arguments we send be asserted directly —
// which is where the money actually lives.
const createSessionMock = jest.fn();

jest.unstable_mockModule('../config/stripe.js', () => ({
  stripe: { checkout: { sessions: { create: createSessionMock } } },
  isStripeConfigured: true,
  isTestKey: true,
  default: { checkout: { sessions: { create: createSessionMock } } },
}));

// The email service is deliberately NOT mocked: checkout sends no email, and a
// mock for a module this suite never exercises is one more thing to keep in step.

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { TherapistProfile } = await import('../models/TherapistProfile.js');
const { PendingCheckout } = await import('../models/PendingCheckout.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { checkoutRateLimiter } = await import('./checkout.routes.js');
const { SUBSCRIPTION_AMOUNT_MINOR } = await import('../constants/payments.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');

const ENDPOINT = '/api/v1/checkout/create-session';

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([User.init(), PendingCheckout.init(), TherapistProfile.init()]);
});

beforeEach(() => {
  createSessionMock.mockReset();
  createSessionMock.mockResolvedValue({
    id: 'cs_test_abc123',
    url: 'https://checkout.stripe.com/c/pay/cs_test_abc123',
  });
  checkoutRateLimiter.resetKey?.('::ffff:127.0.0.1');
  checkoutRateLimiter.resetKey?.('127.0.0.1');
});

afterEach(clearCollections);
afterAll(stopMemoryMongo);

async function seedTherapist(overrides = {}) {
  const user = await User.create({
    email: `t${Date.now()}${Math.random()}@example.com`,
    passwordHash: 'x'.repeat(60),
    role: ROLES.THERAPIST,
    status: USER_STATUS.ACTIVE,
  });

  return TherapistProfile.create({
    userId: user._id,
    // Required since chunk 4.3 — the permanent link back to the application.
    applicationId: new mongoose.Types.ObjectId(),
    title: 'Dr.',
    firstName: 'Maya',
    lastName: 'Iversen',
    gender: 'female',
    dateOfBirth: new Date('1985-04-02'),
    photoUrl: 'https://res.cloudinary.com/demo/image/upload/v1/photo.jpg',
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
    treatmentOrientations: ['CBT', 'Mindfulness'],
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

const couple = (overrides = {}) => ({
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
  ...overrides,
});

const body = (therapist, overrides = {}) => ({
  email: 'aoife@example.com',
  therapistProfileId: String(therapist._id),
  questionnaire: individual(),
  ...overrides,
});

describe('POST /checkout/create-session — the happy path', () => {
  it('returns a Stripe URL and stores the questionnaire', async () => {
    const therapist = await seedTherapist();

    const response = await request(app).post(ENDPOINT).send(body(therapist));

    expect(response.status).toBe(201);
    expect(response.body.url).toBe('https://checkout.stripe.com/c/pay/cs_test_abc123');

    const pending = await PendingCheckout.findOne();
    expect(pending.email).toBe('aoife@example.com');
    expect(String(pending.therapistProfileId)).toBe(String(therapist._id));
    expect(pending.questionnaire.concernTags).toEqual(['Anxiety', 'Stress', 'Grief']);
    expect(pending.checkoutSessionId).toBe('cs_test_abc123');
    expect(pending.reference).toHaveLength(64);
  });

  it('accepts a couple with partners nested under coupleData', async () => {
    const therapist = await seedTherapist();

    const response = await request(app)
      .post(ENDPOINT)
      .send(body(therapist, { questionnaire: couple() }));

    expect(response.status).toBe(201);

    const pending = await PendingCheckout.findOne();
    expect(pending.questionnaire.coupleData.partner1.name).toBe('Marta');
    expect(pending.questionnaire.coupleData.partner2.age).toBe(41);
  });

  it('sets an expiry that outlives the Stripe session', async () => {
    const therapist = await seedTherapist();
    await request(app).post(ENDPOINT).send(body(therapist));

    const pending = await PendingCheckout.findOne();
    const hoursFromNow = (pending.expiresAt - Date.now()) / (60 * 60 * 1000);

    expect(hoursFromNow).toBeGreaterThan(24);
    expect(hoursFromNow).toBeLessThanOrEqual(26);
  });

  it('lowercases and trims the email', async () => {
    const therapist = await seedTherapist();

    await request(app)
      .post(ENDPOINT)
      .send(body(therapist, { email: '  Aoife@Example.COM ' }));

    const pending = await PendingCheckout.findOne();
    expect(pending.email).toBe('aoife@example.com');
  });
});

describe('POST /checkout/create-session — THE GOLDEN RULE', () => {
  // §12: the account is created only when the webhook confirms payment. This is
  // the single most important assertion in the chunk.
  it('creates no user, profile, booking or subscription', async () => {
    const therapist = await seedTherapist();
    const usersBefore = await User.countDocuments();

    const response = await request(app).post(ENDPOINT).send(body(therapist));

    expect(response.status).toBe(201);
    expect(await User.countDocuments()).toBe(usersBefore);
    expect(await ClientProfile.countDocuments()).toBe(0);
    expect(await Booking.countDocuments()).toBe(0);
    expect(await Subscription.countDocuments()).toBe(0);
  });
});

describe('POST /checkout/create-session — what we send Stripe', () => {
  it('charges €200 a month in EUR as a subscription', async () => {
    const therapist = await seedTherapist();
    await request(app).post(ENDPOINT).send(body(therapist));

    const [args] = createSessionMock.mock.calls[0];
    const price = args.line_items[0].price_data;

    expect(args.mode).toBe('subscription');
    expect(price.unit_amount).toBe(SUBSCRIPTION_AMOUNT_MINOR);
    expect(price.unit_amount).toBe(20000);
    expect(price.currency).toBe('eur');
    expect(price.recurring.interval).toBe('month');
    expect(args.line_items[0].quantity).toBe(1);
  });

  // Concern tags are somebody's mental health information. There is no reason
  // for them to reach a third party, and metadata caps at 500 characters anyway.
  it('sends NO questionnaire data to Stripe', async () => {
    const therapist = await seedTherapist();
    await request(app).post(ENDPOINT).send(body(therapist));

    const serialised = JSON.stringify(createSessionMock.mock.calls[0][0]);

    expect(serialised).not.toContain('Anxiety');
    expect(serialised).not.toContain('Aoife Byrne');
    expect(serialised).not.toContain('Single');
    expect(serialised).not.toContain('concernTags');
  });

  it('passes only the random reference, and it matches the stored draft', async () => {
    const therapist = await seedTherapist();
    await request(app).post(ENDPOINT).send(body(therapist));

    const [args] = createSessionMock.mock.calls[0];
    const pending = await PendingCheckout.findOne();

    expect(args.client_reference_id).toBe(pending.reference);
    expect(args.metadata).toEqual({ pendingCheckoutReference: pending.reference });
  });

  it('states the auto-renewal terms on Stripe’s own page', async () => {
    const therapist = await seedTherapist();
    await request(app).post(ENDPOINT).send(body(therapist));

    const [args] = createSessionMock.mock.calls[0];
    expect(args.custom_text.submit.message).toMatch(/charged €200 automatically each month/);
    expect(args.custom_text.submit.message).toMatch(/until you cancel/);
  });

  it('prefills the email and sets both return URLs', async () => {
    const therapist = await seedTherapist();
    await request(app).post(ENDPOINT).send(body(therapist));

    const [args] = createSessionMock.mock.calls[0];
    expect(args.customer_email).toBe('aoife@example.com');
    expect(args.success_url).toContain('/welcome');
    expect(args.success_url).toContain('{CHECKOUT_SESSION_ID}');
    expect(args.cancel_url).toContain('/checkout/cancel');
  });
});

describe('POST /checkout/create-session — refusals, all before Stripe is called', () => {
  it('refuses an email that already has an account, with one neutral message', async () => {
    const therapist = await seedTherapist();
    await User.create({
      email: 'aoife@example.com',
      passwordHash: 'x'.repeat(60),
      role: ROLES.CLIENT,
      status: USER_STATUS.ACTIVE,
    });

    const response = await request(app).post(ENDPOINT).send(body(therapist));

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_IN_USE');
    expect(createSessionMock).not.toHaveBeenCalled();
    expect(await PendingCheckout.countDocuments()).toBe(0);
  });

  // The 3.2 rule: the reply may concede the address is known, never what kind
  // of record it is.
  it('never says whether the address is a client, a therapist or the admin', async () => {
    const therapist = await seedTherapist();

    for (const role of [ROLES.CLIENT, ROLES.THERAPIST, ROLES.ADMIN]) {
      await User.deleteMany({ email: 'aoife@example.com' });
      await User.create({
        email: 'aoife@example.com',
        passwordHash: 'x'.repeat(60),
        role,
        status: USER_STATUS.ACTIVE,
      });

      const response = await request(app).post(ENDPOINT).send(body(therapist));
      const text = JSON.stringify(response.body).toLowerCase();

      expect(response.status).toBe(409);
      expect(text).not.toContain('therapist');
      expect(text).not.toContain('admin');
      expect(text).not.toContain('client');
    }
  });

  it('refuses an unknown therapist', async () => {
    const response = await request(app)
      .post(ENDPOINT)
      .send({
        email: 'aoife@example.com',
        therapistProfileId: String(new mongoose.Types.ObjectId()),
        questionnaire: individual(),
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('THERAPIST_UNAVAILABLE');
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  // Carried from 5.6: the client's selection is a snapshot and may be stale.
  it('refuses a deactivated therapist', async () => {
    const therapist = await seedTherapist({ status: USER_STATUS.INACTIVE });

    const response = await request(app).post(ENDPOINT).send(body(therapist));

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('THERAPIST_UNAVAILABLE');
    expect(createSessionMock).not.toHaveBeenCalled();
    expect(await PendingCheckout.countDocuments()).toBe(0);
  });

  it('refuses a malformed therapist id before touching the database', async () => {
    const response = await request(app)
      .post(ENDPOINT)
      .send({ email: 'a@example.com', therapistProfileId: 'nope', questionnaire: individual() });

    expect(response.status).toBe(422);
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('refuses a bad email', async () => {
    const therapist = await seedTherapist();

    const response = await request(app).post(ENDPOINT).send(body(therapist, { email: 'nope' }));

    expect(response.status).toBe(422);
    expect(createSessionMock).not.toHaveBeenCalled();
  });
});

describe('POST /checkout/create-session — questionnaire validation', () => {
  const cases = [
    ['no concerns', { concernTags: [] }],
    ['five concerns', { concernTags: ['Anxiety', 'Stress', 'Grief', 'Parenting', 'Divorce'] }],
    ['duplicate concerns', { concernTags: ['Anxiety', 'Anxiety'] }],
    ['a concern outside the list', { concernTags: ['OCD'] }],
    ['a lowercased tag', { concernTags: ['anxiety'] }],
    ['an unknown relationship status', { relationshipStatus: 'Complicated' }],
    ['an age of zero', { age: 0 }],
    ['an age over the ceiling', { age: 121 }],
    ['an unknown gender preference', { therapistGenderPreference: 'either' }],
  ];

  it.each(cases)('refuses %s', async (_label, patch) => {
    const therapist = await seedTherapist();

    const response = await request(app)
      .post(ENDPOINT)
      .send(body(therapist, { questionnaire: individual(patch) }));

    expect(response.status).toBe(422);
    expect(createSessionMock).not.toHaveBeenCalled();
    expect(await PendingCheckout.countDocuments()).toBe(0);
  });

  it('refuses an individual carrying couple details', async () => {
    const therapist = await seedTherapist();

    const response = await request(app)
      .post(ENDPOINT)
      .send(body(therapist, { questionnaire: individual({ coupleData: couple().coupleData }) }));

    expect(response.status).toBe(422);
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('refuses a couple carrying individual details', async () => {
    const therapist = await seedTherapist();

    const response = await request(app)
      .post(ENDPOINT)
      .send(body(therapist, { questionnaire: couple({ name: 'Marta', age: 38, gender: 'female' }) }));

    expect(response.status).toBe(422);
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('refuses a couple missing a partner', async () => {
    const therapist = await seedTherapist();
    const answers = couple();
    delete answers.coupleData.partner2;

    const response = await request(app)
      .post(ENDPOINT)
      .send(body(therapist, { questionnaire: answers }));

    expect(response.status).toBe(422);
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  // Unknown keys are stripped rather than rejected, so a card field could never
  // be stored even if a confused frontend sent one.
  it('strips unknown keys, including anything card-shaped', async () => {
    const therapist = await seedTherapist();

    const response = await request(app)
      .post(ENDPOINT)
      .send({
        ...body(therapist),
        cardNumber: '4242424242424242',
        cvc: '123',
      });

    expect(response.status).toBe(201);

    // The WHOLE number and the `cvc` KEY, never a four-digit fragment: this ran
    // green for weeks, then failed when Stripe's expires_at read 1790424269 (11.4).
    const pending = await PendingCheckout.findOne();
    const stored = JSON.stringify(pending.toObject());
    expect(stored).not.toContain('4242424242424242');
    expect(stored).not.toContain('"cvc"');

    const sentToStripe = JSON.stringify(createSessionMock.mock.calls[0][0]);
    expect(sentToStripe).not.toContain('4242424242424242');
    expect(sentToStripe).not.toContain('"cvc"');
    expect(sentToStripe).not.toContain('cardNumber');
  });
});

describe('POST /checkout/create-session — when Stripe fails', () => {
  it('returns 502 and creates no account', async () => {
    const therapist = await seedTherapist();
    createSessionMock.mockRejectedValue(new Error('Stripe is down'));

    const response = await request(app).post(ENDPOINT).send(body(therapist));

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('PAYMENTS_UNAVAILABLE');
    expect(await User.countDocuments({ role: ROLES.CLIENT })).toBe(0);
    expect(await Booking.countDocuments()).toBe(0);
  });

  // The orphan draft is the safe failure direction: it expires on its own, and
  // the alternative ordering could leave a PAID session with no answers behind it.
  it('leaves the draft to expire rather than stranding a paid session', async () => {
    const therapist = await seedTherapist();
    createSessionMock.mockRejectedValue(new Error('Stripe is down'));

    await request(app).post(ENDPOINT).send(body(therapist));

    const pending = await PendingCheckout.findOne();
    expect(pending).not.toBeNull();
    expect(pending.checkoutSessionId).toBeUndefined();
    expect(pending.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('never leaks Stripe’s own error text to the caller', async () => {
    const therapist = await seedTherapist();
    createSessionMock.mockRejectedValue(new Error('No such price: price_secret_internal'));

    const response = await request(app).post(ENDPOINT).send(body(therapist));

    expect(JSON.stringify(response.body)).not.toContain('price_secret_internal');
  });
});

describe('POST /checkout/create-session — rate limiting', () => {
  it('refuses the eleventh attempt in an hour', async () => {
    const therapist = await seedTherapist();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await request(app)
        .post(ENDPOINT)
        .send(body(therapist, { email: `person${attempt}@example.com` }));
    }

    const response = await request(app)
      .post(ENDPOINT)
      .send(body(therapist, { email: 'eleventh@example.com' }));

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('RATE_LIMITED');
  });
});
