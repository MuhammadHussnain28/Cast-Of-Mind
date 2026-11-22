import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';
import { createEmailServiceMock } from '../test/emailServiceMock.js';

// Chunk 11.6 — the pre-renewal reminder (§13's third transparency point) and
// "No thanks" on the end-of-subscription rating. Email is faked; nothing sent.

process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_for_tests';

const sendRenewalReminderEmail = jest.fn(async () => ({ delivered: true }));
jest.unstable_mockModule('../services/email/email.service.js', () =>
  createEmailServiceMock({ sendRenewalReminderEmail }),
);

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { Review } = await import('../models/Review.js');
const { loginRateLimiter } = await import('./auth.routes.js');
const { clientRateLimiter, reviewRateLimiter } = await import('./client.routes.js');
const { SUBSCRIPTION_STATUS, CANCELLED_BY } = await import('../constants/payments.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { hashPassword } = await import('../utils/password.js');
const { sendRenewalReminders } = await import('../services/renewalReminders.service.js');
const { runLifecycleSweep } = await import('../services/subscriptionLifecycle.service.js');
const { renewalReminderEmail } = await import('../services/email/templates/subscriptionChange.js');

const PASSWORD = 'correct-horse-battery-staple';
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const LOOPBACK = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];

let world;
let counter = 0;

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([Subscription.init(), User.init(), Booking.init(), Review.init()]);
}, 60000);

beforeEach(async () => {
  sendRenewalReminderEmail.mockReset();
  sendRenewalReminderEmail.mockResolvedValue({ delivered: true });
  LOOPBACK.forEach((key) => [loginRateLimiter, clientRateLimiter, reviewRateLimiter].forEach((l) => l.resetKey?.(key)));
  world = await seed();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await clearCollections();
});
afterAll(stopMemoryMongo);

async function seed({ billsIn = 2 * DAY, status = SUBSCRIPTION_STATUS.ACTIVE, timezone = 'Asia/Kolkata', extra = {} } = {}) {
  counter += 1;
  const email = `remind${counter}@example.com`;
  const user = await User.create({
    email,
    passwordHash: await hashPassword(PASSWORD),
    role: ROLES.CLIENT,
    status: USER_STATUS.ACTIVE,
  });
  await ClientProfile.create({
    userId: user._id,
    type: 'individual',
    country: 'India',
    city: 'Pune',
    relationshipStatus: 'Single',
    concernTags: ['Anxiety', 'Stress', 'Grief'],
    therapistGenderPreference: 'no_preference',
    name: 'Asha Rao',
    age: 34,
    gender: 'female',
    ...(timezone ? { timezone } : {}),
  });
  const booking = await Booking.create({ clientId: user._id, therapistId: new mongoose.Types.ObjectId(), status: 'active' });
  const billing = new Date(Date.now() + billsIn);
  const subscription = await Subscription.create({
    bookingId: booking._id,
    clientId: user._id,
    status,
    startDate: new Date(billing.getTime() - 30 * DAY),
    currentPeriodEnd: billing,
    nextBillingDate: billing,
    ...(status === SUBSCRIPTION_STATUS.CANCELLED ? { cancelledAt: new Date(), cancelledBy: CANCELLED_BY.CLIENT } : {}),
    ...extra,
  });
  return { user, email, booking, subscription };
}

const quiet = () => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  return jest.spyOn(console, 'error').mockImplementation(() => {});
};
const stored = () => Subscription.findById(world.subscription._id).lean();

