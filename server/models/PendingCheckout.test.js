import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import { PendingCheckout } from './PendingCheckout.js';
import { PENDING_CHECKOUT_TTL_HOURS, CHECKOUT_SESSION_TTL_HOURS } from '../constants/checkout.js';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';

beforeAll(async () => {
  await startMemoryMongo();
  await PendingCheckout.init();
});

afterEach(clearCollections);
afterAll(stopMemoryMongo);

const draft = (overrides = {}) => ({
  email: 'aoife@example.com',
  therapistProfileId: new mongoose.Types.ObjectId(),
  questionnaire: {
    type: 'individual',
    country: 'Ireland',
    city: 'Galway',
    relationshipStatus: 'Single',
    concernTags: ['Anxiety', 'Stress', 'Grief'],
    therapistGenderPreference: 'female',
    name: 'Aoife Byrne',
    age: 31,
    gender: 'female',
  },
  expiresAt: PendingCheckout.expiryFromNow(),
  ...overrides,
});

describe('PendingCheckout — creation', () => {
  it('generates a long random reference by itself', async () => {
    const first = await PendingCheckout.create(draft());
    const second = await PendingCheckout.create(draft({ email: 'other@example.com' }));

    expect(first.reference).toHaveLength(64);
    expect(first.reference).toMatch(/^[0-9a-f]+$/);
    expect(first.reference).not.toBe(second.reference);
  });

  it('lowercases and trims the email', async () => {
    const created = await PendingCheckout.create(draft({ email: '  Aoife@Example.COM ' }));
    expect(created.email).toBe('aoife@example.com');
  });

  it('requires an email, a therapist and the answers', async () => {
    await expect(PendingCheckout.create({ expiresAt: new Date() })).rejects.toThrow();

    await expect(
      PendingCheckout.create(draft({ questionnaire: undefined })),
    ).rejects.toThrow(/questionnaire answers are required/);

    await expect(
      PendingCheckout.create(draft({ therapistProfileId: undefined })),
    ).rejects.toThrow(/therapist must be chosen/);
  });

  it('refuses two drafts sharing a reference', async () => {
    const reference = 'a'.repeat(64);
    await PendingCheckout.create(draft({ reference }));

    await expect(
      PendingCheckout.create(draft({ reference, email: 'other@example.com' })),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('allows the session id to be absent, then written back', async () => {
    const created = await PendingCheckout.create(draft());
    expect(created.checkoutSessionId).toBeUndefined();

    await PendingCheckout.updateOne({ _id: created._id }, { $set: { checkoutSessionId: 'cs_1' } });

    const reloaded = await PendingCheckout.findById(created._id);
    expect(reloaded.checkoutSessionId).toBe('cs_1');
  });
});

describe('PendingCheckout — expiry', () => {
  // The draft must outlive the Stripe session it belongs to. If it expired
  // first, someone paying near the end of the window would arrive at a webhook
  // with no questionnaire behind them.
  it('outlives the Stripe session by a real margin', () => {
    expect(PENDING_CHECKOUT_TTL_HOURS).toBeGreaterThan(CHECKOUT_SESSION_TTL_HOURS);
  });

  it('sets the expiry the stated number of hours ahead', () => {
    const now = Date.parse('2026-09-07T12:00:00.000Z');
    const expiry = PendingCheckout.expiryFromNow(now);

    expect((expiry.getTime() - now) / (60 * 60 * 1000)).toBe(PENDING_CHECKOUT_TTL_HOURS);
  });

  /**
   * THE TTL INDEX — and the distinction from the chunk 1.3 warning.
   *
   * 1.3 recorded that a TTL index must never sit on `refreshTokenExpiresAt`,
   * because that field lives ON the users record and TTL deletes the whole
   * document — every client and therapist account, silently. Here the document
   * IS the disposable thing, so deleting all of it is the intent.
   */
  it('has a TTL index on expiresAt and on nothing else', async () => {
    const indexes = await PendingCheckout.collection.indexes();
    const ttlIndexes = indexes.filter((index) => index.expireAfterSeconds !== undefined);

    expect(ttlIndexes).toHaveLength(1);
    expect(ttlIndexes[0].key).toEqual({ expiresAt: 1 });
    expect(ttlIndexes[0].expireAfterSeconds).toBe(0);
  });
});

describe('PendingCheckout — the answers stay put', () => {
  it('keeps the questionnaire out of toJSON', async () => {
    const created = await PendingCheckout.create(draft());
    const serialised = created.toJSON();

    expect(serialised.questionnaire).toBeUndefined();
    expect(serialised.__v).toBeUndefined();
    expect(JSON.stringify(serialised)).not.toContain('Anxiety');
  });

  it('stores a couple with both partners nested', async () => {
    const created = await PendingCheckout.create(
      draft({
        questionnaire: {
          type: 'couple',
          country: 'Netherlands',
          city: 'Utrecht',
          relationshipStatus: 'Married',
          concernTags: ['Marriage Issues'],
          therapistGenderPreference: 'no_preference',
          coupleData: {
            partner1: { name: 'Marta', age: 38, gender: 'female' },
            partner2: { name: 'Joris', age: 41, gender: 'male' },
          },
        },
      }),
    );

    const reloaded = await PendingCheckout.findById(created._id);
    expect(reloaded.questionnaire.coupleData.partner2.name).toBe('Joris');
  });

  it('is a collection of its own, separate from clientProfiles', () => {
    expect(PendingCheckout.collection.name).toBe('pendingcheckouts');
  });
});
