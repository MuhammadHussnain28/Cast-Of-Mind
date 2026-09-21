import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/User.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { Booking } from '../models/Booking.js';
import { Subscription } from '../models/Subscription.js';
import { hashPassword } from '../utils/password.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { BOOKING_STATUS, SUBSCRIPTION_STATUS, SUBSCRIPTION_AMOUNT_MINOR } from '../constants/payments.js';
import { PORTAL_ACCESS } from '../constants/clientPortal.js';
import { loginRateLimiter, sessionRateLimiter } from './auth.routes.js';
import { therapistRateLimiter } from './therapist.routes.js';
import { startMemoryMongo, stopMemoryMongo } from '../test/mongoMemory.js';

/**
 * One client's workspace — master spec §8.2.
 *
 * THE CHUNK'S CRITICAL REQUIREMENT is that a therapist can never load another
 * therapist's client by changing the URL. The strongest form of that is not
 * merely refusing — it is refusing IDENTICALLY to a booking that does not exist,
 * so the response cannot be used to discover which ids are real. That is what
 * the "three refusals are byte-identical" test pins.
 */

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const url = (id) => `/api/v1/therapist/clients/${id}`;

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

const get = (id, token) => auth(request(app).get(url(id)), token);

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

const makeBooking = async (key, therapistKey, clientKey) => {
  bookings[key] = await Booking.create({
    clientId: users[clientKey]._id,
    therapistId: users[therapistKey]._id,
    status: BOOKING_STATUS.ACTIVE,
  });
  return bookings[key];
};

const makeSubscription = (bookingKey, clientKey, status, currentPeriodEnd) =>
  Subscription.create({
    bookingId: bookings[bookingKey]._id,
    clientId: users[clientKey]._id,
    status,
    currency: 'EUR',
    amount: SUBSCRIPTION_AMOUNT_MINOR,
    startDate: new Date('2026-01-01T00:00:00Z'),
    currentPeriodEnd,
    nextBillingDate: currentPeriodEnd,
    sessionsRemaining: 4,
    platformSubscriptionId: `sub_${bookingKey}_${status}`,
    platformCustomerId: `cus_${bookingKey}`,
    checkoutSessionId: `cs_${bookingKey}`,
  });

const FUTURE = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
const PAST = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);

beforeAll(async () => {
  await startMemoryMongo();
  await User.init();
  await Booking.init();
  await Subscription.init();

  await makeUser('therapist', 'ws-therapist@example.com', ROLES.THERAPIST);
  await makeUser('otherTherapist', 'ws-other-therapist@example.com', ROLES.THERAPIST);
  await makeUser('admin', 'ws-admin@example.com', ROLES.ADMIN);

  await makeUser('rosa', 'ws-rosa@example.com', ROLES.CLIENT);
  await makeUser('couple', 'ws-couple@example.com', ROLES.CLIENT);
  await makeUser('foreign', 'ws-foreign@example.com', ROLES.CLIENT);
  await makeUser('ended', 'ws-ended@example.com', ROLES.CLIENT);
  await makeUser('lapsed', 'ws-lapsed@example.com', ROLES.CLIENT);
  await makeUser('unpaid', 'ws-unpaid@example.com', ROLES.CLIENT);

  await ClientProfile.create({
    userId: users.rosa._id,
    type: 'individual',
    name: 'Rosa',
    age: 34,
    gender: 'female',
    country: 'IE',
    city: 'Galway',
    relationshipStatus: 'Single',
    concernTags: ['Anxiety', 'Grief', 'Stress'],
    therapistGenderPreference: 'female',
  });

  await ClientProfile.create({
    userId: users.couple._id,
    type: 'couple',
    coupleData: {
      partner1: { name: 'Marta', age: 41, gender: 'female' },
      partner2: { name: 'Joris', age: 39, gender: 'male' },
    },
    country: 'NL',
    city: 'Utrecht',
    relationshipStatus: 'Married',
    concernTags: ['Marriage Issues', 'Stress', 'Anxiety'],
    therapistGenderPreference: 'no_preference',
  });

  for (const key of ['foreign', 'ended', 'lapsed', 'unpaid']) {
    await ClientProfile.create({
      userId: users[key]._id,
      type: 'individual',
      name: `Client ${key}`,
      age: 40,
      gender: 'male',
      country: 'PT',
      city: 'Porto',
      relationshipStatus: 'Single',
      concernTags: ['Depression', 'Stress', 'Grief'],
      therapistGenderPreference: 'no_preference',
    });
  }

  await makeBooking('rosa', 'therapist', 'rosa');
  await makeBooking('couple', 'therapist', 'couple');
  await makeBooking('foreign', 'otherTherapist', 'foreign');
  await makeBooking('lapsed', 'therapist', 'lapsed');
  await makeBooking('unpaid', 'therapist', 'unpaid');

  const endedBooking = await makeBooking('ended', 'therapist', 'ended');
  await Booking.updateOne(
    { _id: endedBooking._id },
    { $set: { status: BOOKING_STATUS.ENDED, endedAt: new Date() } },
  );
  bookings.ended = await Booking.findById(endedBooking._id);

  await makeSubscription('rosa', 'rosa', SUBSCRIPTION_STATUS.ACTIVE, FUTURE);
  await makeSubscription('couple', 'couple', SUBSCRIPTION_STATUS.PAST_DUE, FUTURE);
  await makeSubscription('lapsed', 'lapsed', SUBSCRIPTION_STATUS.EXPIRED, PAST);
  // 'unpaid' deliberately has NO subscription row at all.
  // 'ended' likewise — the booking ended and nothing replaced it.
}, 120000);

