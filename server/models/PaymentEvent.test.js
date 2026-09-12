import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import { PaymentEvent, AppendOnlyViolationError } from './PaymentEvent.js';
import { PAYMENT_PLATFORM } from '../constants/payments.js';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';

beforeAll(async () => {
  await startMemoryMongo();
  // unique: true is an INDEX enforced by MongoDB on write, not a validator.
  // Without this the duplicate test can pass for the wrong reason on a fresh db.
  await PaymentEvent.init();
});

// NOTE: clearCollections goes through the raw driver, which is exactly the hole
// the model's guard comment documents. If it went through the model, this suite
// could not clean up after itself.
afterEach(clearCollections);
afterAll(stopMemoryMongo);

const event = (overrides = {}) => ({
  platform: PAYMENT_PLATFORM.STRIPE,
  eventType: 'payment_succeeded',
  platformEventId: 'evt_1PxyzABC',
  amount: 20000,
  currency: 'EUR',
  rawPayload: { id: 'evt_1PxyzABC', object: 'event', data: { object: { amount_paid: 20000 } } },
  ...overrides,
});

describe('PaymentEvent — writing to the ledger', () => {
  it('stores an event with its defaults', async () => {
    const created = await PaymentEvent.create(event());

    expect(created.platform).toBe('stripe');
    expect(created.eventType).toBe('payment_succeeded');
    expect(created.amount).toBe(20000);
    expect(created.currency).toBe('EUR');
    expect(created.receivedAt).toBeInstanceOf(Date);
  });

  it('pins the collection name, because a rename would silently orphan the ledger', () => {
    expect(PaymentEvent.collection.name).toBe('paymentevents');
  });

  it('requires a platform, an event type, an event id and the raw payload', async () => {
    await expect(PaymentEvent.create({})).rejects.toThrow();

    const missingPayload = PaymentEvent.create(event({ rawPayload: undefined }));
    await expect(missingPayload).rejects.toThrow(/audit trail/i);
  });

  it('rejects a platform outside the known list', async () => {
    await expect(PaymentEvent.create(event({ platform: 'monzo' }))).rejects.toThrow(
      /Platform must be one of/,
    );
  });

  it('uppercases the currency it was given', async () => {
    const created = await PaymentEvent.create(event({ currency: 'eur' }));
    expect(created.currency).toBe('EUR');
  });

  it('rejects a fractional amount, because money here is whole cents', async () => {
    await expect(PaymentEvent.create(event({ amount: 200.5 }))).rejects.toThrow(/whole number/);
  });
});

describe('PaymentEvent — what may be missing, and why', () => {
  // The first payment webhook of a client's life arrives BEFORE the user or the
  // subscription exists — chunk 6.4 creates them from it. Requiring either field
  // would make that event impossible to log.
  it('stores an event with no subscriptionId and no clientId', async () => {
    const created = await PaymentEvent.create(
      event({ subscriptionId: undefined, clientId: undefined }),
    );

    expect(created.subscriptionId).toBeUndefined();
    expect(created.clientId).toBeUndefined();
  });

  // An enum on eventType would refuse to record the surprising events that are
  // the most worth investigating.
  it('stores an event type nobody anticipated', async () => {
    const created = await PaymentEvent.create(
      event({ eventType: 'invoice.payment_action_required', platformEventId: 'evt_unknown' }),
    );

    expect(created.eventType).toBe('invoice.payment_action_required');
  });

  // Unlike subscriptions.currency, which is EUR-only. This record says what
  // actually arrived, not what we meant to charge.
  it('records a payment that arrived in an unexpected currency', async () => {
    const created = await PaymentEvent.create(
      event({ currency: 'USD', platformEventId: 'evt_usd' }),
    );

    expect(created.currency).toBe('USD');
  });

  it('stores an event carrying no amount at all', async () => {
    const created = await PaymentEvent.create(
      event({ eventType: 'subscription_cancelled', amount: undefined, platformEventId: 'evt_c' }),
    );

    expect(created.amount).toBeUndefined();
  });
});

describe('PaymentEvent — idempotency', () => {
  it('refuses a second event with the same platform and event id', async () => {
    await PaymentEvent.create(event());

    await expect(PaymentEvent.create(event())).rejects.toMatchObject({ code: 11000 });
    expect(await PaymentEvent.countDocuments()).toBe(1);
  });

  // This is what the compound index buys over indexing platformEventId alone:
  // a PayPal event id that happened to collide with a Stripe one would otherwise
  // be silently refused, losing a real row from an audit ledger.
  it('allows the same event id from a different platform', async () => {
    await PaymentEvent.create(event({ platform: PAYMENT_PLATFORM.STRIPE }));
    await PaymentEvent.create(event({ platform: PAYMENT_PLATFORM.PAYPAL }));

    expect(await PaymentEvent.countDocuments()).toBe(2);
  });
});

