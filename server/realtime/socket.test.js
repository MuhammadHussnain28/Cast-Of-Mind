import { jest } from '@jest/globals';
import http from 'node:http';
import mongoose from 'mongoose';
import { io as ioClient } from 'socket.io-client';
import app from '../app.js';
import { User } from '../models/User.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { Booking } from '../models/Booking.js';
import { Subscription } from '../models/Subscription.js';
import { Message } from '../models/Message.js';
import { hashPassword } from '../utils/password.js';
import { signAccessToken } from '../utils/tokens.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { SUBSCRIPTION_STATUS, SUBSCRIPTION_AMOUNT_MINOR } from '../constants/payments.js';
import { SOCKET_EVENTS, TYPING_TIMEOUT_MS, bookingRoom } from '../constants/socket.js';
import { createSocketServer } from './socketServer.js';
import { setSocketServer, getSocketServer, emitMessage } from './emitter.js';
import { postSessionNotice } from '../services/chat.service.js';
import { startMemoryMongo, stopMemoryMongo } from '../test/mongoMemory.js';

const DAY = 24 * 60 * 60 * 1000;

let httpServer;
let io;
let port;

const ids = {};
const tokens = {};
let bookingA;
let bookingB;
const openSockets = [];

/** Connect a client and resolve once it is actually in. */
function connect(token, options = {}) {
  return new Promise((resolve, reject) => {
    const socket = ioClient(`http://127.0.0.1:${port}`, {
      auth: token === null ? {} : { token },
      transports: ['websocket'],
      reconnection: false,
      forceNew: true,
      ...options,
    });

    openSockets.push(socket);

    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (error) => reject(error));
  });
}