afterAll(async () => {
  await stopMemoryMongo();
}, 120000);

beforeEach(resetRateLimits);

describe('GET /therapist/clients/:bookingId — who may ask', () => {
  it('refuses an unauthenticated request', async () => {
    const res = await get(bookings.rosa._id, NO_TOKEN);
    expect(res.status).toBe(401);
  });

  it('refuses a client', async () => {
    const res = await get(bookings.rosa._id, tokens.rosa);
    expect(res.status).toBe(403);
  });

  it('refuses the admin — §11 gives them no view of a therapist relationship', async () => {
    const res = await get(bookings.rosa._id, tokens.admin);
    expect(res.status).toBe(403);
  });
});

describe('GET /therapist/clients/:bookingId — THE OWNERSHIP GUARD', () => {
  it("refuses another therapist's client", async () => {
    const res = await get(bookings.foreign._id);

    expect(res.status).toBe(404);
    // Nothing of the other conversation travels with the refusal.
    expect(JSON.stringify(res.body)).not.toContain('Client foreign');
  });

  it('lets the therapist who DOES own it through', async () => {
    const res = await get(bookings.foreign._id, tokens.otherTherapist);

    expect(res.status).toBe(200);
    expect(res.body.client.name).toBe('Client foreign');
  });

  it('ALL THREE REFUSALS ARE BYTE-IDENTICAL — a 403 would confirm the id is real', async () => {
    const mine = await get(new mongoose.Types.ObjectId()); // exists: no
    const theirs = await get(bookings.foreign._id); // exists: yes, not mine
    const junk = await get('not-an-object-id'); // not an id at all

    expect(mine.status).toBe(404);
    expect(theirs.status).toBe(404);
    expect(junk.status).toBe(404);

    expect(JSON.stringify(theirs.body)).toBe(JSON.stringify(mine.body));
    expect(JSON.stringify(junk.body)).toBe(JSON.stringify(mine.body));
  });

  it('never names the required role or the real owner in the refusal', async () => {
    const res = await get(bookings.foreign._id);
    const body = JSON.stringify(res.body).toLowerCase();

    expect(body).not.toContain('therapist');
    expect(body).not.toContain('owner');
    expect(body).not.toContain(String(users.otherTherapist._id).toLowerCase());
  });
});

describe('GET /therapist/clients/:bookingId — the client', () => {
  it('returns an individual with their own details', async () => {
    const res = await get(bookings.rosa._id);

    expect(res.status).toBe(200);
    expect(res.body.client).toMatchObject({
      type: 'individual',
      name: 'Rosa',
      age: 34,
      gender: 'female',
      country: 'IE',
      city: 'Galway',
      relationshipStatus: 'Single',
      therapistGenderPreference: 'female',
      partners: null,
    });
  });

  it('returns BOTH partners of a couple — one account, two people (§6)', async () => {
    const res = await get(bookings.couple._id);

    expect(res.body.client.name).toBe('Marta and Joris');
    expect(res.body.client.partners).toEqual([
      { name: 'Marta', age: 41, gender: 'female' },
      { name: 'Joris', age: 39, gender: 'male' },
    ]);
    // The individual-only fields are explicitly null rather than absent, so the
    // browser never has to guess which shape it is holding.
    expect(res.body.client.age).toBeNull();
    expect(res.body.client.gender).toBeNull();
  });

  it('carries the presenting concerns — the clinical point of this screen', async () => {
    const res = await get(bookings.rosa._id);
    expect(res.body.client.concernTags).toEqual(['Anxiety', 'Grief', 'Stress']);
  });

  it('states the gender preference even when it is "no preference"', async () => {
    const res = await get(bookings.couple._id);
    // A blank here cannot be told apart from an unanswered question.
    expect(res.body.client.therapistGenderPreference).toBe('no_preference');
  });

  it('reports the matched date and the booking status', async () => {
    const res = await get(bookings.rosa._id);

    expect(res.body.bookingStatus).toBe(BOOKING_STATUS.ACTIVE);
    expect(new Date(res.body.matchedAt).getTime()).toBeGreaterThan(0);
  });
});

