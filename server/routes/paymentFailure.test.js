import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';
import { createEmailServiceMock } from '../test/emailServiceMock.js';

// Chunk 11.2 — failed payment and the grace period (§13). Webhook signatures are
// REAL; the Stripe API and email are faked, so nothing reaches the network.

const WEBHOOK_SECRET = 'whsec_test_secret_for_signing_only_not_real';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_for_tests';
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

const retrieveMock = jest.fn();
const cancelMock = jest.fn();
const portalMock = jest.fn();

jest.unstable_mockModule('../config/stripe.js', () => {
  const signer = new Stripe('sk_test_dummy_for_tests');
  const fake = {
    webhooks: signer.webhooks,
    subscriptions: { retrieve: retrieveMock, cancel: cancelMock },
    billingPortal: { sessions: { create: portalMock } },
  };
  return { stripe: fake, isStripeConfigured: true, isTestKey: true, default: fake };
});

const sendPaymentFailedEmail = jest.fn(async () => ({ delivered: true }));
const sendPaymentReceiptEmail = jest.fn(async () => ({ delivered: true }));
jest.unstable_mockModule('../services/email/email.service.js', () =>
  createEmailServiceMock({ sendPaymentFailedEmail, sendPaymentReceiptEmail }),
);

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { PaymentEvent } = await import('../models/PaymentEvent.js');
const { webhookRateLimiter } = await import('./webhook.routes.js');
const { loginRateLimiter } = await import('./auth.routes.js');
const { clientRateLimiter, billingPortalRateLimiter } = await import('./client.routes.js');
const { STRIPE_EVENT, BILLING_REASON } = await import('../constants/webhooks.js');
const { SUBSCRIPTION_STATUS, PAST_DUE_GRACE_DAYS } = await import('../constants/payments.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { hashPassword } = await import('../utils/password.js');
const { resolveAccess } = await import('../middleware/requireActiveSubscription.js');
const lifecycle = await import('../services/subscriptionLifecycle.service.js');
const { paymentFailedEmail } = await import('../services/email/templates/paymentFailed.js');

const signer = new Stripe('sk_test_dummy_for_tests');
const ENDPOINT = '/api/v1/webhooks/payment';
const SUB_ID = 'sub_fail_1';
const CUSTOMER_ID = 'cus_fail_1';
const PASSWORD = 'correct-horse-battery-staple';
const DAY = 24 * 60 * 60 * 1000;
const LOOPBACK = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];

const sec = (date) => Math.floor(new Date(date).getTime() / 1000);
// The period that just ended, and the one the failed invoice was for.
// Whole seconds, as Stripe sends them.
const PERIOD_END = new Date(Math.floor((Date.now() - 2 * 60 * 60 * 1000) / 1000) * 1000);
const NEXT_END = new Date(PERIOD_END.getTime() + 30 * DAY);

let client;
let counter = 0;

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([PaymentEvent.init(), Subscription.init(), User.init(), Booking.init()]);
}, 60000);

beforeEach(async () => {
  [sendPaymentFailedEmail, sendPaymentReceiptEmail].forEach((fn) => {
    fn.mockReset();
    fn.mockResolvedValue({ delivered: true });
  });
  retrieveMock.mockReset();
  retrieveMock.mockResolvedValue({ id: SUB_ID, status: 'past_due' });
  cancelMock.mockReset();
  cancelMock.mockResolvedValue({ id: SUB_ID, status: 'canceled' });
  portalMock.mockReset();
  portalMock.mockResolvedValue({ url: 'https://billing.stripe.com/p/session/test_abc' });
  LOOPBACK.forEach((key) => {
    [webhookRateLimiter, loginRateLimiter, clientRateLimiter, billingPortalRateLimiter].forEach((l) =>
      l.resetKey?.(key),
    );
  });
  client = await seedClient();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await clearCollections();
});
afterAll(stopMemoryMongo);

