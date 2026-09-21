import request from 'supertest';
import mongoose from 'mongoose';

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { TherapistProfile } = await import('../models/TherapistProfile.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { hashPassword } = await import('../utils/password.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { SUBSCRIPTION_STATUS, SUBSCRIPTION_AMOUNT_MINOR, BOOKING_STATUS, CANCELLED_BY } =
  await import('../constants/payments.js');
const { loginRateLimiter, sessionRateLimiter } = await import('./auth.routes.js');
const { adminRateLimiter } = await import('./admin.routes.js');
const { startMemoryMongo, stopMemoryMongo } = await import('../test/mongoMemory.js');

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const BASE = '/api/v1/admin/bookings';
const DAY = 24 * 60 * 60 * 1000;

const EMAILS = {
  [ROLES.CLIENT]: 'ab-client@example.com',
  [ROLES.THERAPIST]: 'ab-therapist@example.com',
  [ROLES.ADMIN]: 'ab-admin@example.com',
};

const NO_TOKEN = Symbol('no token');
const tokens = {};
let passwordHash;

function resetRateLimits() {
  LOOPBACK_KEYS.forEach((key) => {
    loginRateLimiter.resetKey(key);
    sessionRateLimiter.resetKey(key);
    adminRateLimiter.resetKey(key);
  });
}

const auth = (req, token = tokens[ROLES.ADMIN]) =>
  token === NO_TOKEN ? req : req.set('Authorization', `Bearer ${token}`);

function get(params = {}, token) {
  resetRateLimits();
  const query = new URLSearchParams(params).toString();
  return auth(request(app).get(query ? `${BASE}?${query}` : BASE), token);
}

/**
 * Every test names its fixtures with a fresh token and searches for it. The
 * database is shared across the suite, so this is what lets a test assert an
 * EXACT count or order rather than "at least one" — which would pass whatever
 * the other tests had left behind.
 */
const freshToken = () => `Zq${Math.random().toString(36).slice(2, 8)}`;

// Raw driver on purpose: `matchedAt` and `createdAt` are Mongoose timestamps,
// which a model update would refuse to move.
const setMatchedAt = (bookingId, date) =>
  Booking.collection.updateOne({ _id: bookingId }, { $set: { matchedAt: date } });
const setCreatedAt = (subscriptionId, date) =>
  Subscription.collection.updateOne({ _id: subscriptionId }, { $set: { createdAt: date } });

async function createTherapist({ firstName = 'Priya', lastName = 'Raman', status = 'active' } = {}) {
  const user = await User.create({
    email: `ab-t-${Math.random().toString(36).slice(2, 10)}@example.com`,
    passwordHash,
    role: ROLES.THERAPIST,
    status,
  });

  const profile = await TherapistProfile.create({
    userId: user._id,
    applicationId: new mongoose.Types.ObjectId(),
    title: 'Dr.',
    firstName,
    lastName,
    gender: 'female',
    dateOfBirth: new Date('1985-04-02'),
    photoUrl: 'https://res.cloudinary.com/x/image/upload/v1/p.jpg',
    streetAddress: '1 Quay Street',
    city: 'Galway',
    stateProvince: 'Connacht',
    zipPostal: 'H91',
    country: 'Ireland',
    timezone: 'Europe/Dublin',
    languages: ['English'],
    workingHours: { monday: { enabled: true, start: '09:00', end: '17:00' } },
    therapistType: 'Clinical Psychologist',
    credentialType: 'License',
    credentialInitials: 'PhD',
    yearsExperience: 9,
    educationSummary: 'Doctorate in clinical psychology.',
    currentWorkSituation: 'Private practice.',
    specialtyTags: ['Anxiety', 'Depression', 'Grief'],
    treatmentOrientations: ['CBT'],
    bio: 'Works with anxiety and low mood.',
    licensingStatus: 'Licensed in Ireland.',
    disciplinaryActions: false,
    malpracticeInsurance: true,
    certificateUrl1: 'https://res.cloudinary.com/x/image/authenticated/s--a--/v1/c.pdf',
    status,
  });

  return { user, profile };
}

/** A pairing as the payment transaction creates it: user, profile, booking, subscription. */
async function createPairing({
  therapist,
  name = 'Aoife Byrne',
  couple = null,
  email,
  accountStatus = USER_STATUS.ACTIVE,
  subscription = SUBSCRIPTION_STATUS.ACTIVE,
  nextBillingIn = 20 * DAY,
} = {}) {
  const user = await User.create({
    email: email ?? `ab-c-${Math.random().toString(36).slice(2, 10)}@example.com`,
    passwordHash,
    role: ROLES.CLIENT,
    status: accountStatus,
  });

  const profile = await ClientProfile.create({
    userId: user._id,
    type: couple ? 'couple' : 'individual',
    country: 'Ireland',
    city: 'Dublin',
    relationshipStatus: 'Single',
    concernTags: ['Anxiety', 'Stress', 'Sleep Issues or Insomnia'],
    therapistGenderPreference: 'no_preference',
    ...(couple
      ? {
          coupleData: {
            partner1: { name: couple[0], age: 34, gender: 'female' },
            partner2: { name: couple[1], age: 36, gender: 'male' },
          },
        }
      : { name, age: 31, gender: 'female' }),
  });

  const booking = await Booking.create({
    clientId: user._id,
    therapistId: therapist.user._id,
    status: BOOKING_STATUS.ACTIVE,
  });

  let sub = null;
  if (subscription) {
    sub = await Subscription.create({
      bookingId: booking._id,
      clientId: user._id,
      status: subscription,
      amount: SUBSCRIPTION_AMOUNT_MINOR,
      currentPeriodEnd: new Date(Date.now() + nextBillingIn),
      nextBillingDate: new Date(Date.now() + nextBillingIn),
      platformSubscriptionId: `sub_${Math.random().toString(36).slice(2, 12)}`,
      ...(subscription === SUBSCRIPTION_STATUS.CANCELLED
        ? { cancelledAt: new Date(), cancelledBy: CANCELLED_BY.CLIENT }
        : {}),
    });
  }

  return { user, profile, booking, subscription: sub };
}

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([User.init(), ClientProfile.init(), TherapistProfile.init(), Booking.init()]);

  passwordHash = await hashPassword(PASSWORD);

  for (const role of Object.values(ROLES)) {
    await User.create({ email: EMAILS[role], passwordHash, role, status: USER_STATUS.ACTIVE });

    resetRateLimits();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: EMAILS[role], password: PASSWORD });

    tokens[role] = res.body.accessToken;
  }
}, 120000);

