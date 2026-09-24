import mongoose from 'mongoose';

const { Review } = await import('./Review.js');
const { startMemoryMongo, stopMemoryMongo } = await import('../test/mongoMemory.js');

const id = () => new mongoose.Types.ObjectId();
const base = () => ({
  bookingId: id(),
  clientId: id(),
  therapistId: id(),
  subscriptionId: id(),
  stars: 4,
});

beforeAll(async () => {
  await startMemoryMongo();
  await Review.init();
}, 120000);

afterAll(async () => {
  await stopMemoryMongo();
});

describe('the reviews model — §10.12', () => {
  test('STARS ARE MANDATORY', async () => {
    const withoutStars = base();
    delete withoutStars.stars;
    await expect(Review.create(withoutStars)).rejects.toThrow(/Choose a rating/);
  });

  test('stars are a whole number from 1 to 5', async () => {
    for (const stars of [0, 6, -1, 3.5]) {
      await expect(Review.create({ ...base(), stars })).rejects.toThrow();
    }
    for (const stars of [1, 5]) {
      await expect(Review.create({ ...base(), stars })).resolves.toBeDefined();
    }
  });

  test('WRITTEN WORDS ARE OPTIONAL', async () => {
    const review = await Review.create(base());
    expect(review.text).toBeUndefined();
  });

  test('an empty or whitespace-only answer is stored as no answer', async () => {
    const review = await Review.create({ ...base(), text: '   \n  ' });
    expect(review.text).toBeUndefined();
    expect((await Review.findById(review._id).lean()).text).toBeUndefined();
  });

  test('words are trimmed and capped', async () => {
    const review = await Review.create({ ...base(), text: '  She listened.  ' });
    expect(review.text).toBe('She listened.');
    await expect(Review.create({ ...base(), text: 'x'.repeat(2001) })).rejects.toThrow(/2000/);
  });

  test('ONE RATING PER SUBSCRIPTION — the index refuses a second', async () => {
    const first = base();
    await Review.create(first);
    await expect(
      Review.create({ ...base(), subscriptionId: first.subscriptionId }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  test('every relationship is required', async () => {
    for (const field of ['bookingId', 'clientId', 'therapistId', 'subscriptionId']) {
      const doc = base();
      delete doc[field];
      await expect(Review.create(doc)).rejects.toThrow();
    }
  });
});
