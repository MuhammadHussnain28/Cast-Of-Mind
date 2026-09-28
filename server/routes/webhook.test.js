import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import Stripe from 'stripe';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';

// A TEST SIGNING SECRET, and the signatures below are REAL.
//
// `stripe.webhooks.generateTestHeaderString` signs a payload exactly as Stripe
// would, so the genuine verification path runs. Mocking constructEvent would
// have proved nothing about the thing most likely to be wrong.
const WEBHOOK_SECRET = 'whsec_test_secret_for_signing_only_not_real';

process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_for_tests';
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

const { default: app } = await import('../app.js');
const { PaymentEvent } = await import('../models/PaymentEvent.js');
const { User } = await import('../models/User.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { webhookRateLimiter } = await import('./webhook.routes.js');
const { STRIPE_EVENT, BILLING_REASON } = await import('../constants/webhooks.js');

const signer = new Stripe('sk_test_dummy_for_tests');
const ENDPOINT = '/api/v1/webhooks/payment';

beforeAll(async () => {
  await startMemoryMongo();
  // The compound unique index is what makes duplicates impossible. Without
  // init() it may not exist yet on a fresh database, and the duplicate tests
  // would pass for the wrong reason.
  await PaymentEvent.init();
});

beforeEach(() => {
  webhookRateLimiter.resetKey?.('::ffff:127.0.0.1');
  webhookRateLimiter.resetKey?.('127.0.0.1');
});

afterEach(clearCollections);
afterAll(stopMemoryMongo);

let counter = 0;

// DEFAULTS TO A NON-ACCOUNT EVENT — changed in chunk 6.4.
//
// `checkout.session.completed` now really creates an account, which needs a
// pendingCheckouts draft that this suite deliberately does not seed. This suite
// is about the transport — signatures, raw bytes, the ledger, idempotency — so
// its default event is one that routes and does nothing. Account creation has
// its own suite, against a replica set: routes/webhookAccountCreation.test.js.
function makeEvent(type = STRIPE_EVENT.SUBSCRIPTION_UPDATED, overrides = {}) {
  counter += 1;
  return {
    id: `evt_test_${Date.now()}_${counter}`,
    object: 'event',
    type,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_123',
        object: 'checkout.session',
        payment_status: 'paid',
        amount_total: 20000,
        currency: 'eur',
        customer_email: 'client@example.com',
        client_reference_id: 'a'.repeat(64),
        ...overrides,
      },
    },
  };
}

/** Sign a payload the way Stripe does, and post it as raw bytes. */
function send(event, { secret = WEBHOOK_SECRET, timestamp, body } = {}) {
  const payload = body ?? JSON.stringify(event);
  const header = signer.webhooks.generateTestHeaderString({
    payload,
    secret,
    ...(timestamp ? { timestamp } : {}),
  });

  // SEND THE STRING, NOT A BUFFER.
  //
  // superagent JSON-serialises a Buffer when the content type is JSON, so the
  // bytes arriving become {"type":"Buffer","data":[...]} and every signature
  // fails. A string is passed through untouched, which is what Stripe sends and
  // what the signature is computed over.
  return request(app)
    .post(ENDPOINT)
    .set('stripe-signature', header)
    .set('Content-Type', 'application/json')
    .send(payload);
}

describe('webhook — signature verification', () => {
  it('accepts a correctly signed event', async () => {
    const response = await send(makeEvent());

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
    expect(await PaymentEvent.countDocuments()).toBe(1);
  });

  it('refuses a request with no signature header at all', async () => {
    const response = await request(app)
      .post(ENDPOINT)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(makeEvent()));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_SIGNATURE');
    expect(await PaymentEvent.countDocuments()).toBe(0);
  });

  it('refuses a signature made with the wrong secret', async () => {
    const response = await send(makeEvent(), { secret: 'whsec_someone_elses_secret' });

    expect(response.status).toBe(400);
    expect(await PaymentEvent.countDocuments()).toBe(0);
  });

  // The attack the signature exists to stop: a real signature reused over an
  // edited body — say, an unpaid session rewritten to look paid.
  it('refuses a valid signature over a DIFFERENT body', async () => {
    const honest = makeEvent();
    const header = signer.webhooks.generateTestHeaderString({
      payload: JSON.stringify(honest),
      secret: WEBHOOK_SECRET,
    });

    const tampered = { ...honest, type: STRIPE_EVENT.INVOICE_PAID };

    const response = await request(app)
      .post(ENDPOINT)
      .set('stripe-signature', header)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(tampered));

    expect(response.status).toBe(400);
    expect(await PaymentEvent.countDocuments()).toBe(0);
  });

  // A captured request replayed later. Stripe's tolerance window is what makes
  // this fail, which is why the tolerance is set explicitly rather than inherited.
  it('refuses a correctly signed event whose timestamp is too old', async () => {
    const longAgo = Math.floor(Date.now() / 1000) - 60 * 60;
    const response = await send(makeEvent(), { timestamp: longAgo });

    expect(response.status).toBe(400);
    expect(await PaymentEvent.countDocuments()).toBe(0);
  });

  it('refuses junk that is not JSON at all', async () => {
    const response = await request(app)
      .post(ENDPOINT)
      .set('stripe-signature', 't=1,v1=deadbeef')
      .set('Content-Type', 'application/json')
      .send('not json');

    expect(response.status).toBe(400);
  });
});

