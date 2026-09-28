import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';
import { createEmailServiceMock } from '../test/emailServiceMock.js';

// Chunk 11.3 — cancellation, reactivation and the end of a cancelled plan (§13).
// NEVER MID-PAID-PERIOD. Webhook signatures are REAL; Stripe's API and email are faked.

const WEBHOOK_SECRET = 'whsec_test_secret_for_signing_only_not_real';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_for_tests';
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

const updateMock = jest.fn();
const cancelMock = jest.fn();
const retrieveMock = jest.fn();

jest.unstable_mockModule('../config/stripe.js', () => {
  const signer = new Stripe('sk_test_dummy_for_tests');
  const fake = {
    webhooks: signer.webhooks,
    subscriptions: { update: updateMock, cancel: cancelMock, retrieve: retrieveMock },
    billingPortal: { sessions: { create: jest.fn() } },
  };
  return { stripe: fake, isStripeConfigured: true, isTestKey: true, default: fake };
});

const sendSubscriptionCancelledEmail = jest.fn(async () => ({ delivered: true }));
const sendSubscriptionReactivatedEmail = jest.fn(async () => ({ delivered: true }));
jest.unstable_mockModule('../services/email/email.service.js', () =>
  createEmailServiceMock({ sendSubscriptionCancelledEmail, sendSubscriptionReactivatedEmail }),
);

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { PaymentEvent } = await import('../models/PaymentEvent.js');
const { webhookRateLimiter } = await import('./webhook.routes.js');
const { loginRateLimiter } = await import('./auth.routes.js');
const { clientRateLimiter, cancelRateLimiter } = await import('./client.routes.js');
const { STRIPE_EVENT } = await import('../constants/webhooks.js');
const { SUBSCRIPTION_STATUS, CANCELLED_BY } = await import('../constants/payments.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { hashPassword } = await import('../utils/password.js');
const { resolveAccess, accessEndsAt } = await import('../middleware/requireActiveSubscription.js');
const lifecycle = await import('../services/subscriptionLifecycle.service.js');
const templates = await import('../services/email/templates/subscriptionChange.js');

const signer = new Stripe('sk_test_dummy_for_tests');
const SUB_ID = 'sub_cancel_1';
const PASSWORD = 'correct-horse-battery-staple';
const DAY = 24 * 60 * 60 * 1000;
const LOOPBACK = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];

let client;
let counter = 0;

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([PaymentEvent.init(), Subscription.init(), User.init(), Booking.init()]);
}, 60000);

beforeEach(async () => {
  [sendSubscriptionCancelledEmail, sendSubscriptionReactivatedEmail].forEach((fn) => {
    fn.mockReset();
    fn.mockResolvedValue({ delivered: true });
  });
  updateMock.mockReset();
  updateMock.mockImplementation(async (id, body) => ({ id, ...body }));
  cancelMock.mockReset();
  cancelMock.mockResolvedValue({ id: SUB_ID, status: 'canceled' });
  retrieveMock.mockReset();
  retrieveMock.mockResolvedValue({ id: SUB_ID, status: 'active', cancel_at_period_end: false });
  LOOPBACK.forEach((key) =>
    [webhookRateLimiter, loginRateLimiter, clientRateLimiter, cancelRateLimiter].forEach((l) => l.resetKey?.(key)),
  );
  client = await seedClient();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await clearCollections();
});
afterAll(stopMemoryMongo);

// Whole seconds, as Stripe sends them.
const at = (ms) => new Date(Math.floor((Date.now() + ms) / 1000) * 1000);

