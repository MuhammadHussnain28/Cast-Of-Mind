import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/User.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { Booking } from '../models/Booking.js';
import { Subscription } from '../models/Subscription.js';
import { Message } from '../models/Message.js';
import { hashPassword } from '../utils/password.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { SUBSCRIPTION_STATUS, SUBSCRIPTION_AMOUNT_MINOR, BOOKING_STATUS } from '../constants/payments.js';
import { MESSAGE_TYPE, MESSAGE_TEXT_MAX, OPENING_MESSAGE_MIN } from '../constants/chat.js';
import { loginRateLimiter, sessionRateLimiter } from './auth.routes.js';
import { chatReadRateLimiter, chatSendRateLimiter } from './chat.routes.js';
import { startMemoryMongo, stopMemoryMongo } from '../test/mongoMemory.js';

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const NO_TOKEN = Symbol('no token');

// Two complete, separate relationships. Cross-booking access is only a real
// test if the other booking genuinely exists and has messages in it.
const PEOPLE = {
  clientA: 'chat-client-a@example.com',
  therapistA: 'chat-therapist-a@example.com',
  clientB: 'chat-client-b@example.com',
  therapistB: 'chat-therapist-b@example.com',
  admin: 'chat-admin@example.com',
};

const users = {};
const tokens = {};
let bookingA;
let bookingB;

function resetRateLimits() {
  LOOPBACK_KEYS.forEach((key) => {
    loginRateLimiter.resetKey(key);
    sessionRateLimiter.resetKey(key);
    chatReadRateLimiter.resetKey(key);
    chatSendRateLimiter.resetKey(key);
  });
}

const auth = (req, token) => (token === NO_TOKEN ? req : req.set('Authorization', `Bearer ${token}`));

const listMessages = (bookingId, token, query = '') =>
  auth(request(app).get(`/api/v1/chat/${bookingId}/messages${query}`), token);
const send = (bookingId, token, body) =>
  auth(request(app).post(`/api/v1/chat/${bookingId}/messages`), token).send(body);
const markRead = (bookingId, token) =>
  auth(request(app).post(`/api/v1/chat/${bookingId}/read`), token);
const unread = (token) => auth(request(app).get('/api/v1/chat/unread-count'), token);

async function signIn(email) {
  resetRateLimits();
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD });
  return res.body.accessToken;
}

