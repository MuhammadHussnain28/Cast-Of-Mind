import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import { ClientProfile } from './ClientProfile.js';
import {
  CONCERN_TAGS,
  CONCERN_TAGS_ASK_MIN,
  CONCERN_TAGS_MAX,
  CONCERN_TAGS_MIN,
  MAX_CLIENT_AGE,
  MIN_CLIENT_AGE,
  RELATIONSHIP_STATUSES,
} from '../constants/clientProfile.js';
import { FUTURE_COLLECTIONS } from '../constants/adminStats.js';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';

beforeAll(async () => {
  await startMemoryMongo();
  // unique: true is an INDEX, enforced by MongoDB on write, not a validator.
  // Without this the duplicate-userId test can pass for the wrong reason.
  await ClientProfile.init();
});

afterEach(clearCollections);
afterAll(stopMemoryMongo);

const individual = (overrides = {}) => ({
  userId: new mongoose.Types.ObjectId(),
  type: 'individual',
  country: 'Ireland',
  city: 'Galway',
  relationshipStatus: 'Single',
  concernTags: ['Anxiety', 'Sleep Issues or Insomnia', 'Stress'],
  therapistGenderPreference: 'no_preference',
  name: 'Aoife Byrne',
  age: 31,
  gender: 'female',
  ...overrides,
});

const couple = (overrides = {}) => ({
  userId: new mongoose.Types.ObjectId(),
  type: 'couple',
  country: 'Netherlands',
  city: 'Utrecht',
  relationshipStatus: 'Married',
  concernTags: ['Marriage Issues', 'Relationship Issues', 'Family Issues'],
  therapistGenderPreference: 'female',
  coupleData: {
    partner1: { name: 'Marta Kowalska', age: 38, gender: 'female' },
    partner2: { name: 'Joris de Vries', age: 41, gender: 'male' },
  },
  ...overrides,
});

/** The message from every failed path, so assertions read on one line. */
const errorOf = async (doc) => {
  try {
    await new ClientProfile(doc).validate();
    return null;
  } catch (error) {
    return error;
  }
};

describe('ClientProfile — the individual shape', () => {
  it('accepts a valid individual profile and stores it', async () => {
    const saved = await ClientProfile.create(individual());

    expect(saved.type).toBe('individual');
    expect(saved.name).toBe('Aoife Byrne');
    expect(saved.age).toBe(31);
    expect(saved.concernTags).toHaveLength(3);
    expect(saved.createdAt).toBeInstanceOf(Date);
  });

  it('has no coupleData at all, not an empty object', async () => {
    const saved = await ClientProfile.create(individual());
    expect(saved.coupleData).toBeUndefined();

    const raw = await mongoose.connection
      .collection(FUTURE_COLLECTIONS.clientProfiles)
      .findOne({ _id: saved._id });
    expect('coupleData' in raw).toBe(false);
  });

  it.each(['name', 'age', 'gender'])('rejects an individual with no %s', async (field) => {
    const error = await errorOf(individual({ [field]: undefined }));
    expect(error.errors[field]).toBeDefined();
  });

  it('REJECTS an individual carrying couple details', async () => {
    // A document holding both shapes is one where nobody can say which is true.
    const error = await errorOf(
      individual({
        coupleData: {
          partner1: { name: 'A', age: 30, gender: 'male' },
          partner2: { name: 'B', age: 30, gender: 'female' },
        },
      }),
    );
    expect(error.errors.coupleData.message).toMatch(/must not carry couple details/i);
  });
});

describe('ClientProfile — the couple shape', () => {
  it('accepts a valid couple profile with both partners nested', async () => {
    const saved = await ClientProfile.create(couple());

    expect(saved.type).toBe('couple');
    expect(saved.coupleData.partner1.name).toBe('Marta Kowalska');
    expect(saved.coupleData.partner2.age).toBe(41);
    // One profile, not two. §6: a couple shares one account.
    expect(await ClientProfile.countDocuments()).toBe(1);
  });

  it('rejects a couple with no coupleData', async () => {
    const error = await errorOf(couple({ coupleData: undefined }));
    expect(error.errors.coupleData).toBeDefined();
  });

  it('rejects a couple missing partner 2', async () => {
    const error = await errorOf(
      couple({ coupleData: { partner1: { name: 'Marta', age: 38, gender: 'female' } } }),
    );
    expect(error.errors['coupleData.partner2']).toBeDefined();
  });

  it.each(['name', 'age', 'gender'])(
    'rejects a partner with no %s',
    async (field) => {
      const data = couple();
      delete data.coupleData.partner2[field];
      const error = await errorOf(data);
      expect(error.errors[`coupleData.partner2.${field}`]).toBeDefined();
    },
  );

  it('REJECTS a couple carrying individual details', async () => {
    const error = await errorOf(couple({ name: 'Marta', age: 38, gender: 'female' }));
    expect(error.errors.type.message).toMatch(/must not carry individual details/i);
  });
});