afterAll(async () => {
  await stopMemoryMongo();
});

describe('the guards', () => {
  test('refuses no token with 401, and a client or therapist with 403', async () => {
    expect((await get({}, NO_TOKEN)).status).toBe(401);
    expect((await get({}, tokens[ROLES.CLIENT])).status).toBe(403);
    expect((await get({}, tokens[ROLES.THERAPIST])).status).toBe(403);
  });

  test('the 403 body never names the required role', async () => {
    const body = JSON.stringify((await get({}, tokens[ROLES.THERAPIST])).body).toLowerCase();
    expect(body).not.toContain('admin');
  });
});

describe('the rows', () => {
  test('one row per booking, with both people, the status and the dates', async () => {
    const t = freshToken();
    const therapist = await createTherapist({ lastName: `Raman${t}` });
    const { booking, profile } = await createPairing({ therapist, name: `Aoife ${t}` });

    const res = await get({ q: t });
    const [row] = res.body.data;

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(row._id).toBe(String(booking._id));
    expect(row.client.displayName).toBe(`Aoife ${t}`);
    expect(row.client.id).toBe(String(profile._id));
    expect(row.therapist.name).toBe(`Dr. Priya Raman${t}`);
    expect(row.therapist.id).toBe(String(therapist.profile._id));
    expect(row.subscriptionStatus).toBe('active');
    expect(new Date(row.pairedSince).getTime()).toBe(booking.matchedAt.getTime());
    expect(row.nextPayment).not.toBeNull();
  });

  test('NAMES A COUPLE WITH BOTH PARTNERS', async () => {
    const t = freshToken();
    const therapist = await createTherapist();
    await createPairing({ therapist, couple: [`Marta${t}`, 'Joris'] });

    const [row] = (await get({ q: t })).body.data;

    expect(row.client.displayName).toBe(`Marta${t} and Joris`);
    expect(row.client.type).toBe('couple');
  });

  test('THE NEWEST SUBSCRIPTION DECIDES THE ROW — the rule the access gate uses', async () => {
    const t = freshToken();
    const therapist = await createTherapist();
    const { booking, user, subscription } = await createPairing({ therapist, name: `Old ${t}` });

    // An older, ended subscription on the same booking — a re-subscriber.
    const older = await Subscription.create({
      bookingId: booking._id,
      clientId: user._id,
      status: SUBSCRIPTION_STATUS.EXPIRED,
      amount: SUBSCRIPTION_AMOUNT_MINOR,
      startDate: new Date(Date.now() - 90 * DAY),
      currentPeriodEnd: new Date(Date.now() - 60 * DAY),
      nextBillingDate: new Date(Date.now() - 60 * DAY),
    });
    await setCreatedAt(older._id, new Date(Date.now() - 90 * DAY));
    await setCreatedAt(subscription._id, new Date());

    const res = await get({ q: t });

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].subscriptionStatus).toBe('active');
  });

  test('a booking with no subscription row is "none", not missing', async () => {
    const t = freshToken();
    const therapist = await createTherapist();
    await createPairing({ therapist, name: `Orphan ${t}`, subscription: null });

    const res = await get({ q: t });

    expect(res.body.data[0].subscriptionStatus).toBe('none');
    expect(res.body.meta.counts.none).toBe(1);
  });

  test('ONLY A LIVE SUBSCRIPTION HAS A NEXT PAYMENT — a stored date is not a charge', async () => {
    const t = freshToken();
    const therapist = await createTherapist();
    await createPairing({ therapist, name: `Live ${t}` });
    await createPairing({ therapist, name: `Failing ${t}`, subscription: 'past_due' });
    await createPairing({ therapist, name: `Leaving ${t}`, subscription: 'cancelled' });
    await createPairing({ therapist, name: `Gone ${t}`, subscription: 'expired' });

    const rows = (await get({ q: t })).body.data;
    const byName = Object.fromEntries(rows.map((r) => [r.client.displayName.split(' ')[0], r]));

    expect(byName.Live.nextPayment).not.toBeNull();
    expect(byName.Failing.nextPayment).not.toBeNull();
    expect(byName.Leaving.nextPayment).toBeNull();
    expect(byName.Gone.nextPayment).toBeNull();
    // The cancelled row still knows when its access ends.
    expect(byName.Leaving.currentPeriodEnd).not.toBeNull();
  });

  test('flags a deactivated therapist and a deactivated client on the row', async () => {
    const t = freshToken();
    const gone = await createTherapist({ lastName: `Left${t}`, status: 'inactive' });
    await createPairing({ therapist: gone, name: `Stranded ${t}` });
    const active = await createTherapist();
    await createPairing({ therapist: active, name: `Blocked ${t}`, accountStatus: 'inactive' });

    const rows = (await get({ q: t })).body.data;
    const stranded = rows.find((r) => r.client.displayName.startsWith('Stranded'));
    const blocked = rows.find((r) => r.client.displayName.startsWith('Blocked'));

    expect(stranded.therapist.status).toBe('inactive');
    expect(blocked.client.accountStatus).toBe('inactive');
  });

  test('NO USER ID, NO EMAIL AND NO CONCERN TAG LEAVES — profile ids only', async () => {
    const t = freshToken();
    const therapist = await createTherapist();
    const { user } = await createPairing({
      therapist,
      name: `Private ${t}`,
      email: `private-${t.toLowerCase()}@example.com`,
    });

    const body = JSON.stringify((await get({ q: t })).body);

    expect(body).not.toContain(String(user._id));
    expect(body).not.toContain(String(therapist.user._id));
    expect(body).not.toContain(`private-${t.toLowerCase()}@example.com`);
    expect(body).not.toContain('Sleep Issues or Insomnia');
    expect(body.toLowerCase()).not.toContain('passwordhash');
  });

  test('carries nothing from a conversation, a journal or a clinical note (§11)', async () => {
    const t = freshToken();
    const therapist = await createTherapist();
    await createPairing({ therapist, name: `Boundary ${t}` });

    const lower = JSON.stringify((await get({ q: t })).body).toLowerCase();

    for (const word of ['journal', 'privatenote', 'message', 'lastactivity', 'unread']) {
      expect(lower).not.toContain(word);
    }
  });
});