describe('the renewal reminder — once per cycle', () => {
  it('reminds a client whose renewal is within three days, once', async () => {
    quiet();
    expect(await sendRenewalReminders()).toEqual({ sent: 1, failed: 0 });
    expect(await sendRenewalReminders()).toEqual({ sent: 0, failed: 0 });
    expect(await sendRenewalReminders()).toEqual({ sent: 0, failed: 0 });

    expect(sendRenewalReminderEmail).toHaveBeenCalledTimes(1);
    expect((await stored()).renewalReminderFor.getTime()).toBe(world.subscription.nextBillingDate.getTime());
  });

  it('three sweeps at the same moment send one email', async () => {
    quiet();
    const results = await Promise.all([sendRenewalReminders(), sendRenewalReminders(), sendRenewalReminders()]);

    expect(results.reduce((n, r) => n + r.sent, 0)).toBe(1);
    expect(sendRenewalReminderEmail).toHaveBeenCalledTimes(1);
  });

  it('the next cycle, after a renewal, gets its own reminder', async () => {
    quiet();
    await sendRenewalReminders();
    const next = new Date(world.subscription.nextBillingDate.getTime() + 30 * DAY);
    await Subscription.updateOne({ _id: world.subscription._id }, { $set: { nextBillingDate: next, currentPeriodEnd: next } });

    // A month on, three days before the new date.
    await sendRenewalReminders({ now: new Date(next.getTime() - 2 * DAY) });
    expect(sendRenewalReminderEmail).toHaveBeenCalledTimes(2);
  });

  it('runs as part of the lifecycle sweep', async () => {
    quiet();
    expect((await runLifecycleSweep()).reminders).toEqual({ sent: 1, failed: 0 });
  });
});

describe('the renewal reminder — who and when', () => {
  it.each([
    ['more than three days away', 4 * DAY],
    ['within six hours of the charge', 5 * HOUR],
    ['already past', -HOUR],
  ])('sends nothing when billing is %s', async (_label, billsIn) => {
    await clearCollections();
    world = await seed({ billsIn });
    quiet();
    expect((await sendRenewalReminders()).sent).toBe(0);
  });

  it.each([[SUBSCRIPTION_STATUS.CANCELLED], [SUBSCRIPTION_STATUS.PAST_DUE], [SUBSCRIPTION_STATUS.EXPIRED]])(
    'sends nothing to a %s subscription — it will not renew',
    async (status) => {
      await clearCollections();
      world = await seed({ status });
      quiet();
      expect((await sendRenewalReminders()).sent).toBe(0);
      expect(sendRenewalReminderEmail).not.toHaveBeenCalled();
    },
  );

  // A subscription is cancelled between the sweep's read and its claim.
  it('never reminds a plan cancelled at the same moment', async () => {
    quiet();
    const realFind = Subscription.find.bind(Subscription);
    jest.spyOn(Subscription, 'find').mockImplementationOnce((...args) => {
      const query = realFind(...args);
      const realLean = query.lean.bind(query);
      query.lean = async () => {
        const rows = await realLean();
        await Subscription.updateOne(
          { _id: world.subscription._id },
          { $set: { status: SUBSCRIPTION_STATUS.CANCELLED, cancelledAt: new Date() } },
        );
        return rows;
      };
      return query;
    });

    expect((await sendRenewalReminders()).sent).toBe(0);
    expect(sendRenewalReminderEmail).not.toHaveBeenCalled();
  });
});

describe('the renewal reminder — a failed send is retried', () => {
  it('releases the claim, and the next sweep sends it once', async () => {
    const errors = quiet();
    sendRenewalReminderEmail.mockRejectedValueOnce(new Error(`Resend refused ${world.email}`));

    expect(await sendRenewalReminders()).toEqual({ sent: 0, failed: 1 });
    expect((await stored()).renewalReminderFor).toBeUndefined();
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/@example\.com/);

    expect(await sendRenewalReminders()).toEqual({ sent: 1, failed: 0 });
    expect(await sendRenewalReminders()).toEqual({ sent: 0, failed: 0 });
    expect(sendRenewalReminderEmail).toHaveBeenCalledTimes(2);
  });
});

