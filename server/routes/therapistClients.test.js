import request from 'supertest';
import app from '../app.js';
import { User } from '../models/User.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { Booking } from '../models/Booking.js';
import { Message } from '../models/Message.js';
import { hashPassword } from '../utils/password.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { BOOKING_STATUS } from '../constants/payments.js';
import { MESSAGE_TYPE } from '../constants/chat.js';
import { LAST_ACTIVITY_KIND, CLIENT_LIST_MAX_PAGE_SIZE } from '../constants/therapistClients.js';
import { loginRateLimiter, sessionRateLimiter } from './auth.routes.js';
import { therapistRateLimiter } from './therapist.routes.js';
import { startMemoryMongo, stopMemoryMongo } from '../test/mongoMemory.js';

/**
 * The therapist client list — master spec §8.1.
 *
 * The two assertions that matter most are the negative ones: no message text
 * and no client user id may appear in this response. Both are decisions rather
 * than omissions, and both are the kind a later chunk could undo while every
 * other test here stayed green.
 */

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const CLIENTS = '/api/v1/therapist/clients';

// Deliberately distinctive, so searching the serialised body for it cannot
// match incidentally — the trap chunk 7.5 hit when it asserted on "hi" and
// found it inside the word "This".
const SECRET_TEXT = 'zephyrine-quartzbloom confided something private here';

const NO_TOKEN = Symbol('no token');
const tokens = {};
const users = {};
const bookings = {};

function resetRateLimits() {
  LOOPBACK_KEYS.forEach((key) => {
    loginRateLimiter.resetKey(key);
    sessionRateLimiter.resetKey(key);
    therapistRateLimiter.resetKey(key);
  });
}

const auth = (req, token = tokens.therapist) =>
  token === NO_TOKEN ? req : req.set('Authorization', `Bearer ${token}`);

const get = (query = '', token) => auth(request(app).get(`${CLIENTS}${query}`), token);

async function makeUser(key, email, role) {
  users[key] = await User.create({
    email,
    passwordHash: await hashPassword(PASSWORD),
    role,
    status: USER_STATUS.ACTIVE,
  });

  resetRateLimits();
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD });
  tokens[key] = res.body.accessToken;

  return users[key];
}

/**
 * `matchedAt` is the schema `createdAt` (§10.5 names it that), and Mongoose
 * owns any path it manages through `timestamps` — a `$set` through the model is
 * silently discarded. The raw driver is the only way to backdate a fixture, and
 * it is used ONLY for that: nothing in the application writes this field after
 * the booking is created.
 */
async function makeBooking(key, therapistKey, clientKey, matchedAt) {
  const booking = await Booking.create({
    clientId: users[clientKey]._id,
    therapistId: users[therapistKey]._id,
    status: BOOKING_STATUS.ACTIVE,
  });

  await Booking.collection.updateOne({ _id: booking._id }, { $set: { matchedAt } });
  bookings[key] = await Booking.findById(booking._id);
  return bookings[key];
}

const sendMessage = (bookingKey, senderKey, text, createdAt, read = false) =>
  Message.create({
    bookingId: bookings[bookingKey]._id,
    senderId: users[senderKey]._id,
    text,
    type: MESSAGE_TYPE.TEXT,
    read,
    createdAt,
  });

const profileFor = (key, extra) =>
  ClientProfile.create({
    userId: users[key]._id,
    country: 'IE',
    city: 'Galway',
    relationshipStatus: 'Single',
    concernTags: ['Anxiety', 'Grief', 'Stress'],
    therapistGenderPreference: 'no_preference',
    ...extra,
  });

