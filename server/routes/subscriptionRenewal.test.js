import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';
import { createEmailServiceMock } from '../test/emailServiceMock.js';

// Chunk 11.1 — automatic renewal (§13). Signatures are REAL; email is faked.

const WEBHOOK_SECRET = 'whsec_test_secret_for_signing_only_not_real';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_for_tests';
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

const sendPaymentReceiptEmail = jest.fn(async () => ({ delivered: true }));
jest.unstable_mockModule('../services/email/email.service.js', () =>
  createEmailServiceMock({ sendPaymentReceiptEmail }),
);

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { PaymentEvent } = await import('../models/PaymentEvent.js');
const { webhookRateLimiter } = await import('./webhook.routes.js');
const { STRIPE_EVENT, BILLING_REASON } = await import('../constants/webhooks.js');
const { SUBSCRIPTION_STATUS } = await import('../constants/payments.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const renewal = await import('../services/subscriptionRenewal.service.js');
const { paymentReceiptEmail } = await import('../services/email/templates/paymentReceipt.js');

const signer = new Stripe('sk_test_dummy_for_tests');
const ENDPOINT = '/api/v1/webhooks/payment';
const SUB_ID = 'sub_renew_1';

const sec = (iso) => Math.floor(new Date(iso).getTime() / 1000);
const MONTH_1_END = '2026-10-14T20:00:00.000Z';
const MONTH_2_END = '2026-11-14T20:00:00.000Z';
const MONTH_3_END = '2026-12-14T20:00:00.000Z';

let client;
let counter = 0;

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([PaymentEvent.init(), Subscription.init(), User.init(), Booking.init()]);
}, 60000);

beforeEach(async () => {
  sendPaymentReceiptEmail.mockReset();
  sendPaymentReceiptEmail.mockResolvedValue({ delivered: true });
  webhookRateLimiter.resetKey?.('::ffff:127.0.0.1');
  webhookRateLimiter.resetKey?.('127.0.0.1');
  client = await seedClient();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await clearCollections();
});
afterAll(stopMemoryMongo);