describe('ClientProfile — concern tags, the field matching runs on', () => {
  it(`accepts the storage floor of ${CONCERN_TAGS_MIN}`, async () => {
    const saved = await ClientProfile.create(individual({ concernTags: ['Grief'] }));
    expect(saved.concernTags).toEqual(['Grief']);
  });

  it(`accepts the ceiling of ${CONCERN_TAGS_MAX}`, async () => {
    const tags = CONCERN_TAGS.slice(0, CONCERN_TAGS_MAX);
    const saved = await ClientProfile.create(individual({ concernTags: tags }));
    expect(saved.concernTags).toHaveLength(CONCERN_TAGS_MAX);
  });

  it('accepts every tag on the master list', async () => {
    for (const tag of CONCERN_TAGS) {
      const error = await errorOf(individual({ concernTags: [tag] }));
      expect(error).toBeNull();
    }
  });

  it('rejects an empty selection', async () => {
    const error = await errorOf(individual({ concernTags: [] }));
    expect(error.errors.concernTags).toBeDefined();
  });

  it(`rejects more than ${CONCERN_TAGS_MAX}`, async () => {
    const error = await errorOf(individual({ concernTags: CONCERN_TAGS.slice(0, 5) }));
    expect(error.errors.concernTags).toBeDefined();
  });

  it('REJECTS duplicates — three copies of one tag is not three concerns', async () => {
    const error = await errorOf(individual({ concernTags: ['Anxiety', 'Anxiety', 'Anxiety'] }));
    expect(error.errors.concernTags).toBeDefined();
  });

  it('rejects a tag that is not on the master list', async () => {
    const error = await errorOf(individual({ concernTags: ['Burnout'] }));
    expect(error.errors.concernTags).toBeDefined();
  });

  it.each([
    ['lowercased', 'anxiety'],
    ['trailing space', 'Anxiety '],
    ['re-punctuated', 'ADHD and Attention Issues'],
  ])('rejects a %s variant — it would match no therapist for ever', async (_label, tag) => {
    const error = await errorOf(individual({ concernTags: [tag] }));
    expect(error.errors.concernTags).toBeDefined();
  });

  it('asks for more on screen than it stores, and the ask sits inside the range', () => {
    expect(CONCERN_TAGS_MIN).toBeLessThan(CONCERN_TAGS_ASK_MIN);
    expect(CONCERN_TAGS_ASK_MIN).toBeLessThanOrEqual(CONCERN_TAGS_MAX);
  });
});

describe('ClientProfile — the constrained values', () => {
  it.each(['male', 'female', 'no_preference'])(
    'accepts therapist gender preference "%s"',
    async (value) => {
      const error = await errorOf(individual({ therapistGenderPreference: value }));
      expect(error).toBeNull();
    },
  );

  it('rejects an unknown therapist gender preference', async () => {
    const error = await errorOf(individual({ therapistGenderPreference: 'any' }));
    expect(error.errors.therapistGenderPreference).toBeDefined();
  });

  it('requires a therapist gender preference — there is no silent default', async () => {
    const error = await errorOf(individual({ therapistGenderPreference: undefined }));
    expect(error.errors.therapistGenderPreference).toBeDefined();
  });

  it.each(RELATIONSHIP_STATUSES)('accepts relationship status "%s"', async (value) => {
    const error = await errorOf(individual({ relationshipStatus: value }));
    expect(error).toBeNull();
  });

  it('rejects a relationship status off the list', async () => {
    const error = await errorOf(individual({ relationshipStatus: 'Complicated' }));
    expect(error.errors.relationshipStatus).toBeDefined();
  });

  it('rejects an unknown type', async () => {
    const error = await errorOf(individual({ type: 'family' }));
    expect(error.errors.type).toBeDefined();
  });

  it.each(['male', 'female', 'other', 'prefer_not_to_say'])(
    'accepts gender "%s"',
    async (value) => {
      const error = await errorOf(individual({ gender: value }));
      expect(error).toBeNull();
    },
  );

  it.each([
    ['country', undefined],
    ['city', undefined],
    ['userId', undefined],
  ])('rejects a profile with no %s', async (field) => {
    const error = await errorOf(individual({ [field]: undefined }));
    expect(error.errors[field]).toBeDefined();
  });
});