describe('PaymentEvent — the append-only guard', () => {
  const expectBlocked = async (promise, operation) => {
    await expect(promise).rejects.toThrow(AppendOnlyViolationError);
    await expect(promise).rejects.toThrow(new RegExp(operation.replace(/\$/g, '\\$')));
  };

  it('blocks Model.updateOne', async () => {
    const saved = await PaymentEvent.create(event());
    await expectBlocked(
      PaymentEvent.updateOne({ _id: saved._id }, { eventType: 'tampered' }),
      'updateOne',
    );
  });

  it('blocks Model.updateMany', async () => {
    await PaymentEvent.create(event());
    await expectBlocked(PaymentEvent.updateMany({}, { eventType: 'tampered' }), 'updateMany');
  });

  it('blocks Model.findOneAndUpdate', async () => {
    await PaymentEvent.create(event());
    await expectBlocked(
      PaymentEvent.findOneAndUpdate({}, { eventType: 'tampered' }),
      'findOneAndUpdate',
    );
  });

  it('blocks Model.findOneAndReplace', async () => {
    await PaymentEvent.create(event());
    await expectBlocked(PaymentEvent.findOneAndReplace({}, event()), 'findOneAndReplace');
  });

  it('blocks Model.replaceOne', async () => {
    await PaymentEvent.create(event());
    await expectBlocked(PaymentEvent.replaceOne({}, event()), 'replaceOne');
  });

  it('blocks Model.deleteOne and Model.deleteMany', async () => {
    await PaymentEvent.create(event());

    await expectBlocked(PaymentEvent.deleteOne({}), 'deleteOne');
    await expectBlocked(PaymentEvent.deleteMany({}), 'deleteMany');
    expect(await PaymentEvent.countDocuments()).toBe(1);
  });

  it('blocks Model.findOneAndDelete', async () => {
    await PaymentEvent.create(event());
    await expectBlocked(PaymentEvent.findOneAndDelete({}), 'findOneAndDelete');
  });

  // Document middleware, not query middleware. A guard registered for only one
  // of the two forms would let this straight through.
  it('blocks doc.deleteOne()', async () => {
    const saved = await PaymentEvent.create(event());
    await expectBlocked(saved.deleteOne(), 'deleteOne');
  });

  it('blocks re-saving an existing document', async () => {
    await PaymentEvent.create(event());

    const found = await PaymentEvent.findOne().select('+rawPayload');
    found.eventType = 'tampered';

    await expectBlocked(found.save(), 'save');
  });

  it('blocks bulkWrite', async () => {
    await expectBlocked(
      PaymentEvent.bulkWrite([
        { updateOne: { filter: {}, update: { $set: { eventType: 'tampered' } } } },
      ]),
      'bulkWrite',
    );
  });

  it('blocks an aggregation that writes back with $out or $merge', async () => {
    await PaymentEvent.create(event());

    await expectBlocked(
      PaymentEvent.aggregate([{ $match: {} }, { $out: 'paymentevents' }]),
      'aggregate',
    );
    await expectBlocked(
      PaymentEvent.aggregate([{ $match: {} }, { $merge: { into: 'paymentevents' } }]),
      'aggregate',
    );
  });

  it('still allows creating, reading and aggregating', async () => {
    await PaymentEvent.create(event());
    await PaymentEvent.create(event({ platformEventId: 'evt_second', amount: 20000 }));

    expect(await PaymentEvent.countDocuments()).toBe(2);

    const totals = await PaymentEvent.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    expect(totals[0].total).toBe(40000);
  });
});

describe('PaymentEvent — the raw payload stays out of sight', () => {
  it('is not returned by an ordinary query', async () => {
    await PaymentEvent.create(event());

    const found = await PaymentEvent.findOne();
    expect(found.rawPayload).toBeUndefined();
  });

  it('is returned only when asked for explicitly', async () => {
    await PaymentEvent.create(event());

    const found = await PaymentEvent.findOne().select('+rawPayload');
    expect(found.rawPayload).toMatchObject({ object: 'event' });
  });

  it('is stripped from toJSON, so it cannot reach a response body', async () => {
    await PaymentEvent.create(event());

    const found = await PaymentEvent.findOne().select('+rawPayload');
    const serialised = found.toJSON();

    expect(serialised.rawPayload).toBeUndefined();
    expect(serialised.__v).toBeUndefined();
    expect(JSON.stringify(serialised)).not.toContain('amount_paid');
  });

  it('is genuinely stored, despite being hidden', async () => {
    const saved = await PaymentEvent.create(event());

    const stored = await mongoose.connection.db
      .collection('paymentevents')
      .findOne({ _id: saved._id });

    expect(stored.rawPayload.data.object.amount_paid).toBe(20000);
  });
});