async function seedClient({ status = SUBSCRIPTION_STATUS.ACTIVE, periodEnd = at(10 * DAY), extra = {} } = {}) {
  counter += 1;
  const email = `cancel${counter}@example.com`;
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
    timezone: 'Asia/Kolkata',
  });
  const booking = await Booking.create({
    clientId: user._id,
    therapistId: new mongoose.Types.ObjectId(),
    status: 'active',
  });
  const subscription = await Subscription.create({
    bookingId: booking._id,
    clientId: user._id,
    status,
    startDate: new Date(periodEnd.getTime() - 40 * DAY),
    currentPeriodEnd: periodEnd,
    nextBillingDate: periodEnd,
    sessionsRemaining: 3,
    platformSubscriptionId: SUB_ID,
    platformCustomerId: 'cus_cancel_1',
    ...(status === SUBSCRIPTION_STATUS.CANCELLED
      ? { cancelledAt: new Date(), cancelledBy: CANCELLED_BY.CLIENT }
      : {}),
    ...extra,
  });
  return { user, email, booking, subscription };
}

const stored = () => Subscription.findOne({ platformSubscriptionId: SUB_ID }).lean();
const set = (fields) => Subscription.updateOne({ platformSubscriptionId: SUB_ID }, { $set: fields });
const quiet = () => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  return jest.spyOn(console, 'error').mockImplementation(() => {});
};

async function tokenFor(email) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD });
  return res.body.accessToken;
}

const post = async (path, email = client.email) =>
  request(app).post(`/api/v1/client/subscription/${path}`).set('Authorization', `Bearer ${await tokenFor(email)}`);
const me = async (email = client.email) =>
  request(app).get('/api/v1/client/me').set('Authorization', `Bearer ${await tokenFor(email)}`);
const gated = async (email = client.email) =>
  request(app).get('/api/v1/client/journal').set('Authorization', `Bearer ${await tokenFor(email)}`);

function subscriptionEvent(type, object = { id: SUB_ID, object: 'subscription' }) {
  counter += 1;
  const event = {
    id: `evt_cancel_${Date.now()}_${counter}`,
    object: 'event',
    type,
    created: Math.floor(Date.now() / 1000),
    data: { object },
  };
  const payload = JSON.stringify(event);
  const header = signer.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
  return request(app)
    .post('/api/v1/webhooks/payment')
    .set('stripe-signature', header)
    .set('Content-Type', 'application/json')
    .send(payload);
}