describe('GET /therapist/clients/:bookingId — subscription state', () => {
  it('reports an active subscription as both status and resolved access', async () => {
    const res = await get(bookings.rosa._id);
    expect(res.body.subscription).toEqual({
      status: SUBSCRIPTION_STATUS.ACTIVE,
      access: PORTAL_ACCESS.ACTIVE,
      sessionsRemaining: 4,
      cycleEndsAt: FUTURE.toISOString(),
    });
  });

  it('reports past_due as still having access — §13 grants a grace period', async () => {
    const res = await get(bookings.couple._id);
    expect(res.body.subscription).toEqual({
      status: SUBSCRIPTION_STATUS.PAST_DUE,
      access: PORTAL_ACCESS.PAST_DUE,
      sessionsRemaining: 4,
      cycleEndsAt: FUTURE.toISOString(),
    });
  });

  it('reports an expired subscription as ended', async () => {
    const res = await get(bookings.lapsed._id);
    // §13: the counter reads 0 once the subscription has ended, whatever is stored.
    expect(res.body.subscription).toEqual({
      status: SUBSCRIPTION_STATUS.EXPIRED,
      access: PORTAL_ACCESS.ENDED,
      sessionsRemaining: 0,
      cycleEndsAt: PAST.toISOString(),
    });
  });

  it('answers null rather than guessing when there is no subscription at all', async () => {
    const res = await get(bookings.unpaid._id);
    expect(res.body.subscription).toBeNull();
  });

  it('still loads an ENDED booking — the record is clinically the therapist own', async () => {
    const res = await get(bookings.ended._id);

    expect(res.status).toBe(200);
    expect(res.body.bookingStatus).toBe(BOOKING_STATUS.ENDED);
    expect(res.body.client.name).toBe('Client ended');
  });
});

describe('GET /therapist/clients/:bookingId — what must never travel', () => {
  it('carries NO client user id', async () => {
    const res = await get(bookings.rosa._id);
    expect(JSON.stringify(res.body)).not.toContain(String(users.rosa._id));
  });

  it('carries NO email address', async () => {
    const res = await get(bookings.rosa._id);
    const body = JSON.stringify(res.body);

    expect(body).not.toContain('ws-rosa@example.com');
    expect(body).not.toContain('email');
  });

  it('carries NO billing figures and NO Stripe identifiers', async () => {
    const res = await get(bookings.rosa._id);
    const body = JSON.stringify(res.body);

    expect(body).not.toContain('sub_rosa');
    expect(body).not.toContain('cus_rosa');
    expect(body).not.toContain('cs_rosa');
    expect(body).not.toContain(String(SUBSCRIPTION_AMOUNT_MINOR));
    expect(body).not.toContain('nextBillingDate');
    expect(body).not.toContain('currentPeriodEnd');
  });

  // 9.5, developer's call: the session counter and the date it resets reach the
  // therapist. Sessions, not money: still no amount, currency or Stripe id.
  it('carries the session counter and its reset date, and nothing else about billing', async () => {
    const res = await get(bookings.rosa._id);

    expect(Object.keys(res.body.subscription).sort()).toEqual(
      ['access', 'cycleEndsAt', 'sessionsRemaining', 'status'].sort(),
    );
    expect(res.body.subscription.sessionsRemaining).toBe(4);
    expect(res.body.subscription.cycleEndsAt).toBeTruthy();
  });

  it('returns exactly the agreed keys, so a later addition has to be deliberate', async () => {
    const res = await get(bookings.rosa._id);

    expect(Object.keys(res.body).sort()).toEqual([
      'bookingId',
      'bookingStatus',
      'client',
      'matchedAt',
      'subscription',
    ]);

    expect(Object.keys(res.body.client).sort()).toEqual([
      'age',
      'city',
      'concernTags',
      'country',
      'gender',
      'name',
      'partners',
      'relationshipStatus',
      'therapistGenderPreference',
      'timezone',
      'type',
    ]);
  });

  // REVERSED IN 9.2: the zone is now saved from the client's browser. It is
  // still never guessed — until they save one it is null, whatever their country.
  it('carries a null timezone until the client has saved one, never a guess', async () => {
    const res = await get(bookings.rosa._id);
    expect(res.body.client.timezone).toBeNull();
  });

  it("carries the client's own saved timezone once there is one", async () => {
    await ClientProfile.updateOne(
      { userId: users.rosa._id },
      { $set: { timezone: 'America/New_York' } },
    );
    const res = await get(bookings.rosa._id);
    expect(res.body.client.timezone).toBe('America/New_York');
    await ClientProfile.updateOne({ userId: users.rosa._id }, { $unset: { timezone: 1 } });
  });
});
