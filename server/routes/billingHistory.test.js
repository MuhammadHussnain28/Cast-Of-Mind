import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';
import { createEmailServiceMock } from '../test/emailServiceMock.js';

// Chunk 11.5 — billing history from the ledger. Own rows only, one row per
// invoice, derived fields only. Webhook signatures are REAL; nothing is sent.

const WEBHOOK_SECRET = 'whsec_test_secret_for_signing_only_not_real';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_for_tests';
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

jest.unstable_mockModule('../services/email/email.service.js', () => createEmailServiceMock());

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { PaymentEvent } = await import('../models/PaymentEvent.js');
const { webhookRateLimiter } = await import('./webhook.routes.js');
const { loginRateLimiter } = await import('./auth.routes.js');
const { clientRateLimiter } = await import('./client.routes.js');
const { STRIPE_EVENT, BILLING_REASON } = await import('../constants/webhooks.js');
const { SUBSCRIPTION_STATUS } = await import('../constants/payments.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { hashPassword } = await import('../utils/password.js');

const signer = new Stripe('sk_test_dummy_for_tests');
const PASSWORD = 'correct-horse-battery-staple';
const DAY = 24 * 60 * 60 * 1000;
const LOOPBACK = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];

let a;
let b;
let counter = 0;

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([PaymentEvent.init(), Subscription.init(), User.init(), Booking.init()]);
}, 60000);

beforeEach(async () => {
  LOOPBACK.forEach((key) =>
    [webhookRateLimiter, loginRateLimiter, clientRateLimiter].forEach((l) => l.resetKey?.(key)),
  );
  a = await seedClient('a', ['sub_a_old', 'sub_a_now']);
  b = await seedClient('b', ['sub_b_now']);
});

afterEach(async () => {
  jest.restoreAllMocks();
  await clearCollections();
});
afterAll(stopMemoryMongo);

async function seedClient(tag, subIds) {
  counter += 1;
  const email = `bill-${tag}-${counter}@example.com`;
  const user = await User.create({
    email,
    passwordHash: await hashPassword(PASSWORD),
    role: ROLES.CLIENT,
    status: USER_STATUS.ACTIVE,
  });
  await ClientProfile.create({
    userId: user._id,
    type: 'individual',
    country: 'Ireland',
    city: 'Cork',
    relationshipStatus: 'Single',
    concernTags: ['Anxiety', 'Stress', 'Grief'],
    therapistGenderPreference: 'no_preference',
    name: `Client ${tag}`,
    age: 30,
    gender: 'female',
  });
  const booking = await Booking.create({ clientId: user._id, therapistId: new mongoose.Types.ObjectId(), status: 'active' });
  const subscriptions = [];
  for (const [index, platformSubscriptionId] of subIds.entries()) {
    const live = index === subIds.length - 1;
    subscriptions.push(
      await Subscription.create({
        bookingId: booking._id,
        clientId: user._id,
        status: live ? SUBSCRIPTION_STATUS.ACTIVE : SUBSCRIPTION_STATUS.EXPIRED,
        startDate: new Date(Date.now() - (live ? 20 : 90) * DAY),
        currentPeriodEnd: new Date(Date.now() + (live ? 10 : -60) * DAY),
        nextBillingDate: new Date(Date.now() + (live ? 10 : -60) * DAY),
        platformSubscriptionId,
      }),
    );
  }
  return { user, email, booking, subscriptions };
}

const sec = (date) => Math.floor(new Date(date).getTime() / 1000);

/** One ledger row, shaped as Stripe sends an invoice event. */
function ledger({ type = STRIPE_EVENT.INVOICE_PAID, invoice, sub, at, amount = 20000, links = {}, reason }) {
  counter += 1;
  const paid = type === STRIPE_EVENT.INVOICE_PAID;
  const periodStart = new Date(new Date(at).getTime() - DAY);
  return PaymentEvent.create({
    platform: 'stripe',
    eventType: type,
    platformEventId: `evt_hist_${counter}`,
    platformSubscriptionId: sub,
    amount: paid ? amount : amount,
    currency: 'EUR',
    receivedAt: at,
    ...links,
    rawPayload: {
      id: `evt_hist_${counter}`,
      type,
      data: {
        object: {
          id: invoice,
          object: 'invoice',
          billing_reason: reason ?? BILLING_REASON.RENEWAL,
          amount_paid: paid ? amount : 0,
          amount_due: amount,
          currency: 'eur',
          status_transitions: { paid_at: paid ? sec(at) : null },
          parent: { subscription_details: { subscription: sub } },
          lines: { data: [{ period: { start: sec(periodStart), end: sec(new Date(periodStart.getTime() + 30 * DAY)) } }] },
          payment_method_details: { card: { last4: '4242', brand: 'visa' } },
        },
      },
    },
  });
}