async function makeTherapistProfile(userId, firstName) {
  return TherapistProfile.create({
    userId,
    applicationId: new mongoose.Types.ObjectId(),
    title: 'Dr.',
    firstName,
    lastName: 'Adeyemi',
    gender: 'female',
    dateOfBirth: new Date('1986-01-04'),
    photoUrl: 'https://res.cloudinary.com/demo/image/upload/t.jpg',
    streetAddress: '2 Bridge Street',
    city: 'Lisbon',
    stateProvince: 'Lisboa',
    zipPostal: '1100',
    country: 'PT',
    timezone: 'Europe/Lisbon',
    therapistType: 'Clinical Psychologist',
    credentialType: 'Diploma/Degree',
    credentialInitials: 'PhD',
    yearsExperience: 8,
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

const DAY = 24 * 60 * 60 * 1000;

async function activeSubscription(clientId, bookingId, overrides = {}) {
  await Subscription.deleteMany({ clientId });
  return Subscription.create({
    bookingId,
    clientId,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    amount: SUBSCRIPTION_AMOUNT_MINOR,
    startDate: new Date(Date.now() - 5 * DAY),
    currentPeriodEnd: new Date(Date.now() + 25 * DAY),
    nextBillingDate: new Date(Date.now() + 25 * DAY),
    ...overrides,
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

  const passwordHash = await hashPassword(PASSWORD);

  for (const [key, email] of Object.entries(PEOPLE)) {
    const role = key.startsWith('client')
      ? ROLES.CLIENT
      : key.startsWith('therapist')
        ? ROLES.THERAPIST
        : ROLES.ADMIN;

    users[key] = await User.create({ email, passwordHash, role, status: USER_STATUS.ACTIVE });
    tokens[key] = await signIn(email);
  }

  await ClientProfile.create({
    userId: users.clientA._id,
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
    userId: users.clientB._id,
    type: 'couple',
    coupleData: {
      partner1: { name: 'Marta', age: 38, gender: 'female' },
      partner2: { name: 'Joris', age: 41, gender: 'male' },
    },
    country: 'NL',
    city: 'Utrecht',
    relationshipStatus: 'Married',
    concernTags: ['Marriage Issues'],
    therapistGenderPreference: 'no_preference',
  });

  await makeTherapistProfile(users.therapistA._id, 'Priya');
  await makeTherapistProfile(users.therapistB._id, 'Nadia');

  bookingA = await Booking.create({
    clientId: users.clientA._id,
    therapistId: users.therapistA._id,
  });
  bookingB = await Booking.create({
    clientId: users.clientB._id,
    therapistId: users.therapistB._id,
  });

  await activeSubscription(users.clientA._id, bookingA._id);
  await activeSubscription(users.clientB._id, bookingB._id);
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(async () => {
  resetRateLimits();
  await Message.deleteMany({});
  await Subscription.updateMany({}, { $set: { status: SUBSCRIPTION_STATUS.ACTIVE } });
  await Booking.updateMany({}, { $set: { status: BOOKING_STATUS.ACTIVE }, $unset: { endedAt: 1 } });
});

/** Seed a thread directly, so ordering is controlled rather than raced. */
async function seedThread(booking, rows) {
  const created = [];
  for (const [index, row] of rows.entries()) {
    created.push(
      await Message.create({
        bookingId: booking._id,
        senderId: row.from,
        text: row.text,
        type: row.type ?? MESSAGE_TYPE.TEXT,
        read: row.read ?? false,
        createdAt: new Date(Date.now() - (rows.length - index) * 60000),
      }),
    );
  }
  return created;
}

// ---------------------------------------------------------------------------
// Authorisation — the rule the whole chunk turns on
// ---------------------------------------------------------------------------

describe('a user may only reach a booking they belong to', () => {
  beforeEach(async () => {
    await seedThread(bookingB, [{ from: users.clientB._id, text: 'Private to booking B.' }]);
  });

  it('lets the client and the therapist of a booking read it', async () => {
    await seedThread(bookingA, [{ from: users.clientA._id, text: 'Hello.' }]);

    expect((await listMessages(bookingA._id, tokens.clientA)).status).toBe(200);
    resetRateLimits();
    expect((await listMessages(bookingA._id, tokens.therapistA)).status).toBe(200);
  });

  it('refuses a client reading somebody else\'s booking', async () => {
    const res = await listMessages(bookingB._id, tokens.clientA);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CONVERSATION_NOT_FOUND');
    expect(JSON.stringify(res.body)).not.toContain('Private to booking B.');
  });

  it('refuses a therapist reading a booking that is not theirs', async () => {
    expect((await listMessages(bookingB._id, tokens.therapistA)).status).toBe(404);
  });

  it('refuses a client WRITING into somebody else\'s booking', async () => {
    const res = await send(bookingB._id, tokens.clientA, { text: 'Sneaking in.' });
    expect(res.status).toBe(404);
    expect(await Message.countDocuments({ bookingId: bookingB._id })).toBe(1);
  });

  it('refuses marking somebody else\'s booking read', async () => {
    const res = await markRead(bookingB._id, tokens.clientA);
    expect(res.status).toBe(404);
    // Booking B's message is untouched.
    expect(await Message.countDocuments({ bookingId: bookingB._id, read: false })).toBe(1);
  });

  it('RETURNS THE SAME 404 for a real booking and an unknown one, so ids cannot be probed', async () => {
    const foreign = await listMessages(bookingB._id, tokens.clientA);
    resetRateLimits();
    const missing = await listMessages(new mongoose.Types.ObjectId(), tokens.clientA);
    resetRateLimits();
    const malformed = await listMessages('not-an-id', tokens.clientA);

    expect(foreign.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(malformed.status).toBe(404);
    expect(foreign.body).toEqual(missing.body);
    expect(foreign.body).toEqual(malformed.body);
  });

  it('refuses the admin outright — §11: no admin conversation viewer exists', async () => {
    expect((await listMessages(bookingA._id, tokens.admin)).status).toBe(403);
    resetRateLimits();
    expect((await unread(tokens.admin)).status).toBe(403);
  });

  it('refuses a request with no token', async () => {
    expect((await listMessages(bookingA._id, NO_TOKEN)).status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// The subscription gate — clients close, therapists stay open
// ---------------------------------------------------------------------------

describe('the subscription gate on chat', () => {
  it('blocks an expired CLIENT from their own conversation', async () => {
    await Subscription.updateOne(
      { clientId: users.clientA._id },
      { $set: { status: SUBSCRIPTION_STATUS.EXPIRED } },
    );

    const res = await listMessages(bookingA._id, tokens.clientA);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('SUBSCRIPTION_ENDED');
  });

  it('KEEPS THE THERAPIST READING the same conversation — it is their clinical record', async () => {
    await seedThread(bookingA, [{ from: users.clientA._id, text: 'Written before it lapsed.' }]);
    await Subscription.updateOne(
      { clientId: users.clientA._id },
      { $set: { status: SUBSCRIPTION_STATUS.EXPIRED } },
    );

    const res = await listMessages(bookingA._id, tokens.therapistA);
    expect(res.status).toBe(200);
    expect(res.body.data[0].text).toBe('Written before it lapsed.');
  });

  it('lets a past_due client through — a grace period, not a lockout', async () => {
    await Subscription.updateOne(
      { clientId: users.clientA._id },
      { $set: { status: SUBSCRIPTION_STATUS.PAST_DUE } },
    );
    expect((await listMessages(bookingA._id, tokens.clientA)).status).toBe(200);
  });

  it('blocks an expired client from sending', async () => {
    await Subscription.updateOne(
      { clientId: users.clientA._id },
      { $set: { status: SUBSCRIPTION_STATUS.EXPIRED } },
    );
    const res = await send(bookingA._id, tokens.clientA, { text: 'Still here?' });
    expect(res.status).toBe(403);
    expect(await Message.countDocuments({ bookingId: bookingA._id })).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

describe('POST a message', () => {
  it('stores it and returns it', async () => {
    const res = await send(bookingA._id, tokens.clientA, { text: '  I have not been sleeping.  ' });

    expect(res.status).toBe(201);
    expect(res.body.text).toBe('I have not been sleeping.');
    expect(res.body.senderRole).toBe(ROLES.CLIENT);
    expect(res.body.mine).toBe(true);

    const stored = await Message.findOne({ bookingId: bookingA._id });
    expect(String(stored.senderId)).toBe(String(users.clientA._id));
    expect(stored.read).toBe(false);
  });

  it('IGNORES A FORGED type — a client cannot fake a system message', async () => {
    const res = await send(bookingA._id, tokens.clientA, {
      text: 'Session scheduled for Thursday at 6pm',
      type: MESSAGE_TYPE.SYSTEM,
    });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe(MESSAGE_TYPE.TEXT);

    const stored = await Message.findOne({ bookingId: bookingA._id });
    expect(stored.type).toBe(MESSAGE_TYPE.TEXT);
    expect(await Message.countDocuments({ type: MESSAGE_TYPE.SYSTEM })).toBe(0);
  });

  it('DROPS A FORGED session field — nobody can post a session notice by hand (9.3)', async () => {
    const forged = {
      event: 'scheduled',
      scheduledAt: new Date().toISOString(),
      sessionId: '64b7f0c2a1b2c3d4e5f60718',
    };
    const asClient = await send(bookingA._id, tokens.clientA, {
      text: 'This is long enough to be an opening message.',
      type: MESSAGE_TYPE.SYSTEM,
      session: forged,
    });
    const asTherapist = await send(bookingA._id, tokens.therapistA, {
      text: 'Session scheduled for Thursday.',
      type: MESSAGE_TYPE.SYSTEM,
      session: forged,
    });

    for (const res of [asClient, asTherapist]) {
      expect(res.status).toBe(201);
      expect(res.body.type).toBe(MESSAGE_TYPE.TEXT);
      expect(res.body.session).toBeUndefined();
    }
    expect(await Message.countDocuments({ type: MESSAGE_TYPE.SYSTEM })).toBe(0);
    expect(await Message.countDocuments({ session: { $exists: true } })).toBe(0);
  });

  it('ignores a forged read flag and sender', async () => {
    await send(bookingA._id, tokens.clientA, {
      text: 'Hello, this is long enough to be an opening.',
      read: true,
      senderId: String(users.therapistA._id),
    });

    const stored = await Message.findOne({ bookingId: bookingA._id });
    expect(stored.read).toBe(false);
    expect(String(stored.senderId)).toBe(String(users.clientA._id));
  });

  it('echoes clientMessageId back but NEVER stores it', async () => {
    const res = await send(bookingA._id, tokens.clientA, {
      text: 'Optimistic send, long enough to open the conversation.',
      clientMessageId: 'abc-123_XYZ',
    });

    expect(res.status).toBe(201);
    expect(res.body.clientMessageId).toBe('abc-123_XYZ');

    // The rendering hint must not have reached the database in any form.
    const raw = await mongoose.connection.db
      .collection('messages')
      .findOne({ _id: new mongoose.Types.ObjectId(res.body.id) });
    expect(raw.clientMessageId).toBeUndefined();
    expect(JSON.stringify(raw)).not.toContain('abc-123_XYZ');
  });

  it('omits clientMessageId entirely when none was sent', async () => {
    const res = await send(bookingA._id, tokens.clientA, {
      text: 'No hint, but long enough to open the conversation.',
    });
    expect(res.status).toBe(201);
    expect(res.body.clientMessageId).toBeUndefined();
  });

  it('refuses a clientMessageId that is not an opaque token', async () => {
    const tooLong = await send(bookingA._id, tokens.clientA, {
      text: 'x',
      clientMessageId: 'a'.repeat(65),
    });
    expect(tooLong.status).toBe(422);

    resetRateLimits();
    const scripty = await send(bookingA._id, tokens.clientA, {
      text: 'x',
      clientMessageId: '<script>alert(1)</script>',
    });
    expect(scripty.status).toBe(422);
    expect(await Message.countDocuments()).toBe(0);
  });

  it('refuses an empty message and one over the limit', async () => {
    expect((await send(bookingA._id, tokens.clientA, { text: '   ' })).status).toBe(422);
    resetRateLimits();
    expect(
      (await send(bookingA._id, tokens.clientA, { text: 'a'.repeat(MESSAGE_TEXT_MAX + 1) })).status,
    ).toBe(422);
    expect(await Message.countDocuments()).toBe(0);
  });

  it(`accepts exactly ${MESSAGE_TEXT_MAX} characters`, async () => {
    const res = await send(bookingA._id, tokens.clientA, { text: 'a'.repeat(MESSAGE_TEXT_MAX) });
    expect(res.status).toBe(201);
  });

  it('lets the therapist send into the same thread', async () => {
    const res = await send(bookingA._id, tokens.therapistA, { text: 'Thank you for writing.' });
    expect(res.status).toBe(201);
    expect(res.body.senderRole).toBe(ROLES.THERAPIST);
  });

  it('refuses writing to an ended booking but still allows reading it', async () => {
    await seedThread(bookingA, [{ from: users.clientA._id, text: 'Earlier.' }]);
    await Booking.updateOne(
      { _id: bookingA._id },
      { $set: { status: BOOKING_STATUS.ENDED, endedAt: new Date() } },
    );

    const write = await send(bookingA._id, tokens.therapistA, { text: 'One more.' });
    expect(write.status).toBe(409);
    expect(write.body.error.code).toBe('BOOKING_ENDED');

    resetRateLimits();
    const read = await listMessages(bookingA._id, tokens.therapistA);
    expect(read.status).toBe(200);
    expect(read.body.data).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// The mandatory first message — §7.1
// ---------------------------------------------------------------------------

describe('the mandatory first message', () => {
  const SHORT = 'hi';
  const REAL_CRY = "I can't do this anymore."; // 24 chars — must be allowed

  it('refuses a client opening that is below the floor', async () => {
    const res = await send(bookingA._id, tokens.clientA, { text: SHORT });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('OPENING_MESSAGE_REQUIRED');
    expect(await Message.countDocuments({ bookingId: bookingA._id })).toBe(0);
  });

  it('ALLOWS A SHORT CRY FOR HELP — the reason the floor is 20 and not 30', async () => {
    expect(REAL_CRY.length).toBeGreaterThanOrEqual(OPENING_MESSAGE_MIN);
    expect(REAL_CRY.length).toBeLessThan(30);

    const res = await send(bookingA._id, tokens.clientA, { text: REAL_CRY });
    expect(res.status).toBe(201);
  });

  it('accepts exactly the floor and refuses one character under it', async () => {
    const under = 'a'.repeat(OPENING_MESSAGE_MIN - 1);
    expect((await send(bookingA._id, tokens.clientA, { text: under })).status).toBe(422);

    resetRateLimits();
    const exact = 'a'.repeat(OPENING_MESSAGE_MIN);
    expect((await send(bookingA._id, tokens.clientA, { text: exact })).status).toBe(201);
  });

  it('measures the TRIMMED length, so padding with spaces does not pass', async () => {
    const padded = `${'  '.repeat(20)}hi${'  '.repeat(20)}`;
    const res = await send(bookingA._id, tokens.clientA, { text: padded });
    expect(res.status).toBe(422);
  });

  it('APPLIES ONCE — a short second message is ordinary', async () => {
    expect(
      (await send(bookingA._id, tokens.clientA, { text: 'I have not been sleeping well at all.' }))
        .status,
    ).toBe(201);

    resetRateLimits();
    expect((await send(bookingA._id, tokens.clientA, { text: 'ok' })).status).toBe(201);
    expect(await Message.countDocuments({ bookingId: bookingA._id })).toBe(2);
  });

  it('never restricts the THERAPIST, even before the client has written', async () => {
    const res = await send(bookingA._id, tokens.therapistA, { text: 'Hi' });
    expect(res.status).toBe(201);
  });

  it('and the client still owes their opening after the therapist wrote first', async () => {
    await send(bookingA._id, tokens.therapistA, { text: 'Hello' });
    resetRateLimits();

    const res = await send(bookingA._id, tokens.clientA, { text: 'hi' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('OPENING_MESSAGE_REQUIRED');
  });

  it('reports awaitingOpeningMessage before, and clears it after', async () => {
    const before = await listMessages(bookingA._id, tokens.clientA);
    expect(before.body.meta.awaitingOpeningMessage).toBe(true);

    resetRateLimits();
    await send(bookingA._id, tokens.clientA, { text: 'I have been struggling to sleep lately.' });

    resetRateLimits();
    const after = await listMessages(bookingA._id, tokens.clientA);
    expect(after.body.meta.awaitingOpeningMessage).toBe(false);
  });

  it('reports it to the THERAPIST too — they see the client has not written', async () => {
    const before = await listMessages(bookingA._id, tokens.therapistA);
    expect(before.body.meta.awaitingOpeningMessage).toBe(true);

    resetRateLimits();
    await send(bookingA._id, tokens.therapistA, { text: 'A therapist message changes nothing.' });

    resetRateLimits();
    const still = await listMessages(bookingA._id, tokens.therapistA);
    expect(still.body.meta.awaitingOpeningMessage).toBe(true);
  });

  it('refuses without leaking the message text back in the error', async () => {
    // A distinctive token, because a naive substring like "hi" also occurs
    // inside the word "This" in the refusal copy — the first version of this
    // test failed for that reason rather than for a real leak.
    const res = await send(bookingA._id, tokens.clientA, { text: 'qqzz' });

    expect(res.status).toBe(422);
    expect(JSON.stringify(res.body)).not.toContain('qqzz');
  });
});

// ---------------------------------------------------------------------------
// Reading the thread
// ---------------------------------------------------------------------------

describe('GET the messages', () => {
  it('returns them oldest first, so a UI renders straight down the screen', async () => {
    await seedThread(bookingA, [
      { from: users.clientA._id, text: 'First.' },
      { from: users.therapistA._id, text: 'Second.' },
      { from: users.clientA._id, text: 'Third.' },
    ]);

    const { body } = await listMessages(bookingA._id, tokens.clientA);
    expect(body.data.map((m) => m.text)).toEqual(['First.', 'Second.', 'Third.']);
  });

  it('marks each message with a role and whether it is yours, from both sides', async () => {
    await seedThread(bookingA, [
      { from: users.clientA._id, text: 'Mine.' },
      { from: users.therapistA._id, text: 'Theirs.' },
    ]);

    const asClient = await listMessages(bookingA._id, tokens.clientA);
    expect(asClient.body.data.map((m) => m.mine)).toEqual([true, false]);

    resetRateLimits();
    const asTherapist = await listMessages(bookingA._id, tokens.therapistA);
    expect(asTherapist.body.data.map((m) => m.mine)).toEqual([false, true]);
    expect(asTherapist.body.data.map((m) => m.senderRole)).toEqual([ROLES.CLIENT, ROLES.THERAPIST]);
  });

  it('NEVER returns a raw user id, and never a read receipt', async () => {
    await seedThread(bookingA, [{ from: users.therapistA._id, text: 'Hello.', read: true }]);

    const { body } = await listMessages(bookingA._id, tokens.clientA);
    const serialised = JSON.stringify(body);

    expect(body.data[0].senderId).toBeUndefined();
    expect(body.data[0].read).toBeUndefined();
    expect(serialised).not.toContain(String(users.therapistA._id));
    expect(serialised).not.toContain(String(users.clientA._id));
  });

  it('names both participants once, not per message', async () => {
    await seedThread(bookingA, [
      { from: users.clientA._id, text: 'a' },
      { from: users.clientA._id, text: 'b' },
    ]);

    const { body } = await listMessages(bookingA._id, tokens.clientA);
    expect(body.meta.participants.therapist.name).toBe('Dr. Priya Adeyemi');
    expect(body.meta.participants.client.name).toBe('Rosa');
    expect(body.meta.participants.therapist.workingHours.monday.start).toBe('09:00');
  });

  it('labels a couple with both partners — one account, two people', async () => {
    await seedThread(bookingB, [{ from: users.clientB._id, text: 'Hello from us.' }]);
    const { body } = await listMessages(bookingB._id, tokens.therapistB);
    expect(body.meta.participants.client.name).toBe('Marta and Joris');
  });

  it('returns an empty thread cleanly, with participants still named', async () => {
    const { body } = await listMessages(bookingA._id, tokens.clientA);
    expect(body.data).toEqual([]);
    expect(body.meta.hasMore).toBe(false);
    expect(body.meta.nextCursor).toBeNull();
    expect(body.meta.participants.therapist.name).toBe('Dr. Priya Adeyemi');
  });
});

// ---------------------------------------------------------------------------
// Cursor pagination
// ---------------------------------------------------------------------------

describe('pagination', () => {
  it('serves the newest page first and walks backwards without gaps or repeats', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({
      from: users.clientA._id,
      text: `m${i + 1}`,
    }));
    await seedThread(bookingA, rows);

    const first = await listMessages(bookingA._id, tokens.clientA, '?limit=10');
    expect(first.body.data.map((m) => m.text)).toEqual([
      'm16', 'm17', 'm18', 'm19', 'm20', 'm21', 'm22', 'm23', 'm24', 'm25',
    ]);
    expect(first.body.meta.hasMore).toBe(true);

    resetRateLimits();
    const second = await listMessages(
      bookingA._id,
      tokens.clientA,
      `?limit=10&before=${encodeURIComponent(first.body.meta.nextCursor)}`,
    );
    expect(second.body.data.map((m) => m.text)).toEqual([
      'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12', 'm13', 'm14', 'm15',
    ]);

    resetRateLimits();
    const third = await listMessages(
      bookingA._id,
      tokens.clientA,
      `?limit=10&before=${encodeURIComponent(second.body.meta.nextCursor)}`,
    );
    expect(third.body.data.map((m) => m.text)).toEqual(['m1', 'm2', 'm3', 'm4', 'm5']);
    expect(third.body.meta.hasMore).toBe(false);
    expect(third.body.meta.nextCursor).toBeNull();
  });

  it('IS STABLE WHEN A MESSAGE ARRIVES MID-READ — the reason it is not offset paging', async () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      from: users.clientA._id,
      text: `m${i + 1}`,
    }));
    await seedThread(bookingA, rows);

    const first = await listMessages(bookingA._id, tokens.clientA, '?limit=10');
    const firstPage = first.body.data.map((m) => m.text);

    // Somebody replies while the reader is still on page one.
    resetRateLimits();
    await send(bookingA._id, tokens.therapistA, { text: 'arrived-later' });

    resetRateLimits();
    const second = await listMessages(
      bookingA._id,
      tokens.clientA,
      `?limit=10&before=${encodeURIComponent(first.body.meta.nextCursor)}`,
    );
    const secondPage = second.body.data.map((m) => m.text);

    // No overlap, nothing skipped, and the new message does not intrude on the
    // older page. Offset paging would have re-served m11 here.
    expect(secondPage).toEqual(['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10']);
    expect(firstPage.filter((t) => secondPage.includes(t))).toEqual([]);
    expect(secondPage).not.toContain('arrived-later');
  });

  it('refuses a cursor it did not issue', async () => {
    const res = await listMessages(bookingA._id, tokens.clientA, '?before=not-a-real-cursor');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CURSOR');
  });

  it('refuses an absurd limit rather than serving the whole history', async () => {
    expect((await listMessages(bookingA._id, tokens.clientA, '?limit=5000')).status).toBe(422);
    resetRateLimits();
    expect((await listMessages(bookingA._id, tokens.clientA, '?limit=0')).status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// Unread
// ---------------------------------------------------------------------------

describe('unread counting and marking read', () => {
  it('counts only the OTHER party\'s unread messages', async () => {
    await seedThread(bookingA, [
      { from: users.clientA._id, text: 'mine 1' },
      { from: users.clientA._id, text: 'mine 2' },
      { from: users.therapistA._id, text: 'theirs 1' },
      { from: users.therapistA._id, text: 'theirs 2' },
      { from: users.therapistA._id, text: 'theirs 3, already seen', read: true },
    ]);

    const forClient = await unread(tokens.clientA);
    expect(forClient.body.total).toBe(2);
    expect(forClient.body.byBooking).toEqual([
      { bookingId: String(bookingA._id), count: 2 },
    ]);

    resetRateLimits();
    const forTherapist = await unread(tokens.therapistA);
    expect(forTherapist.body.total).toBe(2); // the client's two
  });

  it('reports zero cleanly when there is nothing waiting', async () => {
    const res = await unread(tokens.clientA);
    expect(res.body).toEqual({ total: 0, byBooking: [] });
  });

  it('never counts another booking into your total', async () => {
    await seedThread(bookingB, [
      { from: users.clientB._id, text: 'x' },
      { from: users.clientB._id, text: 'y' },
    ]);

    const res = await unread(tokens.therapistA);
    expect(res.body.total).toBe(0);
  });

  it('marks the other party\'s messages read and leaves your own alone', async () => {
    await seedThread(bookingA, [
      { from: users.clientA._id, text: 'mine' },
      { from: users.therapistA._id, text: 'theirs 1' },
      { from: users.therapistA._id, text: 'theirs 2' },
    ]);

    const res = await markRead(bookingA._id, tokens.clientA);
    expect(res.status).toBe(200);
    expect(res.body.marked).toBe(2);

    expect(await Message.countDocuments({ senderId: users.therapistA._id, read: false })).toBe(0);
    // The client's own message is untouched — the therapist has not read it.
    expect(await Message.countDocuments({ senderId: users.clientA._id, read: false })).toBe(1);
  });

  it('touches no other booking when marking read', async () => {
    await seedThread(bookingA, [{ from: users.therapistA._id, text: 'a' }]);
    await seedThread(bookingB, [{ from: users.therapistB._id, text: 'b' }]);

    await markRead(bookingA._id, tokens.clientA);

    expect(await Message.countDocuments({ bookingId: bookingB._id, read: false })).toBe(1);
  });

  it('is idempotent — marking read twice changes nothing the second time', async () => {
    await seedThread(bookingA, [{ from: users.therapistA._id, text: 'a' }]);

    expect((await markRead(bookingA._id, tokens.clientA)).body.marked).toBe(1);
    resetRateLimits();
    expect((await markRead(bookingA._id, tokens.clientA)).body.marked).toBe(0);
  });

  it('drops the badge to zero once the conversation is opened', async () => {
    await seedThread(bookingA, [
      { from: users.therapistA._id, text: 'a' },
      { from: users.therapistA._id, text: 'b' },
      // The client's own reply stays unread — the therapist has not opened it.
      // It is here so "zero" proves the sender exclusion rather than just
      // proving markRead cleared everything in the booking.
      { from: users.clientA._id, text: 'my reply' },
    ]);

    expect((await unread(tokens.clientA)).body.total).toBe(2);
    resetRateLimits();
    await markRead(bookingA._id, tokens.clientA);
    resetRateLimits();

    expect((await unread(tokens.clientA)).body.total).toBe(0);
    // And the therapist still has the client's reply waiting.
    resetRateLimits();
    expect((await unread(tokens.therapistA)).body.total).toBe(1);
  });
});