async function seedClient({ status = SUBSCRIPTION_STATUS.ACTIVE, customer = CUSTOMER_ID, subId = SUB_ID } = {}) {
  counter += 1;
  const email = `failed${counter}@example.com`;
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
    startDate: new Date(PERIOD_END.getTime() - 30 * DAY),
    currentPeriodEnd: PERIOD_END,
    nextBillingDate: PERIOD_END,
    sessionsRemaining: 2,
    ...(subId ? { platformSubscriptionId: subId } : {}),
    ...(customer ? { platformCustomerId: customer } : {}),
    ...(status === SUBSCRIPTION_STATUS.CANCELLED ? { cancelledAt: new Date(PERIOD_END.getTime() - DAY) } : {}),
  });
  return { user, email, booking, subscription };
}

function invoiceEvent({
  type = STRIPE_EVENT.INVOICE_FAILED,
  reason = BILLING_REASON.RENEWAL,
  from = PERIOD_END,
  to = NEXT_END,
  subscription = SUB_ID,
  created = Math.floor(Date.now() / 1000),
  id,
} = {}) {
  counter += 1;
  return {
    id: id ?? `evt_fail_${Date.now()}_${counter}`,
    object: 'event',
    type,
    created,
    data: {
      object: {
        id: `in_fail_${counter}`,
        object: 'invoice',
        billing_reason: reason,
        amount_due: 20000,
        amount_paid: type === STRIPE_EVENT.INVOICE_PAID ? 20000 : 0,
        currency: 'eur',
        period_end: sec(from),
        parent: { type: 'subscription_details', subscription_details: { subscription } },
        lines: {
          data: [{ period: { start: sec(from), end: sec(to) }, parent: { type: 'subscription_item_details' } }],
        },
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

async function tokenFor(email) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD });
  return res.body.accessToken;
}

const stored = () => Subscription.findOne({ platformSubscriptionId: SUB_ID }).lean();
const quiet = () => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  return jest.spyOn(console, 'error').mockImplementation(() => {});
};
const lapse = () =>
  Subscription.updateOne(
    { platformSubscriptionId: SUB_ID },
    {
      $set: {
        status: SUBSCRIPTION_STATUS.PAST_DUE,
        pastDueSince: new Date(Date.now() - 4 * DAY),
        graceEndsAt: new Date(Date.now() - DAY),
      },
    },
  );