describe('search', () => {
  test('finds by client name, either partner, and client email', async () => {
    const t = freshToken();
    const therapist = await createTherapist();
    await createPairing({ therapist, name: `Katherine ${t}Solo` });
    await createPairing({ therapist, couple: [`Ines${t}`, `Tomasz${t}`] });
    await createPairing({ therapist, name: 'Unrelated Name', email: `mail${t.toLowerCase()}@example.com` });

    expect((await get({ q: `${t}Solo` })).body.data).toHaveLength(1);
    expect((await get({ q: `Ines${t}` })).body.data).toHaveLength(1);
    expect((await get({ q: `Tomasz${t}` })).body.data).toHaveLength(1);
    expect((await get({ q: `mail${t.toLowerCase()}` })).body.data).toHaveLength(1);
  });

  test('finds every pairing of a therapist by first name, last name, or both', async () => {
    const t = freshToken();
    const therapist = await createTherapist({ firstName: `Grace${t}`, lastName: `Hopper${t}` });
    await createPairing({ therapist, name: 'One Client' });
    await createPairing({ therapist, name: 'Another Client' });

    for (const term of [`grace${t}`, `hopper${t}`, `Grace${t} Hopper${t}`]) {
      expect((await get({ q: term })).body.data).toHaveLength(2);
    }
  });

  test('escapes regex metacharacters', async () => {
    expect((await get({ q: '.*' })).body.data).toHaveLength(0);
  });

  test('THE COUNTS FOLLOW THE SEARCH — they describe this table, not the business', async () => {
    const t = freshToken();
    const therapist = await createTherapist();
    await createPairing({ therapist, name: `Counted ${t}` });
    await createPairing({ therapist, name: `Counted ${t}`, subscription: 'cancelled' });

    const res = await get({ q: t });

    expect(res.body.meta.counts).toEqual({
      active: 1,
      past_due: 0,
      cancelled: 1,
      expired: 0,
      none: 0,
    });
  });
});