async function history(who = a, query = '') {
  const login = await request(app).post('/api/v1/auth/login').send({ email: who.email, password: PASSWORD });
  return request(app)
    .get(`/api/v1/client/billing/history${query}`)
    .set('Authorization', `Bearer ${login.body.accessToken}`);
}

const ago = (days) => new Date(Date.now() - days * DAY);

describe('billing history — what a client sees', () => {
  it('starts empty, and says so', async () => {
    const res = await history();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [], meta: { page: 1, pageSize: 12, total: 0, hasMore: false } });
  });

  // Logged before the account existed, so only the Stripe id links it.
  it('includes the very first payment', async () => {
    await ledger({ invoice: 'in_first', sub: 'sub_a_now', at: ago(20), reason: BILLING_REASON.FIRST_INVOICE });
    const { body } = await history();

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ status: 'paid', amount: 20000, currency: 'EUR', retried: false });
  });

  it('carries its history across a re-subscribe', async () => {
    await ledger({ invoice: 'in_old', sub: 'sub_a_old', at: ago(80) });
    await ledger({ invoice: 'in_new', sub: 'sub_a_now', at: ago(5) });
    expect((await history()).body.data).toHaveLength(2);
  });

  it('includes rows linked the older way, by subscription or client', async () => {
    await ledger({ invoice: 'in_x', sub: undefined, at: ago(40), links: { subscriptionId: a.subscriptions[0]._id } });
    await ledger({ invoice: 'in_y', sub: undefined, at: ago(35), links: { clientId: a.user._id } });
    expect((await history()).body.data).toHaveLength(2);
  });

  it('lists the newest first, with the period each payment covers', async () => {
    await ledger({ invoice: 'in_1', sub: 'sub_a_now', at: ago(60) });
    await ledger({ invoice: 'in_2', sub: 'sub_a_now', at: ago(30) });
    const { body } = await history();

    expect(new Date(body.data[0].date) > new Date(body.data[1].date)).toBe(true);
    expect(body.data[0].periodStart).toBeTruthy();
    expect(new Date(body.data[0].periodEnd) > new Date(body.data[0].periodStart)).toBe(true);
  });
});

describe('billing history — one row per invoice', () => {
  it('two failed tries then a payment read as ONE paid month, marked as retried', async () => {
    await ledger({ type: STRIPE_EVENT.INVOICE_FAILED, invoice: 'in_r', sub: 'sub_a_now', at: ago(6) });
    await ledger({ type: STRIPE_EVENT.INVOICE_FAILED, invoice: 'in_r', sub: 'sub_a_now', at: ago(5) });
    await ledger({ invoice: 'in_r', sub: 'sub_a_now', at: ago(4) });
    const { body } = await history();

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ status: 'paid', retried: true, amount: 20000 });
    expect(new Date(body.data[0].date).getTime()).toBe(Math.floor(ago(4).getTime() / 1000) * 1000);
  });

  it('a payment still outstanding reads as one row that did not go through', async () => {
    await ledger({ type: STRIPE_EVENT.INVOICE_FAILED, invoice: 'in_f', sub: 'sub_a_now', at: ago(3) });
    await ledger({ type: STRIPE_EVENT.INVOICE_FAILED, invoice: 'in_f', sub: 'sub_a_now', at: ago(2) });
    const { body } = await history();

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ status: 'failed', retried: false, amount: 20000 });
  });

  it('lists only payment events, never checkout or subscription changes', async () => {
    await ledger({ invoice: 'in_ok', sub: 'sub_a_now', at: ago(5) });
    await PaymentEvent.create({
      platform: 'stripe',
      eventType: STRIPE_EVENT.SUBSCRIPTION_UPDATED,
      platformEventId: 'evt_other',
      platformSubscriptionId: 'sub_a_now',
      receivedAt: ago(1),
      rawPayload: { data: { object: { id: 'sub_a_now', object: 'subscription' } } },
    });
    expect((await history()).body.data).toHaveLength(1);
  });
});