describe('a failed renewal — past_due and the grace period', () => {
  it('sets past_due, with a grace of 3 days from when Stripe reported it', async () => {
    quiet();
    const event = invoiceEvent();
    const response = await send(event);

    expect(response.status).toBe(200);
    const sub = await stored();
    expect(sub.status).toBe(SUBSCRIPTION_STATUS.PAST_DUE);
    expect(sub.pastDueSince.getTime()).toBe(event.created * 1000);
    expect(sub.graceEndsAt.getTime() - sub.pastDueSince.getTime()).toBe(PAST_DUE_GRACE_DAYS * DAY);
    // Nothing else moves: the period and the sessions are untouched.
    expect(sub.currentPeriodEnd.getTime()).toBe(PERIOD_END.getTime());
    expect(sub.sessionsRemaining).toBe(2);
  });

  it('sends one notice, naming when access ends in the client\'s own clock', async () => {
    quiet();
    await send(invoiceEvent());

    expect(sendPaymentFailedEmail).toHaveBeenCalledTimes(1);
    const [to, details] = sendPaymentFailedEmail.mock.calls[0];
    expect(to).toBe(client.email);
    expect(details.amount).toBe('€200.00');
    expect(details.accessUntil).toMatch(/\(Kolkata time\)$/);
  });

  // Stripe retries the card and each failure fires again: ONE EPISODE, ONE EMAIL.
  it('a later retry failing again neither restarts the grace nor emails twice', async () => {
    quiet();
    await send(invoiceEvent());
    const first = await stored();
    await send(invoiceEvent({ created: Math.floor(Date.now() / 1000) + 86400 }));

    const sub = await stored();
    expect(sub.graceEndsAt.getTime()).toBe(first.graceEndsAt.getTime());
    expect(sendPaymentFailedEmail).toHaveBeenCalledTimes(1);
  });

  it('a replayed event changes nothing', async () => {
    quiet();
    const event = invoiceEvent();
    await send(event);
    const replay = await send(event);

    expect(replay.body.duplicate).toBe(true);
    expect(sendPaymentFailedEmail).toHaveBeenCalledTimes(1);
    expect(await PaymentEvent.countDocuments()).toBe(1);
  });

  // An out-of-order failure for an invoice 11.1 already applied: it was paid.
  it('ignores a failure for a period that has already been paid', async () => {
    quiet();
    await Subscription.updateOne({ platformSubscriptionId: SUB_ID }, { $set: { currentPeriodEnd: NEXT_END } });
    await send(invoiceEvent());

    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
    expect(sendPaymentFailedEmail).not.toHaveBeenCalled();
  });

  it.each([[SUBSCRIPTION_STATUS.CANCELLED], [SUBSCRIPTION_STATUS.EXPIRED]])(
    'leaves a %s subscription alone',
    async (status) => {
      await clearCollections();
      client = await seedClient({ status });
      quiet();
      await send(invoiceEvent());

      expect((await stored()).status).toBe(status);
      expect(sendPaymentFailedEmail).not.toHaveBeenCalled();
    },
  );

  it('ignores a failed first invoice — the checkout never completed', async () => {
    quiet();
    await send(invoiceEvent({ reason: BILLING_REASON.FIRST_INVOICE }));
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
  });

  it('an unknown subscription: 200, a loud log, nothing changed', async () => {
    const errors = quiet();
    const response = await send(invoiceEvent({ subscription: 'sub_nobody' }));

    expect(response.status).toBe(200);
    expect(errors.mock.calls.flat().join(' ')).toMatch(/NOT APPLIED.*sub_nobody/);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
  });

  it('a failed notice never undoes past_due, and logs no address', async () => {
    const errors = quiet();
    sendPaymentFailedEmail.mockRejectedValue(new Error(`Resend refused ${client.email}`));
    const response = await send(invoiceEvent());

    expect(response.status).toBe(200);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.PAST_DUE);
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/@example\.com/);
  });

  // THE RACE THE ATOMIC FILTER EXISTS FOR: the service's read is already out of
  // date when it writes. Only the filter can stop it (mutation-checked in 11.2).
  function staleRead(snapshot) {
    const realFindOne = Subscription.findOne.bind(Subscription);
    jest.spyOn(Subscription, 'findOne').mockImplementation((...args) => {
      const query = realFindOne(...args);
      const realSelect = query.select.bind(query);
      query.select = (fields) =>
        fields === '_id status currentPeriodEnd' ? { lean: async () => snapshot } : realSelect(fields);
      return query;
    });
  }

  it('a failure read as active but already past due does not restart the grace', async () => {
    quiet();
    await send(invoiceEvent());
    const first = await stored();
    staleRead({ _id: first._id, status: SUBSCRIPTION_STATUS.ACTIVE, currentPeriodEnd: PERIOD_END });

    await send(invoiceEvent({ created: Math.floor(Date.now() / 1000) + 86400 }));

    expect((await stored()).graceEndsAt.getTime()).toBe(first.graceEndsAt.getTime());
    expect(sendPaymentFailedEmail).toHaveBeenCalledTimes(1);
  });

  it('a failure read before a renewal landed does not undo the renewal', async () => {
    quiet();
    await Subscription.updateOne({ platformSubscriptionId: SUB_ID }, { $set: { currentPeriodEnd: NEXT_END } });
    staleRead({ _id: client.subscription._id, status: SUBSCRIPTION_STATUS.ACTIVE, currentPeriodEnd: PERIOD_END });

    await send(invoiceEvent());

    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
    expect(sendPaymentFailedEmail).not.toHaveBeenCalled();
  });

  it('records the failure in the ledger, linked to the subscription', async () => {
    quiet();
    await send(invoiceEvent());
    const row = await PaymentEvent.findOne().lean();
    expect(row.eventType).toBe(STRIPE_EVENT.INVOICE_FAILED);
    expect(String(row.subscriptionId)).toBe(String(client.subscription._id));
    expect(row.amount).toBe(20000);
  });

  // The 11.1 path: the handler fails after the ledger row, and the retry heals.
  it('heals on retry after the handler failed once', async () => {
    quiet();
    const event = invoiceEvent();
    jest
      .spyOn(Subscription, 'findOneAndUpdate')
      .mockImplementationOnce(() => ({ lean: () => Promise.reject(new Error('database blip')) }));

    expect((await send(event)).status).toBe(500);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.ACTIVE);

    expect((await send(event)).status).toBe(200);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.PAST_DUE);
    expect(sendPaymentFailedEmail).toHaveBeenCalledTimes(1);
  });
});