/** Wait for one event, or fail after a bounded time. */
function waitFor(socket, event, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${event}`)), timeout);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

/** Assert an event does NOT arrive within a window. */
function expectNoEvent(socket, event, window = 350) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, window);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      reject(new Error(`unexpectedly received ${event}: ${JSON.stringify(payload)}`));
    });
  });
}

const emit = (socket, event, payload) =>
  new Promise((resolve) => socket.emit(event, payload, resolve));

async function makeTherapistProfile(userId, firstName) {
  return TherapistProfile.create({
    userId,
    applicationId: new mongoose.Types.ObjectId(),
    title: 'Dr.',
    firstName,
    lastName: 'Okonkwo',
    gender: 'female',
    dateOfBirth: new Date('1985-02-02'),
    photoUrl: 'https://res.cloudinary.com/demo/image/upload/t.jpg',
    streetAddress: '5 Quay Street',
    city: 'Porto',
    stateProvince: 'Porto',
    zipPostal: '4000',
    country: 'PT',
    timezone: 'Europe/Lisbon',
    therapistType: 'Clinical Psychologist',
    credentialType: 'Diploma/Degree',
    credentialInitials: 'PhD',
    yearsExperience: 9,
    educationSummary: 'PhD in clinical psychology.',
    currentWorkSituation: 'Private practice.',
    languages: ['English'],
    specialtyTags: ['Anxiety', 'Grief', 'Stress'],
    treatmentOrientations: ['CBT'],
    bio: 'I work with adults on anxiety and grief.',
    licensingStatus: 'Licensed in Portugal.',
    disciplinaryActions: false,
    malpracticeInsurance: true,
    workingHours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: false, start: '', end: '' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '', end: '' },
      sunday: { enabled: false, start: '', end: '' },
      note: '',
    },
    certificateUrl1: 'https://res.cloudinary.com/demo/image/authenticated/s--a--/c.pdf',
    certificatePublicId1: 'cast-of-mind/certs/a',
  });
}

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([
    User.init(),
    ClientProfile.init(),
    TherapistProfile.init(),
    Booking.init(),
    Subscription.init(),
    Message.init(),
  ]);

  const passwordHash = await hashPassword('correct-horse-battery-staple');

  const make = async (key, email, role) => {
    const user = await User.create({ email, passwordHash, role, status: USER_STATUS.ACTIVE });
    ids[key] = user._id;
    tokens[key] = signAccessToken({ userId: String(user._id), role });
  };

  await make('clientA', 'sock-client-a@example.com', ROLES.CLIENT);
  await make('therapistA', 'sock-therapist-a@example.com', ROLES.THERAPIST);
  await make('clientB', 'sock-client-b@example.com', ROLES.CLIENT);
  await make('therapistB', 'sock-therapist-b@example.com', ROLES.THERAPIST);
  await make('admin', 'sock-admin@example.com', ROLES.ADMIN);

  await ClientProfile.create({
    userId: ids.clientA,
    type: 'individual',
    name: 'Rosa',
    age: 34,
    gender: 'female',
    country: 'IE',
    city: 'Galway',
    relationshipStatus: 'Single',
    concernTags: ['Anxiety'],
    therapistGenderPreference: 'no_preference',
  });
  await ClientProfile.create({
    userId: ids.clientB,
    type: 'individual',
    name: 'Sam',
    age: 29,
    gender: 'male',
    country: 'NL',
    city: 'Utrecht',
    relationshipStatus: 'Single',
    concernTags: ['Stress'],
    therapistGenderPreference: 'no_preference',
  });

  await makeTherapistProfile(ids.therapistA, 'Priya');
  await makeTherapistProfile(ids.therapistB, 'Nadia');

  bookingA = await Booking.create({ clientId: ids.clientA, therapistId: ids.therapistA });
  bookingB = await Booking.create({ clientId: ids.clientB, therapistId: ids.therapistB });

  for (const [clientKey, booking] of [['clientA', bookingA], ['clientB', bookingB]]) {
    await Subscription.create({
      bookingId: booking._id,
      clientId: ids[clientKey],
      status: SUBSCRIPTION_STATUS.ACTIVE,
      amount: SUBSCRIPTION_AMOUNT_MINOR,
      startDate: new Date(Date.now() - 5 * DAY),
      currentPeriodEnd: new Date(Date.now() + 25 * DAY),
      nextBillingDate: new Date(Date.now() + 25 * DAY),
    });
  }

  httpServer = http.createServer(app);
  io = createSocketServer(httpServer);

  await new Promise((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => {
      port = httpServer.address().port;
      resolve();
    });
  });
}, 60000);

afterAll(async () => {
  openSockets.forEach((socket) => socket.close());
  if (io) await new Promise((resolve) => io.close(resolve));
  if (httpServer?.listening) await new Promise((resolve) => httpServer.close(resolve));
  await stopMemoryMongo();
});

afterEach(async () => {
  while (openSockets.length) openSockets.pop()?.close();
  await Message.deleteMany({});
  await Subscription.updateMany({}, { $set: { status: SUBSCRIPTION_STATUS.ACTIVE } });
  // The emitter is global; every test must find it attached.
  setSocketServer(io);
});

// ---------------------------------------------------------------------------
// Handshake authentication
// ---------------------------------------------------------------------------

describe('socket authentication', () => {
  it('accepts a valid access token', async () => {
    const socket = await connect(tokens.clientA);
    expect(socket.connected).toBe(true);
  });

  it('refuses a connection with no token', async () => {
    await expect(connect(null)).rejects.toThrow(/unauthenticated/i);
  });

  it('refuses a malformed token', async () => {
    await expect(connect('not-a-jwt')).rejects.toThrow(/unauthenticated/i);
  });

  it('refuses a token forged with another secret', async () => {
    // Signed by something that is not our secret — the signature will not verify.
    const forged =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ4Iiwicm9sZSI6ImFkbWluIn0.' +
      'ZmFrZS1zaWduYXR1cmUtdGhhdC13aWxsLW5vdC12ZXJpZnk';
    await expect(connect(forged)).rejects.toThrow(/unauthenticated/i);
  });

  it('refuses an already-expired token at the handshake', async () => {
    const expired = signAccessToken({ userId: String(ids.clientA), role: ROLES.CLIENT, });
    // Sign one that is already past its life by going through jsonwebtoken directly.
    const jwt = (await import('jsonwebtoken')).default;
    const stale = jwt.sign(
      { sub: String(ids.clientA), role: ROLES.CLIENT },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: -10 },
    );
    expect(typeof expired).toBe('string');
    await expect(connect(stale)).rejects.toThrow(/unauthenticated/i);
  });

  it('REFUSES THE ADMIN — §11: no admin conversation viewer, on any transport', async () => {
    await expect(connect(tokens.admin)).rejects.toThrow(/not permitted/i);
  });

  it('refuses a client whose subscription has ended', async () => {
    await Subscription.updateOne(
      { clientId: ids.clientA },
      { $set: { status: SUBSCRIPTION_STATUS.EXPIRED } },
    );
    await expect(connect(tokens.clientA)).rejects.toThrow(/subscription/i);
  });

  it('still connects the THERAPIST when that client has expired', async () => {
    await Subscription.updateOne(
      { clientId: ids.clientA },
      { $set: { status: SUBSCRIPTION_STATUS.EXPIRED } },
    );
    const socket = await connect(tokens.therapistA);
    expect(socket.connected).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

describe('rooms are assigned by the server', () => {
  it('puts both parties of a booking in the same room', async () => {
    await connect(tokens.clientA);
    await connect(tokens.therapistA);

    const room = io.sockets.adapter.rooms.get(bookingRoom(bookingA._id));
    expect(room?.size).toBe(2);
  });

  it('never puts a user in a booking room that is not theirs', async () => {
    await connect(tokens.clientA);

    const foreign = io.sockets.adapter.rooms.get(bookingRoom(bookingB._id));
    expect(foreign?.size ?? 0).toBe(0);
  });

  it('joins a therapist to every booking they hold, for cross-client alerts', async () => {
    const extraClient = await User.create({
      email: `sock-extra-${Date.now()}@example.com`,
      passwordHash: await hashPassword('correct-horse-battery-staple'),
      role: ROLES.CLIENT,
      status: USER_STATUS.ACTIVE,
    });
    const second = await Booking.create({
      clientId: extraClient._id,
      therapistId: ids.therapistA,
    });

    await connect(tokens.therapistA);

    expect(io.sockets.adapter.rooms.get(bookingRoom(bookingA._id))?.size).toBe(1);
    expect(io.sockets.adapter.rooms.get(bookingRoom(second._id))?.size).toBe(1);

    await Booking.deleteOne({ _id: second._id });
    await User.deleteOne({ _id: extraClient._id });
  });
});

// ---------------------------------------------------------------------------
// Delivery — the heart of the chunk
// ---------------------------------------------------------------------------

describe('message delivery', () => {
  it('delivers a message to the other party in the room', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    const incoming = waitFor(therapist, SOCKET_EVENTS.MESSAGE_NEW);
    const ack = await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'I have not been sleeping for weeks now.',
    });

    expect(ack.data.text).toBe('I have not been sleeping for weeks now.');
    const received = await incoming;
    expect(received.text).toBe('I have not been sleeping for weeks now.');
    expect(received.senderRole).toBe(ROLES.CLIENT);
  });

  /**
   * §14's central rule, tested DETERMINISTICALLY rather than by racing.
   *
   * The obvious version — listen for the event, then look the row up — proves
   * nothing: the network round trip to the client and back takes milliseconds,
   * by which time the write has landed whatever order the code used. It passed
   * against a deliberately inverted implementation, which is how this was
   * caught.
   *
   * Instead both sides are marked as they happen and the ORDER is asserted.
   * `save` is patched rather than `create`, so a future refactor to
   * `new Message().save()` is still covered.
   */
  it('PERSISTS BEFORE IT EMITS — asserted by order, not by timing', async () => {
    const order = [];
    const markSaved = () => {
      if (!order.includes('saved')) order.push('saved');
    };

    const realIo = getSocketServer();
    const originalCreate = Message.create;
    const originalSave = Message.prototype.save;

    // BOTH write paths are patched. Mongoose's `Model.create` does not go
    // through the document prototype's `save`, so patching only one of them
    // silently records nothing — which is exactly how the first version of this
    // test passed against an inverted implementation.
    Message.create = async function patchedCreate(...args) {
      const result = await originalCreate.apply(this, args);
      markSaved();
      return result;
    };
    Message.prototype.save = async function patchedSave(...args) {
      const result = await originalSave.apply(this, args);
      markSaved();
      return result;
    };

    setSocketServer({
      to: () => ({
        emit: (event) => {
          if (event === SOCKET_EVENTS.MESSAGE_NEW) order.push('emitted');
        },
      }),
      // The emitter puts both participants into the booking room before it
      // emits (8.3), so the fake has to model that call as well. Joining a room
      // is not delivery, so it records nothing in the order.
      in: () => ({ socketsJoin: () => {} }),
    });

    try {
      const { sendMessage } = await import('../services/chat.service.js');
      await sendMessage(
        String(bookingA._id),
        { id: String(ids.clientA), role: ROLES.CLIENT },
        'Persisted first, and long enough to be an opening.',
      );
    } finally {
      Message.create = originalCreate;
      Message.prototype.save = originalSave;
      setSocketServer(realIo);
    }

    expect(order).toEqual(['saved', 'emitted']);
    expect(
      await Message.countDocuments({ text: 'Persisted first, and long enough to be an opening.' }),
    ).toBe(1);
  });

  it('delivers the persisted row to the other party', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    const seenInDb = new Promise((resolve) => {
      therapist.once(SOCKET_EVENTS.MESSAGE_NEW, async (payload) => {
        resolve(await Message.findById(payload.id));
      });
    });

    await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'Persisted first, and long enough to open.',
    });

    const row = await seenInDb;
    expect(row).not.toBeNull();
    expect(row.text).toBe('Persisted first, and long enough to open.');
  });

  it('NEVER LEAKS A MESSAGE INTO ANOTHER BOOKING\'S ROOM', async () => {
    const clientA = await connect(tokens.clientA);
    const clientB = await connect(tokens.clientB);

    const nothingForB = expectNoEvent(clientB, SOCKET_EVENTS.MESSAGE_NEW);

    await emit(clientA, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'Only for booking A, long enough to open.',
    });

    await expect(nothingForB).resolves.toBeUndefined();
  });

  it('refuses a send into a booking the sender does not belong to', async () => {
    const clientA = await connect(tokens.clientA);

    const ack = await emit(clientA, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingB._id),
      text: 'Sneaking in.',
    });

    expect(ack.error.code).toBe('CONVERSATION_NOT_FOUND');
    expect(await Message.countDocuments({ bookingId: bookingB._id })).toBe(0);
  });

  it('reaches the sender\'s own other tab', async () => {
    const tabOne = await connect(tokens.clientA);
    const tabTwo = await connect(tokens.clientA);

    const onSecondTab = waitFor(tabTwo, SOCKET_EVENTS.MESSAGE_NEW);
    await emit(tabOne, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'Two tabs open, long enough to open a thread.',
    });

    expect((await onSecondTab).text).toBe('Two tabs open, long enough to open a thread.');
  });

  it('carries no viewer-relative `mine` flag over the socket', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    const incoming = waitFor(therapist, SOCKET_EVENTS.MESSAGE_NEW);
    await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'No mine flag, and long enough to open.',
    });

    const received = await incoming;
    expect(received.mine).toBeUndefined();
    expect(received.senderRole).toBe(ROLES.CLIENT);
  });

  it('echoes clientMessageId on BOTH the ack and the emit, so every tab dedupes', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    const incoming = waitFor(therapist, SOCKET_EVENTS.MESSAGE_NEW);
    const ack = await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'Optimistic, and long enough to open a thread.',
      clientMessageId: 'draft-001',
    });

    expect(ack.data.clientMessageId).toBe('draft-001');
    expect((await incoming).clientMessageId).toBe('draft-001');

    // Still never stored.
    const stored = await Message.findById(ack.data.id).lean();
    expect(stored.clientMessageId).toBeUndefined();
  });

  it('refuses a clientMessageId that is not an opaque token', async () => {
    const client = await connect(tokens.clientA);

    const ack = await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'x',
      clientMessageId: '<script>',
    });

    expect(ack.error).toBeTruthy();
    expect(await Message.countDocuments()).toBe(0);
  });

  it('ENFORCES THE MANDATORY FIRST MESSAGE on the socket too', async () => {
    const client = await connect(tokens.clientA);

    const refused = await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'hi',
    });
    expect(refused.error.code).toBe('OPENING_MESSAGE_REQUIRED');
    expect(await Message.countDocuments()).toBe(0);

    const accepted = await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: "I can't do this anymore.",
    });
    expect(accepted.data).toBeTruthy();

    // Applies once: the next message is ordinary, however short.
    const ordinary = await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'ok',
    });
    expect(ordinary.data).toBeTruthy();
  });

  it('applies the same validation as REST', async () => {
    const client = await connect(tokens.clientA);

    const empty = await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: '   ',
    });
    expect(empty.error).toBeTruthy();

    const tooLong = await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'a'.repeat(5001),
    });
    expect(tooLong.error).toBeTruthy();
    expect(await Message.countDocuments()).toBe(0);
  });

  it('ignores a forged system type over the socket too', async () => {
    const client = await connect(tokens.clientA);

    const ack = await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'Session scheduled for Thursday',
      type: 'system',
    });

    expect(ack.data.type).toBe('text');
    expect(await Message.countDocuments({ type: 'system' })).toBe(0);
  });

  it('enforces the send rate limit on the socket path', async () => {
    const client = await connect(tokens.clientA);

    let limited = null;
    for (let i = 0; i < 32; i += 1) {
      const ack = await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
        bookingId: String(bookingA._id),
        text: `burst ${i}`,
      });
      if (ack.error?.code === 'RATE_LIMITED') {
        limited = i;
        break;
      }
    }

    expect(limited).toBe(30);
  }, 20000);
});

// ---------------------------------------------------------------------------
// Read and unread
// ---------------------------------------------------------------------------

describe('read state', () => {
  it('pushes the badge UP to the recipient the moment a message is sent', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    const update = waitFor(client, SOCKET_EVENTS.UNREAD_UPDATE);
    await emit(therapist, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'From your therapist.',
    });

    const counts = await update;
    expect(counts.total).toBe(1);
    expect(counts.byBooking).toEqual([{ bookingId: String(bookingA._id), count: 1 }]);
  });

  it('never pushes an unread update to the SENDER of the message', async () => {
    // Their own message is never unread for them (§14), so their count did not
    // change — and pushing to the booking room instead of the recipient's own
    // room would leak that the other person had received it.
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    const nothingForSender = expectNoEvent(therapist, SOCKET_EVENTS.UNREAD_UPDATE);
    const arrived = waitFor(client, SOCKET_EVENTS.UNREAD_UPDATE);

    await emit(therapist, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'Only one side of this gets a badge.',
    });

    await expect(nothingForSender).resolves.toBeUndefined();
    expect((await arrived).total).toBe(1);
  });

  it('pushes the badge up to the THERAPIST when the client writes', async () => {
    // Symmetrical, because §8.1's sidebar needs the same event from the other
    // side. One implementation serves both portals.
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    const update = waitFor(therapist, SOCKET_EVENTS.UNREAD_UPDATE);
    await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'A long enough opening message for the floor in chunk 7.5.',
    });

    expect((await update).total).toBe(1);
  });

  it('counts up as messages accumulate, and never counts the reader own', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    for (const text of ['One.', 'Two.', 'Three.']) {
      const update = waitFor(client, SOCKET_EVENTS.UNREAD_UPDATE);
      await emit(therapist, SOCKET_EVENTS.MESSAGE_SEND, {
        bookingId: String(bookingA._id),
        text,
      });
      await update;
    }

    // The client replies. Their own message must not raise their own badge.
    const therapistUpdate = waitFor(therapist, SOCKET_EVENTS.UNREAD_UPDATE);
    await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'My own reply, which is never unread for me.',
    });
    await therapistUpdate;

    const ack = await emit(client, SOCKET_EVENTS.CONVERSATION_SYNC, {
      bookingId: String(bookingA._id),
    });
    expect(ack.data.data).toHaveLength(4);
  });

  it('reaches every tab the recipient has open, not just one', async () => {
    const tabOne = await connect(tokens.clientA);
    const tabTwo = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    const onOne = waitFor(tabOne, SOCKET_EVENTS.UNREAD_UPDATE);
    const onTwo = waitFor(tabTwo, SOCKET_EVENTS.UNREAD_UPDATE);

    await emit(therapist, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'Both tabs should learn about this.',
    });

    expect((await onOne).total).toBe(1);
    expect((await onTwo).total).toBe(1);
  });

  it('never reaches someone outside the booking', async () => {
    const outsider = await connect(tokens.clientB);
    const therapist = await connect(tokens.therapistA);

    const nothing = expectNoEvent(outsider, SOCKET_EVENTS.UNREAD_UPDATE);
    await emit(therapist, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'Not for booking B at all.',
    });

    await expect(nothing).resolves.toBeUndefined();
  });

  it('pushes a live unread update to the reader when they mark read', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    // Wait out the send's own push first, so the two transitions cannot race.
    const raised = waitFor(client, SOCKET_EVENTS.UNREAD_UPDATE);
    await emit(therapist, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'From your therapist.',
    });
    expect((await raised).total).toBe(1);

    const cleared = waitFor(client, SOCKET_EVENTS.UNREAD_UPDATE);
    const ack = await emit(client, SOCKET_EVENTS.MESSAGE_READ, {
      bookingId: String(bookingA._id),
    });

    expect(ack.data.marked).toBe(1);
    expect((await cleared).total).toBe(0);
  });

  it('does not tell the SENDER their message was read', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    const raised = waitFor(client, SOCKET_EVENTS.UNREAD_UPDATE);
    await emit(therapist, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'Read receipts are deliberately absent.',
    });
    await raised;

    const nothingForTherapist = expectNoEvent(therapist, SOCKET_EVENTS.UNREAD_UPDATE);
    await emit(client, SOCKET_EVENTS.MESSAGE_READ, { bookingId: String(bookingA._id) });

    await expect(nothingForTherapist).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Reconnection
// ---------------------------------------------------------------------------

describe('reconnection', () => {
  it('fills exactly the gap missed while disconnected', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'before the drop',
    });

    // Whatever the client holds at the moment it goes away.
    const held = await emit(client, SOCKET_EVENTS.CONVERSATION_SYNC, {
      bookingId: String(bookingA._id),
    });
    const cursor = held.data.meta.syncCursor;
    client.close();

    await emit(therapist, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'missed one',
    });
    await emit(therapist, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'missed two',
    });

    const back = await connect(tokens.clientA);
    const sync = await emit(back, SOCKET_EVENTS.CONVERSATION_SYNC, {
      bookingId: String(bookingA._id),
      after: cursor,
    });

    expect(sync.data.data.map((m) => m.text)).toEqual(['missed one', 'missed two']);
  });

  it('refuses a sync for a booking that is not the caller\'s', async () => {
    const clientA = await connect(tokens.clientA);
    const ack = await emit(clientA, SOCKET_EVENTS.CONVERSATION_SYNC, {
      bookingId: String(bookingB._id),
    });
    expect(ack.error.code).toBe('CONVERSATION_NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// Typing — ephemeral, symmetrical, zero database writes
// ---------------------------------------------------------------------------

describe('the typing indicator', () => {
  it('reaches the other party', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    const typing = waitFor(therapist, SOCKET_EVENTS.TYPING_START);
    client.emit(SOCKET_EVENTS.TYPING_START, { bookingId: String(bookingA._id) });

    const payload = await typing;
    expect(payload.senderRole).toBe(ROLES.CLIENT);
    expect(payload.bookingId).toBe(String(bookingA._id));
  });

  it('is SYMMETRICAL — the therapist typing reaches the client', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    const typing = waitFor(client, SOCKET_EVENTS.TYPING_START);
    therapist.emit(SOCKET_EVENTS.TYPING_START, { bookingId: String(bookingA._id) });

    expect((await typing).senderRole).toBe(ROLES.THERAPIST);
  });

  it('is never echoed back to the person typing', async () => {
    const client = await connect(tokens.clientA);
    await connect(tokens.therapistA);

    const noEcho = expectNoEvent(client, SOCKET_EVENTS.TYPING_START);
    client.emit(SOCKET_EVENTS.TYPING_START, { bookingId: String(bookingA._id) });

    await expect(noEcho).resolves.toBeUndefined();
  });

  it('never crosses into another booking', async () => {
    const clientA = await connect(tokens.clientA);
    const clientB = await connect(tokens.clientB);

    const nothing = expectNoEvent(clientB, SOCKET_EVENTS.TYPING_START);
    clientA.emit(SOCKET_EVENTS.TYPING_START, { bookingId: String(bookingA._id) });

    await expect(nothing).resolves.toBeUndefined();
  });

  it('is ignored for a booking the sender does not belong to', async () => {
    const clientA = await connect(tokens.clientA);
    const clientB = await connect(tokens.clientB);

    const nothing = expectNoEvent(clientB, SOCKET_EVENTS.TYPING_START);
    clientA.emit(SOCKET_EVENTS.TYPING_START, { bookingId: String(bookingB._id) });

    await expect(nothing).resolves.toBeUndefined();
  });

  it('stops on request', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    client.emit(SOCKET_EVENTS.TYPING_START, { bookingId: String(bookingA._id) });
    await waitFor(therapist, SOCKET_EVENTS.TYPING_START);

    const stopped = waitFor(therapist, SOCKET_EVENTS.TYPING_STOP);
    client.emit(SOCKET_EVENTS.TYPING_STOP, { bookingId: String(bookingA._id) });

    expect((await stopped).bookingId).toBe(String(bookingA._id));
  });

  it('AUTO-STOPS, so a dropped connection cannot leave "typing…" for ever', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    client.emit(SOCKET_EVENTS.TYPING_START, { bookingId: String(bookingA._id) });
    await waitFor(therapist, SOCKET_EVENTS.TYPING_START);

    const stopped = await waitFor(therapist, SOCKET_EVENTS.TYPING_STOP, TYPING_TIMEOUT_MS + 2000);
    expect(stopped.bookingId).toBe(String(bookingA._id));
  }, 15000);

  it('stops when the typist disconnects', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    client.emit(SOCKET_EVENTS.TYPING_START, { bookingId: String(bookingA._id) });
    await waitFor(therapist, SOCKET_EVENTS.TYPING_START);

    const stopped = waitFor(therapist, SOCKET_EVENTS.TYPING_STOP);
    client.close();

    expect((await stopped).senderRole).toBe(ROLES.CLIENT);
  });

  it('stops once the message is actually sent', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    client.emit(SOCKET_EVENTS.TYPING_START, { bookingId: String(bookingA._id) });
    await waitFor(therapist, SOCKET_EVENTS.TYPING_START);

    const stopped = waitFor(therapist, SOCKET_EVENTS.TYPING_STOP);
    await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: String(bookingA._id),
      text: 'Done typing, and long enough to open here.',
    });

    await expect(stopped).resolves.toBeTruthy();
  });

  it('WRITES NOTHING TO THE DATABASE', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    const before = await Message.countDocuments();

    client.emit(SOCKET_EVENTS.TYPING_START, { bookingId: String(bookingA._id) });
    await waitFor(therapist, SOCKET_EVENTS.TYPING_START);
    client.emit(SOCKET_EVENTS.TYPING_STOP, { bookingId: String(bookingA._id) });
    await waitFor(therapist, SOCKET_EVENTS.TYPING_STOP);

    expect(await Message.countDocuments()).toBe(before);
  });

  it('carries no draft text — nothing crosses the wire before it is sent', async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    const typing = waitFor(therapist, SOCKET_EVENTS.TYPING_START);
    client.emit(SOCKET_EVENTS.TYPING_START, {
      bookingId: String(bookingA._id),
      text: 'a secret draft',
    });

    const payload = await typing;
    expect(JSON.stringify(payload)).not.toContain('secret');
    expect(Object.keys(payload).sort()).toEqual(['bookingId', 'senderRole']);
  });
});

// ---------------------------------------------------------------------------
// Graceful degradation
// ---------------------------------------------------------------------------

describe('graceful degradation', () => {
  it('the emitter is a NO-OP when no socket server is attached', async () => {
    setSocketServer(null);
    expect(getSocketServer()).toBeNull();

    // Nothing throws, and nothing is delivered — which is precisely how every
    // other suite in this project runs.
    expect(emitMessage(String(bookingA._id), { id: 'x', text: 'y' })).toBe(false);

    setSocketServer(io);
  });

  it('REST still sends and stores with the socket server detached', async () => {
    const request = (await import('supertest')).default;
    setSocketServer(null);

    const res = await request(app)
      .post(`/api/v1/chat/${bookingA._id}/messages`)
      .set('Authorization', `Bearer ${tokens.clientA}`)
      .send({ text: 'Sent with no socket layer at all.' });

    expect(res.status).toBe(201);
    expect(await Message.countDocuments({ bookingId: bookingA._id })).toBe(1);

    setSocketServer(io);
    // Explicit timeout, like the rate-limit test above. This is the only
    // supertest call in a file that has already opened and closed several dozen
    // sockets, and the first HTTP request after all that has been measured at
    // 785ms alone and over 12s at the end of a full run on a loaded machine.
    // The default 5s is a measure of the machine, not of this behaviour.
  }, 20000);

  it('runs NO unread aggregation at all when nothing is listening', async () => {
    // The emitter would no-op on its own, but the aggregation behind it would
    // still run on every single send. Reading the attachment first is what
    // keeps the REST-only path at exactly the cost it had before 7.6 — this
    // suite, and any deployment running without sockets.
    const request = (await import('supertest')).default;
    const spy = jest.spyOn(Message, 'aggregate');
    setSocketServer(null);

    try {
      const res = await request(app)
        .post(`/api/v1/chat/${bookingA._id}/messages`)
        .set('Authorization', `Bearer ${tokens.therapistA}`)
        .send({ text: 'No socket, so no badge to push anywhere.' });

      expect(res.status).toBe(201);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
      setSocketServer(io);
    }
  }, 20000);
});

// ---------------------------------------------------------------------------
// The therapist inbox (8.3) — one therapist, several clients, one socket
// ---------------------------------------------------------------------------

describe('the therapist inbox — several clients on one socket', () => {
  const inbox = {};

  const openingFor = (name) => `${name} writing an opening long enough for the floor.`;

  async function makeInboxClient(key, name) {
    const passwordHash = await hashPassword('correct-horse-battery-staple');
    const user = await User.create({
      email: `inbox-${key}@example.com`,
      passwordHash,
      role: ROLES.CLIENT,
      status: USER_STATUS.ACTIVE,
    });

    await ClientProfile.create({
      userId: user._id,
      type: 'individual',
      name,
      age: 30,
      gender: 'female',
      country: 'IE',
      city: 'Cork',
      relationshipStatus: 'Single',
      concernTags: ['Anxiety'],
      therapistGenderPreference: 'no_preference',
    });

    const booking = await Booking.create({ clientId: user._id, therapistId: inbox.therapistId });

    await Subscription.create({
      bookingId: booking._id,
      clientId: user._id,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      amount: SUBSCRIPTION_AMOUNT_MINOR,
      startDate: new Date(Date.now() - 5 * DAY),
      currentPeriodEnd: new Date(Date.now() + 25 * DAY),
      nextBillingDate: new Date(Date.now() + 25 * DAY),
    });

    inbox[key] = {
      userId: user._id,
      bookingId: String(booking._id),
      token: signAccessToken({ userId: String(user._id), role: ROLES.CLIENT }),
    };
  }

  beforeAll(async () => {
    const passwordHash = await hashPassword('correct-horse-battery-staple');
    const therapist = await User.create({
      email: 'inbox-therapist@example.com',
      passwordHash,
      role: ROLES.THERAPIST,
      status: USER_STATUS.ACTIVE,
    });
    inbox.therapistId = therapist._id;
    inbox.therapistToken = signAccessToken({ userId: String(therapist._id), role: ROLES.THERAPIST });
    await makeTherapistProfile(therapist._id, 'Imogen');

    await makeInboxClient('a', 'Aoife');
    await makeInboxClient('b', 'Bram');
    await makeInboxClient('c', 'Cora');
  }, 60000);

  it('delivers every client message to the therapist tagged with ITS OWN booking', async () => {
    const therapist = await connect(inbox.therapistToken);
    const clients = {
      a: await connect(inbox.a.token),
      b: await connect(inbox.b.token),
      c: await connect(inbox.c.token),
    };

    const received = [];
    therapist.on(SOCKET_EVENTS.MESSAGE_NEW, (payload) => received.push(payload));

    // Interleaved on purpose: the order a busy therapist actually sees.
    const sends = ['a', 'b', 'c', 'b', 'a', 'c'];
    const expected = new Map();
    for (const [index, key] of sends.entries()) {
      const text = index < 3 ? openingFor(key) : `${key} message number ${index}`;
      expected.set(text, inbox[key].bookingId);
      await emit(clients[key], SOCKET_EVENTS.MESSAGE_SEND, { bookingId: inbox[key].bookingId, text });
    }

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(received).toHaveLength(sends.length);
    for (const payload of received) {
      // The whole leak defence in the browser rests on this field being right.
      expect(payload.bookingId).toBe(expected.get(payload.text));
    }
  });

  it('never delivers one client message to another client of the same therapist', async () => {
    const clientA = await connect(inbox.a.token);
    const clientB = await connect(inbox.b.token);

    const nothingForA = expectNoEvent(clientA, SOCKET_EVENTS.MESSAGE_NEW);
    await emit(clientB, SOCKET_EVENTS.MESSAGE_SEND, {
      bookingId: inbox.b.bookingId,
      text: openingFor('Bram, privately'),
    });

    await expect(nothingForA).resolves.toBeUndefined();
  });

  it('marking ONE client read clears only that client', async () => {
    const therapist = await connect(inbox.therapistToken);

    for (const key of ['a', 'b', 'c']) {
      const client = await connect(inbox[key].token);
      const raised = waitFor(therapist, SOCKET_EVENTS.UNREAD_UPDATE);
      await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
        bookingId: inbox[key].bookingId,
        text: openingFor(key),
      });
      await raised;
    }

    const cleared = waitFor(therapist, SOCKET_EVENTS.UNREAD_UPDATE);
    await emit(therapist, SOCKET_EVENTS.MESSAGE_READ, { bookingId: inbox.b.bookingId });
    const counts = await cleared;

    const byBooking = Object.fromEntries(counts.byBooking.map((row) => [row.bookingId, row.count]));
    expect(byBooking[inbox.b.bookingId]).toBeUndefined();
    expect(byBooking[inbox.a.bookingId]).toBe(1);
    expect(byBooking[inbox.c.bookingId]).toBe(1);
    expect(counts.total).toBe(2);
  });

  it('typing from one client names ITS OWN booking and no other', async () => {
    const therapist = await connect(inbox.therapistToken);
    const clientC = await connect(inbox.c.token);

    const typing = waitFor(therapist, SOCKET_EVENTS.TYPING_START);
    clientC.emit(SOCKET_EVENTS.TYPING_START, { bookingId: inbox.c.bookingId });

    expect((await typing).bookingId).toBe(inbox.c.bookingId);
  });

  describe('a booking created AFTER the therapist connected', () => {
    let late;

    afterEach(async () => {
      // Only the records this test created, removed by the ids it recorded.
      if (!late) return;
      await Subscription.deleteMany({ bookingId: late.bookingId });
      await Booking.deleteOne({ _id: late.bookingId });
      await ClientProfile.deleteOne({ userId: late.userId });
      await User.deleteOne({ _id: late.userId });
      delete inbox.late;
      late = null;
    });

    it('still delivers the new client opening message live, on every tab', async () => {
      // Connected first: at this moment the booking does not exist, so the
      // handshake could not have joined its room.
      const tabOne = await connect(inbox.therapistToken);
      const tabTwo = await connect(inbox.therapistToken);

      await makeInboxClient('late', 'Lena');
      late = inbox.late;

      const client = await connect(late.token);
      const onOne = waitFor(tabOne, SOCKET_EVENTS.MESSAGE_NEW);
      const onTwo = waitFor(tabTwo, SOCKET_EVENTS.MESSAGE_NEW);

      await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
        bookingId: late.bookingId,
        text: openingFor('Lena, just matched'),
      });

      expect((await onOne).bookingId).toBe(late.bookingId);
      expect((await onTwo).bookingId).toBe(late.bookingId);
    });

    it('joins NOBODY ELSE to the new room', async () => {
      const outsider = await connect(tokens.therapistB);
      await makeInboxClient('late', 'Lena');
      late = inbox.late;

      const client = await connect(late.token);
      const nothing = expectNoEvent(outsider, SOCKET_EVENTS.MESSAGE_NEW);

      await emit(client, SOCKET_EVENTS.MESSAGE_SEND, {
        bookingId: late.bookingId,
        text: openingFor('Lena, not for Nadia'),
      });

      await expect(nothing).resolves.toBeUndefined();
    });

    it('takes the room members from the STORED booking, never from the request', async () => {
      // A payload naming someone else's booking is refused before anything is
      // emitted, so no socket can be pulled into a room by asking for it.
      const outsider = await connect(tokens.therapistB);
      await makeInboxClient('late', 'Lena');
      late = inbox.late;

      const ack = await emit(outsider, SOCKET_EVENTS.MESSAGE_SEND, {
        bookingId: late.bookingId,
        text: 'Trying to reach a room that is not mine at all.',
      });
      expect(ack.error).toBeDefined();

      const room = io.sockets.adapter.rooms.get(bookingRoom(late.bookingId));
      const outsiderSockets = await io.in(`user:${ids.therapistB}`).fetchSockets();
      expect(outsiderSockets.length).toBeGreaterThan(0);
      for (const socket of outsiderSockets) {
        expect(room?.has(socket.id) ?? false).toBe(false);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Session notices (9.3) — the platform speaking, delivered like any message
// ---------------------------------------------------------------------------

describe('session notices', () => {
  it("reach both people live, carry the time as data, and raise only the client's badge", async () => {
    const client = await connect(tokens.clientA);
    const therapist = await connect(tokens.therapistA);

    const toClient = waitFor(client, SOCKET_EVENTS.MESSAGE_NEW);
    const toTherapist = waitFor(therapist, SOCKET_EVENTS.MESSAGE_NEW);
    const badge = waitFor(client, SOCKET_EVENTS.UNREAD_UPDATE);
    const quiet = expectNoEvent(therapist, SOCKET_EVENTS.UNREAD_UPDATE);

    const at = new Date(Date.now() + 3 * DAY);
    await postSessionNotice(bookingA, ids.therapistA, {
      event: 'scheduled',
      sessionId: new mongoose.Types.ObjectId(),
      scheduledAt: at,
    });

    const [forClient, forTherapist] = await Promise.all([toClient, toTherapist]);
    expect(forClient.type).toBe('system');
    expect(forClient.bookingId).toBe(String(bookingA._id));
    expect(forClient.session.event).toBe('scheduled');
    expect(forClient.session.scheduledAt).toBe(at.toISOString());
    expect(forClient).not.toHaveProperty('mine');
    expect(forTherapist.id).toBe(forClient.id);

    expect((await badge).total).toBe(1);
    await quiet;
  });

  it('never reaches a third party on another booking', async () => {
    const outsider = await connect(tokens.clientB);
    const silent = expectNoEvent(outsider, SOCKET_EVENTS.MESSAGE_NEW);

    await postSessionNotice(bookingA, ids.therapistA, {
      event: 'cancelled',
      sessionId: new mongoose.Types.ObjectId(),
      scheduledAt: new Date(Date.now() + DAY),
    });

    await silent;
  });
});
