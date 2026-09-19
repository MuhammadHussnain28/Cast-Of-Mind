import request from 'supertest';

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { Journal } = await import('../models/Journal.js');
const { hashPassword } = await import('../utils/password.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { SUBSCRIPTION_STATUS, SUBSCRIPTION_AMOUNT_MINOR, BOOKING_STATUS } = await import(
  '../constants/payments.js'
);
const { MOOD_TAG_MAX, JOURNAL_TEXT_MAX } = await import('../constants/journal.js');
const { loginRateLimiter, sessionRateLimiter } = await import('./auth.routes.js');
const { therapistRateLimiter } = await import('./therapist.routes.js');
const { clientRateLimiter, journalWriteRateLimiter } = await import('./client.routes.js');
const { startMemoryMongo, stopMemoryMongo } = await import('../test/mongoMemory.js');

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const DAY = 24 * 60 * 60 * 1000;
const GONE_ID = '64b7f0c2a1b2c3d4e5f60718';

const users = {};
const tokens = {};
const bookings = {};

function resetLimits() {
  LOOPBACK.forEach((key) => {
    [loginRateLimiter, sessionRateLimiter, therapistRateLimiter, clientRateLimiter,
      journalWriteRateLimiter].forEach((limiter) => limiter.resetKey(key));
  });
}

const auth = (req, token) => req.set('Authorization', `Bearer ${token}`);

const mine = (token = tokens.client) => auth(request(app).get('/api/v1/client/journal'), token);
const write = (body, token = tokens.client) =>
  auth(request(app).post('/api/v1/client/journal'), token).send(body);
const edit = (id, body, token = tokens.client) =>
  auth(request(app).patch(`/api/v1/client/journal/${id}`), token).send(body);
const drop = (id, token = tokens.client) =>
  auth(request(app).delete(`/api/v1/client/journal/${id}`), token);
const theirs = (bookingId = bookings.mine._id, token = tokens.therapist) =>
  auth(request(app).get(`/api/v1/therapist/journal/${bookingId}`), token);

async function makeUser(key, role) {
  users[key] = await User.create({
    email: `j86-${key}@example.com`,
    passwordHash: await hashPassword(PASSWORD),
    role,
    status: USER_STATUS.ACTIVE,
  });
  resetLimits();
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: `j86-${key}@example.com`, password: PASSWORD });
  tokens[key] = res.body.accessToken;
}

async function makeClientBooking(key, clientKey, therapistKey) {
  await ClientProfile.create({
    userId: users[clientKey]._id,
    type: 'individual',
    name: `Client ${clientKey}`,
    age: 31,
    gender: 'female',
    country: 'Ireland',
    city: 'Galway',
    relationshipStatus: 'Single',
    concernTags: ['Anxiety'],
    therapistGenderPreference: 'no_preference',
  });
  bookings[key] = await Booking.create({
    clientId: users[clientKey]._id,
    therapistId: users[therapistKey]._id,
  });
  await Subscription.create({
    bookingId: bookings[key]._id,
    clientId: users[clientKey]._id,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    amount: SUBSCRIPTION_AMOUNT_MINOR,
    startDate: new Date(Date.now() - 5 * DAY),
    currentPeriodEnd: new Date(Date.now() + 25 * DAY),
    nextBillingDate: new Date(Date.now() + 25 * DAY),
  });
}

const entryFixture = (bookingKey, clientKey, text, extra = {}) =>
  Journal.create({
    bookingId: bookings[bookingKey]._id,
    clientId: users[clientKey]._id,
    text,
    ...extra,
  });

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([User.init(), Booking.init(), Subscription.init(), Journal.init()]);

  await makeUser('therapist', ROLES.THERAPIST);
  await makeUser('otherTherapist', ROLES.THERAPIST);
  await makeUser('client', ROLES.CLIENT);
  await makeUser('otherClient', ROLES.CLIENT);

  await makeClientBooking('mine', 'client', 'therapist');
  await makeClientBooking('theirs', 'otherClient', 'otherTherapist');
}, 120000);