describe('webhook — the raw body survives the parser', () => {
  /**
   * The regression guard for app.js's middleware ordering.
   *
   * If express.json() ever runs first, req.body becomes a parsed object, the
   * bytes are gone, and EVERY webhook fails verification. That would look like
   * a credentials problem rather than a middleware problem, so it is pinned.
   */
  it('verifies a payload whose exact bytes would not survive re-serialisation', async () => {
    const event = makeEvent();
    // Key order and spacing that JSON.stringify would not reproduce from an
    // object: if anything re-serialises this, the HMAC changes and it fails.
    const payload = `{"id":"${event.id}","object":"event","type":"${event.type}",  "created":${event.created},"data":{"object":{"payment_status":"paid","amount_total":20000,"currency":"eur"}}}`;

    const response = await send(event, { body: payload });

    expect(response.status).toBe(200);

    const stored = await PaymentEvent.findOne().select('+rawPayload');
    expect(stored.platformEventId).toBe(event.id);
  });
});

describe('webhook — idempotency', () => {
  it('records the same event only once and answers 200 both times', async () => {
    const event = makeEvent();

    const first = await send(event);
    const second = await send(event);

    expect(first.status).toBe(200);
    expect(first.body.duplicate).toBeUndefined();
    expect(second.status).toBe(200);
    expect(second.body.duplicate).toBe(true);

    expect(await PaymentEvent.countDocuments()).toBe(1);
  });

  // 11.1: a duplicate is routed again, so a retry can heal a failed handler.
  it('routes a duplicate event to its handler again', async () => {
    const logs = jest.spyOn(console, 'log').mockImplementation(() => {});
    const event = makeEvent();

    await send(event);
    await send(event);

    const handled = logs.mock.calls.flat().filter((line) => /subscription updated/.test(String(line)));
    expect(handled).toHaveLength(2);
    logs.mockRestore();
  });

  /**
   * A smoke test for simultaneous delivery.
   *
   * Honest limitation: this does NOT by itself distinguish the unique index
   * from a read-then-write. Node's event loop serialises these enough that a
   * findOne-then-create implementation also passes — verified by mutation, not
   * assumed. The structural assertion below is what actually pins the design.
   */
  it('records one row even when two identical events arrive at once', async () => {
    const event = makeEvent();

    const responses = await Promise.all([send(event), send(event), send(event)]);

    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(await PaymentEvent.countDocuments()).toBe(1);

    const duplicates = responses.filter((response) => response.body.duplicate === true);
    expect(duplicates).toHaveLength(2);
  });

  /**
   * THE ASSERTION THAT ACTUALLY PINS THE DESIGN.
   *
   * The duplicate check must BE the insert, not a lookup before it. A
   * findOne-then-create races: Stripe genuinely resends within milliseconds,
   * and under real concurrency two readers both miss and both insert. Only the
   * unique index is atomic.
   *
   * Asserting that no read happens is the only way to catch that from a test —
   * a behavioural test cannot reliably reproduce the race in a single process.
   */
  it('never reads before writing — the unique index is the gate', async () => {
    const readSpy = jest.spyOn(PaymentEvent, 'findOne');

    await send(makeEvent());
    await send(makeEvent());

    expect(readSpy).not.toHaveBeenCalled();

    readSpy.mockRestore();
  });

  it('treats a different event id as a separate event', async () => {
    await send(makeEvent());
    await send(makeEvent());

    expect(await PaymentEvent.countDocuments()).toBe(2);
  });
});

describe('webhook — what gets written to the ledger', () => {
  it('stores the platform, type, id, amount and currency', async () => {
    const event = makeEvent();
    await send(event);

    const stored = await PaymentEvent.findOne();

    expect(stored.platform).toBe('stripe');
    expect(stored.eventType).toBe(event.type);
    expect(stored.platformEventId).toBe(event.id);
    expect(stored.amount).toBe(20000);
    expect(stored.currency).toBe('EUR');
    expect(stored.receivedAt).toBeInstanceOf(Date);
  });

  it('stores the full payload verbatim, but keeps it out of ordinary reads', async () => {
    await send(makeEvent());

    const plain = await PaymentEvent.findOne();
    expect(plain.rawPayload).toBeUndefined();

    const withPayload = await PaymentEvent.findOne().select('+rawPayload');
    expect(withPayload.rawPayload.data.object.customer_email).toBe('client@example.com');
  });

  // Neither exists yet — 6.1 made both optional precisely so the FIRST payment
  // of a client's life can be logged before there is anything to link it to.
  it('stores an event with no subscription or client linked yet', async () => {
    await send(makeEvent());

    const stored = await PaymentEvent.findOne();
    expect(stored.subscriptionId).toBeUndefined();
    expect(stored.clientId).toBeUndefined();
  });

  it('stores an event that carries no money', async () => {
    await send(makeEvent(STRIPE_EVENT.SUBSCRIPTION_DELETED, { amount_total: undefined }));

    const stored = await PaymentEvent.findOne();
    expect(stored.amount).toBeUndefined();
  });
});