async function seedClient({ timezone = 'Asia/Kolkata', status = SUBSCRIPTION_STATUS.ACTIVE, remaining = 1 } = {}) {
  counter += 1;
  const user = await User.create({
    email: `renew${counter}@example.com`,
    passwordHash: 'x'.repeat(60),
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
  const booking = await Booking.create({
    clientId: user._id,
    therapistId: new mongoose.Types.ObjectId(),
    status: 'active',
  });
  const subscription = await Subscription.create({
    bookingId: booking._id,
    clientId: user._id,
    status,
    startDate: new Date('2026-09-14T20:00:00.000Z'),
    currentPeriodEnd: new Date(MONTH_1_END),
    nextBillingDate: new Date(MONTH_1_END),
    sessionsRemaining: remaining,
    platformSubscriptionId: SUB_ID,
    ...(status === SUBSCRIPTION_STATUS.CANCELLED ? { cancelledAt: new Date('2026-10-01T00:00:00Z') } : {}),
  });
  return { user, booking, subscription };
}

/** A paid renewal invoice in the pinned API's (dahlia) shape, or the older one. */
function invoiceEvent({
  from = MONTH_1_END,
  to = MONTH_2_END,
  reason = BILLING_REASON.RENEWAL,
  amount = 25000,
  shape = 'dahlia',
  lines = true,
  subscription = SUB_ID,
  id,
} = {}) {
  counter += 1;
  const line =
    shape === 'dahlia'
      ? { period: { start: sec(from), end: sec(to) }, parent: { type: 'subscription_item_details' } }
      : { period: { start: sec(from), end: sec(to) }, type: 'subscription' };
  return {
    id: id ?? `evt_renew_${Date.now()}_${counter}`,
    object: 'event',
    type: STRIPE_EVENT.INVOICE_PAID,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `in_test_${counter}`,
        object: 'invoice',
        billing_reason: reason,
        amount_paid: amount,
        currency: 'eur',
        // The PREVIOUS period, as Stripe sends on a renewal invoice.
        period_start: sec('2026-09-14T20:00:00.000Z'),
        period_end: sec(from),
        status_transitions: { paid_at: sec(from) },
        ...(shape === 'dahlia'
          ? { parent: { type: 'subscription_details', subscription_details: { subscription } } }
          : { subscription }),
        lines: { data: lines ? [line] : [] },
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

const stored = () => Subscription.findOne({ platformSubscriptionId: SUB_ID }).lean();
const quiet = () => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  return jest.spyOn(console, 'error').mockImplementation(() => {});
};

describe('renewal — the period moves forward', () => {
  it("extends to the invoice line's period and keeps the status active", async () => {
    quiet();
    const response = await send(invoiceEvent());

    expect(response.status).toBe(200);
    const sub = await stored();
    expect(sub.currentPeriodStart.toISOString()).toBe(MONTH_1_END);
    expect(sub.currentPeriodEnd.toISOString()).toBe(MONTH_2_END);
    expect(sub.nextBillingDate.toISOString()).toBe(MONTH_2_END);
    expect(sub.status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
  });

  // invoice.period_end is the OLD period's end. Renewing to it would go nowhere.
  it("never uses the invoice's own period, which is the one that just ended", async () => {
    quiet();
    await send(invoiceEvent());
    expect((await stored()).currentPeriodEnd.toISOString()).not.toBe(MONTH_1_END);
  });

  it('keeps the rest of the record as it was', async () => {
    quiet();
    await send(invoiceEvent());
    const sub = await stored();
    expect(String(sub.bookingId)).toBe(String(client.booking._id));
    expect(sub.startDate.toISOString()).toBe('2026-09-14T20:00:00.000Z');
    expect(sub.amount).toBe(25000);
  });

  it('works with the older invoice shape too', async () => {
    quiet();
    await send(invoiceEvent({ shape: 'legacy' }));
    expect((await stored()).currentPeriodEnd.toISOString()).toBe(MONTH_2_END);
  });
});

describe('renewal — sessions reset to 4, never carried over', () => {
  it('one left becomes 4', async () => {
    quiet();
    await send(invoiceEvent());
    expect((await stored()).sessionsRemaining).toBe(4);
  });

  it('two unused become 4, never 6', async () => {
    quiet();
    await send(invoiceEvent());
    await Subscription.updateOne({ platformSubscriptionId: SUB_ID }, { $set: { sessionsRemaining: 2 } });
    await send(invoiceEvent({ from: MONTH_2_END, to: MONTH_3_END }));

    const sub = await stored();
    expect(sub.sessionsRemaining).toBe(4);
    expect(sub.currentPeriodEnd.toISOString()).toBe(MONTH_3_END);
  });

  it('zero left becomes 4', async () => {
    quiet();
    await Subscription.updateOne({ platformSubscriptionId: SUB_ID }, { $set: { sessionsRemaining: 0 } });
    await send(invoiceEvent());
    expect((await stored()).sessionsRemaining).toBe(4);
  });
});

describe('renewal — processed only once', () => {
  it('a replayed event changes nothing and sends no second receipt', async () => {
    quiet();
    const event = invoiceEvent();
    await send(event);
    await Subscription.updateOne({ platformSubscriptionId: SUB_ID }, { $set: { sessionsRemaining: 3 } });
    const replay = await send(event);

    expect(replay.status).toBe(200);
    expect(replay.body.duplicate).toBe(true);
    const sub = await stored();
    expect(sub.currentPeriodEnd.toISOString()).toBe(MONTH_2_END);
    // A replay must not hand back a session that was used since.
    expect(sub.sessionsRemaining).toBe(3);
    expect(sendPaymentReceiptEmail).toHaveBeenCalledTimes(1);
    expect(await PaymentEvent.countDocuments()).toBe(1);
  });

  // The case a ledger-only check lets through: a new event id, same invoice.
  it('a different event carrying the same invoice renews once', async () => {
    quiet();
    const event = invoiceEvent();
    await send(event);
    await send({ ...event, id: `${event.id}_resent` });

    expect((await stored()).currentPeriodEnd.toISOString()).toBe(MONTH_2_END);
    expect(sendPaymentReceiptEmail).toHaveBeenCalledTimes(1);
    expect(await PaymentEvent.countDocuments()).toBe(2);
  });

  it('three identical deliveries at once renew once', async () => {
    quiet();
    const event = invoiceEvent();
    const responses = await Promise.all([send(event), send(event), send(event)]);

    expect(responses.every((r) => r.status === 200)).toBe(true);
    expect((await stored()).currentPeriodEnd.toISOString()).toBe(MONTH_2_END);
    expect(sendPaymentReceiptEmail).toHaveBeenCalledTimes(1);
  });

  it('an older invoice arriving late never moves the period back', async () => {
    quiet();
    await send(invoiceEvent({ from: MONTH_2_END, to: MONTH_3_END }));
    await send(invoiceEvent());

    const sub = await stored();
    expect(sub.currentPeriodEnd.toISOString()).toBe(MONTH_3_END);
    expect(sendPaymentReceiptEmail).toHaveBeenCalledTimes(1);
  });

  // The 6.3 gap, closed: the ledger row exists, the handler failed, and Stripe's
  // retry of the SAME event must still renew.
  it('heals on retry after the handler failed once', async () => {
    quiet();
    const event = invoiceEvent();
    // A query, not a promise: the service calls .lean() on it.
    jest
      .spyOn(Subscription, 'findOneAndUpdate')
      .mockImplementationOnce(() => ({ lean: () => Promise.reject(new Error('database blip')) }));

    const failed = await send(event);
    expect(failed.status).toBe(500);
    expect((await stored()).currentPeriodEnd.toISOString()).toBe(MONTH_1_END);

    const retried = await send(event);
    expect(retried.status).toBe(200);
    expect(retried.body.duplicate).toBe(true);
    expect((await stored()).currentPeriodEnd.toISOString()).toBe(MONTH_2_END);
    expect(sendPaymentReceiptEmail).toHaveBeenCalledTimes(1);
  });

  // Without lines, the period comes from the invoice alone. Anchored on our own
  // record, each retry would add another month.
  it('the no-lines fallback is also applied only once', async () => {
    quiet();
    const event = invoiceEvent({ lines: false });
    await send(event);
    await send(event);
    await send({ ...event, id: `${event.id}_again` });

    expect((await stored()).currentPeriodEnd.toISOString()).toBe(MONTH_2_END);
  });
});

describe('renewal — the ledger records every one', () => {
  it('writes a row per renewal, linked to the subscription and client', async () => {
    quiet();
    await send(invoiceEvent());
    await send(invoiceEvent({ from: MONTH_2_END, to: MONTH_3_END }));

    const rows = await PaymentEvent.find({ eventType: STRIPE_EVENT.INVOICE_PAID }).lean();
    expect(rows).toHaveLength(2);
    rows.forEach((row) => {
      expect(String(row.subscriptionId)).toBe(String(client.subscription._id));
      expect(String(row.clientId)).toBe(String(client.user._id));
      expect(row.amount).toBe(25000);
      expect(row.currency).toBe('EUR');
    });
  });

  it('still records the event when the subscription is unknown', async () => {
    quiet();
    await send(invoiceEvent({ subscription: 'sub_nobody' }));
    const row = await PaymentEvent.findOne().lean();
    expect(row.platformEventId).toMatch(/^evt_renew_/);
    expect(row.subscriptionId).toBeUndefined();
  });
});

describe('renewal — what it refuses, loudly and without crashing', () => {
  it('an unknown subscription: 200, a loud log, nothing changed', async () => {
    const errors = quiet();
    const response = await send(invoiceEvent({ subscription: 'sub_nobody' }));

    expect(response.status).toBe(200);
    expect(errors.mock.calls.flat().join(' ')).toMatch(/RENEWAL NOT APPLIED.*sub_nobody/);
    expect((await stored()).currentPeriodEnd.toISOString()).toBe(MONTH_1_END);
    expect(sendPaymentReceiptEmail).not.toHaveBeenCalled();
  });

  it.each([[SUBSCRIPTION_STATUS.CANCELLED], [SUBSCRIPTION_STATUS.EXPIRED]])(
    'a %s subscription is not renewed',
    async (status) => {
      await clearCollections();
      client = await seedClient({ status });
      const errors = quiet();

      const response = await send(invoiceEvent());

      expect(response.status).toBe(200);
      expect(errors.mock.calls.flat().join(' ')).toMatch(/RENEWAL NOT APPLIED/);
      const sub = await stored();
      expect(sub.status).toBe(status);
      expect(sub.currentPeriodEnd.toISOString()).toBe(MONTH_1_END);
    },
  );

  it('the first invoice is not a renewal', async () => {
    quiet();
    await send(invoiceEvent({ reason: BILLING_REASON.FIRST_INVOICE }));
    const sub = await stored();
    expect(sub.currentPeriodEnd.toISOString()).toBe(MONTH_1_END);
    expect(sub.sessionsRemaining).toBe(1);
  });

  it('a paid invoice for another reason is left alone', async () => {
    quiet();
    await send(invoiceEvent({ reason: 'manual' }));
    expect((await stored()).currentPeriodEnd.toISOString()).toBe(MONTH_1_END);
  });

  it('an invoice with no usable period changes nothing', async () => {
    const errors = quiet();
    const event = invoiceEvent({ lines: false });
    delete event.data.object.period_end;
    const response = await send(event);

    expect(response.status).toBe(200);
    expect(errors.mock.calls.flat().join(' ')).toMatch(/no usable period/);
    expect((await stored()).currentPeriodEnd.toISOString()).toBe(MONTH_1_END);
  });

  it('never logs an email address or a name', async () => {
    const errors = quiet();
    const logs = console.log;
    await send(invoiceEvent());
    await send(invoiceEvent({ subscription: 'sub_nobody' }));

    const printed = [...logs.mock.calls, ...errors.mock.calls].flat().join(' ');
    expect(printed).not.toMatch(/@example\.com|Asha/);
  });
});

describe('renewal — past_due comes back to active', () => {
  it('a paid renewal on a past_due subscription makes it active', async () => {
    quiet();
    await Subscription.updateOne({ platformSubscriptionId: SUB_ID }, { $set: { status: SUBSCRIPTION_STATUS.PAST_DUE } });
    await send(invoiceEvent());

    const sub = await stored();
    expect(sub.status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
    expect(sub.currentPeriodEnd.toISOString()).toBe(MONTH_2_END);
    expect(sub.sessionsRemaining).toBe(4);
  });
});

describe('renewal — money that differs from the plan', () => {
  it('still renews, and warns with amounts only', async () => {
    quiet();
    await send(invoiceEvent({ amount: 15000 }));

    expect((await stored()).currentPeriodEnd.toISOString()).toBe(MONTH_2_END);
    expect(console.warn.mock.calls.flat().join(' ')).toMatch(/paid 15000 EUR, plan 25000 EUR/);
  });
});

describe('renewal — the receipt', () => {
  it("sends one receipt, with dates in the client's own zone", async () => {
    quiet();
    await send(invoiceEvent());

    expect(sendPaymentReceiptEmail).toHaveBeenCalledTimes(1);
    const [to, details] = sendPaymentReceiptEmail.mock.calls[0];
    expect(to).toBe(client.user.email);
    expect(details.name).toBe('Asha Rao');
    expect(details.amount).toBe('€250.00');
    // 20:00 UTC on the 14th is already the 15th in Kolkata.
    expect(details.periodFrom).toBe('15 October 2026');
    expect(details.nextPayment).toBe('15 November 2026');
  });

  it('labels the dates UTC when the client has no saved zone', async () => {
    await clearCollections();
    client = await seedClient({ timezone: null });
    quiet();
    await send(invoiceEvent());

    expect(sendPaymentReceiptEmail.mock.calls[0][1].nextPayment).toBe('14 November 2026 (UTC)');
  });

  it('a failed receipt never undoes the renewal', async () => {
    const errors = quiet();
    sendPaymentReceiptEmail.mockRejectedValue(new Error('Resend refused renew@example.com'));
    const response = await send(invoiceEvent());

    expect(response.status).toBe(200);
    expect((await stored()).currentPeriodEnd.toISOString()).toBe(MONTH_2_END);
    const printed = errors.mock.calls.flat().join(' ');
    expect(printed).toMatch(/receipt email failed: Error/);
    expect(printed).not.toMatch(/@example\.com/);
  });

  const receipt = () =>
    paymentReceiptEmail({
      name: '<b>Asha</b>',
      amount: '€250.00',
      paidOn: '15 October 2026',
      periodFrom: '15 October 2026',
      periodTo: '15 November 2026',
      nextPayment: '15 November 2026',
      accountUrl: 'https://castofmind.com/portal/account',
    });

  it("carries §13's renewal sentence in both parts", () => {
    const { html, text } = receipt();
    const sentence = 'Next payment: 15 November 2026. To stop it, cancel before this date.';
    expect(html).toContain(sentence);
    expect(text).toContain(sentence);
  });

  it('carries no card detail, no invoice link and no session length', () => {
    const { html, text } = receipt();
    const both = `${html} ${text}`;
    expect(both).not.toMatch(/card|last4|\*{4}|visa|mastercard|invoice\.stripe|stripe\.com/i);
    expect(both).not.toMatch(/\b\d+\s*(minutes?|mins?|hours?)\b/i);
  });

  it('escapes the name in the HTML', () => {
    const { html } = receipt();
    expect(html).not.toContain('<b>Asha</b>');
    expect(html).toContain('&lt;b&gt;Asha&lt;/b&gt;');
  });
});

describe('renewal helpers', () => {
  it.each([
    ['2026-01-31T09:00:00.000Z', '2026-02-28T09:00:00.000Z'],
    ['2028-01-31T09:00:00.000Z', '2028-02-29T09:00:00.000Z'],
    ['2026-03-15T09:00:00.000Z', '2026-04-15T09:00:00.000Z'],
    ['2026-12-31T09:00:00.000Z', '2027-01-31T09:00:00.000Z'],
    ['2026-08-31T09:00:00.000Z', '2026-09-30T09:00:00.000Z'],
  ])('one month after %s is %s', (from, to) => {
    expect(renewal.addOneMonth(new Date(from)).toISOString()).toBe(to);
  });

  it('prefers the subscription line over any other line', () => {
    const period = renewal.invoiceLinePeriod({
      lines: {
        data: [
          { period: { start: sec('2026-10-01T00:00:00Z'), end: sec('2027-03-01T00:00:00Z') } },
          { period: { start: sec(MONTH_1_END), end: sec(MONTH_2_END) }, parent: { type: 'subscription_item_details' } },
        ],
      },
    });
    expect(period.end.toISOString()).toBe(MONTH_2_END);
  });

  it('reads the subscription id from either invoice shape', () => {
    expect(renewal.invoiceSubscriptionId({ parent: { subscription_details: { subscription: 'sub_a' } } })).toBe('sub_a');
    expect(renewal.invoiceSubscriptionId({ subscription: 'sub_b' })).toBe('sub_b');
    expect(renewal.invoiceSubscriptionId({ subscription: { id: 'sub_c' } })).toBe('sub_c');
    expect(renewal.invoiceSubscriptionId({})).toBeNull();
  });
});
