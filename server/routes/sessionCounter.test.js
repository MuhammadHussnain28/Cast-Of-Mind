import request from 'supertest';
import mongoose from 'mongoose';

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { TherapistProfile } = await import('../models/TherapistProfile.js');
const { Session } = await import('../models/Session.js');
const { Message } = await import('../models/Message.js');
const { hashPassword } = await import('../utils/password.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { SUBSCRIPTION_STATUS, SUBSCRIPTION_AMOUNT_MINOR } = await import('../constants/payments.js');
const { SESSION_STATUS } = await import('../constants/sessions.js');
const counter = await import('../services/sessionCounter.service.js');
const { loginRateLimiter, sessionRateLimiter } = await import('./auth.routes.js');
const { therapistRateLimiter, therapySessionWriteRateLimiter } = await import('./therapist.routes.js');
const { sessionsReadRateLimiter } = await import('./sessions.routes.js');
const { clientRateLimiter } = await import('./client.routes.js');
// Completion runs in a transaction, which only a replica set supports.
const { startMemoryReplSet, stopMemoryMongo } = await import('../test/mongoMemory.js');

// §13's session counter (9.5): down by one when a session completes, never below
// 0, never above 4, 4 on renewal, 0 when the subscription ends.

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const LINK = 'https://zoom.us/j/81234567890';

const users = {};
const tokens = {};
const bookings = {};

function resetLimits() {
  LOOPBACK.forEach((key) => {
    [loginRateLimiter, sessionRateLimiter, therapistRateLimiter, therapySessionWriteRateLimiter,
      sessionsReadRateLimiter, clientRateLimiter].forEach((limiter) => limiter.resetKey(key));
  });
}

const auth = (req, token) => req.set('Authorization', `Bearer ${token}`);
const list = (token = tokens.therapist, query = '') =>
  auth(request(app).get(`/api/v1/sessions/${bookings.mine._id}${query}`), token);
const held = (id, token = tokens.therapist) =>
  auth(request(app).post(`/api/v1/therapist/sessions/${id}/held`), token);
const notHeld = (id, token = tokens.therapist) =>
  auth(request(app).post(`/api/v1/therapist/sessions/${id}/not-held`), token);
const schedule = (body, token = tokens.therapist) =>
  auth(request(app).post('/api/v1/therapist/sessions'), token).send(body);

// A calendar date in London, `days` from now — the therapist's own zone.
const londonDate = (days) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date(Date.now() + days * DAY));

const remaining = async () => (await Subscription.findOne({ bookingId: bookings.mine._id })).sessionsRemaining;
const at = (ms) => new Date(Date.now() + ms);
const sessionAt = (scheduledAt, extra = {}) =>
  Session.create({ bookingId: bookings.mine._id, scheduledAt, zoomLink: LINK, ...extra });

async function makeUser(key, role) {
  users[key] = await User.create({
    email: `sc95-${key}@example.com`,
    passwordHash: await hashPassword(PASSWORD),
    role,
    status: USER_STATUS.ACTIVE,
  });
  resetLimits();
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: `sc95-${key}@example.com`, password: PASSWORD });
  tokens[key] = res.body.accessToken;
}

