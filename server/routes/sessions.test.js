import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { TherapistProfile } = await import('../models/TherapistProfile.js');
const { Session } = await import('../models/Session.js');
const { Message } = await import('../models/Message.js');
const { hashPassword } = await import('../utils/password.js');
const { formatInZone } = await import('../utils/timezone.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { SUBSCRIPTION_STATUS, SUBSCRIPTION_AMOUNT_MINOR, BOOKING_STATUS } = await import(
  '../constants/payments.js'
);
const { SESSION_STATUS, SESSION_NOTE_MAX } = await import('../constants/sessions.js');
const { loginRateLimiter, sessionRateLimiter } = await import('./auth.routes.js');
const { therapistRateLimiter, therapySessionWriteRateLimiter } = await import(
  './therapist.routes.js'
);
const { sessionsReadRateLimiter } = await import('./sessions.routes.js');
const { chatReadRateLimiter } = await import('./chat.routes.js');
// A replica set: completion runs in a transaction (9.5), which a standalone refuses.
const { startMemoryReplSet: startMemoryMongo, stopMemoryMongo } = await import('../test/mongoMemory.js');

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const GONE_ID = '64b7f0c2a1b2c3d4e5f60718';
const LINK = 'https://zoom.us/j/81234567890?pwd=abc123';

const users = {};
const tokens = {};
const bookings = {};

// ── dates, found rather than hard-coded, so the suite holds on any day ──────

const pad = (n) => String(n).padStart(2, '0');
const ymd = (ms) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

const offsetOf = (ms, timeZone) =>
  new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(new Date(ms))
    .find((part) => part.type === 'timeZoneName').value;

// The first date from next week whose clocks sit at these offsets.
function findDate(londonOffset, newYorkOffset) {
  const today = new Date();
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12);
  for (let i = 7; i < 330; i += 1) {
    const noon = start + i * DAY;
    if (
      offsetOf(noon, 'Europe/London') === londonOffset &&
      offsetOf(noon, 'America/New_York') === newYorkOffset
    ) {
      return ymd(noon);
    }
  }
  throw new Error(`No date found with London ${londonOffset} and New York ${newYorkOffset}.`);
}

// The next last-Sunday-of-March, when London skips 01:00–02:00.
function nextLondonSpringGap() {
  const year = new Date().getUTCFullYear();
  for (const y of [year, year + 1]) {
    const lastOfMarch = new Date(Date.UTC(y, 3, 0));
    const day = lastOfMarch.getUTCDate() - lastOfMarch.getUTCDay();
    if (Date.UTC(y, 2, day) > Date.now() + DAY) return `${y}-03-${pad(day)}`;
  }
  throw new Error('No spring gap found.');
}

const SUMMER = findDate('GMT+1', 'GMT-4');
const WINTER = findDate('GMT', 'GMT-5');
// US clocks have moved and UK clocks have not, or the reverse.
const MISMATCH = findDate('GMT', 'GMT-4');
const GAP = nextLondonSpringGap();

// ── fixtures ────────────────────────────────────────────────────────────────

function resetLimits() {
  LOOPBACK.forEach((key) => {
    [loginRateLimiter, sessionRateLimiter, therapistRateLimiter,
      therapySessionWriteRateLimiter, sessionsReadRateLimiter, chatReadRateLimiter]
      .forEach((limiter) => limiter.resetKey(key));
  });
}

const auth = (req, token) => req.set('Authorization', `Bearer ${token}`);

const schedule = (body, token = tokens.therapist) =>
  auth(request(app).post('/api/v1/therapist/sessions'), token).send(body);
const change = (id, body, token = tokens.therapist) =>
  auth(request(app).patch(`/api/v1/therapist/sessions/${id}`), token).send(body);
const cancel = (id, token = tokens.therapist) =>
  auth(request(app).delete(`/api/v1/therapist/sessions/${id}`), token);
const list = (bookingId, token = tokens.therapist, query = '') =>
  auth(request(app).get(`/api/v1/sessions/${bookingId}${query}`), token);

const valid = (overrides = {}) => ({
  bookingId: String(bookings.mine._id),
  date: SUMMER,
  time: '15:00',
  zoomLink: LINK,
  ...overrides,
});

const sessionFixture = (bookingKey, scheduledAt, extra = {}) =>
  Session.create({
    bookingId: bookings[bookingKey]._id,
    scheduledAt,
    zoomLink: LINK,
    ...extra,
  });

async function makeUser(key, role) {
  users[key] = await User.create({
    email: `s91-${key}@example.com`,
    passwordHash: await hashPassword(PASSWORD),
    role,
    status: USER_STATUS.ACTIVE,
  });
  resetLimits();
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: `s91-${key}@example.com`, password: PASSWORD });
  tokens[key] = res.body.accessToken;
}