describe('ClientProfile — age bounds', () => {
  // NO 18+ RESTRICTION, by decision 2026-09-05. §10.2 sets no minimum and one
  // was deliberately not invented. These are sanity bounds only.
  it.each([MIN_CLIENT_AGE, 17, 42, MAX_CLIENT_AGE])('accepts age %s', async (age) => {
    const error = await errorOf(individual({ age }));
    expect(error).toBeNull();
  });

  it.each([0, -1, MAX_CLIENT_AGE + 1])('rejects age %s', async (age) => {
    const error = await errorOf(individual({ age }));
    expect(error.errors.age).toBeDefined();
  });

  it('rejects a fractional age', async () => {
    const error = await errorOf(individual({ age: 30.5 }));
    expect(error.errors.age).toBeDefined();
  });

  it('applies the same bounds to each partner', async () => {
    const data = couple();
    data.coupleData.partner2.age = MAX_CLIENT_AGE + 1;
    const error = await errorOf(data);
    expect(error.errors['coupleData.partner2.age']).toBeDefined();
  });
});

describe('ClientProfile — one profile per account', () => {
  it('refuses a second profile for the same user', async () => {
    const userId = new mongoose.Types.ObjectId();
    await ClientProfile.create(individual({ userId }));

    await expect(ClientProfile.create(couple({ userId }))).rejects.toMatchObject({ code: 11000 });
  });
});

describe('ClientProfile — what must NOT be on this collection', () => {
  it('never stores an email — that belongs to the users record', async () => {
    const saved = await ClientProfile.create(individual({ email: 'aoife@example.com' }));

    expect(saved.email).toBeUndefined();
    const raw = await mongoose.connection
      .collection(FUTURE_COLLECTIONS.clientProfiles)
      .findOne({ _id: saved._id });
    expect('email' in raw).toBe(false);
  });

  it('never stores a password or hash', async () => {
    const saved = await ClientProfile.create(
      individual({ password: 'not-a-field', passwordHash: 'not-a-field' }),
    );

    const raw = await mongoose.connection
      .collection(FUTURE_COLLECTIONS.clientProfiles)
      .findOne({ _id: saved._id });
    expect('password' in raw).toBe(false);
    expect('passwordHash' in raw).toBe(false);
  });

  it('drops __v from toJSON', async () => {
    const saved = await ClientProfile.create(individual());
    expect(saved.toJSON().__v).toBeUndefined();
  });
});

describe('ClientProfile — the collection name the dashboard already depends on', () => {
  // Chunk 4.4 reads this collection through the raw driver because it did not
  // exist yet, and warns that a name mismatch makes the dashboard report 0 for
  // ever — silently, which is far worse than an error. This pins the two together.
  it('is exactly what constants/adminStats.js expects Mongoose to pluralise to', () => {
    expect(ClientProfile.collection.name).toBe(FUTURE_COLLECTIONS.clientProfiles);
  });
});

describe('ClientProfile — the saved timezone (9.2)', () => {
  it('has none until the browser saves one', async () => {
    const profile = await ClientProfile.create(individual());
    expect(profile.timezone).toBeUndefined();
  });

  it('keeps a real IANA zone as given', async () => {
    const profile = await ClientProfile.create(individual({ timezone: 'Asia/Kolkata' }));
    expect(profile.timezone).toBe('Asia/Kolkata');
  });

  it('refuses a made-up zone', async () => {
    await expect(ClientProfile.create(individual({ timezone: 'Mars/Olympus' }))).rejects.toThrow(
      /real IANA timezone/,
    );
  });
});