async function makeTherapistProfile(key) {
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
    timezone: 'Europe/London',
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

beforeAll(async () => {
  await startMemoryReplSet();
  await Promise.all([User.init(), Booking.init(), Subscription.init(), Session.init(), Message.init()]);

  await makeUser('therapist', ROLES.THERAPIST);
  await makeUser('otherTherapist', ROLES.THERAPIST);
  await makeUser('client', ROLES.CLIENT);
  await makeTherapistProfile('therapist');

  await ClientProfile.create({
    userId: users.client._id,
    type: 'individual',
    name: 'Marta',
    age: 34,
    gender: 'female',
    country: 'Ireland',
    city: 'Dublin',
    relationshipStatus: 'Single',
    concernTags: ['Anxiety'],
    therapistGenderPreference: 'no_preference',
  });
  bookings.mine = await Booking.create({ clientId: users.client._id, therapistId: users.therapist._id });
  await Subscription.create({
    bookingId: bookings.mine._id,
    clientId: users.client._id,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    amount: SUBSCRIPTION_AMOUNT_MINOR,
    startDate: new Date(Date.now() - 5 * DAY),
    currentPeriodEnd: new Date(Date.now() + 25 * DAY),
    nextBillingDate: new Date(Date.now() + 25 * DAY),
  });
}, 180000);

afterAll(async () => {
  await stopMemoryMongo();
}, 120000);

beforeEach(async () => {
  resetLimits();
  await Promise.all([Session.deleteMany({}), Message.deleteMany({})]);
  await Subscription.updateMany(
    {},
    {
      $set: {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startDate: new Date(Date.now() - 5 * DAY),
        currentPeriodEnd: new Date(Date.now() + 25 * DAY),
        sessionsRemaining: 4,
      },
    },
  );
});

/* ────────────────────────────────────────────────────────────────────────────
 * THE BRIEF'S THREE: completion decrements, never negative, renewal resets to 4.
 * ──────────────────────────────────────────────────────────────────────────── */

describe('completion takes one session, exactly once', () => {
  it('COMPLETION DECREMENTS: a session past its window completes and the count drops by one', async () => {
    const s = await sessionAt(at(-2 * HOUR));

    const result = await counter.completeSession(s._id);

    expect(result).toEqual({ completed: true, counted: true });
    expect(await remaining()).toBe(3);
    const stored = await Session.findById(s._id);
    expect(stored.status).toBe(SESSION_STATUS.COMPLETED);
    expect(stored.countedAt).toBeInstanceOf(Date);
  });

  it('completing the same session twice takes only one', async () => {
    const s = await sessionAt(at(-2 * HOUR));
    await counter.completeSession(s._id);
    const again = await counter.completeSession(s._id);

    expect(again).toEqual({ completed: false, counted: false });
    expect(await remaining()).toBe(3);
  });

  it('MANY READERS AT ONCE never double-count', async () => {
    await Promise.all([sessionAt(at(-3 * HOUR)), sessionAt(at(-4 * HOUR)), sessionAt(at(-5 * HOUR))]);

    const done = await Promise.all(Array.from({ length: 5 }, () => counter.completeOverdue(bookings.mine._id)));

    expect(done.reduce((a, b) => a + b, 0)).toBe(3);
    expect(await remaining()).toBe(1);
    expect(await Session.countDocuments({ countedAt: { $exists: true } })).toBe(3);
  });

  it('NEVER NEGATIVE: at 0 a session still completes but takes nothing', async () => {
    await Subscription.updateOne({ bookingId: bookings.mine._id }, { $set: { sessionsRemaining: 0 } });
    const s = await sessionAt(at(-2 * HOUR));

    const result = await counter.completeSession(s._id);

    expect(result).toEqual({ completed: true, counted: false });
    expect(await remaining()).toBe(0);
    expect((await Session.findById(s._id)).countedAt).toBeUndefined();
  });

  it('a fifth session in a cycle leaves the count at 0, not -1', async () => {
    await Promise.all([1, 2, 3, 4, 5].map((h) => sessionAt(at(-(h + 1) * HOUR))));
    await counter.completeOverdue(bookings.mine._id);

    expect(await remaining()).toBe(0);
    expect(await Session.countDocuments({ status: SESSION_STATUS.COMPLETED })).toBe(5);
    expect(await Session.countDocuments({ countedAt: { $exists: true } })).toBe(4);
  });

  it("a session from before this period completes but does not take this month's session", async () => {
    const s = await sessionAt(at(-10 * DAY));

    expect(await counter.completeSession(s._id)).toEqual({ completed: true, counted: false });
    expect(await remaining()).toBe(4);
  });

  it('a session still inside its window is left alone', async () => {
    await sessionAt(at(-30 * MINUTE));
    expect(await counter.completeOverdue(bookings.mine._id)).toBe(0);
    expect(await remaining()).toBe(4);
  });
});

// Renewal's reset to 4 and expiry's drop to 0 are tested through the real
// webhook and sweep, in subscriptionRenewal.test.js and paymentFailure.test.js.
describe('the ceiling', () => {
  it('the model itself refuses a count above 4', async () => {
    const sub = await Subscription.findOne({ bookingId: bookings.mine._id });
    sub.sessionsRemaining = 6;
    await expect(sub.save()).rejects.toThrow(/do not carry over/);
  });
});

describe('the billing period', () => {
  it('starts one month before the period end, never before the subscription began', () => {
    expect(
      counter.periodStartOf({ startDate: new Date('2026-01-01T00:00:00Z'), currentPeriodEnd: new Date('2026-07-15T09:00:00Z') }).toISOString(),
    ).toBe('2026-06-15T09:00:00.000Z');
    expect(
      counter.periodStartOf({ startDate: new Date('2026-07-01T00:00:00Z'), currentPeriodEnd: new Date('2026-07-15T09:00:00Z') }).toISOString(),
    ).toBe('2026-07-01T00:00:00.000Z');
  });

  it("uses Stripe's stored period start once a renewal has saved one", () => {
    const sub = {
      startDate: new Date('2026-01-01T00:00:00Z'),
      currentPeriodStart: new Date('2026-06-28T09:00:00Z'),
      currentPeriodEnd: new Date('2026-07-28T09:00:00Z'),
    };
    expect(counter.periodStartOf(sub).toISOString()).toBe('2026-06-28T09:00:00.000Z');
    // Last period's sessions never count against the new one.
    expect(counter.countsAgainst(sub, '2026-06-27T10:00:00Z')).toBe(false);
    expect(counter.countsAgainst(sub, '2026-06-29T10:00:00Z')).toBe(true);
  });

  it('counts a session inside the period, and not one at or after its end', () => {
    const sub = { startDate: new Date('2026-06-01T00:00:00Z'), currentPeriodEnd: new Date('2026-07-15T09:00:00Z') };
    expect(counter.countsAgainst(sub, '2026-07-01T10:00:00Z')).toBe(true);
    expect(counter.countsAgainst(sub, '2026-07-15T09:00:00Z')).toBe(false);
    expect(counter.countsAgainst(sub, '2026-06-10T10:00:00Z')).toBe(false);
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * On read, over HTTP — both portals see the same, current number.
 * ──────────────────────────────────────────────────────────────────────────── */

describe('the on-read check', () => {
  it('listing sessions completes the overdue one and reports the new count', async () => {
    const s = await sessionAt(at(-2 * HOUR));
    const res = await list(tokens.client, '?scope=history');

    expect(res.body.data.find((row) => row.id === String(s._id)).status).toBe(SESSION_STATUS.COMPLETED);
    expect(res.body.meta.counter).toMatchObject({ sessionsRemaining: 3, total: 4, access: 'active' });
    expect(res.body.meta.counter.cycleEndsAt).toBeTruthy();
  });

  it("the client's own portal state reads the new count", async () => {
    await sessionAt(at(-2 * HOUR));
    const me = await auth(request(app).get('/api/v1/client/me'), tokens.client);
    expect(me.body.subscription.sessionsRemaining).toBe(3);
  });

  it("the therapist's client view reads the new count and the reset date", async () => {
    await sessionAt(at(-2 * HOUR));
    const res = await auth(request(app).get(`/api/v1/therapist/clients/${bookings.mine._id}`), tokens.therapist);

    expect(res.body.subscription.sessionsRemaining).toBe(3);
    expect(res.body.subscription.cycleEndsAt).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toContain(String(SUBSCRIPTION_AMOUNT_MINOR));
  });

  it('auto-completion posts nothing into the chat', async () => {
    await sessionAt(at(-2 * HOUR));
    await list(tokens.therapist);
    expect(await Message.countDocuments({})).toBe(0);
  });

  it('shows 0 once the subscription has ended, whatever is stored', async () => {
    await Subscription.updateOne({ bookingId: bookings.mine._id }, { $set: { status: SUBSCRIPTION_STATUS.EXPIRED } });
    const res = await list(tokens.therapist);
    expect(res.body.meta.counter.sessionsRemaining).toBe(0);
  });
});

describe('"Mark as held" — the therapist completes it early', () => {
  it('refuses a session that has not started yet', async () => {
    const s = await sessionAt(at(2 * HOUR));
    const res = await held(s._id);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SESSION_NOT_STARTED');
    expect(await remaining()).toBe(4);
  });

  it('completes a started session now and takes one', async () => {
    const s = await sessionAt(at(-10 * MINUTE));
    const res = await held(s._id);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(SESSION_STATUS.COMPLETED);
    expect(res.body.counted).toBe(true);
    expect(res.body.counter.sessionsRemaining).toBe(3);
  });

  it('cannot take a second one from the same session', async () => {
    const s = await sessionAt(at(-10 * MINUTE));
    await held(s._id);
    const again = await held(s._id);

    expect(again.status).toBe(409);
    expect(await remaining()).toBe(3);
  });
});

describe('"Didn\'t take place" — the credit comes back', () => {
  it('turns a completed session into a cancelled one, gives the session back and tells the client', async () => {
    const s = await sessionAt(at(-2 * HOUR));
    await counter.completeSession(s._id);
    expect(await remaining()).toBe(3);

    const res = await notHeld(s._id);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(SESSION_STATUS.CANCELLED);
    expect(res.body.notHeldAt).toBeTruthy();
    expect(res.body.restored).toBe(true);
    expect(res.body.counter.sessionsRemaining).toBe(4);

    const [notice] = await Message.find({ type: 'system' });
    expect(notice.session.event).toBe('not_held');
    expect(String(notice.senderId)).toBe(String(users.therapist._id));
  });

  it('marking it twice gives back only one', async () => {
    const s = await sessionAt(at(-2 * HOUR));
    await counter.completeSession(s._id);
    await notHeld(s._id);
    const again = await notHeld(s._id);

    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('SESSION_NOT_COMPLETED');
    expect(await remaining()).toBe(4);
    expect(await Message.countDocuments({ type: 'system' })).toBe(1);
  });

  it('gives nothing back for a session that took nothing (completed at 0)', async () => {
    await Subscription.updateOne({ bookingId: bookings.mine._id }, { $set: { sessionsRemaining: 0 } });
    const s = await sessionAt(at(-2 * HOUR));
    await counter.completeSession(s._id);

    const res = await notHeld(s._id);
    expect(res.body.restored).toBe(false);
    expect(await remaining()).toBe(0);
  });

  it('gives nothing back for a session from an earlier period — no carry-over', async () => {
    const s = await sessionAt(at(-10 * DAY), { status: SESSION_STATUS.COMPLETED, countedAt: at(-10 * DAY) });
    await Subscription.updateOne({ bookingId: bookings.mine._id }, { $set: { sessionsRemaining: 2 } });

    const res = await notHeld(s._id);
    expect(res.body.restored).toBe(false);
    expect(await remaining()).toBe(2);
  });

  it('never gives back above 4', async () => {
    const s = await sessionAt(at(-2 * HOUR), { status: SESSION_STATUS.COMPLETED, countedAt: at(-HOUR) });
    const res = await notHeld(s._id);

    expect(res.body.restored).toBe(false);
    expect(await remaining()).toBe(4);
  });

  it('a scheduled session cannot be marked as not held — it is simply cancelled', async () => {
    const s = await sessionAt(at(DAY));
    expect((await notHeld(s._id)).status).toBe(409);
  });

  it('a completed session cannot be cancelled the ordinary way, and the refusal says what to do', async () => {
    const s = await sessionAt(at(-2 * HOUR));
    await counter.completeSession(s._id);
    const res = await auth(request(app).delete(`/api/v1/therapist/sessions/${s._id}`), tokens.therapist);

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/did not take place/);
  });
});

describe('who may use the overrides', () => {
  it('a client cannot mark anything, either way', async () => {
    const s = await sessionAt(at(-10 * MINUTE));
    expect((await held(s._id, tokens.client)).status).toBe(403);
    expect((await notHeld(s._id, tokens.client)).status).toBe(403);
    expect((await Session.findById(s._id)).status).toBe(SESSION_STATUS.SCHEDULED);
  });

  it("another therapist gets the same 404 as a made-up id", async () => {
    const s = await sessionAt(at(-10 * MINUTE));
    const theirs = await held(s._id, tokens.otherTherapist);
    const gone = await held(new mongoose.Types.ObjectId());

    expect(theirs.status).toBe(404);
    expect(theirs.body).toEqual(gone.body);
    expect(await remaining()).toBe(4);
  });
});

describe('scheduling past what is left: warned, never blocked', () => {
  const body = (days) => ({ bookingId: String(bookings.mine._id), date: londonDate(days), time: '15:00', zoomLink: LINK });

  it('no warning while there is room', async () => {
    const res = await schedule(body(2));
    expect(res.status).toBe(201);
    expect(res.body.warning).toBeNull();
  });

  it('warns on the session that goes past, and still schedules it', async () => {
    await Subscription.updateOne({ bookingId: bookings.mine._id }, { $set: { sessionsRemaining: 1 } });
    const first = await schedule(body(2));
    const second = await schedule(body(3));

    expect(first.body.warning).toBeNull();
    expect(second.status).toBe(201);
    expect(second.body.warning).toEqual({ code: 'OVER_REMAINING', remaining: 1, scheduled: 2 });
    expect(await Session.countDocuments({})).toBe(2);
  });

  it('does not warn for a session in the next cycle', async () => {
    await Subscription.updateOne({ bookingId: bookings.mine._id }, { $set: { sessionsRemaining: 0 } });
    const res = await schedule(body(27));
    expect(res.body.warning).toBeNull();
  });
});
