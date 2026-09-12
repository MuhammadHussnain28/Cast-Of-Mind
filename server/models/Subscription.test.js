import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import { Subscription } from './Subscription.js';
import {
  BILLING_CURRENCY,
  SESSIONS_PER_CYCLE,
  SUBSCRIPTION_AMOUNT_MINOR,
  SUBSCRIPTION_STATUS,
} from '../constants/payments.js';
import { FUTURE_COLLECTIONS } from '../constants/adminStats.js';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';

beforeAll(async () => {
  await startMemoryMongo();
  // Both partial unique indexes are enforced by MongoDB, not by a validator.
  await Subscription.init();
});

afterEach(clearCollections);
afterAll(stopMemoryMongo);

const DAY = 24 * 60 * 60 * 1000;
const startDate = new Date('2026-09-01T00:00:00.000Z');
const periodEnd = new Date(startDate.getTime() + 30 * DAY);

const subscription = (overrides = {}) => ({
  bookingId: new mongoose.Types.ObjectId(),
  clientId: new mongoose.Types.ObjectId(),
  startDate,
  currentPeriodEnd: periodEnd,
  nextBillingDate: periodEnd,
  ...overrides,
});

describe('Subscription — creation and defaults', () => {
  it('creates an active EUR subscription at the standard price', async () => {
    const created = await Subscription.create(subscription());

    expect(created.status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
    expect(created.currency).toBe(BILLING_CURRENCY);
    expect(created.amount).toBe(SUBSCRIPTION_AMOUNT_MINOR);
    expect(created.sessionsRemaining).toBe(SESSIONS_PER_CYCLE);
    expect(created.cancelledAt).toBeUndefined();
  });

  // Pins the euros-or-cents decision. If this ever reads 200, every money figure
  // on the admin dashboard is out by a factor of 100 and nothing else fails.
  it('prices €200/month as 20000 minor units', () => {
    expect(SUBSCRIPTION_AMOUNT_MINOR).toBe(20000);
    expect(Subscription.schema.path('amount').defaultValue).toBe(20000);
  });

  it('pins the collection name the admin dashboard reads raw', () => {
    expect(Subscription.collection.name).toBe(FUTURE_COLLECTIONS.subscriptions);
  });

  it('records both timestamps, per §10.6', async () => {
    const created = await Subscription.create(subscription());

    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  it('requires a booking, a client, a period end and a billing date', async () => {
    await expect(Subscription.create({})).rejects.toThrow();

    await expect(
      Subscription.create(subscription({ currentPeriodEnd: undefined })),
    ).rejects.toThrow(/when the paid period ends/);

    await expect(
      Subscription.create(subscription({ nextBillingDate: undefined })),
    ).rejects.toThrow(/when it renews/);
  });
});

describe('Subscription — money', () => {
  it('rejects a fractional amount, because money is whole cents', async () => {
    await expect(Subscription.create(subscription({ amount: 200.5 }))).rejects.toThrow(
      /whole number/,
    );
  });

  it('rejects a negative amount', async () => {
    await expect(Subscription.create(subscription({ amount: -1 }))).rejects.toThrow(
      /cannot be negative/,
    );
  });

  // Strict here, deliberately free on the ledger — this record is what we charge.
  it('bills in EUR only', async () => {
    await expect(Subscription.create(subscription({ currency: 'USD' }))).rejects.toThrow(
      /Only EUR is billed/,
    );
  });
});

describe('Subscription — the session counter', () => {
  it('refuses more than a cycle allows, so sessions can never carry over', async () => {
    await expect(
      Subscription.create(subscription({ sessionsRemaining: SESSIONS_PER_CYCLE + 1 })),
    ).rejects.toThrow(/do not carry over/);
  });

  it('refuses a negative counter', async () => {
    await expect(
      Subscription.create(subscription({ sessionsRemaining: -1 })),
    ).rejects.toThrow(/cannot be negative/);
  });

  it('refuses a fractional counter', async () => {
    await expect(
      Subscription.create(subscription({ sessionsRemaining: 1.5 })),
    ).rejects.toThrow(/whole number/);
  });

  // §13: the counter drops to 0 when a subscription ends.
  it('allows zero', async () => {
    const created = await Subscription.create(subscription({ sessionsRemaining: 0 }));
    expect(created.sessionsRemaining).toBe(0);
  });
});

describe('Subscription — lifecycle guards', () => {
  it('rejects a status outside §13’s state machine', async () => {
    await expect(Subscription.create(subscription({ status: 'paused' }))).rejects.toThrow(
      /Status must be one of/,
    );
  });

  it('accepts every state §13 defines', async () => {
    for (const status of Object.values(SUBSCRIPTION_STATUS)) {
      const extra = status === SUBSCRIPTION_STATUS.CANCELLED ? { cancelledAt: new Date() } : {};
      const created = await Subscription.create(subscription({ status, ...extra }));
      expect(created.status).toBe(status);
    }
  });

  it('refuses a period that ends before it starts', async () => {
    await expect(
      Subscription.create(
        subscription({ currentPeriodEnd: new Date(startDate.getTime() - DAY) }),
      ),
    ).rejects.toThrow(/must end after it starts/);
  });

  it('refuses a cancelled subscription with no cancellation date', async () => {
    await expect(
      Subscription.create(subscription({ status: SUBSCRIPTION_STATUS.CANCELLED })),
    ).rejects.toThrow(/must record when it was cancelled/);
  });

  // §13: cancelled keeps access until the period ends, then expires. The stamp
  // has to survive that move or the reason for ending is lost.
  it('keeps cancelledAt when a cancelled subscription later expires', async () => {
    const cancelledAt = new Date();
    const created = await Subscription.create(
      subscription({ status: SUBSCRIPTION_STATUS.CANCELLED, cancelledAt }),
    );

    created.status = SUBSCRIPTION_STATUS.EXPIRED;
    await created.save();

    const reloaded = await Subscription.findById(created._id);
    expect(reloaded.status).toBe(SUBSCRIPTION_STATUS.EXPIRED);
    expect(reloaded.cancelledAt).toEqual(cancelledAt);
  });
});

describe('Subscription — one active subscription per booking', () => {
  it('refuses a second active subscription on the same booking', async () => {
    const bookingId = new mongoose.Types.ObjectId();

    await Subscription.create(subscription({ bookingId }));

    await expect(Subscription.create(subscription({ bookingId }))).rejects.toMatchObject({
      code: 11000,
    });

    expect(await Subscription.countDocuments()).toBe(1);
  });

  // The re-subscribe path in §13: the old row ends, a new one begins, and the
  // booking keeps its history.
  it('allows a new subscription once the previous one has expired', async () => {
    const bookingId = new mongoose.Types.ObjectId();

    const first = await Subscription.create(subscription({ bookingId }));
    first.status = SUBSCRIPTION_STATUS.EXPIRED;
    first.sessionsRemaining = 0;
    await first.save();

    await Subscription.create(subscription({ bookingId }));

    expect(await Subscription.countDocuments({ bookingId })).toBe(2);
    expect(
      await Subscription.countDocuments({ bookingId, status: SUBSCRIPTION_STATUS.ACTIVE }),
    ).toBe(1);
  });

  it('does not restrict different bookings', async () => {
    await Subscription.create(subscription());
    await Subscription.create(subscription());

    expect(await Subscription.countDocuments()).toBe(2);
  });
});

describe('Subscription — the platform subscription id', () => {
  it('refuses two records pointing at the same platform subscription', async () => {
    await Subscription.create(subscription({ platformSubscriptionId: 'sub_123' }));

    await expect(
      Subscription.create(subscription({ platformSubscriptionId: 'sub_123' })),
    ).rejects.toMatchObject({ code: 11000 });
  });

  // The reason this is a partial index on string values rather than `sparse`:
  // sparse only skips a MISSING field, so several rows explicitly holding null
  // would still collide — and null is what a careless insert writes.
  it('allows many records with no platform id yet', async () => {
    await Subscription.create(subscription());
    await Subscription.create(subscription({ platformSubscriptionId: null }));
    await Subscription.create(subscription({ platformSubscriptionId: undefined }));

    expect(await Subscription.countDocuments()).toBe(3);
  });
});
