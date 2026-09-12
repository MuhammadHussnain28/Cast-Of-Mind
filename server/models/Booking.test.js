import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import { Booking } from './Booking.js';
import { BOOKING_STATUS } from '../constants/payments.js';
import { FUTURE_COLLECTIONS } from '../constants/adminStats.js';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';

beforeAll(async () => {
  await startMemoryMongo();
  // The partial unique index is enforced by MongoDB, not by a validator.
  await Booking.init();
});

afterEach(clearCollections);
afterAll(stopMemoryMongo);

const ids = () => ({
  clientId: new mongoose.Types.ObjectId(),
  therapistId: new mongoose.Types.ObjectId(),
});

const booking = (overrides = {}) => ({ ...ids(), ...overrides });

describe('Booking — creation and defaults', () => {
  it('creates an active booking and stamps matchedAt', async () => {
    const created = await Booking.create(booking());

    expect(created.status).toBe(BOOKING_STATUS.ACTIVE);
    expect(created.matchedAt).toBeInstanceOf(Date);
    expect(created.endedAt).toBeUndefined();
  });

  it('requires both a client and a therapist', async () => {
    await expect(Booking.create({})).rejects.toThrow();
    await expect(
      Booking.create({ clientId: new mongoose.Types.ObjectId() }),
    ).rejects.toThrow(/must have a therapist/);
  });

  it('rejects a status outside the list', async () => {
    await expect(Booking.create(booking({ status: 'paused' }))).rejects.toThrow(
      /Status must be one of/,
    );
  });

  // Chunk 4.4 reads this collection through the raw driver. A rename would make
  // the dashboard report 0 for ever, silently — the 5.1 precedent.
  it('pins the collection name the admin dashboard reads raw', () => {
    expect(Booking.collection.name).toBe(FUTURE_COLLECTIONS.bookings);
  });

  it('carries no updatedAt, because §10.5 does not define one', async () => {
    const created = await Booking.create(booking());
    expect(created.toJSON().updatedAt).toBeUndefined();
  });
});

describe('Booking — shape guards', () => {
  it('refuses to link a person to themselves', async () => {
    const id = new mongoose.Types.ObjectId();

    await expect(Booking.create({ clientId: id, therapistId: id })).rejects.toThrow(
      /cannot link a person to themselves/,
    );
  });

  it('refuses an ended booking with no end date', async () => {
    await expect(
      Booking.create(booking({ status: BOOKING_STATUS.ENDED })),
    ).rejects.toThrow(/must record when it ended/);
  });

  it('refuses an active booking that carries an end date', async () => {
    await expect(Booking.create(booking({ endedAt: new Date() }))).rejects.toThrow(
      /must not carry an end date/,
    );
  });

  it('accepts an ended booking with its end date', async () => {
    const created = await Booking.create(
      booking({ status: BOOKING_STATUS.ENDED, endedAt: new Date() }),
    );

    expect(created.status).toBe(BOOKING_STATUS.ENDED);
    expect(created.endedAt).toBeInstanceOf(Date);
  });
});

describe('Booking — one active booking per client', () => {
  it('refuses a second active booking for the same client', async () => {
    const clientId = new mongoose.Types.ObjectId();

    await Booking.create({ clientId, therapistId: new mongoose.Types.ObjectId() });

    await expect(
      Booking.create({ clientId, therapistId: new mongoose.Types.ObjectId() }),
    ).rejects.toMatchObject({ code: 11000 });

    expect(await Booking.countDocuments()).toBe(1);
  });

  it('allows a new booking once the previous one has ended', async () => {
    const clientId = new mongoose.Types.ObjectId();

    const first = await Booking.create({ clientId, therapistId: new mongoose.Types.ObjectId() });

    first.status = BOOKING_STATUS.ENDED;
    first.endedAt = new Date();
    await first.save();

    await Booking.create({ clientId, therapistId: new mongoose.Types.ObjectId() });

    expect(await Booking.countDocuments()).toBe(2);
    expect(await Booking.countDocuments({ clientId, status: BOOKING_STATUS.ACTIVE })).toBe(1);
  });

  it('does not restrict different clients', async () => {
    await Booking.create(booking());
    await Booking.create(booking());

    expect(await Booking.countDocuments()).toBe(2);
  });

  // §13: re-subscribing reuses the same booking so the chat history survives.
  // The index must not stand in the way of that.
  it('allows an ended booking to be reactivated', async () => {
    const created = await Booking.create(
      booking({ status: BOOKING_STATUS.ENDED, endedAt: new Date() }),
    );

    created.status = BOOKING_STATUS.ACTIVE;
    created.endedAt = undefined;
    await created.save();

    const reloaded = await Booking.findById(created._id);
    expect(reloaded.status).toBe(BOOKING_STATUS.ACTIVE);
    expect(reloaded.endedAt).toBeUndefined();
  });

  // One therapist genuinely has many clients — the index is on the client side
  // only, and getting that backwards would break the whole platform.
  it('allows one therapist to hold many active bookings', async () => {
    const therapistId = new mongoose.Types.ObjectId();

    await Booking.create({ clientId: new mongoose.Types.ObjectId(), therapistId });
    await Booking.create({ clientId: new mongoose.Types.ObjectId(), therapistId });
    await Booking.create({ clientId: new mongoose.Types.ObjectId(), therapistId });

    expect(await Booking.countDocuments({ therapistId, status: BOOKING_STATUS.ACTIVE })).toBe(3);
  });
});