beforeAll(async () => {
  await startMemoryMongo();
  await User.init();
  await Booking.init();
  await Message.init();

  await makeUser('therapist', 'inbox-therapist@example.com', ROLES.THERAPIST);
  await makeUser('otherTherapist', 'inbox-other-therapist@example.com', ROLES.THERAPIST);
  await makeUser('lonely', 'inbox-lonely@example.com', ROLES.THERAPIST);
  await makeUser('admin', 'inbox-admin@example.com', ROLES.ADMIN);

  await makeUser('rosa', 'inbox-rosa@example.com', ROLES.CLIENT);
  await makeUser('couple', 'inbox-couple@example.com', ROLES.CLIENT);
  await makeUser('quiet', 'inbox-quiet@example.com', ROLES.CLIENT);
  await makeUser('solo', 'inbox-solo@example.com', ROLES.CLIENT);
  await makeUser('foreign', 'inbox-foreign@example.com', ROLES.CLIENT);
  await makeUser('ended', 'inbox-ended@example.com', ROLES.CLIENT);

  await profileFor('rosa', { type: 'individual', name: 'Rosa', age: 34, gender: 'female' });

  await profileFor('couple', {
    type: 'couple',
    coupleData: {
      partner1: { name: 'Marta', age: 41, gender: 'female' },
      partner2: { name: 'Joris', age: 39, gender: 'male' },
    },
    relationshipStatus: 'Married',
  });

  await profileFor('quiet', { type: 'individual', name: 'Daniel', age: 52, gender: 'male' });
  await profileFor('solo', { type: 'individual', name: 'Solomon', age: 28, gender: 'male' });
  await profileFor('foreign', {
    type: 'individual',
    name: 'Someone Else',
    age: 30,
    gender: 'female',
  });
  await profileFor('ended', {
    type: 'individual',
    name: 'Former Client',
    age: 45,
    gender: 'male',
  });

  // Matched oldest to newest, so the ordering test proves activity ordering
  // rather than accidentally agreeing with creation order.
  await makeBooking('rosa', 'therapist', 'rosa', new Date('2026-01-01T09:00:00Z'));
  await makeBooking('couple', 'therapist', 'couple', new Date('2026-02-01T09:00:00Z'));
  await makeBooking('quiet', 'therapist', 'quiet', new Date('2026-03-01T09:00:00Z'));
  await makeBooking('solo', 'therapist', 'solo', new Date('2026-03-15T09:00:00Z'));
  await makeBooking('foreign', 'otherTherapist', 'foreign', new Date('2026-01-15T09:00:00Z'));

  const endedBooking = await makeBooking(
    'ended',
    'therapist',
    'ended',
    new Date('2026-04-01T09:00:00Z'),
  );
  await Booking.updateOne(
    { _id: endedBooking._id },
    { $set: { status: BOOKING_STATUS.ENDED, endedAt: new Date('2026-05-01T09:00:00Z') } },
  );

  // Rosa: one of hers already read, one of the therapist own (unread, and must
  // never count), then two more of hers.
  await sendMessage('rosa', 'rosa', SECRET_TEXT, new Date('2026-06-01T10:00:00Z'), true);
  await sendMessage('rosa', 'therapist', 'Thank you for writing.', new Date('2026-06-01T11:00:00Z'));
  await sendMessage('rosa', 'rosa', 'I had a hard week.', new Date('2026-06-02T10:00:00Z'));
  await sendMessage('rosa', 'rosa', 'Sorry to write twice.', new Date('2026-06-02T10:05:00Z'));

  // The couple: newest activity of all, one unread.
  await sendMessage('couple', 'couple', 'We argued again.', new Date('2026-06-10T10:00:00Z'));

  // The other therapist client, so isolation has something real to fail on.
  await sendMessage('foreign', 'foreign', 'Not yours to read.', new Date('2026-06-11T10:00:00Z'));

  /**
   * SOLOMON: ONLY THE THERAPIST HAS WRITTEN, AND BOTH ARE STILL UNREAD.
   *
   * This exists so that "reads zero" proves the `senderId != me` exclusion
   * rather than proving the conversation was empty. Without it, removing that
   * condition broke exactly ONE test — the false-confidence shape 7.2 caught in
   * the same aggregation, where the fixture set up the wrong thing rather than
   * the assertion checking the wrong thing.
   *
   * It is also the realistic case: a therapist who wrote twice and has not been
   * read yet would otherwise see a badge of 2 against their own name.
   */
  await sendMessage('solo', 'therapist', 'Welcome, I am glad you are here.', new Date('2026-05-05T09:00:00Z'));
  await sendMessage('solo', 'therapist', 'No rush at all.', new Date('2026-05-05T09:05:00Z'));

  // 'quiet' deliberately has no messages at all.
}, 120000);