describe('cancelling an active plan — access continues to the paid end', () => {
  it('stops Stripe at the period end and records who cancelled', async () => {
    quiet();
    const res = await post('cancel');

    expect(res.status).toBe(200);
    expect(res.body.cancelled).toBe(true);
    expect(new Date(res.body.accessEndsAt).getTime()).toBe(client.subscription.currentPeriodEnd.getTime());
    expect(updateMock).toHaveBeenCalledWith(SUB_ID, { cancel_at_period_end: true });
    expect(cancelMock).not.toHaveBeenCalled();

    const sub = await stored();
    expect(sub.status).toBe(SUBSCRIPTION_STATUS.CANCELLED);
    expect(sub.cancelledBy).toBe(CANCELLED_BY.CLIENT);
    expect(sub.cancelledAt).toBeInstanceOf(Date);
  });

  it('NEVER cuts off mid-paid-period: the portal stays open and names the end', async () => {
    quiet();
    await post('cancel');

    expect((await gated()).status).toBe(200);
    const body = (await me()).body;
    expect(body.access).toBe('ending');
    expect(new Date(body.accessEndsAt).getTime()).toBe(client.subscription.currentPeriodEnd.getTime());
    expect(body.subscription.cancelledBy).toBe(CANCELLED_BY.CLIENT);
  });

  it('keeps the sessions already paid for', async () => {
    quiet();
    await post('cancel');
    expect((await stored()).sessionsRemaining).toBe(3);
  });

  it('tells Stripe first — at that moment our row is still active', async () => {
    quiet();
    const seen = [];
    updateMock.mockImplementation(async (id) => {
      seen.push((await stored()).status);
      return { id };
    });
    await post('cancel');
    expect(seen).toEqual([SUBSCRIPTION_STATUS.ACTIVE]);
  });

  it("a Stripe failure changes nothing and speaks our words, not Stripe's", async () => {
    quiet();
    updateMock.mockRejectedValue(new Error('secret Stripe detail'));
    const res = await post('cancel');

    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toMatch(/secret Stripe detail/);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
    expect(sendSubscriptionCancelledEmail).not.toHaveBeenCalled();
  });

  it('a second press is safe: one Stripe call, one email', async () => {
    quiet();
    await post('cancel');
    const second = await post('cancel');

    expect(second.status).toBe(200);
    expect(second.body.alreadyCancelled).toBe(true);
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(sendSubscriptionCancelledEmail).toHaveBeenCalledTimes(1);
  });

  // Both read "active" before either writes: only the atomic filter can stop a
  // second cancellation and a second email.
  it('two presses at the same moment cancel once and email once', async () => {
    quiet();
    const token = await tokenFor(client.email);
    const press = () =>
      request(app).post('/api/v1/client/subscription/cancel').set('Authorization', `Bearer ${token}`);

    const responses = await Promise.all([press(), press()]);

    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect(responses.filter((r) => r.body.cancelled === true)).toHaveLength(1);
    expect(sendSubscriptionCancelledEmail).toHaveBeenCalledTimes(1);
  });

  it('emails exactly when access ends, in the client\'s own clock', async () => {
    quiet();
    await post('cancel');

    const [to, details] = sendSubscriptionCancelledEmail.mock.calls[0];
    expect(to).toBe(client.email);
    expect(details.accessUntil).toMatch(/\(Kolkata time\)$/);
    expect(details.canReactivate).toBe(true);
  });

  it('ignores anything in the body — the subscription comes from the token', async () => {
    quiet();
    const other = await seedClient({ extra: { platformSubscriptionId: 'sub_other' } });
    await request(app)
      .post('/api/v1/client/subscription/cancel')
      .set('Authorization', `Bearer ${await tokenFor(client.email)}`)
      .send({ subscriptionId: String(other.subscription._id) });

    expect((await Subscription.findById(other.subscription._id).lean()).status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
  });
});

describe('cancelling while past due — Stripe stopped now, access to the grace end', () => {
  beforeEach(async () => {
    await clearCollections();
    client = await seedClient({
      status: SUBSCRIPTION_STATUS.PAST_DUE,
      periodEnd: at(-DAY),
      extra: { pastDueSince: at(-DAY), graceEndsAt: at(2 * DAY) },
    });
  });

  it('cancels at Stripe immediately so no retry can charge them', async () => {
    quiet();
    const res = await post('cancel');

    expect(res.status).toBe(200);
    expect(cancelMock).toHaveBeenCalledWith(SUB_ID);
    expect(updateMock).not.toHaveBeenCalled();
    expect(new Date(res.body.accessEndsAt).getTime()).toBe(client.subscription.graceEndsAt.getTime());
  });

  it('keeps the portal open until the grace ends, as the banner promised', async () => {
    quiet();
    await post('cancel');

    expect((await gated()).status).toBe(200);
    expect((await me()).body.access).toBe('ending');
    expect(sendSubscriptionCancelledEmail.mock.calls[0][1].canReactivate).toBe(false);
  });
});

describe('where access ends — the one helper', () => {
  const now = new Date('2026-10-17T12:00:00Z');
  const cancelled = (fields) => ({ status: SUBSCRIPTION_STATUS.CANCELLED, ...fields });

  it('a cancelled plan ends exactly at its period end', () => {
    expect(resolveAccess(cancelled({ currentPeriodEnd: new Date('2026-10-17T12:00:01Z') }), now)).toBe('ending');
    expect(resolveAccess(cancelled({ currentPeriodEnd: now }), now)).toBe('ended');
  });

  it('a past-due cancellation runs to whichever is later, period or grace', () => {
    const sub = cancelled({ currentPeriodEnd: new Date('2026-10-10T00:00:00Z'), graceEndsAt: new Date('2026-10-18T00:00:00Z') });
    expect(accessEndsAt(sub).toISOString()).toBe('2026-10-18T00:00:00.000Z');
    expect(resolveAccess(sub, now)).toBe('ending');
  });

  it('an active plan has no end', () => {
    expect(accessEndsAt({ status: SUBSCRIPTION_STATUS.ACTIVE, currentPeriodEnd: now })).toBeNull();
  });
});

describe('the sweep — cancelled → expired at the right time', () => {
  it('does nothing before the end, and expires it after, with 0 sessions', async () => {
    quiet();
    await set({ status: SUBSCRIPTION_STATUS.CANCELLED, cancelledAt: new Date(), cancelledBy: CANCELLED_BY.CLIENT });

    expect((await lifecycle.expireEndedCancellations()).expired).toBe(0);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.CANCELLED);

    const result = await lifecycle.expireEndedCancellations({ now: new Date(Date.now() + 11 * DAY) });
    expect(result.expired).toBe(1);
    const sub = await stored();
    expect(sub.status).toBe(SUBSCRIPTION_STATUS.EXPIRED);
    expect(sub.sessionsRemaining).toBe(0);
    // Kept, as the record of when and who.
    expect(sub.cancelledBy).toBe(CANCELLED_BY.CLIENT);
    expect(retrieveMock).not.toHaveBeenCalled();
  });

  it('waits for the grace end of a past-due cancellation, not just the period end', async () => {
    quiet();
    await set({
      status: SUBSCRIPTION_STATUS.CANCELLED,
      cancelledAt: new Date(),
      currentPeriodEnd: at(-DAY),
      graceEndsAt: at(2 * DAY),
    });

    expect((await lifecycle.expireEndedCancellations()).expired).toBe(0);
    expect((await lifecycle.expireEndedCancellations({ now: new Date(Date.now() + 3 * DAY) })).expired).toBe(1);
  });

  // A reactivation lands between the sweep's read and its write: it wins.
  it('never expires one that was reactivated at the same moment', async () => {
    quiet();
    jest.spyOn(Subscription, 'find').mockImplementation(() => {
      const chain = { select: () => chain, sort: () => chain, limit: () => chain, lean: async () => [{ _id: client.subscription._id }] };
      return chain;
    });

    const result = await lifecycle.expireEndedCancellations({ now: new Date(Date.now() + 11 * DAY) });

    expect(result.expired).toBe(0);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
  });

  it('runs through the sweep entry point', async () => {
    quiet();
    await set({ status: SUBSCRIPTION_STATUS.CANCELLED, cancelledAt: new Date(), currentPeriodEnd: at(-DAY) });
    expect((await lifecycle.runLifecycleSweep()).cancelled.expired).toBe(1);
  });
});