describe('webhook — routing', () => {
  it.each([
    [STRIPE_EVENT.CHECKOUT_COMPLETED],
    [STRIPE_EVENT.INVOICE_PAID],
    [STRIPE_EVENT.INVOICE_FAILED],
    [STRIPE_EVENT.SUBSCRIPTION_DELETED],
    [STRIPE_EVENT.SUBSCRIPTION_UPDATED],
  ])('accepts and records %s', async (type) => {
    // Unpaid for the checkout event: a paid one would attempt real account
    // creation, which is covered in its own suite.
    const overrides = type === STRIPE_EVENT.CHECKOUT_COMPLETED ? { payment_status: 'unpaid' } : {};
    const response = await send(makeEvent(type, overrides));

    expect(response.status).toBe(200);
    expect(await PaymentEvent.countDocuments({ eventType: type })).toBe(1);
  });

  // Refusing an unknown type would make Stripe retry an event we were never
  // going to act on, and eventually mark the endpoint as failing.
  it('accepts an unknown event type without erroring, and still records it', async () => {
    const response = await send(makeEvent('customer.discount.created'));

    expect(response.status).toBe(200);
    expect(await PaymentEvent.countDocuments()).toBe(1);
  });

  // A completed session is not automatically a paid one.
  it('records but does not act on a completed-yet-unpaid checkout', async () => {
    const logs = jest.spyOn(console, 'log').mockImplementation(() => {});

    await send(makeEvent(STRIPE_EVENT.CHECKOUT_COMPLETED, { payment_status: 'unpaid' }));

    const printed = logs.mock.calls.flat().join(' ');
    expect(printed).toMatch(/unpaid/);
    expect(await PaymentEvent.countDocuments()).toBe(1);

    logs.mockRestore();
  });

  // The first invoice also fires invoice.payment_succeeded. Handling it here as
  // well as on the checkout event would process the opening payment twice.
  it('does not treat the first invoice as a renewal', async () => {
    const logs = jest.spyOn(console, 'log').mockImplementation(() => {});

    await send(
      makeEvent(STRIPE_EVENT.INVOICE_PAID, {
        billing_reason: BILLING_REASON.FIRST_INVOICE,
        amount_paid: 20000,
      }),
    );

    const printed = logs.mock.calls.flat().join(' ');
    expect(printed).toMatch(/first invoice/i);
    expect(printed).not.toMatch(/renewal/i);

    logs.mockRestore();
  });

  // Routed to the renewal handler (11.1). This payload names no subscription, so
  // it must say so loudly and still answer 200. Full renewal: subscriptionRenewal.test.js.
  it('does treat a later invoice as a renewal', async () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await send(
      makeEvent(STRIPE_EVENT.INVOICE_PAID, {
        object: 'invoice',
        billing_reason: BILLING_REASON.RENEWAL,
        amount_paid: 20000,
      }),
    );

    expect(response.status).toBe(200);
    expect(errors.mock.calls.flat().join(' ')).toMatch(/RENEWAL NOT APPLIED/);
    errors.mockRestore();
  });
});

describe('webhook — THE GOLDEN RULE still holds', () => {
  // Account creation happens ONLY for a paid checkout session with a stored
  // draft — proven in routes/webhookAccountCreation.test.js. No other event
  // type may create anything, which is what this asserts.
  it('creates no user, profile, booking or subscription', async () => {
    await send(makeEvent(STRIPE_EVENT.CHECKOUT_COMPLETED, { payment_status: 'unpaid' }));
    await send(makeEvent(STRIPE_EVENT.INVOICE_PAID));

    expect(await User.countDocuments()).toBe(0);
    expect(await ClientProfile.countDocuments()).toBe(0);
    expect(await Booking.countDocuments()).toBe(0);
    expect(await Subscription.countDocuments()).toBe(0);
  });
});

describe('webhook — rate limiting counts failures only', () => {
  /**
   * Stripe sends from a handful of IP addresses, so a per-IP counter is
   * effectively a global one. Throttling a burst of genuine renewals could make
   * Stripe disable the endpoint, so verified events must never accumulate.
   */
  it('lets many verified events through', async () => {
    for (let i = 0; i < 25; i += 1) {
      const response = await send(makeEvent());
      expect(response.status).toBe(200);
    }

    expect(await PaymentEvent.countDocuments()).toBe(25);
  });

  it('eventually refuses a flood of badly signed requests', async () => {
    let sawRateLimit = false;

    for (let i = 0; i < 70; i += 1) {
      const response = await send(makeEvent(), { secret: 'whsec_wrong' });
      if (response.status === 429) {
        sawRateLimit = true;
        break;
      }
    }

    expect(sawRateLimit).toBe(true);
    expect(await PaymentEvent.countDocuments()).toBe(0);
  });
});
