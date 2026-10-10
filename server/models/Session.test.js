import mongoose from 'mongoose';
import { Session } from './Session.js';
import { SESSION_STATUS, SESSION_NOTE_MAX } from '../constants/sessions.js';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';

const bookingId = new mongoose.Types.ObjectId();
const at = new Date('2026-07-15T14:00:00Z');

const base = (overrides = {}) => ({
  bookingId,
  scheduledAt: at,
  zoomLink: 'https://zoom.us/j/81234567890',
  ...overrides,
});

beforeAll(async () => {
  await startMemoryMongo();
  await Session.init();
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

afterEach(async () => {
  await clearCollections();
});

describe('the sessions schema', () => {
  it('stores the spec fields plus updatedAt, and no local time of any kind', async () => {
    const therapySession = await Session.create(base({ note: 'Bring the worksheet.' }));
    const raw = await mongoose.connection.db
      .collection('sessions')
      .findOne({ _id: therapySession._id });

    // 9.6 adds timeSetAt to every session: when the CURRENT time was set.
    expect(Object.keys(raw).sort()).toEqual(
      ['_id', '__v', 'bookingId', 'scheduledAt', 'timeSetAt', 'zoomLink', 'note', 'status',
        'createdAt', 'updatedAt'].sort(),
    );
    expect(raw.scheduledAt).toEqual(at);
    // The reminder records appear only once a reminder has actually been claimed.
    expect(raw.reminders).toBeUndefined();
  });

  it('defaults to scheduled', async () => {
    expect((await Session.create(base())).status).toBe(SESSION_STATUS.SCHEDULED);
  });

  it.each(['bookingId', 'scheduledAt', 'zoomLink'])('requires %s', async (field) => {
    await expect(Session.create(base({ [field]: undefined }))).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('refuses an unknown status', async () => {
    await expect(Session.create(base({ status: 'rescheduled' }))).rejects.toThrow(
      /Status must be one of/,
    );
  });

  it('refuses a link that is not Zoom or Meet, even when written directly', async () => {
    await expect(Session.create(base({ zoomLink: 'https://example.com/j/1' }))).rejects.toThrow(
      /Zoom or Google Meet/,
    );
  });

  it('refuses a note over the limit', async () => {
    await expect(
      Session.create(base({ note: 'x'.repeat(SESSION_NOTE_MAX + 1) })),
    ).rejects.toThrow(/characters or fewer/);
  });

  it('a cancelled session must say when, and only a cancelled one may', async () => {
    await expect(Session.create(base({ status: SESSION_STATUS.CANCELLED }))).rejects.toThrow(
      /record when it was cancelled/,
    );
    await expect(Session.create(base({ cancelledAt: new Date() }))).rejects.toThrow(
      /Only a cancelled session/,
    );
    const cancelled = await Session.create(
      base({ status: SESSION_STATUS.CANCELLED, cancelledAt: new Date() }),
    );
    expect(cancelled.status).toBe(SESSION_STATUS.CANCELLED);
  });

  it('indexes a booking by time, for both lists', async () => {
    const indexes = await Session.collection.indexes();
    expect(indexes.some((index) => index.key.bookingId === 1 && index.key.scheduledAt === 1)).toBe(
      true,
    );
  });

  it('the reminder sweep\'s query uses an index, not a collection scan (12.4)', async () => {
    await Session.create(base());
    const now = new Date();
    const plan = await Session.find({
      status: SESSION_STATUS.SCHEDULED,
      scheduledAt: { $gt: now, $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
    }).explain('queryPlanner');

    const winning = JSON.stringify(plan.queryPlanner.winningPlan);
    expect(winning).toContain('IXSCAN');
    expect(winning).not.toContain('COLLSCAN');
    expect(winning).toContain('status_1_scheduledAt_1');
  });
});