afterAll(async () => {
  await stopMemoryMongo();
}, 120000);

beforeEach(resetRateLimits);

describe('GET /therapist/clients — who may ask', () => {
  it('refuses an unauthenticated request', async () => {
    const res = await get('', NO_TOKEN);
    expect(res.status).toBe(401);
  });

  it('refuses a client', async () => {
    const res = await get('', tokens.rosa);
    expect(res.status).toBe(403);
  });

  it('refuses the admin — §11 gives them no view of a therapist relationship', async () => {
    const res = await get('', tokens.admin);
    expect(res.status).toBe(403);
  });

  it('never names the required role in the refusal', async () => {
    const res = await get('', tokens.rosa);
    const body = JSON.stringify(res.body).toLowerCase();
    expect(body).not.toContain('therapist');
    expect(body).not.toContain('admin');
  });
});

describe('GET /therapist/clients — the list', () => {
  it('returns one row per ACTIVE booking, and no others', async () => {
    const res = await get();

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4);
    expect(res.body.meta.total).toBe(4);
    expect(res.body.data.map((row) => row.name).sort()).toEqual([
      'Daniel',
      'Marta and Joris',
      'Rosa',
      'Solomon',
    ]);
  });

  it('leaves an ENDED booking out — history is not the inbox', async () => {
    const res = await get();
    expect(res.body.data.map((row) => row.name)).not.toContain('Former Client');
  });

  it('NEVER returns another therapist client', async () => {
    const res = await get();
    expect(res.body.data.map((row) => row.name)).not.toContain('Someone Else');

    const other = await get('', tokens.otherTherapist);
    expect(other.body.data).toHaveLength(1);
    expect(other.body.data[0].name).toBe('Someone Else');
  });

  it('labels a couple with BOTH partners — one account, two people (§6)', async () => {
    const res = await get();
    const couple = res.body.data.find((row) => row.bookingId === String(bookings.couple._id));
    expect(couple.name).toBe('Marta and Joris');
  });

  it('answers cleanly for a therapist with no clients at all', async () => {
    const res = await get('', tokens.lonely);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
    expect(res.body.meta.nextCursor).toBeNull();
  });
});

describe('GET /therapist/clients — unread counts (§14)', () => {
  it('counts only the other party unread messages, never your own', async () => {
    const res = await get();
    const rosa = res.body.data.find((row) => row.bookingId === String(bookings.rosa._id));

    // Four messages on this booking: one of hers already read, one of the
    // therapist own left unread, and two of hers. Only the last two count.
    expect(rosa.unreadCount).toBe(2);
  });

  it('reads zero for a conversation nobody has written in', async () => {
    const res = await get();
    const quiet = res.body.data.find((row) => row.bookingId === String(bookings.quiet._id));
    expect(quiet.unreadCount).toBe(0);
  });

  it('reads zero when only the THERAPIST has written and nothing is read yet', async () => {
    const res = await get();
    const solo = res.body.data.find((row) => row.bookingId === String(bookings.solo._id));

    // Two unread messages exist on this booking and both are the therapist own,
    // so §14 makes the badge zero. This is the case that makes "zero" mean the
    // exclusion works rather than meaning the conversation was empty.
    expect(solo.unreadCount).toBe(0);
    expect(await Message.countDocuments({ bookingId: bookings.solo._id, read: false })).toBe(2);
  });

  it('never counts another booking into a row', async () => {
    const res = await get();
    const couple = res.body.data.find((row) => row.bookingId === String(bookings.couple._id));
    expect(couple.unreadCount).toBe(1);
  });
});