describe('the renewal reminder — its words', () => {
  it("names the date in the client's own zone, and the amount", async () => {
    quiet();
    await sendRenewalReminders();
    const [to, details] = sendRenewalReminderEmail.mock.calls[0];

    expect(to).toBe(world.email);
    expect(details.amount).toBe('€250.00');
    const expected = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(world.subscription.nextBillingDate);
    expect(details.renewsOn).toBe(expected);
  });

  it('labels the date UTC when the client has no saved zone', async () => {
    await clearCollections();
    world = await seed({ timezone: null });
    quiet();
    await sendRenewalReminders();
    expect(sendRenewalReminderEmail.mock.calls[0][1].renewsOn).toMatch(/\(UTC\)$/);
  });

  it("carries §13's sentence word for word, and nothing about the card", () => {
    const { text, html } = renewalReminderEmail({
      name: '<b>Asha</b>',
      renewsOn: 'Tuesday 14 October 2026',
      amount: '€250.00',
      accountUrl: 'https://castofmind.com/portal/account',
    });
    const sentence = 'Your subscription renews on Tuesday 14 October 2026. No action needed to continue; cancel anytime before then.';
    expect(text).toContain(sentence);
    expect(html).toContain(sentence);
    expect(html).toContain('&lt;b&gt;Asha&lt;/b&gt;');
    expect(`${text} ${html}`).not.toMatch(/last4|\*{4}|visa|mastercard|urgent|last chance/i);
  });
});

describe('"No thanks" on the end-of-subscription rating', () => {
  async function asClient(method, path, body) {
    const login = await request(app).post('/api/v1/auth/login').send({ email: world.email, password: PASSWORD });
    const req = request(app)[method](path).set('Authorization', `Bearer ${login.body.accessToken}`);
    return body ? req.send(body) : req;
  }

  beforeEach(async () => {
    await clearCollections();
    world = await seed({ status: SUBSCRIPTION_STATUS.CANCELLED, billsIn: 10 * DAY });
  });

  it('puts the invitation away for good, and nothing else changes', async () => {
    expect((await asClient('get', '/api/v1/client/me')).body.reviewState).toBe('eligible');

    const res = await asClient('post', '/api/v1/client/reviews/decline');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ declined: true });

    const me = (await asClient('get', '/api/v1/client/me')).body;
    expect(me.reviewState).toBe('declined');
    // Leaving is never gated on it: the plan runs on exactly as before.
    expect(me.access).toBe('ending');
    expect(await Review.countDocuments()).toBe(0);
  });

  it('is safe to press twice, and keeps the first time', async () => {
    await asClient('post', '/api/v1/client/reviews/decline');
    const first = (await stored()).reviewDeclinedAt;
    expect((await asClient('post', '/api/v1/client/reviews/decline')).status).toBe(200);
    expect((await stored()).reviewDeclinedAt.getTime()).toBe(first.getTime());
  });

  it('is refused while the plan is still active — there is nothing to decline yet', async () => {
    await Subscription.updateOne({ _id: world.subscription._id }, {
      $set: { status: SUBSCRIPTION_STATUS.ACTIVE },
      $unset: { cancelledAt: 1, cancelledBy: 1 },
    });
    const res = await asClient('post', '/api/v1/client/reviews/decline');
    expect(res.status).toBe(409);
    expect((await stored()).reviewDeclinedAt).toBeUndefined();
  });

  it('works for an expired client too, above the gate', async () => {
    await Subscription.updateOne({ _id: world.subscription._id }, { $set: { status: SUBSCRIPTION_STATUS.EXPIRED } });
    expect((await asClient('post', '/api/v1/client/reviews/decline')).status).toBe(200);
  });

  it('stars are still required to submit, and words are still optional', async () => {
    expect((await asClient('post', '/api/v1/client/reviews', { text: 'Words only' })).status).toBe(422);
    expect((await asClient('post', '/api/v1/client/reviews', { stars: 4 })).status).toBe(201);
    expect((await asClient('get', '/api/v1/client/me')).body.reviewState).toBe('submitted');
  });
});