describe('the portal during and after the grace', () => {
  it('access CONTINUES during the grace, and /me names when it ends', async () => {
    quiet();
    await send(invoiceEvent());
    const token = await tokenFor(client.email);

    const me = await request(app).get('/api/v1/client/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.access).toBe('past_due');
    expect(new Date(me.body.subscription.graceEndsAt).getTime()).toBe((await stored()).graceEndsAt.getTime());

    const gated = await request(app).get('/api/v1/client/journal').set('Authorization', `Bearer ${token}`);
    expect(gated.status).toBe(200);
  });

  // Belt and braces: the gate closes on the boundary even before the sweep runs.
  it('closes once the grace has passed, even before the sweep', async () => {
    await lapse();
    const token = await tokenFor(client.email);

    const gated = await request(app).get('/api/v1/client/journal').set('Authorization', `Bearer ${token}`);
    expect(gated.status).toBe(403);
    expect(gated.body.error.code).toBe('SUBSCRIPTION_ENDED');

    const me = await request(app).get('/api/v1/client/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.access).toBe('ended');
  });

  it('resolves access on the exact boundary', () => {
    const now = new Date('2026-10-17T12:00:00Z');
    const pastDue = (graceEndsAt) => ({ status: SUBSCRIPTION_STATUS.PAST_DUE, graceEndsAt });
    expect(resolveAccess(pastDue(new Date('2026-10-17T12:00:01Z')), now)).toBe('past_due');
    expect(resolveAccess(pastDue(now), now)).toBe('ended');
    // A past_due row from before 11.2, with no grace stored, stays open.
    expect(resolveAccess(pastDue(undefined), now)).toBe('past_due');
  });
});

describe('payment during the grace restores active', () => {
  it('a paid retry makes it active, clears the grace, and resets the sessions', async () => {
    quiet();
    await send(invoiceEvent());
    await send(invoiceEvent({ type: STRIPE_EVENT.INVOICE_PAID }));

    const sub = await stored();
    expect(sub.status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
    expect(sub.pastDueSince).toBeUndefined();
    expect(sub.graceEndsAt).toBeUndefined();
    expect(sub.currentPeriodEnd.getTime()).toBe(NEXT_END.getTime());
    expect(sub.sessionsRemaining).toBe(4);
  });

  it('the banner has nothing to show once recovered', async () => {
    quiet();
    await send(invoiceEvent());
    await send(invoiceEvent({ type: STRIPE_EVENT.INVOICE_PAID }));
    const token = await tokenFor(client.email);

    const me = await request(app).get('/api/v1/client/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.access).toBe('active');
    expect(me.body.subscription.graceEndsAt).toBeUndefined();
  });
});

describe('the sweep — grace expiry', () => {
  it('expires after the grace: Stripe cancelled first, then expired with 0 sessions', async () => {
    quiet();
    await lapse();
    // Stripe first, database second: at the moment of the cancel, the row is
    // still past_due.
    const seenAtCancel = [];
    cancelMock.mockImplementation(async (id) => {
      seenAtCancel.push((await stored()).status);
      return { id, status: 'canceled' };
    });

    const result = await lifecycle.expireLapsedGrace();

    expect(result).toEqual({ expired: 1, waiting: 0, failed: 0 });
    expect(cancelMock).toHaveBeenCalledWith(SUB_ID);
    expect(seenAtCancel).toEqual([SUBSCRIPTION_STATUS.PAST_DUE]);
    const sub = await stored();
    expect(sub.status).toBe(SUBSCRIPTION_STATUS.EXPIRED);
    expect(sub.sessionsRemaining).toBe(0);
    // Kept as the record of why it ended.
    expect(sub.graceEndsAt).toBeInstanceOf(Date);
  });

  it('does nothing while the grace is still running', async () => {
    quiet();
    await send(invoiceEvent());
    const result = await lifecycle.expireLapsedGrace();

    expect(result.expired).toBe(0);
    expect(retrieveMock).not.toHaveBeenCalled();
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.PAST_DUE);
  });

  it('never expires one that Stripe says was paid — the webhook is on its way', async () => {
    quiet();
    await lapse();
    retrieveMock.mockResolvedValue({ id: SUB_ID, status: 'active' });

    const result = await lifecycle.expireLapsedGrace();

    expect(result).toEqual({ expired: 0, waiting: 1, failed: 0 });
    expect(cancelMock).not.toHaveBeenCalled();
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.PAST_DUE);
  });

  it('does not cancel twice when Stripe has already ended it', async () => {
    quiet();
    await lapse();
    retrieveMock.mockResolvedValue({ id: SUB_ID, status: 'canceled' });

    await lifecycle.expireLapsedGrace();

    expect(cancelMock).not.toHaveBeenCalled();
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.EXPIRED);
  });

  it('a Stripe failure changes nothing here, and the next sweep succeeds', async () => {
    const errors = quiet();
    await lapse();
    cancelMock.mockRejectedValueOnce(Object.assign(new Error('secret Stripe detail'), { name: 'StripeAPIError' }));

    const first = await lifecycle.expireLapsedGrace();
    expect(first).toEqual({ expired: 0, waiting: 0, failed: 1 });
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.PAST_DUE);
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/secret Stripe detail/);

    const second = await lifecycle.expireLapsedGrace();
    expect(second.expired).toBe(1);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.EXPIRED);
  });

  // A recovery lands between the sweep's read and its write: the recovery wins.
  it('never expires a subscription that recovered at the same moment', async () => {
    quiet();
    await lapse();
    retrieveMock.mockImplementation(async () => {
      await Subscription.updateOne(
        { platformSubscriptionId: SUB_ID },
        { $set: { status: SUBSCRIPTION_STATUS.ACTIVE }, $unset: { graceEndsAt: 1, pastDueSince: 1 } },
      );
      return { id: SUB_ID, status: 'past_due' };
    });

    const result = await lifecycle.expireLapsedGrace();

    expect(result.expired).toBe(0);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
  });

  it('expires locally, with no Stripe call, when there is no Stripe subscription', async () => {
    quiet();
    await clearCollections();
    client = await seedClient({ subId: null });
    await Subscription.updateOne(
      { _id: client.subscription._id },
      { $set: { status: SUBSCRIPTION_STATUS.PAST_DUE, graceEndsAt: new Date(Date.now() - DAY) } },
    );

    const result = await lifecycle.expireLapsedGrace();

    expect(result.expired).toBe(1);
    expect(retrieveMock).not.toHaveBeenCalled();
  });

  it('only ever touches past_due rows', async () => {
    quiet();
    await Subscription.updateOne(
      { platformSubscriptionId: SUB_ID },
      { $set: { graceEndsAt: new Date(Date.now() - DAY) } },
    );

    const result = await lifecycle.expireLapsedGrace();

    expect(result.expired).toBe(0);
    expect((await stored()).status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
  });

  it('runs through the sweep entry point', async () => {
    quiet();
    await lapse();
    expect((await lifecycle.runLifecycleSweep()).grace.expired).toBe(1);
  });
});