describe('reactivating before the end', () => {
  beforeEach(async () => {
    await clearCollections();
    client = await seedClient({ status: SUBSCRIPTION_STATUS.CANCELLED });
  });

  it('turns Stripe back on, then the row, and says when the next payment is', async () => {
    quiet();
    const res = await post('reactivate');

    expect(res.status).toBe(200);
    expect(res.body.reactivated).toBe(true);
    expect(updateMock).toHaveBeenCalledWith(SUB_ID, { cancel_at_period_end: false });

    const sub = await stored();
    expect(sub.status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
    expect(sub.cancelledAt).toBeUndefined();
    expect(sub.cancelledBy).toBeUndefined();

    const details = sendSubscriptionReactivatedEmail.mock.calls[0][1];
    expect(details.amount).toBe('€200.00');
    expect(details.nextPayment).toMatch(/\(Kolkata time\)$/);
    expect((await me()).body.access).toBe('active');
  });

  it('is out of reach once the paid period is over', async () => {
    quiet();
    await set({ currentPeriodEnd: at(-DAY) });
    expect((await post('reactivate')).status).toBe(403);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("refuses to undo the admin's cancellation", async () => {
    quiet();
    await set({ cancelledBy: CANCELLED_BY.ADMIN });
    const res = await post('reactivate');

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CANNOT_REACTIVATE');
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('refuses a past-due cancellation, which Stripe has already ended', async () => {
    quiet();
    await set({ graceEndsAt: at(2 * DAY) });
    expect((await post('reactivate')).status).toBe(409);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('a Stripe failure leaves it cancelled', async () => {
    quiet();
    updateMock.mockRejectedValue(new Error('Stripe down'));
    expect((await post('reactivate')).status).toBe(502);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.CANCELLED);
    expect(sendSubscriptionReactivatedEmail).not.toHaveBeenCalled();
  });

  // The row expires between the checks and the write: the filter must refuse.
  it('never revives a row that ended meanwhile', async () => {
    quiet();
    updateMock.mockImplementation(async (id) => {
      await set({ status: SUBSCRIPTION_STATUS.EXPIRED, sessionsRemaining: 0 });
      return { id };
    });

    expect((await post('reactivate')).status).toBe(409);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.EXPIRED);
  });

  it('an active plan has nothing to reactivate', async () => {
    quiet();
    await set({ status: SUBSCRIPTION_STATUS.ACTIVE });
    const res = await post('reactivate');
    expect(res.body.alreadyActive).toBe(true);
    expect(updateMock).not.toHaveBeenCalled();
  });
});

describe('Stripe says the subscription ended (customer.subscription.deleted)', () => {
  it('with paid time left: cancelled, access kept to the end', async () => {
    quiet();
    const res = await subscriptionEvent(STRIPE_EVENT.SUBSCRIPTION_DELETED);

    expect(res.status).toBe(200);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.CANCELLED);
    expect((await me()).body.access).toBe('ending');
  });

  it('with no paid time left: expired, with 0 sessions', async () => {
    quiet();
    await set({ currentPeriodEnd: at(-DAY) });
    await subscriptionEvent(STRIPE_EVENT.SUBSCRIPTION_DELETED);

    const sub = await stored();
    expect(sub.status).toBe(SUBSCRIPTION_STATUS.EXPIRED);
    expect(sub.sessionsRemaining).toBe(0);
  });

  it('a past-due plan inside its grace keeps access to the grace end', async () => {
    quiet();
    await set({ status: SUBSCRIPTION_STATUS.PAST_DUE, currentPeriodEnd: at(-DAY), graceEndsAt: at(DAY) });
    await subscriptionEvent(STRIPE_EVENT.SUBSCRIPTION_DELETED);

    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.CANCELLED);
    expect((await me()).body.access).toBe('ending');
  });

  it('a replay, and an unknown subscription, change nothing', async () => {
    quiet();
    await set({ currentPeriodEnd: at(-DAY) });
    await subscriptionEvent(STRIPE_EVENT.SUBSCRIPTION_DELETED);
    await subscriptionEvent(STRIPE_EVENT.SUBSCRIPTION_DELETED);
    const res = await subscriptionEvent(STRIPE_EVENT.SUBSCRIPTION_DELETED, { id: 'sub_nobody', object: 'subscription' });

    expect(res.status).toBe(200);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.EXPIRED);
  });

  // Read shows the old period, but a renewal moved it meanwhile: the pinned filter refuses.
  it('never expires a row renewed between the read and the write', async () => {
    quiet();
    const realFindOne = Subscription.findOne.bind(Subscription);
    jest.spyOn(Subscription, 'findOne').mockImplementation((...args) => {
      const query = realFindOne(...args);
      const realSelect = query.select.bind(query);
      query.select = (fields) =>
        fields === '_id status currentPeriodEnd graceEndsAt'
          ? { lean: async () => ({ _id: client.subscription._id, status: SUBSCRIPTION_STATUS.ACTIVE, currentPeriodEnd: at(-DAY) }) }
          : realSelect(fields);
      return query;
    });

    await subscriptionEvent(STRIPE_EVENT.SUBSCRIPTION_DELETED);

    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
  });
});

describe("a change made in Stripe's own screens (customer.subscription.updated)", () => {
  it('a cancel there is mirrored here, with access kept', async () => {
    quiet();
    retrieveMock.mockResolvedValue({ id: SUB_ID, status: 'active', cancel_at_period_end: true });
    await subscriptionEvent(STRIPE_EVENT.SUBSCRIPTION_UPDATED, { id: SUB_ID, object: 'subscription', cancel_at_period_end: true });

    const sub = await stored();
    expect(sub.status).toBe(SUBSCRIPTION_STATUS.CANCELLED);
    expect(sub.cancelledBy).toBeUndefined();
  });

  it('an undo there is mirrored here', async () => {
    quiet();
    await set({ status: SUBSCRIPTION_STATUS.CANCELLED, cancelledAt: new Date(), cancelledBy: CANCELLED_BY.CLIENT });
    await subscriptionEvent(STRIPE_EVENT.SUBSCRIPTION_UPDATED);

    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
  });

  // The payload says "cancel", but Stripe's live state says otherwise: live wins.
  it("trusts Stripe's live state, never a late payload", async () => {
    quiet();
    await subscriptionEvent(STRIPE_EVENT.SUBSCRIPTION_UPDATED, { id: SUB_ID, object: 'subscription', cancel_at_period_end: true });

    expect(retrieveMock).toHaveBeenCalledWith(SUB_ID);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
  });

  it('does nothing for a subscription Stripe has already ended', async () => {
    quiet();
    retrieveMock.mockResolvedValue({ id: SUB_ID, status: 'canceled', cancel_at_period_end: true });
    await subscriptionEvent(STRIPE_EVENT.SUBSCRIPTION_UPDATED);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
  });
});

describe('who may cancel', () => {
  it('clients only, signed in, with a live plan', async () => {
    quiet();
    const therapist = await User.create({
      email: `therapist${counter}@example.com`,
      passwordHash: await hashPassword(PASSWORD),
      role: ROLES.THERAPIST,
      status: USER_STATUS.ACTIVE,
    });
    expect((await post('cancel', therapist.email)).status).toBe(403);
    expect((await request(app).post('/api/v1/client/subscription/cancel')).status).toBe(401);

    await set({ status: SUBSCRIPTION_STATUS.EXPIRED });
    expect((await post('cancel')).status).toBe(403);
    expect(updateMock).not.toHaveBeenCalled();
  });
});

describe('the emails — facts, never pressure', () => {
  const PRESSURE = /sad to see|miss you|are you sure|discount|offer|lose|last chance|reconsider|!/i;

  it('the cancellation names the end, keeps the data, and offers the undo only when real', () => {
    const withUndo = templates.subscriptionCancelledEmail({
      name: '<b>Asha</b>',
      accessUntil: 'Saturday 17 October 2026 at 14:05 (Kolkata time)',
      canReactivate: true,
      accountUrl: 'https://castofmind.com/portal/account',
    });
    const withoutUndo = templates.subscriptionCancelledEmail({
      name: null,
      accessUntil: 'Saturday 17 October 2026 at 14:05 (Kolkata time)',
      canReactivate: false,
      accountUrl: 'https://castofmind.com/portal/account',
    });

    expect(withUndo.text).toContain('Saturday 17 October 2026 at 14:05 (Kolkata time)');
    expect(withUndo.text).toMatch(/nothing is deleted/i);
    expect(withUndo.text).toMatch(/reactivate/i);
    expect(withoutUndo.text).not.toMatch(/reactivate/i);
    expect(withUndo.html).toContain('&lt;b&gt;Asha&lt;/b&gt;');
    expect(withUndo.text).not.toMatch(PRESSURE);
  });

  it('the reactivation states the next charge and how to stop it', () => {
    const { text } = templates.subscriptionReactivatedEmail({
      name: 'Asha',
      amount: '€200.00',
      nextPayment: 'Saturday 17 October 2026 at 14:05 (Kolkata time)',
      accountUrl: 'https://castofmind.com/portal/account',
    });
    expect(text).toContain('€200.00');
    expect(text).toMatch(/cancel before this date/i);
    expect(text).not.toMatch(PRESSURE);
  });
});