afterAll(async () => {
  await stopMemoryMongo();
}, 120000);

beforeEach(async () => {
  resetLimits();
  await Journal.deleteMany({});
  await Subscription.updateMany({}, { $set: { status: SUBSCRIPTION_STATUS.ACTIVE } });
  await Booking.updateMany({}, { $set: { status: BOOKING_STATUS.ACTIVE } });
});

describe('POST /client/journal', () => {
  it('writes an entry and never returns the author id', async () => {
    const res = await write({ text: 'Slept badly but got out for a walk.' });

    expect(res.status).toBe(201);
    expect(res.body.text).toBe('Slept badly but got out for a walk.');
    expect(res.body.moodTag).toBeNull();
    expect(res.body.editedAt).toBeNull();
    expect(JSON.stringify(res.body)).not.toContain(String(users.client._id));
    expect(Object.keys(res.body).sort()).toEqual(['createdAt', 'editedAt', 'id', 'moodTag', 'text']);
  });

  it('stores it against the client\'s own booking, taken from the token', async () => {
    await write({ text: 'A first entry about this week.' });
    const stored = await Journal.findOne({});

    expect(String(stored.bookingId)).toBe(String(bookings.mine._id));
    expect(String(stored.clientId)).toBe(String(users.client._id));
  });

  it('accepts one of the eight presets', async () => {
    const res = await write({ text: 'Felt steadier today than yesterday.', moodTag: 'Hopeful' });

    expect(res.status).toBe(201);
    expect(res.body.moodTag).toBe('Hopeful');
  });

  it('accepts a custom mood the client typed', async () => {
    const res = await write({ text: 'Hard to name it today.', moodTag: 'Restless and a bit raw' });

    expect(res.status).toBe(201);
    expect(res.body.moodTag).toBe('Restless and a bit raw');
  });

  it(`refuses a mood longer than ${MOOD_TAG_MAX} characters`, async () => {
    const res = await write({ text: 'Long mood.', moodTag: 'x'.repeat(MOOD_TAG_MAX + 1) });

    expect(res.status).toBe(422);
    expect(await Journal.countDocuments({})).toBe(0);
  });

  it('accepts a mood at exactly the limit', async () => {
    const res = await write({ text: 'Boundary mood.', moodTag: 'x'.repeat(MOOD_TAG_MAX) });

    expect(res.status).toBe(201);
  });

  it('treats an empty or blank mood as no mood at all', async () => {
    const blank = await write({ text: 'No mood given.', moodTag: '   ' });

    expect(blank.status).toBe(201);
    expect(blank.body.moodTag).toBeNull();
    expect((await Journal.findById(blank.body.id)).moodTag).toBeUndefined();
  });

  it('refuses an empty entry, and one that is only whitespace', async () => {
    expect((await write({ text: '' })).status).toBe(422);
    expect((await write({ text: '   \n  ' })).status).toBe(422);
    expect(await Journal.countDocuments({})).toBe(0);
  });

  it('refuses an entry over the length cap and accepts one exactly at it', async () => {
    expect((await write({ text: 'x'.repeat(JOURNAL_TEXT_MAX + 1) })).status).toBe(422);
    expect((await write({ text: 'x'.repeat(JOURNAL_TEXT_MAX) })).status).toBe(201);
  });

  it('refuses a therapist outright — this is the client\'s own writing space', async () => {
    const res = await write({ text: 'Not mine to write.' }, tokens.therapist);

    expect(res.status).toBe(403);
    expect(await Journal.countDocuments({})).toBe(0);
  });

  it('refuses a client whose subscription has ended', async () => {
    await Subscription.updateMany(
      { clientId: users.client._id },
      { $set: { status: SUBSCRIPTION_STATUS.EXPIRED } },
    );

    const res = await write({ text: 'Should not be saved.' });

    expect(res.status).toBe(403);
    expect(await Journal.countDocuments({})).toBe(0);
  });
});