describe('GET /therapist/clients — last activity', () => {
  it('reports the newest message, and says that is what it is', async () => {
    const res = await get();
    const rosa = res.body.data.find((row) => row.bookingId === String(bookings.rosa._id));

    expect(rosa.lastActivityKind).toBe(LAST_ACTIVITY_KIND.MESSAGE);
    expect(new Date(rosa.lastActivityAt).toISOString()).toBe('2026-06-02T10:05:00.000Z');
  });

  it('falls back to the matched date, and says THAT is what it is', async () => {
    const res = await get();
    const quiet = res.body.data.find((row) => row.bookingId === String(bookings.quiet._id));

    expect(quiet.lastActivityKind).toBe(LAST_ACTIVITY_KIND.MATCHED);
    expect(new Date(quiet.lastActivityAt).toISOString()).toBe('2026-03-01T09:00:00.000Z');
  });

  it('orders by most recent activity, not by when the booking was created', async () => {
    const res = await get();

    // By matchedAt the order would be solo, quiet, couple, rosa. By activity it
    // is couple (10 Jun), rosa (2 Jun), solo (5 May), quiet (matched 1 Mar) —
    // so this cannot pass by accidentally agreeing with creation order.
    expect(res.body.data.map((row) => row.bookingId)).toEqual([
      String(bookings.couple._id),
      String(bookings.rosa._id),
      String(bookings.solo._id),
      String(bookings.quiet._id),
    ]);
  });
});

describe('GET /therapist/clients — what must never travel', () => {
  it('carries NO MESSAGE TEXT — a sidebar preview is therapy content', async () => {
    const res = await get();
    const body = JSON.stringify(res.body);

    expect(body).not.toContain('zephyrine-quartzbloom');
    expect(body).not.toContain('I had a hard week');
    expect(body).not.toContain('We argued again');
  });

  it('carries NO client user id — the booking id is the only handle', async () => {
    const res = await get();
    const body = JSON.stringify(res.body);

    for (const key of ['rosa', 'couple', 'quiet', 'solo']) {
      expect(body).not.toContain(String(users[key]._id));
    }
  });

  it('carries no questionnaire answers and no subscription state', async () => {
    const res = await get();
    const body = JSON.stringify(res.body);

    expect(body).not.toContain('Anxiety');
    expect(body).not.toContain('concernTags');
    expect(body).not.toContain('subscription');
  });

  it('returns exactly the agreed keys, so a later addition has to be deliberate', async () => {
    const res = await get();

    expect(Object.keys(res.body.data[0]).sort()).toEqual([
      'bookingId',
      'lastActivityAt',
      'lastActivityKind',
      'matchedAt',
      'name',
      'unreadCount',
    ]);
  });
});

describe('GET /therapist/clients — pagination', () => {
  it('pages without repeating or skipping a row', async () => {
    const first = await get('?limit=2');

    expect(first.body.data).toHaveLength(2);
    expect(first.body.meta.hasMore).toBe(true);
    expect(first.body.meta.nextCursor).toEqual(expect.any(String));
    // The TOTAL is the whole list, not the page — the rail prints it.
    expect(first.body.meta.total).toBe(4);

    const second = await get(`?limit=2&cursor=${encodeURIComponent(first.body.meta.nextCursor)}`);

    expect(second.body.data).toHaveLength(2);
    expect(second.body.meta.hasMore).toBe(false);
    expect(second.body.meta.nextCursor).toBeNull();

    const ids = [...first.body.data, ...second.body.data].map((row) => row.bookingId);
    expect(new Set(ids).size).toBe(4);
  });

  it('refuses a cursor it did not issue', async () => {
    const res = await get('?cursor=not-a-real-cursor');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CURSOR');
  });

  it('refuses an absurd limit rather than serving everything', async () => {
    const res = await get(`?limit=${CLIENT_LIST_MAX_PAGE_SIZE + 1}`);
    expect(res.status).toBe(422);
  });

  it('ignores an unknown query key rather than refusing the request', async () => {
    const res = await get('?sneaky=1');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4);
  });
});