async function makeTherapistProfile(key, timezone) {
  await TherapistProfile.create({
    userId: users[key]._id,
    applicationId: new mongoose.Types.ObjectId(),
    title: 'Dr.',
    firstName: 'Priya',
    lastName: 'Raman',
    gender: 'female',
    dateOfBirth: new Date('1985-04-02'),
    photoUrl: 'https://res.cloudinary.com/test/image/upload/p.jpg',
    streetAddress: '1 Quay Street',
    city: 'London',
    stateProvince: 'Greater London',
    zipPostal: 'EC1',
    country: 'United Kingdom',
    timezone,
    therapistType: 'Clinical Psychologist',
    credentialType: 'Diploma/Degree',
    credentialInitials: 'PhD',
    yearsExperience: 9,
    educationSummary: 'Doctorate in clinical psychology.',
    currentWorkSituation: 'Private practice.',
    languages: ['English'],
    specialtyTags: ['Anxiety', 'Depression', 'Stress'],
    treatmentOrientations: ['CBT'],
    bio: 'Works with anxiety and low mood.',
    licensingStatus: 'Licensed in the UK.',
    disciplinaryActions: false,
    malpracticeInsurance: true,
    workingHours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: false, start: '', end: '' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '13:00' },
      saturday: { enabled: false, start: '', end: '' },
      sunday: { enabled: false, start: '', end: '' },
    },
    certificateUrl1: 'https://res.cloudinary.com/test/image/authenticated/c1',
    certificatePublicId1: 'cast-of-mind/certs/c1',
  });
}

async function makeClientBooking(key, clientKey, therapistKey) {
  await ClientProfile.create({
    userId: users[clientKey]._id,
    type: 'individual',
    name: `Client ${clientKey}`,
    age: 34,
    gender: 'female',
    country: 'United States',
    city: 'New York',
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

const setSubscription = (clientKey, fields) =>
  Subscription.updateOne({ clientId: users[clientKey]._id }, { $set: fields });

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([User.init(), Booking.init(), Subscription.init(), Session.init(), Message.init()]);

  await makeUser('therapist', ROLES.THERAPIST);
  await makeUser('otherTherapist', ROLES.THERAPIST);
  await makeUser('kolkataTherapist', ROLES.THERAPIST);
  await makeUser('bareTherapist', ROLES.THERAPIST);
  await makeUser('client', ROLES.CLIENT);
  await makeUser('otherClient', ROLES.CLIENT);
  await makeUser('kolkataClient', ROLES.CLIENT);
  await makeUser('bareClient', ROLES.CLIENT);
  await makeUser('admin', ROLES.ADMIN);

  await makeTherapistProfile('therapist', 'Europe/London');
  await makeTherapistProfile('otherTherapist', 'Europe/London');
  await makeTherapistProfile('kolkataTherapist', 'Asia/Kolkata');
  // bareTherapist has no profile, so no timezone.

  await makeClientBooking('mine', 'client', 'therapist');
  await makeClientBooking('theirs', 'otherClient', 'otherTherapist');
  await makeClientBooking('kolkata', 'kolkataClient', 'kolkataTherapist');
  await makeClientBooking('bare', 'bareClient', 'bareTherapist');
}, 180000);

afterAll(async () => {
  await stopMemoryMongo();
}, 120000);

beforeEach(async () => {
  resetLimits();
  await Session.deleteMany({});
  await Message.deleteMany({});
  await Subscription.updateMany(
    {},
    {
      $set: {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 25 * DAY),
        sessionsRemaining: 4,
      },
    },
  );
  await Booking.updateMany({}, { $set: { status: BOOKING_STATUS.ACTIVE } });
});

/* ────────────────────────────────────────────────────────────────────────────
 * THE RULE: store one UTC instant, show each reader their own clock (§15).
 * ──────────────────────────────────────────────────────────────────────────── */