describe('GET /client/journal', () => {
  it('returns the client\'s own entries, newest first, and nobody else\'s', async () => {
    await entryFixture('mine', 'client', 'Older of mine');
    await entryFixture('mine', 'client', 'Newer of mine');
    await entryFixture('theirs', 'otherClient', 'Somebody else entirely');

    const res = await mine();

    expect(res.status).toBe(200);
    expect(res.body.data.map((e) => e.text)).toEqual(['Newer of mine', 'Older of mine']);
    expect(res.body.meta.total).toBe(2);
    expect(JSON.stringify(res.body)).not.toContain('Somebody else entirely');
  });

  it('pages with a cursor, without overlapping or skipping', async () => {
    for (let i = 0; i < 5; i += 1) await entryFixture('mine', 'client', `Entry ${i}`);

    const first = await mine().query({ limit: 2 });
    const second = await mine().query({ limit: 2, cursor: first.body.meta.nextCursor });

    expect(first.body.data).toHaveLength(2);
    expect(first.body.meta.hasMore).toBe(true);
    const ids = [...first.body.data, ...second.body.data].map((e) => e.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('refuses an unreadable cursor', async () => {
    expect((await mine().query({ cursor: 'not-a-cursor' })).status).toBe(400);
  });

  it('is empty, not broken, for a client who has written nothing', async () => {
    const res = await mine();

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });
});

describe('PATCH /client/journal/:entryId', () => {
  it('rewrites the entry and stamps that it was edited', async () => {
    const entry = await entryFixture('mine', 'client', 'First attempt', { moodTag: 'Low' });

    const res = await edit(entry._id, { text: 'What I actually meant', moodTag: 'Steady' });

    expect(res.status).toBe(200);
    expect(res.body.text).toBe('What I actually meant');
    expect(res.body.moodTag).toBe('Steady');
    expect(res.body.editedAt).not.toBeNull();
  });

  it('can clear a mood that was set', async () => {
    const entry = await entryFixture('mine', 'client', 'Had a mood', { moodTag: 'Angry' });

    const res = await edit(entry._id, { text: 'Had a mood', moodTag: null });

    expect(res.status).toBe(200);
    expect(res.body.moodTag).toBeNull();
  });

  it('REFUSES ANOTHER CLIENT\'S ENTRY WITH THE SAME 404 AS A MADE-UP ID', async () => {
    const hers = await entryFixture('theirs', 'otherClient', 'Private to her');

    const foreign = await edit(hers._id, { text: 'Tampered' });
    const missing = await edit(GONE_ID, { text: 'Tampered' });
    const junk = await edit('not-an-id', { text: 'Tampered' });

    expect(foreign.status).toBe(404);
    expect(foreign.body).toEqual(missing.body);
    expect(foreign.body).toEqual(junk.body);
    expect((await Journal.findById(hers._id)).text).toBe('Private to her');
  });
});

/**
 * DEFENCE IN DEPTH, PROVED RATHER THAN ASSUMED.
 *
 * A booking has exactly one client today, so matching on `bookingId` alone
 * would pass every test above — which is why the mutation run broke nothing
 * until these two existed. Reassignment (deferred to v2) would make both
 * guards load-bearing, so the situations are constructed directly.
 */
describe('entry ownership is matched on all three fields', () => {
  it('refuses an entry on my booking that somebody else authored', async () => {
    const notMine = await Journal.create({
      bookingId: bookings.mine._id,
      clientId: users.otherClient._id,
      text: 'Authored by another client',
    });

    const patched = await edit(notMine._id, { text: 'Tampered' });
    const deleted = await drop(notMine._id);

    expect(patched.status).toBe(404);
    expect(deleted.status).toBe(404);
    expect((await Journal.findById(notMine._id)).text).toBe('Authored by another client');
  });

  it('refuses my own entry that belongs to a different booking', async () => {
    const elsewhere = await Journal.create({
      bookingId: bookings.theirs._id,
      clientId: users.client._id,
      text: 'Mine, but from another booking',
    });

    const patched = await edit(elsewhere._id, { text: 'Tampered' });
    const deleted = await drop(elsewhere._id);

    expect(patched.status).toBe(404);
    expect(deleted.status).toBe(404);
    expect((await Journal.findById(elsewhere._id)).text).toBe('Mine, but from another booking');
    expect((await mine()).body.data).toEqual([]);
  });
});

describe('DELETE /client/journal/:entryId', () => {
  it('removes the entry permanently', async () => {
    const entry = await entryFixture('mine', 'client', 'Written then regretted');

    const res = await drop(entry._id);

    expect(res.status).toBe(200);
    expect(await Journal.findById(entry._id)).toBeNull();
    expect((await mine()).body.data).toEqual([]);
  });

  it('takes it out of the therapist\'s view too', async () => {
    const entry = await entryFixture('mine', 'client', 'Seen then withdrawn');
    expect((await theirs()).body.data).toHaveLength(1);

    await drop(entry._id);

    expect((await theirs()).body.data).toEqual([]);
  });

  it('refuses another client\'s entry with the identical 404', async () => {
    const hers = await entryFixture('theirs', 'otherClient', 'Hers to keep');

    const foreign = await drop(hers._id);

    expect(foreign.status).toBe(404);
    expect(foreign.body).toEqual((await drop(GONE_ID)).body);
    expect(await Journal.findById(hers._id)).not.toBeNull();
  });
});

describe('GET /therapist/journal/:bookingId', () => {
  it('reads the client\'s entries, with mood and the edited stamp', async () => {
    const edited = new Date();
    await entryFixture('mine', 'client', 'How the week went', { moodTag: 'Tired', editedAt: edited });

    const res = await theirs();

    expect(res.status).toBe(200);
    expect(res.body.data[0].text).toBe('How the week went');
    expect(res.body.data[0].moodTag).toBe('Tired');
    expect(res.body.data[0].editedAt).toBe(edited.toISOString());
  });

  it('REFUSES ANOTHER THERAPIST\'S CLIENT WITH THE SAME 404 AS A MADE-UP BOOKING', async () => {
    await entryFixture('theirs', 'otherClient', 'Another therapist\'s client wrote this');

    const foreign = await theirs(bookings.theirs._id);
    const missing = await theirs(GONE_ID);
    const junk = await theirs('not-an-id');

    expect(foreign.status).toBe(404);
    expect(foreign.body).toEqual(missing.body);
    expect(foreign.body).toEqual(junk.body);
    expect(JSON.stringify(foreign.body)).not.toContain('wrote this');
  });

  it('still reads an ended booking — the record is clinically theirs', async () => {
    await entryFixture('mine', 'client', 'Written before it ended');
    await Booking.updateOne({ _id: bookings.mine._id }, { $set: { status: BOOKING_STATUS.ENDED } });

    const res = await theirs();

    expect(res.status).toBe(200);
    expect(res.body.data[0].text).toBe('Written before it ended');
  });

  it('EXPOSES NO WRITE ROUTE AT ALL — a therapist cannot touch a client\'s entry', async () => {
    const entry = await entryFixture('mine', 'client', 'Not the therapist\'s to change');
    const url = `/api/v1/therapist/journal/${bookings.mine._id}`;

    const posted = await auth(request(app).post(url), tokens.therapist).send({ text: 'Injected' });
    const patched = await auth(request(app).patch(`${url}/${entry._id}`), tokens.therapist).send({
      text: 'Rewritten',
    });
    const deleted = await auth(request(app).delete(`${url}/${entry._id}`), tokens.therapist);

    expect([posted.status, patched.status, deleted.status]).toEqual([404, 404, 404]);
    expect((await Journal.findById(entry._id)).text).toBe('Not the therapist\'s to change');
    expect(await Journal.countDocuments({})).toBe(1);
  });

  it('refuses a client on the therapist\'s journal route', async () => {
    const res = await theirs(bookings.mine._id, tokens.client);

    expect(res.status).toBe(403);
  });
});