describe('billing history — privacy', () => {
  it("never shows another client's payments", async () => {
    await ledger({ invoice: 'in_b', sub: 'sub_b_now', at: ago(3), links: { clientId: b.user._id } });
    await ledger({ invoice: 'in_a', sub: 'sub_a_now', at: ago(3) });

    const mine = (await history(a)).body.data;
    const theirs = (await history(b)).body.data;
    expect(mine).toHaveLength(1);
    expect(theirs).toHaveLength(1);
    expect(mine[0].id).not.toBe(theirs[0].id);
  });

  it('returns derived fields only — no Stripe ids, no payload, nothing about the card', async () => {
    await ledger({ invoice: 'in_secret', sub: 'sub_a_now', at: ago(3) });
    const { body } = await history();

    expect(Object.keys(body.data[0]).sort()).toEqual(
      ['amount', 'currency', 'date', 'id', 'periodEnd', 'periodStart', 'retried', 'status'].sort(),
    );
    const raw = JSON.stringify(body);
    expect(raw).not.toMatch(/in_secret|sub_a_now|evt_hist|rawPayload|last4|4242|visa/);
  });

  it('is refused to a client whose subscription has ended, to a therapist, and without a sign-in', async () => {
    await Subscription.updateOne({ _id: a.subscriptions[1]._id }, { $set: { status: SUBSCRIPTION_STATUS.EXPIRED } });
    expect((await history(a)).status).toBe(403);

    const therapist = await User.create({
      email: `bill-t-${counter}@example.com`,
      passwordHash: await hashPassword(PASSWORD),
      role: ROLES.THERAPIST,
      status: USER_STATUS.ACTIVE,
    });
    expect((await history({ email: therapist.email })).status).toBe(403);
    expect((await request(app).get('/api/v1/client/billing/history')).status).toBe(401);
  });
});

describe('billing history — paging', () => {
  it('pages twelve at a time', async () => {
    for (let i = 0; i < 14; i += 1) await ledger({ invoice: `in_p${i}`, sub: 'sub_a_now', at: ago(i + 1) });

    const first = (await history(a, '?page=1')).body;
    const second = (await history(a, '?page=2')).body;
    expect(first.data).toHaveLength(12);
    expect(first.meta).toMatchObject({ total: 14, hasMore: true });
    expect(second.data).toHaveLength(2);
    expect(second.meta.hasMore).toBe(false);
  });

  it.each([['0'], ['abc'], ['51'], ['1.5']])('refuses page=%s', async (page) => {
    expect((await history(a, `?page=${page}`)).status).toBe(422);
  });
});

describe('the ledger records the Stripe subscription on every event', () => {
  function send(type, object) {
    counter += 1;
    const payload = JSON.stringify({
      id: `evt_rec_${counter}`,
      object: 'event',
      type,
      created: Math.floor(Date.now() / 1000),
      data: { object },
    });
    const header = signer.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
    return request(app)
      .post('/api/v1/webhooks/payment')
      .set('stripe-signature', header)
      .set('Content-Type', 'application/json')
      .send(payload);
  }

  it.each([
    ['an invoice (current API shape)', STRIPE_EVENT.INVOICE_FAILED, { id: 'in_z', object: 'invoice', billing_reason: 'manual', parent: { subscription_details: { subscription: 'sub_new_1' } } }],
    ['an invoice (older shape)', STRIPE_EVENT.INVOICE_PAID, { id: 'in_z2', object: 'invoice', billing_reason: 'manual', subscription: 'sub_new_2' }],
    ['a checkout session', STRIPE_EVENT.CHECKOUT_COMPLETED, { id: 'cs_z', object: 'checkout.session', payment_status: 'unpaid', subscription: 'sub_new_3' }],
    ['a subscription', STRIPE_EVENT.SUBSCRIPTION_DELETED, { id: 'sub_new_4', object: 'subscription' }],
  ])('from %s', async (_label, type, object) => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await send(type, object);

    const row = await PaymentEvent.findOne().lean();
    const expected = object.object === 'subscription' ? object.id : object.subscription ?? object.parent.subscription_details.subscription;
    expect(row.platformSubscriptionId).toBe(expected);
  });
});