describe('POST /therapist/sessions — the time', () => {
  it("THE BRIEF'S CASE: 3 PM in London is stored as UTC and reads 10 AM in New York", async () => {
    const res = await schedule(valid({ date: SUMMER, time: '15:00' }));

    expect(res.status).toBe(201);
    expect(res.body.scheduledAt).toBe(`${SUMMER}T14:00:00.000Z`);
    expect(res.body.therapistTimezone).toBe('Europe/London');

    const stored = await Session.findOne({});
    expect(stored.scheduledAt.toISOString()).toBe(`${SUMMER}T14:00:00.000Z`);

    const inNewYork = formatInZone(stored.scheduledAt, 'America/New_York', { locale: 'en-US' });
    expect(inNewYork.time.replace(/\s/g, ' ')).toBe('10:00 AM');
    expect(inNewYork.zone).toBe('EDT');

    const inLondon = formatInZone(stored.scheduledAt, 'Europe/London');
    expect(inLondon.time).toBe('15:00');
    expect(inLondon.zone).toBe('BST');
  });

  it('in winter the same 3 PM is a different UTC hour, and still 10 AM in New York', async () => {
    const res = await schedule(valid({ date: WINTER }));

    expect(res.body.scheduledAt).toBe(`${WINTER}T15:00:00.000Z`);
    const inNewYork = formatInZone(res.body.scheduledAt, 'America/New_York', { locale: 'en-US' });
    expect(inNewYork.time.replace(/\s/g, ' ')).toBe('10:00 AM');
    expect(inNewYork.zone).toBe('EST');
  });

  it('in the weeks the two countries change clocks apart, 3 PM London is 11 AM New York', async () => {
    const res = await schedule(valid({ date: MISMATCH }));

    expect(res.body.scheduledAt).toBe(`${MISMATCH}T15:00:00.000Z`);
    const inNewYork = formatInZone(res.body.scheduledAt, 'America/New_York', { locale: 'en-US' });
    expect(inNewYork.time.replace(/\s/g, ' ')).toBe('11:00 AM');
  });

  it("THE ZONE IS THE THERAPIST'S PROFILE: the same 3 PM from Kolkata is a different instant", async () => {
    const res = await schedule(
      valid({ bookingId: String(bookings.kolkata._id), date: SUMMER }),
      tokens.kolkataTherapist,
    );

    expect(res.status).toBe(201);
    expect(res.body.scheduledAt).toBe(`${SUMMER}T09:30:00.000Z`);
    expect(res.body.therapistTimezone).toBe('Asia/Kolkata');
  });

  it.each([
    ['timezone', { timezone: 'America/New_York' }],
    ['scheduledAt', { scheduledAt: `${SUMMER}T15:00:00.000Z` }],
    ['status', { status: SESSION_STATUS.COMPLETED }],
  ])('refuses a %s sent in the body, and stores nothing', async (_field, extra) => {
    const res = await schedule(valid(extra));

    expect(res.status).toBe(422);
    expect(await Session.countDocuments({})).toBe(0);
  });

  it('refuses a time the clocks skip, and says how to fix it', async () => {
    const res = await schedule(valid({ date: GAP, time: '01:30' }));

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('SESSION_TIME_NONEXISTENT');
    expect(res.body.error.message).toMatch(/clocks go forward/);
    expect(await Session.countDocuments({})).toBe(0);
  });

  it('refuses a time already past', async () => {
    const res = await schedule(valid({ date: ymd(Date.now() - 2 * DAY) }));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('SESSION_TIME_IN_PAST');
  });

  it('refuses a date more than a year ahead', async () => {
    const res = await schedule(valid({ date: ymd(Date.now() + 400 * DAY) }));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('SESSION_TIME_TOO_FAR');
  });

  it('refuses a date that does not exist', async () => {
    const res = await schedule(valid({ date: '2027-02-30' }));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('SESSION_DATE_INVALID');
  });

  it('refuses a therapist with no timezone on their profile, rather than guessing', async () => {
    const res = await schedule(
      valid({ bookingId: String(bookings.bare._id) }),
      tokens.bareTherapist,
    );
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('THERAPIST_TIMEZONE_MISSING');
    expect(await Session.countDocuments({})).toBe(0);
  });
});