describe('update your card — the Stripe Customer Portal', () => {
  const open = (token) =>
    request(app).post('/api/v1/client/billing/portal').set('Authorization', `Bearer ${token}`);

  it('gives a past_due client a Stripe link, never their customer id', async () => {
    quiet();
    await send(invoiceEvent());
    const response = await open(await tokenFor(client.email));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ url: 'https://billing.stripe.com/p/session/test_abc' });
    expect(JSON.stringify(response.body)).not.toContain(CUSTOMER_ID);
    expect(portalMock).toHaveBeenCalledWith({
      customer: CUSTOMER_ID,
      return_url: expect.stringMatching(/\/portal\/account$/),
    });
  });

  it('ignores anything in the body — the customer comes from the token', async () => {
    const token = await tokenFor(client.email);
    await request(app)
      .post('/api/v1/client/billing/portal')
      .set('Authorization', `Bearer ${token}`)
      .send({ customer: 'cus_someone_else' });

    expect(portalMock.mock.calls[0][0].customer).toBe(CUSTOMER_ID);
  });

  it('is refused once the subscription has ended', async () => {
    await lapse();
    const response = await open(await tokenFor(client.email));

    expect(response.status).toBe(403);
    expect(portalMock).not.toHaveBeenCalled();
  });

  it('409 when there is no billing account on file', async () => {
    await clearCollections();
    client = await seedClient({ customer: null });
    const response = await open(await tokenFor(client.email));

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('NO_BILLING_ACCOUNT');
  });

  it("a Stripe failure is a 502 with our words, never Stripe's", async () => {
    quiet();
    portalMock.mockRejectedValue(new Error('No configuration provided; secret detail'));
    const response = await open(await tokenFor(client.email));

    expect(response.status).toBe(502);
    expect(JSON.stringify(response.body)).not.toMatch(/secret detail|configuration/);
  });

  it('refuses to hand over a link that is not Stripe\'s', async () => {
    quiet();
    portalMock.mockResolvedValue({ url: 'https://billing.stripe.com.evil.example/p' });
    const response = await open(await tokenFor(client.email));

    expect(response.status).toBe(502);
  });

  it('is for clients only, and needs a sign-in', async () => {
    const therapist = await User.create({
      email: `therapist${counter}@example.com`,
      passwordHash: await hashPassword(PASSWORD),
      role: ROLES.THERAPIST,
      status: USER_STATUS.ACTIVE,
    });
    expect((await open(await tokenFor(therapist.email))).status).toBe(403);
    expect((await request(app).post('/api/v1/client/billing/portal')).status).toBe(401);
    expect(portalMock).not.toHaveBeenCalled();
  });
});

describe('the failed-payment email', () => {
  const email = () =>
    paymentFailedEmail({
      name: '<b>Asha</b>',
      amount: '€200.00',
      accessUntil: 'Saturday 17 October 2026 at 14:05 (Kolkata time)',
      accountUrl: 'https://castofmind.com/portal/account',
    });

  it('names when access ends and offers one way forward', () => {
    const { html, text, subject } = email();
    expect(subject).toMatch(/did not go through/);
    for (const part of [html, text]) {
      expect(part).toContain('Saturday 17 October 2026 at 14:05 (Kolkata time)');
      expect(part).toContain('https://castofmind.com/portal/account');
    }
    expect(html).toContain('Update your card');
  });

  it('carries no card detail and no alarm', () => {
    const { html, text } = email();
    const both = `${html} ${text}`;
    expect(both).not.toMatch(/last4|\*{4}|visa|mastercard|stripe\.com/i);
    expect(both).not.toMatch(/urgent|immediately|suspend|final notice|act now/i);
    // No exclamation marks in the words (the HTML's <!doctype> aside).
    expect(text).not.toContain('!');
  });

  it('escapes the name', () => {
    expect(email().html).toContain('&lt;b&gt;Asha&lt;/b&gt;');
  });
});