describe('the status filter', () => {
  test('narrows the rows but NOT the counts, so every bucket stays visible', async () => {
    const t = freshToken();
    const therapist = await createTherapist();
    await createPairing({ therapist, name: `Fine ${t}` });
    await createPairing({ therapist, name: `Failing ${t}`, subscription: 'past_due' });

    const res = await get({ q: t, status: 'past_due' });

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].subscriptionStatus).toBe('past_due');
    expect(res.body.meta.total).toBe(1);
    expect(res.body.meta.counts.active).toBe(1);
    expect(res.body.meta.counts.past_due).toBe(1);
  });

  test('refuses an unknown status', async () => {
    expect((await get({ status: 'banana' })).status).toBe(422);
  });
});

describe('sorting', () => {
  const names = (res) => res.body.data.map((r) => r.client.displayName.split(' ')[0]);

  test('by client name, case-insensitively, both ways', async () => {
    const t = freshToken();
    const therapist = await createTherapist();
    // Chosen so a BINARY sort gets it wrong: byte order puts every capital
    // before every lower-case letter, giving Alice, Carl, bob. A fixture whose
    // binary and human orders agree would pass with the collation deleted.
    for (const first of ['Carl', 'Alice', 'bob']) {
      await createPairing({ therapist, name: `${first} ${t}` });
    }

    expect(names(await get({ q: t, sort: 'client', direction: 'asc' }))).toEqual([
      'Alice',
      'bob',
      'Carl',
    ]);
    expect(names(await get({ q: t, sort: 'client', direction: 'desc' }))).toEqual([
      'Carl',
      'bob',
      'Alice',
    ]);
  });

  test('by therapist name', async () => {
    const t = freshToken();
    const zara = await createTherapist({ firstName: 'Zara', lastName: `Q${t}` });
    const ada = await createTherapist({ firstName: 'Ada', lastName: `Q${t}` });
    await createPairing({ therapist: zara, name: 'First Client' });
    await createPairing({ therapist: ada, name: 'Second Client' });

    const rows = (await get({ q: `Q${t}`, sort: 'therapist', direction: 'asc' })).body.data;

    expect(rows.map((r) => r.therapist.name)).toEqual([`Dr. Ada Q${t}`, `Dr. Zara Q${t}`]);
  });

  test('BY STATUS IN LIFECYCLE ORDER, not alphabetical', async () => {
    const t = freshToken();
    const therapist = await createTherapist();
    await createPairing({ therapist, name: `Expired ${t}`, subscription: 'expired' });
    await createPairing({ therapist, name: `Cancelled ${t}`, subscription: 'cancelled' });
    await createPairing({ therapist, name: `Active ${t}` });
    await createPairing({ therapist, name: `Pastdue ${t}`, subscription: 'past_due' });

    expect(names(await get({ q: t, sort: 'status', direction: 'asc' }))).toEqual([
      'Active',
      'Pastdue',
      'Cancelled',
      'Expired',
    ]);
  });

  test('defaults to the newest pairing first', async () => {
    const t = freshToken();
    const therapist = await createTherapist();
    const older = await createPairing({ therapist, name: `Older ${t}` });
    const newer = await createPairing({ therapist, name: `Newer ${t}` });
    await setMatchedAt(older.booking._id, new Date(Date.now() - 30 * DAY));
    await setMatchedAt(newer.booking._id, new Date(Date.now() - DAY));

    expect(names(await get({ q: t }))).toEqual(['Newer', 'Older']);
  });

  test('A ROW WITH NO NEXT PAYMENT SORTS LAST, WHICHEVER WAY THE COLUMN RUNS', async () => {
    const t = freshToken();
    const therapist = await createTherapist();
    await createPairing({ therapist, name: `Soon ${t}`, nextBillingIn: 2 * DAY });
    await createPairing({ therapist, name: `Later ${t}`, nextBillingIn: 25 * DAY });
    await createPairing({ therapist, name: `Nothing ${t}`, subscription: 'expired' });

    expect(names(await get({ q: t, sort: 'nextPayment', direction: 'asc' }))).toEqual([
      'Soon',
      'Later',
      'Nothing',
    ]);
    expect(names(await get({ q: t, sort: 'nextPayment', direction: 'desc' }))).toEqual([
      'Later',
      'Soon',
      'Nothing',
    ]);
  });

  test('REFUSES A SORT KEY NOT ON THE ALLOWLIST, and a bad direction', async () => {
    for (const sort of ['passwordHash', 'clientId', '$where', 'email']) {
      const res = await get({ sort });
      expect(res.status).toBe(422);
    }
    expect((await get({ sort: 'client', direction: 'sideways' })).status).toBe(422);
  });
});

describe('pagination', () => {
  test('pages the rows and reports the total for the filtered set', async () => {
    const t = freshToken();
    const therapist = await createTherapist();
    for (const first of ['Anna', 'Bea', 'Cara']) {
      await createPairing({ therapist, name: `${first} ${t}` });
    }

    const first = await get({ q: t, sort: 'client', direction: 'asc', page: 1, limit: 2 });
    const second = await get({ q: t, sort: 'client', direction: 'asc', page: 2, limit: 2 });

    expect(first.body.data).toHaveLength(2);
    expect(second.body.data).toHaveLength(1);
    expect(first.body.meta.total).toBe(3);
    expect(first.body.meta.pages).toBe(2);
    expect(second.body.data[0].client.displayName).toBe(`Cara ${t}`);
  });

  test('refuses an absurd page size', async () => {
    expect((await get({ limit: 5000 })).status).toBe(422);
  });
});