describe('POST /therapist/sessions — who and what', () => {
  it('returns the session with no user id anywhere', async () => {
    const res = await schedule(valid({ note: 'Bring the worksheet.' }));

    expect(Object.keys(res.body).sort()).toEqual(
      ['bookingId', 'cancelledAt', 'createdAt', 'id', 'joinClosesAt', 'joinOpensAt', 'note',
        'notHeldAt', 'scheduledAt', 'status', 'therapistTimezone', 'updatedAt', 'warning',
        'zoomLink'].sort(),
    );
    expect(res.body.status).toBe(SESSION_STATUS.SCHEDULED);
    expect(res.body.zoomLink).toBe(LINK);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain(String(users.therapist._id));
    expect(body).not.toContain(String(users.client._id));
  });

  it("refuses another therapist's client, a made-up id and junk with the same 404", async () => {
    const responses = await Promise.all([
      schedule(valid({ bookingId: String(bookings.theirs._id) })),
      schedule(valid({ bookingId: GONE_ID })),
      schedule(valid({ bookingId: 'not-an-id' })),
    ]);

    for (const res of responses) expect(res.status).toBe(404);
    expect(responses[0].body).toEqual(responses[1].body);
    expect(responses[1].body).toEqual(responses[2].body);
    expect(await Session.countDocuments({})).toBe(0);
  });

  it('refuses a booking that has ended', async () => {
    await Booking.updateOne({ _id: bookings.mine._id }, { $set: { status: BOOKING_STATUS.ENDED } });
    const res = await schedule(valid());
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SESSION_BOOKING_ENDED');
  });

  it('refuses a client whose subscription has ended', async () => {
    await setSubscription('client', { status: SUBSCRIPTION_STATUS.EXPIRED });
    const res = await schedule(valid());
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SESSION_CLIENT_SUBSCRIPTION_ENDED');
  });

  it('refuses a cancelled subscription once its paid period is over', async () => {
    await setSubscription('client', {
      status: SUBSCRIPTION_STATUS.CANCELLED,
      currentPeriodEnd: new Date(Date.now() - DAY),
    });
    expect((await schedule(valid())).status).toBe(409);
  });

  it.each([
    ['past due', { status: SUBSCRIPTION_STATUS.PAST_DUE }],
    ['cancelled but still paid for', { status: SUBSCRIPTION_STATUS.CANCELLED }],
  ])('schedules a client who is %s — they still have access (§13)', async (_label, fields) => {
    await setSubscription('client', fields);
    expect((await schedule(valid())).status).toBe(201);
  });

  it.each([
    'https://us02web.zoom.us/j/81234567890',
    'https://acme.zoom.us/my/dr.raman',
    'https://zoomgov.com/j/1612345678',
    'https://meet.google.com/abc-defg-hij',
  ])('accepts %s', async (zoomLink) => {
    const res = await schedule(valid({ zoomLink }));
    expect(res.status).toBe(201);
    expect(res.body.zoomLink).toBe(zoomLink);
  });

  it.each([
    'http://zoom.us/j/81234567890',
    'https://zoom.us.evil.example/j/1',
    'https://x.meet.google.com/abc-defg-hij',
    'https://teams.microsoft.com/l/meetup-join/1',
    'https://zoom.us@evil.example/j/1',
  ])('refuses %s, and stores nothing', async (zoomLink) => {
    const res = await schedule(valid({ zoomLink }));
    expect(res.status).toBe(422);
    expect(JSON.stringify(res.body)).not.toContain(zoomLink);
    expect(await Session.countDocuments({})).toBe(0);
  });

  it('stores the note trimmed, and an empty note as none', async () => {
    const withNote = await schedule(valid({ note: '  Bring the worksheet.  ' }));
    expect(withNote.body.note).toBe('Bring the worksheet.');

    const empty = await schedule(valid({ time: '16:00', note: '' }));
    expect(empty.body.note).toBeNull();
    expect((await Session.findById(empty.body.id)).note).toBeUndefined();
  });

  it('refuses a note over the limit', async () => {
    const res = await schedule(valid({ note: 'x'.repeat(SESSION_NOTE_MAX + 1) }));
    expect(res.status).toBe(422);
  });

  it('a client cannot schedule, and neither can the admin', async () => {
    const asClient = await schedule(valid(), tokens.client);
    const asAdmin = await schedule(valid(), tokens.admin);

    expect(asClient.status).toBe(403);
    expect(asAdmin.status).toBe(403);
    expect(await Session.countDocuments({})).toBe(0);
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * GET /sessions/:bookingId — both roles read, nobody else.
 * ──────────────────────────────────────────────────────────────────────────── */

describe('GET /sessions/:bookingId — access', () => {
  it('the client and their therapist read the same sessions', async () => {
    await sessionFixture('mine', new Date(Date.now() + DAY));

    const asTherapist = await list(bookings.mine._id, tokens.therapist);
    const asClient = await list(bookings.mine._id, tokens.client);

    expect(asTherapist.status).toBe(200);
    expect(asClient.status).toBe(200);
    expect(asClient.body.data).toHaveLength(1);
    // Identical but for the link, which a client gets only inside the Join window (9.4).
    const { zoomLink: clientLink, ...clientRest } = asClient.body.data[0];
    const { zoomLink: therapistLink, ...therapistRest } = asTherapist.body.data[0];
    expect(clientRest).toEqual(therapistRest);
    expect(clientLink).toBeNull();
    expect(therapistLink).toBe(LINK);
    expect(clientRest.therapistTimezone).toBe('Europe/London');
  });

  it("carries the therapist's zone even when there are no sessions yet (9.2)", async () => {
    const res = await list(bookings.mine._id, tokens.therapist);

    expect(res.body.data).toEqual([]);
    expect(res.body.meta.therapistTimezone).toBe('Europe/London');
  });

  it('never sends a user id', async () => {
    await sessionFixture('mine', new Date(Date.now() + DAY));
    const body = JSON.stringify((await list(bookings.mine._id, tokens.client)).body);

    expect(body).not.toContain(String(users.therapist._id));
    expect(body).not.toContain(String(users.client._id));
  });

  it('refuses the admin', async () => {
    expect((await list(bookings.mine._id, tokens.admin)).status).toBe(403);
  });

  it('shuts out an expired client, while their therapist can still read', async () => {
    await sessionFixture('mine', new Date(Date.now() + DAY));
    await setSubscription('client', { status: SUBSCRIPTION_STATUS.EXPIRED });

    const asClient = await list(bookings.mine._id, tokens.client);
    expect(asClient.status).toBe(403);
    expect(asClient.body.error.code).toBe('SUBSCRIPTION_ENDED');

    const asTherapist = await list(bookings.mine._id, tokens.therapist);
    expect(asTherapist.status).toBe(200);
    expect(asTherapist.body.data).toHaveLength(1);
  });

  it("gives the same 404 for someone else's booking, a made-up one and junk", async () => {
    await sessionFixture('theirs', new Date(Date.now() + DAY));

    const responses = await Promise.all([
      list(bookings.theirs._id, tokens.client),
      list(GONE_ID, tokens.client),
      list('not-an-id', tokens.client),
      list(bookings.theirs._id, tokens.therapist),
    ]);

    for (const res of responses) {
      expect(res.status).toBe(404);
      expect(res.body).toEqual(responses[0].body);
      expect(JSON.stringify(res.body)).not.toContain(LINK);
    }
  });

  it('a client has no write route at all', async () => {
    const therapySession = await sessionFixture('mine', new Date(Date.now() + DAY));

    const responses = await Promise.all([
      change(therapySession._id, { note: 'Moved by the client.' }, tokens.client),
      cancel(therapySession._id, tokens.client),
      auth(request(app).post(`/api/v1/sessions/${bookings.mine._id}`), tokens.client).send({}),
    ]);

    expect(responses[0].status).toBe(403);
    expect(responses[1].status).toBe(403);
    expect(responses[2].status).toBe(404);
    const stored = await Session.findById(therapySession._id);
    expect(stored.status).toBe(SESSION_STATUS.SCHEDULED);
    expect(stored.note).toBeUndefined();
  });
});

describe('GET /sessions/:bookingId — upcoming and history', () => {
  let rows;

  beforeEach(async () => {
    const now = Date.now();
    rows = {
      completed: await sessionFixture('mine', new Date(now - 3 * DAY), {
        status: SESSION_STATUS.COMPLETED,
      }),
      longAgo: await sessionFixture('mine', new Date(now - 2 * HOUR)),
      running: await sessionFixture('mine', new Date(now - 30 * MINUTE)),
      tomorrow: await sessionFixture('mine', new Date(now + DAY)),
      cancelled: await sessionFixture('mine', new Date(now + 2 * DAY), {
        status: SESSION_STATUS.CANCELLED,
        cancelledAt: new Date(),
      }),
      nextWeek: await sessionFixture('mine', new Date(now + 5 * DAY)),
    };
  });

  const ids = (res) => res.body.data.map((row) => row.id);

  it('upcoming is soonest first, and keeps a session that is running now', async () => {
    const res = await list(bookings.mine._id);

    expect(res.body.meta.scope).toBe('upcoming');
    expect(ids(res)).toEqual([rows.running.id, rows.tomorrow.id, rows.nextWeek.id]);
  });

  it('history is newest first, and includes a cancelled session still ahead', async () => {
    const res = await list(bookings.mine._id, tokens.client, '?scope=history');

    expect(ids(res)).toEqual([rows.cancelled.id, rows.longAgo.id, rows.completed.id]);
  });

  it('only a scheduled session carries its link', async () => {
    const history = (await list(bookings.mine._id, tokens.therapist, '?scope=history')).body.data;
    const byId = Object.fromEntries(history.map((row) => [row.id, row]));

    expect(byId[rows.cancelled.id].zoomLink).toBeNull();
    expect(byId[rows.completed.id].zoomLink).toBeNull();
    // Past its Join window, so the read completed it first (9.5): no link either.
    expect(byId[rows.longAgo.id].status).toBe(SESSION_STATUS.COMPLETED);
    expect(byId[rows.longAgo.id].zoomLink).toBeNull();
    expect(byId[rows.cancelled.id].cancelledAt).not.toBeNull();
  });

  it('pages with a cursor, never repeating or skipping', async () => {
    const first = await list(bookings.mine._id, tokens.therapist, '?limit=2');
    expect(first.body.meta.hasMore).toBe(true);

    const second = await list(
      bookings.mine._id,
      tokens.therapist,
      `?limit=2&cursor=${first.body.meta.nextCursor}`,
    );
    expect(second.body.meta.hasMore).toBe(false);
    expect(second.body.meta.nextCursor).toBeNull();

    expect([...ids(first), ...ids(second)]).toEqual([
      rows.running.id,
      rows.tomorrow.id,
      rows.nextWeek.id,
    ]);
  });

  it('pages history the same way', async () => {
    const first = await list(bookings.mine._id, tokens.therapist, '?scope=history&limit=2');
    const second = await list(
      bookings.mine._id,
      tokens.therapist,
      `?scope=history&limit=2&cursor=${first.body.meta.nextCursor}`,
    );

    expect([...ids(first), ...ids(second)]).toEqual([
      rows.cancelled.id,
      rows.longAgo.id,
      rows.completed.id,
    ]);
  });

  it.each([
    ['an unreadable cursor', '?cursor=not-a-cursor', 400],
    ['an unknown scope', '?scope=everything', 422],
    ['a limit of zero', '?limit=0', 422],
    ['an absurd limit', '?limit=5000', 422],
  ])('refuses %s', async (_label, query, status) => {
    expect((await list(bookings.mine._id, tokens.therapist, query)).status).toBe(status);
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * PATCH and DELETE — the therapist changes or cancels; the record survives.
 * ──────────────────────────────────────────────────────────────────────────── */

describe('PATCH /therapist/sessions/:id', () => {
  let therapySession;

  beforeEach(async () => {
    therapySession = await sessionFixture('mine', new Date(Date.now() + 3 * DAY), {
      note: 'Bring the worksheet.',
    });
  });

  it('reschedules in the therapist\'s own zone, and stamps updatedAt', async () => {
    const res = await change(therapySession._id, { date: WINTER, time: '09:15' });

    expect(res.status).toBe(200);
    expect(res.body.scheduledAt).toBe(`${WINTER}T09:15:00.000Z`);
    expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(
      therapySession.updatedAt.getTime(),
    );
  });

  it('changes the link alone, leaving the time', async () => {
    const res = await change(therapySession._id, { zoomLink: 'https://meet.google.com/abc-defg-hij' });

    expect(res.body.zoomLink).toBe('https://meet.google.com/abc-defg-hij');
    expect(res.body.scheduledAt).toBe(therapySession.scheduledAt.toISOString());
  });

  it('clears the note with null', async () => {
    const res = await change(therapySession._id, { note: null });

    expect(res.body.note).toBeNull();
    expect((await Session.findById(therapySession._id)).note).toBeUndefined();
  });

  it.each([
    ['a status', { status: SESSION_STATUS.COMPLETED }],
    // A literal id: it.each tables are built before beforeAll runs.
    ['a booking', { bookingId: GONE_ID }],
    ['a timezone', { timezone: 'UTC' }],
    ['nothing at all', {}],
    ['a date without a time', { date: WINTER }],
    ['a bad link', { zoomLink: 'https://example.com/j/1' }],
  ])('refuses %s, and changes nothing', async (_label, body) => {
    const res = await change(therapySession._id, body);

    expect(res.status).toBe(422);
    const stored = await Session.findById(therapySession._id);
    expect(stored.status).toBe(SESSION_STATUS.SCHEDULED);
    expect(String(stored.bookingId)).toBe(String(bookings.mine._id));
    expect(stored.zoomLink).toBe(LINK);
  });

  it('refuses a time the clocks skip, and one already past', async () => {
    const gap = await change(therapySession._id, { date: GAP, time: '01:30' });
    const past = await change(therapySession._id, { date: ymd(Date.now() - 2 * DAY), time: '10:00' });

    expect(gap.body.error.code).toBe('SESSION_TIME_NONEXISTENT');
    expect(past.body.error.code).toBe('SESSION_TIME_IN_PAST');
  });

  it.each([SESSION_STATUS.CANCELLED, SESSION_STATUS.COMPLETED])(
    'refuses to change a %s session',
    async (status) => {
      await Session.updateOne(
        { _id: therapySession._id },
        {
          $set: {
            status,
            ...(status === SESSION_STATUS.CANCELLED ? { cancelledAt: new Date() } : {}),
          },
        },
      );
      const res = await change(therapySession._id, { note: 'Too late.' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('SESSION_NOT_EDITABLE');
    },
  );

  it('refuses when the booking has ended', async () => {
    await Booking.updateOne({ _id: bookings.mine._id }, { $set: { status: BOOKING_STATUS.ENDED } });
    expect((await change(therapySession._id, { note: 'Late.' })).status).toBe(409);
  });

  it("gives the same 404 for another therapist's session, a made-up one and junk", async () => {
    const responses = await Promise.all([
      change(therapySession._id, { note: 'Not mine.' }, tokens.otherTherapist),
      change(GONE_ID, { note: 'Not mine.' }),
      change('not-an-id', { note: 'Not mine.' }),
    ]);

    for (const res of responses) {
      expect(res.status).toBe(404);
      expect(res.body).toEqual(responses[0].body);
    }
    expect((await Session.findById(therapySession._id)).note).toBe('Bring the worksheet.');
  });
});

describe('DELETE /therapist/sessions/:id', () => {
  let therapySession;

  beforeEach(async () => {
    therapySession = await sessionFixture('mine', new Date(Date.now() + 3 * DAY));
  });

  it('cancels without deleting, and hides the link', async () => {
    const res = await cancel(therapySession._id);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(SESSION_STATUS.CANCELLED);
    expect(res.body.cancelledAt).not.toBeNull();
    expect(res.body.zoomLink).toBeNull();

    const stored = await Session.findById(therapySession._id);
    expect(stored).not.toBeNull();
    expect(stored.status).toBe(SESSION_STATUS.CANCELLED);
    expect(stored.zoomLink).toBe(LINK);
  });

  it('cancelling twice is fine, and keeps the first date', async () => {
    const first = await cancel(therapySession._id);
    const second = await cancel(therapySession._id);

    expect(second.status).toBe(200);
    expect(second.body.cancelledAt).toBe(first.body.cancelledAt);
  });

  it('refuses to cancel a completed session', async () => {
    await Session.updateOne(
      { _id: therapySession._id },
      { $set: { status: SESSION_STATUS.COMPLETED } },
    );
    const res = await cancel(therapySession._id);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SESSION_NOT_CANCELLABLE');
  });

  it("still cancels after the client's subscription has ended", async () => {
    await setSubscription('client', { status: SUBSCRIPTION_STATUS.EXPIRED });
    expect((await cancel(therapySession._id)).status).toBe(200);
  });

  it("refuses another therapist's session with the same 404, and leaves it alone", async () => {
    const theirs = await cancel(therapySession._id, tokens.otherTherapist);
    const gone = await cancel(GONE_ID);

    expect(theirs.status).toBe(404);
    expect(theirs.body).toEqual(gone.body);
    expect((await Session.findById(therapySession._id)).status).toBe(SESSION_STATUS.SCHEDULED);
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * 9.3 — THE CHAT NOTICE. The client hears about a session where they already look.
 * ──────────────────────────────────────────────────────────────────────────── */

describe('session notices in the chat (9.3)', () => {
  const notices = () => Message.find({ type: 'system' }).sort({ createdAt: 1, _id: 1 });
  const thread = (token) =>
    auth(request(app).get(`/api/v1/chat/${bookings.mine._id}/messages`), token);
  const unread = (token) => auth(request(app).get('/api/v1/chat/unread-count'), token);

  it('scheduling posts one notice, sent as the therapist, with the time as data only', async () => {
    const res = await schedule(valid());
    const all = await notices();

    expect(all).toHaveLength(1);
    const [notice] = all;
    expect(String(notice.bookingId)).toBe(String(bookings.mine._id));
    expect(String(notice.senderId)).toBe(String(users.therapist._id));
    expect(notice.session.event).toBe('scheduled');
    expect(String(notice.session.sessionId)).toBe(res.body.id);
    expect(notice.session.scheduledAt.toISOString()).toBe(res.body.scheduledAt);
    // No time baked into the words: each reader's screen formats it in their own zone.
    expect(notice.text).toBe('Session scheduled.');
  });

  it("raises the client's unread count, never the therapist's", async () => {
    await schedule(valid());

    expect((await unread(tokens.client)).body.total).toBe(1);
    expect((await unread(tokens.therapist)).body.total).toBe(0);
  });

  it('both people read the same notice, with no link and no user id in it', async () => {
    const res = await schedule(valid());

    for (const token of [tokens.client, tokens.therapist]) {
      const page = await thread(token);
      const notice = page.body.data.find((m) => m.type === 'system');
      expect(notice.session).toEqual({
        sessionId: res.body.id,
        event: 'scheduled',
        scheduledAt: res.body.scheduledAt,
        previousScheduledAt: null,
      });
      const body = JSON.stringify(notice);
      expect(body).not.toContain('zoom.us');
      expect(body).not.toContain('pwd=');
      expect(body).not.toContain(String(users.therapist._id));
      expect(body).not.toContain(String(users.client._id));
    }
  });

  it("does not count as the client's opening message", async () => {
    await schedule(valid());
    expect((await thread(tokens.client)).body.meta.awaitingOpeningMessage).toBe(true);
  });

  it('moving the time posts a notice carrying the old time too', async () => {
    const created = await schedule(valid());
    const moved = await change(created.body.id, { date: WINTER, time: '09:15' });

    const all = await notices();
    expect(all).toHaveLength(2);
    expect(all[1].session.event).toBe('rescheduled');
    expect(all[1].session.scheduledAt.toISOString()).toBe(moved.body.scheduledAt);
    expect(all[1].session.previousScheduledAt.toISOString()).toBe(created.body.scheduledAt);
  });

  it('a link or note edit posts nothing, and neither does re-sending the same time', async () => {
    const created = await schedule(valid());
    await change(created.body.id, { note: 'Bring the worksheet.' });
    await change(created.body.id, { zoomLink: 'https://meet.google.com/abc-defg-hij' });
    await change(created.body.id, { date: SUMMER, time: '15:00' });

    expect(await notices()).toHaveLength(1);
  });

  it('cancelling posts one notice; cancelling again posts nothing', async () => {
    const created = await schedule(valid());
    await cancel(created.body.id);
    await cancel(created.body.id);

    const all = await notices();
    expect(all.map((m) => m.session.event)).toEqual(['scheduled', 'cancelled']);
  });

  describe('A CHAT FAILURE NEVER UNDOES THE SESSION', () => {
    let failSave;
    let log;

    beforeEach(() => {
      failSave = () =>
        jest
          .spyOn(Message, 'create')
          .mockRejectedValueOnce(Object.assign(new Error('boom zoom.us pwd=abc'), { name: 'MongoServerError' }));
      log = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const logged = () => log.mock.calls.map((call) => call.join(' ')).join(' | ');

    it('scheduling still succeeds, and the log holds no content', async () => {
      failSave();
      const res = await schedule(valid({ note: 'Bring the worksheet.' }));

      expect(res.status).toBe(201);
      expect(await Session.countDocuments({})).toBe(1);
      expect(await Message.countDocuments({})).toBe(0);
      expect(logged()).toMatch(/chat notice failed: scheduled/);
      expect(logged()).not.toMatch(/boom|zoom\.us|pwd=|Bring the worksheet/);
    });

    it('a move still lands', async () => {
      const created = await schedule(valid());
      failSave();
      const moved = await change(created.body.id, { date: WINTER, time: '09:15' });

      expect(moved.status).toBe(200);
      expect((await Session.findById(created.body.id)).scheduledAt.toISOString()).toBe(
        `${WINTER}T09:15:00.000Z`,
      );
      expect(logged()).toMatch(/chat notice failed: rescheduled/);
    });

    it('a cancel still lands', async () => {
      const created = await schedule(valid());
      failSave();
      const res = await cancel(created.body.id);

      expect(res.status).toBe(200);
      expect((await Session.findById(created.body.id)).status).toBe(SESSION_STATUS.CANCELLED);
      expect(logged()).toMatch(/chat notice failed: cancelled/);
    });
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * 9.4 — THE JOIN WINDOW. The client gets the link only when it is time to use it.
 * ──────────────────────────────────────────────────────────────────────────── */

describe('the Join window (9.4)', () => {
  const at = (ms) => new Date(Date.now() + ms);
  const linkFor = async (token, scope = '') =>
    (await list(bookings.mine._id, token, scope)).body.data[0]?.zoomLink ?? null;

  it('opens 10 minutes before the start and closes on the upcoming boundary', async () => {
    const start = at(3 * DAY);
    await sessionFixture('mine', start);
    const [row] = (await list(bookings.mine._id, tokens.client)).body.data;

    expect(new Date(row.joinOpensAt).getTime()).toBe(start.getTime() - 10 * MINUTE);
    expect(new Date(row.joinClosesAt).getTime()).toBe(start.getTime() + 60 * MINUTE);
  });

  it('carries no window on a cancelled or completed session', async () => {
    await sessionFixture('mine', at(-3 * DAY), { status: SESSION_STATUS.COMPLETED });
    await sessionFixture('mine', at(2 * DAY), { status: SESSION_STATUS.CANCELLED, cancelledAt: new Date() });

    for (const row of (await list(bookings.mine._id, tokens.client, '?scope=history')).body.data) {
      expect(row.joinOpensAt).toBeNull();
      expect(row.joinClosesAt).toBeNull();
      expect(row.zoomLink).toBeNull();
    }
  });

  it.each([
    ['a day before', DAY, false],
    ['11 minutes before', 11 * MINUTE, false],
    ['9 minutes before', 9 * MINUTE, true],
  ])('a client %s: link %s', async (_label, ahead, visible) => {
    await sessionFixture('mine', at(ahead));
    expect(await linkFor(tokens.client)).toBe(visible ? LINK : null);
  });

  it('a client gets the link while the session is running', async () => {
    await sessionFixture('mine', at(-30 * MINUTE));
    expect(await linkFor(tokens.client)).toBe(LINK);
  });

  it('a client gets no link once the window has closed', async () => {
    await sessionFixture('mine', at(-2 * HOUR));
    expect(await linkFor(tokens.client, '?scope=history')).toBeNull();
  });

  it('the therapist always gets the link of a scheduled session', async () => {
    await sessionFixture('mine', at(DAY));
    expect(await linkFor(tokens.therapist)).toBe(LINK);
  });

  it('A CLIENT CAN WRITE NOTHING, on any route or verb', async () => {
    const therapySession = await sessionFixture('mine', at(DAY), { note: 'Bring the worksheet.' });
    const id = String(therapySession._id);
    const c = (req) => auth(req, tokens.client);
    const body = { bookingId: String(bookings.mine._id), date: SUMMER, time: '15:00', zoomLink: LINK };

    const responses = await Promise.all([
      c(request(app).post('/api/v1/therapist/sessions')).send(body),
      c(request(app).patch(`/api/v1/therapist/sessions/${id}`)).send({ note: 'Moved by me.' }),
      c(request(app).delete(`/api/v1/therapist/sessions/${id}`)),
      c(request(app).post(`/api/v1/sessions/${bookings.mine._id}`)).send(body),
      c(request(app).put(`/api/v1/sessions/${bookings.mine._id}`)).send(body),
      c(request(app).patch(`/api/v1/sessions/${bookings.mine._id}`)).send(body),
      c(request(app).delete(`/api/v1/sessions/${bookings.mine._id}`)),
    ]);

    for (const res of responses) expect([403, 404]).toContain(res.status);
    expect(await Session.countDocuments({})).toBe(1);
    const stored = await Session.findById(id);
    expect(stored.status).toBe(SESSION_STATUS.SCHEDULED);
    expect(stored.note).toBe('Bring the worksheet.');
  });
});
