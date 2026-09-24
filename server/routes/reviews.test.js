import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import mongoose from 'mongoose';

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { TherapistProfile } = await import('../models/TherapistProfile.js');
const { Review } = await import('../models/Review.js');
const { hashPassword } = await import('../utils/password.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { SUBSCRIPTION_STATUS, SUBSCRIPTION_AMOUNT_MINOR, CANCELLED_BY } = await import(
  '../constants/payments.js'
);
const { RANKING_MIN_RATINGS } = await import('../constants/reviews.js');
const { loginRateLimiter, sessionRateLimiter } = await import('./auth.routes.js');
const { clientRateLimiter, reviewRateLimiter, journalWriteRateLimiter } = await import(
  './client.routes.js'
);
const { therapistRateLimiter } = await import('./therapist.routes.js');
const { chatReadRateLimiter } = await import('./chat.routes.js');
const { sessionsReadRateLimiter } = await import('./sessions.routes.js');
const { matchingRateLimiter } = await import('./matching.routes.js');
const { therapistDetailRateLimiter } = await import('./therapists.routes.js');
const { adminRateLimiter } = await import('./admin.routes.js');
const { startMemoryMongo, stopMemoryMongo } = await import('../test/mongoMemory.js');

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const DAY = 24 * 60 * 60 * 1000;
const REVIEWS = '/api/v1/client/reviews';

// The canary. If this string reaches anyone but the admin, the chunk failed.
const CANARY = 'CANARY-she-rushed-every-session-and-never-listened';

const users = {};
const tokens = {};
const profiles = {};
const bookings = {};
const subscriptions = {};

function resetLimits() {
  const limiters = [
    loginRateLimiter, sessionRateLimiter, clientRateLimiter, reviewRateLimiter,
    journalWriteRateLimiter, therapistRateLimiter, chatReadRateLimiter,
    sessionsReadRateLimiter, matchingRateLimiter, therapistDetailRateLimiter, adminRateLimiter,
  ];
  for (const key of LOOPBACK) for (const limiter of limiters) limiter?.resetKey(key);
}

const auth = (req, token) => (token ? req.set('Authorization', `Bearer ${token}`) : req);
const submit = (key, body) => {
  resetLimits();
  return auth(request(app).post(REVIEWS), tokens[key]).send(body);
};
const get = (url, key) => {
  resetLimits();
  return auth(request(app).get(url), tokens[key]);
};

async function makeUser(key, role, status = USER_STATUS.ACTIVE) {
  users[key] = await User.create({
    email: `rv-${key.toLowerCase()}@example.com`,
    passwordHash: await hashPassword(PASSWORD),
    role,
    status,
  });
  resetLimits();
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: `rv-${key.toLowerCase()}@example.com`, password: PASSWORD });
  tokens[key] = res.body.accessToken;
}

async function makeTherapist(key, { firstName = 'Priya', lastName = 'Raman', status = 'active' } = {}) {
  await makeUser(key, ROLES.THERAPIST);
  profiles[key] = await TherapistProfile.create({
    userId: users[key]._id,
    applicationId: new mongoose.Types.ObjectId(),
    title: 'Dr.',
    firstName,
    lastName,
    gender: 'female',
    dateOfBirth: new Date('1985-04-02'),
    photoUrl: 'https://res.cloudinary.com/test/image/upload/p.jpg',
    streetAddress: '1 Quay Street',
    city: 'Galway',
    stateProvince: 'Connacht',
    zipPostal: 'H91',
    country: 'Ireland',
    timezone: 'Europe/Dublin',
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
    licensingStatus: 'Licensed in Ireland.',
    disciplinaryActions: false,
    malpracticeInsurance: true,
    workingHours: { monday: { enabled: true, start: '09:00', end: '17:00' } },
    certificateUrl1: 'https://res.cloudinary.com/test/image/authenticated/c1',
    status,
  });
}

/** A paying client of `therapistKey`, their subscription in `status`. */
async function makeClient(key, therapistKey, status = SUBSCRIPTION_STATUS.ACTIVE) {
  await makeUser(key, ROLES.CLIENT);
  profiles[key] = await ClientProfile.create({
    userId: users[key]._id,
    type: 'individual',
    name: `Client ${key}`,
    age: 29,
    gender: 'male',
    country: 'Ireland',
    city: 'Cork',
    relationshipStatus: 'Single',
    concernTags: ['Anxiety'],
    therapistGenderPreference: 'no_preference',
  });
  bookings[key] = await Booking.create({
    clientId: users[key]._id,
    therapistId: users[therapistKey]._id,
  });
  subscriptions[key] = await setSubscription(key, status);
}

/** A fresh subscription row on the client's booking — the newest decides. */
async function setSubscription(key, status) {
  const ended = status === SUBSCRIPTION_STATUS.EXPIRED;
  const sub = await Subscription.create({
    bookingId: bookings[key]._id,
    clientId: users[key]._id,
    status,
    amount: SUBSCRIPTION_AMOUNT_MINOR,
    startDate: new Date(Date.now() - (ended ? 40 : 5) * DAY),
    currentPeriodEnd: new Date(Date.now() + (ended ? -10 : 25) * DAY),
    nextBillingDate: new Date(Date.now() + (ended ? -10 : 25) * DAY),
    platformSubscriptionId: `sub_${Math.random().toString(36).slice(2, 12)}`,
    ...(status === SUBSCRIPTION_STATUS.CANCELLED
      ? { cancelledAt: new Date(), cancelledBy: CANCELLED_BY.CLIENT }
      : {}),
  });
  subscriptions[key] = sub;
  return sub;
}

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([
    User.init(), Booking.init(), Subscription.init(), Review.init(), TherapistProfile.init(),
  ]);

  await makeUser('admin', ROLES.ADMIN);
  await makeTherapist('therapist');
  await makeClient('active', 'therapist', SUBSCRIPTION_STATUS.ACTIVE);
  await makeClient('pastDue', 'therapist', SUBSCRIPTION_STATUS.PAST_DUE);
  await makeClient('cancelled', 'therapist', SUBSCRIPTION_STATUS.CANCELLED);
  await makeClient('expired', 'therapist', SUBSCRIPTION_STATUS.EXPIRED);
}, 180000);

afterAll(async () => {
  await stopMemoryMongo();
}, 120000);

/* ────────────────────────────────────────────────────────────────────────── */

describe('submitting a rating — POST /client/reviews', () => {
  beforeEach(async () => {
    await Review.deleteMany({});
  });

  test('an expired client can rate, and hears back nothing but "submitted"', async () => {
    const res = await submit('expired', { stars: 4, text: 'Steady and kind.' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ submitted: true });
    expect(await Review.countDocuments({})).toBe(1);
  });

  test('a cancelled client still inside their paid period can rate too (approved)', async () => {
    const res = await submit('cancelled', { stars: 5 });
    expect(res.status).toBe(201);
  });

  test('AN ACTIVE OR PAST-DUE CLIENT CANNOT — the subscription has not ended', async () => {
    for (const key of ['active', 'pastDue']) {
      const res = await submit(key, { stars: 5 });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('REVIEW_NOT_AVAILABLE');
    }
    expect(await Review.countDocuments({})).toBe(0);
  });

  test('THE THERAPIST COMES FROM THE CLIENT’S OWN BOOKING, never the request', async () => {
    await submit('expired', { stars: 3 });
    const stored = await Review.findOne({}).lean();

    expect(String(stored.therapistId)).toBe(String(users.therapist._id));
    expect(String(stored.clientId)).toBe(String(users.expired._id));
    expect(String(stored.bookingId)).toBe(String(bookings.expired._id));
    expect(String(stored.subscriptionId)).toBe(String(subscriptions.expired._id));
  });

  test('A BODY NAMING ANYONE ELSE IS REFUSED, and nothing is written', async () => {
    const someoneElse = String(new mongoose.Types.ObjectId());
    for (const extra of [{ therapistId: someoneElse }, { clientId: someoneElse }, { bookingId: someoneElse }]) {
      const res = await submit('expired', { stars: 1, ...extra });
      expect(res.status).toBe(422);
    }
    expect(await Review.countDocuments({})).toBe(0);
  });

  test('STARS ARE REQUIRED — a whole number from one to five', async () => {
    for (const body of [{}, { text: 'Only words.' }, { stars: 0 }, { stars: 6 }, { stars: 3.5 }, { stars: '4' }]) {
      const res = await submit('expired', body);
      expect(res.status).toBe(422);
    }
    expect(await Review.countDocuments({})).toBe(0);
  });

  test('WORDS ARE OPTIONAL, and whitespace alone counts as none', async () => {
    expect((await submit('expired', { stars: 5, text: '   ' })).status).toBe(201);
    expect((await Review.findOne({}).lean()).text).toBeUndefined();
  });

  test('refuses words past 2,000 characters, saying how to fix it', async () => {
    const res = await submit('expired', { stars: 2, text: 'x'.repeat(2001) });
    expect(res.status).toBe(422);
    expect(JSON.stringify(res.body)).toMatch(/2,000/);
  });

  test('ONE RATING PER SUBSCRIPTION — a second is refused, the first kept', async () => {
    await submit('expired', { stars: 5 });
    const again = await submit('expired', { stars: 1 });

    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('ALREADY_REVIEWED');
    const all = await Review.find({}).lean();
    expect(all).toHaveLength(1);
    expect(all[0].stars).toBe(5);
  });

  test('two submissions racing each other still leave exactly one', async () => {
    resetLimits();
    const [a, b] = await Promise.all([
      auth(request(app).post(REVIEWS), tokens.expired).send({ stars: 4 }),
      auth(request(app).post(REVIEWS), tokens.expired).send({ stars: 2 }),
    ]);

    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(await Review.countDocuments({})).toBe(1);
  });

  test('a client who comes back can rate their NEXT subscription once it ends', async () => {
    await submit('expired', { stars: 3 });
    await setSubscription('expired', SUBSCRIPTION_STATUS.ACTIVE);
    expect((await submit('expired', { stars: 5 })).status).toBe(409);

    await Subscription.updateOne({ _id: subscriptions.expired._id }, {
      $set: { status: SUBSCRIPTION_STATUS.EXPIRED },
    });
    expect((await submit('expired', { stars: 5 })).status).toBe(201);
    expect(await Review.countDocuments({ clientId: users.expired._id })).toBe(2);

    // Put the fixture back: the newest row is expired again, as it began.
  });

  test('only a client may submit — no token 401, therapist and admin 403', async () => {
    resetLimits();
    expect((await request(app).post(REVIEWS).send({ stars: 5 })).status).toBe(401);
    expect((await submit('therapist', { stars: 5 })).status).toBe(403);
    expect((await submit('admin', { stars: 5 })).status).toBe(403);
    expect(await Review.countDocuments({})).toBe(0);
  });
});

describe('what the portal is told — /client/me reviewState', () => {
  beforeEach(async () => {
    await Review.deleteMany({});
  });

  test('not_yet while live, eligible once ended, submitted after — and never any content', async () => {
    expect((await get('/api/v1/client/me', 'active')).body.reviewState).toBe('not_yet');
    expect((await get('/api/v1/client/me', 'pastDue')).body.reviewState).toBe('not_yet');
    expect((await get('/api/v1/client/me', 'cancelled')).body.reviewState).toBe('eligible');
    expect((await get('/api/v1/client/me', 'expired')).body.reviewState).toBe('eligible');

    await submit('expired', { stars: 2, text: CANARY });
    const me = await get('/api/v1/client/me', 'expired');

    expect(me.body.reviewState).toBe('submitted');
    expect(JSON.stringify(me.body)).not.toContain(CANARY);
    expect(JSON.stringify(me.body).toLowerCase()).not.toContain('"stars"');
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * THE BOUNDARY — reviews are admin-only, §9.6. The reason this chunk exists.
 * ──────────────────────────────────────────────────────────────────────────── */

describe('*** ADMIN-ONLY: no client, therapist or public endpoint exposes a review ***', () => {
  test('NO ROUTER BUT THE ADMIN’S CAN EVEN REACH THE CODE THAT READS REVIEWS', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const serverRoot = path.resolve(here, '..');

    // Three import shapes, not one: `from '…'`, a bare side-effect `import '…'`,
    // and a dynamic `import('…')`. Matching only the first let a bare import of
    // the read service onto the client path pass every test (caught by mutation
    // in 10.3 — the same hole was in 8.6's walker, fixed there too).
    const importsOf = (file) =>
      [...fs.readFileSync(file, 'utf8').matchAll(/(?:\bfrom\s+|\bimport\s*\(?\s*)['"](\.[^'"]+)['"]/g)]
        .map((match) => path.resolve(path.dirname(file), match[1]));

    const reachableFrom = (entries) => {
      const seen = new Set();
      const queue = [...entries];
      while (queue.length) {
        const file = queue.pop();
        if (seen.has(file) || !fs.existsSync(file)) continue;
        seen.add(file);
        queue.push(...importsOf(file));
      }
      return seen;
    };

    const readers = [
      path.join(serverRoot, 'services', 'adminReviews.service.js'),
      path.join(serverRoot, 'controllers', 'adminReviews.controller.js'),
    ];

    // Every router except the admin's — including any a later chunk adds, since
    // the list is read from the directory rather than written out here.
    const routersDir = path.join(serverRoot, 'routes');
    const others = fs
      .readdirSync(routersDir)
      .filter((name) => name.endsWith('.routes.js') && name !== 'admin.routes.js')
      .map((name) => path.join(routersDir, name));

    expect(others.length).toBeGreaterThan(10);

    for (const router of others) {
      const reachable = reachableFrom([router]);
      for (const reader of readers) {
        expect({ router: path.basename(router), reaches: reachable.has(reader) }).toEqual({
          router: path.basename(router),
          reaches: false,
        });
      }
    }

    // THE WALKER MUST FIND THEM FROM THE ADMIN ROUTER, or the above is vacuous.
    const adminPath = reachableFrom([path.join(routersDir, 'admin.routes.js')]);
    for (const reader of readers) expect(adminPath.has(reader)).toBe(true);
  });

  test('A REAL REVIEW NEVER APPEARS IN ANY CLIENT, THERAPIST OR PUBLIC RESPONSE', async () => {
    await Review.deleteMany({});
    await submit('expired', { stars: 1, text: CANARY });
    expect(await Review.countDocuments({})).toBe(1);

    const b = bookings.active._id;
    const responses = await Promise.all([
      // The client who wrote it — their portal still answers while expired.
      get('/api/v1/client/me', 'expired'),
      // Another client of the same therapist, with a live portal.
      get('/api/v1/client/me', 'active'),
      get('/api/v1/client/journal', 'active'),
      get('/api/v1/client/worksheets', 'active'),
      get(`/api/v1/chat/${b}/messages`, 'active'),
      get('/api/v1/chat/unread-count', 'active'),
      get(`/api/v1/sessions/${b}`, 'active'),
      get(`/api/v1/sessions/${b}?scope=history`, 'active'),
      // The therapist the review is ABOUT — every screen they have.
      get('/api/v1/therapist/profile', 'therapist'),
      get('/api/v1/therapist/clients', 'therapist'),
      get(`/api/v1/therapist/clients/${bookings.expired._id}`, 'therapist'),
      get(`/api/v1/therapist/clients/${b}`, 'therapist'),
      get(`/api/v1/therapist/worksheets/${b}`, 'therapist'),
      get(`/api/v1/therapist/journal/${b}`, 'therapist'),
      get(`/api/v1/therapist/notes/${b}`, 'therapist'),
      get(`/api/v1/sessions/${b}`, 'therapist'),
      get(`/api/v1/chat/${b}/messages`, 'therapist'),
      get('/api/v1/chat/unread-count', 'therapist'),
      // The public: the profile a visitor reads, and the matching results.
      get(`/api/v1/therapists/${profiles.therapist._id}`),
      (() => {
        resetLimits();
        return request(app)
          .post('/api/v1/matching')
          .send({ concernTags: ['Anxiety'], therapistGenderPreference: 'no_preference' });
      })(),
    ]);

    for (const res of responses) {
      // Every one really answered — otherwise the sweep proves nothing.
      expect({ url: res.req.path, status: res.status < 400 }).toEqual({
        url: res.req.path,
        status: true,
      });

      const body = JSON.stringify(res.body);
      const lower = body.toLowerCase();
      expect(body).not.toContain(CANARY);
      for (const key of ['"stars"', 'averagerating', 'reviewcount', 'writtencount', '"reviews"', '"rating', '"distribution"']) {
        expect({ url: res.req.path, key, found: lower.includes(key) }).toEqual({
          url: res.req.path,
          key,
          found: false,
        });
      }
    }

    // And the one place it is allowed, it is there.
    const admin = await get('/api/v1/admin/reviews', 'admin');
    expect(JSON.stringify(admin.body)).toContain(CANARY);
  });
});

/* ────────────────────────────────────────────────────────────────────────── */

describe('the admin’s review list — GET /admin/reviews', () => {
  beforeEach(async () => {
    await Review.deleteMany({});
  });

  test('names who wrote it and who it is about, by profile id — never a user id', async () => {
    await submit('expired', { stars: 4, text: 'Helped me more than I expected.' });

    const res = await get('/api/v1/admin/reviews', 'admin');
    const [review] = res.body.data;

    expect(res.status).toBe(200);
    expect(review.stars).toBe(4);
    expect(review.client).toEqual({ id: String(profiles.expired._id), displayName: 'Client expired' });
    expect(review.therapist).toEqual({ id: String(profiles.therapist._id), name: 'Dr. Priya Raman' });

    const body = JSON.stringify(res.body);
    expect(body).not.toContain(String(users.expired._id));
    expect(body).not.toContain(String(users.therapist._id));
  });

  test('filters to one therapist by profile id, and pages newest first', async () => {
    await makeTherapist('listOther', { lastName: 'Other' });
    const ids = [];
    for (let i = 0; i < 3; i += 1) {
      const created = await Review.create({
        bookingId: new mongoose.Types.ObjectId(),
        clientId: new mongoose.Types.ObjectId(),
        therapistId: users.therapist._id,
        subscriptionId: new mongoose.Types.ObjectId(),
        stars: i + 1,
      });
      await Review.collection.updateOne({ _id: created._id }, { $set: { createdAt: new Date(Date.now() - (3 - i) * DAY) } });
      ids.push(String(created._id));
    }
    await Review.create({
      bookingId: new mongoose.Types.ObjectId(),
      clientId: new mongoose.Types.ObjectId(),
      therapistId: users.listOther._id,
      subscriptionId: new mongoose.Types.ObjectId(),
      stars: 5,
    });

    const first = await get(`/api/v1/admin/reviews?therapistId=${profiles.therapist._id}&limit=2`, 'admin');
    const second = await get(`/api/v1/admin/reviews?therapistId=${profiles.therapist._id}&limit=2&page=2`, 'admin');

    expect(first.body.meta.total).toBe(3);
    expect(first.body.data.map((r) => r.id)).toEqual([ids[2], ids[1]]);
    expect(second.body.data.map((r) => r.id)).toEqual([ids[0]]);
  });

  test('an unknown therapist is 404, a malformed one 422', async () => {
    expect((await get(`/api/v1/admin/reviews?therapistId=${new mongoose.Types.ObjectId()}`, 'admin')).status).toBe(404);
    expect((await get('/api/v1/admin/reviews?therapistId=nope', 'admin')).status).toBe(422);
  });

  test('refuses a client and a therapist', async () => {
    expect((await get('/api/v1/admin/reviews', 'expired')).status).toBe(403);
    expect((await get('/api/v1/admin/reviews', 'therapist')).status).toBe(403);
  });
});

describe('the therapist’s ratings in admin — GET /admin/therapists/:id', () => {
  test('average, count, how many came with words, and the count at each star', async () => {
    await Review.deleteMany({});
    for (const [stars, text] of [[5, 'Wonderful.'], [5, undefined], [4, undefined], [2, 'Rushed.']]) {
      await Review.create({
        bookingId: new mongoose.Types.ObjectId(),
        clientId: new mongoose.Types.ObjectId(),
        therapistId: users.therapist._id,
        subscriptionId: new mongoose.Types.ObjectId(),
        stars,
        text,
      });
    }

    const res = await get(`/api/v1/admin/therapists/${profiles.therapist._id}`, 'admin');

    expect(res.body.averageRating).toBe(4);
    expect(res.body.reviewCount).toBe(4);
    expect(res.body.writtenCount).toBe(2);
    expect(res.body.distribution).toEqual({ 5: 2, 4: 1, 3: 0, 2: 1, 1: 0 });
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * The dashboard. LAST in the file: it deactivates every earlier therapist so the
 * ranking can be asserted exactly.
 * ──────────────────────────────────────────────────────────────────────────── */

describe('the dashboard’s quality picture — GET /admin/stats', () => {
  let seq = 0;

  async function ratedTherapist(stars, { status = 'active', text } = {}) {
    seq += 1;
    const key = `dash${seq}`;
    await makeTherapist(key, { firstName: 'T', lastName: `Rated${seq}`, status });
    for (const value of stars) {
      await Review.create({
        bookingId: new mongoose.Types.ObjectId(),
        clientId: new mongoose.Types.ObjectId(),
        therapistId: users[key]._id,
        subscriptionId: new mongoose.Types.ObjectId(),
        stars: value,
        text,
      });
    }
    return `Dr. T Rated${seq}`;
  }

  const quality = async () => (await get('/api/v1/admin/stats', 'admin')).body.quality;

  beforeEach(async () => {
    await Review.deleteMany({});
    await TherapistProfile.updateMany({}, { $set: { status: 'inactive' } });
  });

  test('nothing rated reads as an absence, never as zero', async () => {
    const q = await quality();
    expect(q.averageRating).toBeNull();
    expect(q.reviewCount).toBe(0);
    expect(q.highestRated).toEqual([]);
    expect(q.needsAttention).toEqual([]);
  });

  test(`A THERAPIST WITH FEWER THAN ${RANKING_MIN_RATINGS} RATINGS IS COUNTED, NOT RANKED`, async () => {
    await ratedTherapist([1, 1]);
    const ranked = await ratedTherapist([5, 5, 5]);

    const q = await quality();

    expect(q.highestRated.map((t) => t.name)).toEqual([ranked]);
    expect(q.needsAttention).toEqual([]);
    expect(q.unrankedCount).toBe(1);
    expect(q.rankingMinimum).toBe(RANKING_MIN_RATINGS);
  });

  test('the ranked set splits at its middle — never the same name in both lists', async () => {
    const best = await ratedTherapist([5, 5, 5]);
    const good = await ratedTherapist([4, 4, 5]);
    const fair = await ratedTherapist([3, 3, 4]);
    const worst = await ratedTherapist([1, 2, 2]);

    const q = await quality();

    expect(q.highestRated.map((t) => t.name)).toEqual([best, good]);
    // Lowest first — the name most worth a look leads.
    expect(q.needsAttention.map((t) => t.name)).toEqual([worst, fair]);
    expect(q.highestRated[0]).toMatchObject({ averageRating: 5, reviewCount: 3 });
  });

  test('a deactivated therapist is not ranked — "needs attention" is for people still working', async () => {
    await ratedTherapist([1, 1, 1], { status: 'inactive' });
    const q = await quality();
    expect(q.needsAttention).toEqual([]);
    expect(q.reviewCount).toBe(3);
  });

  test('the platform average, the count, and how many came with words', async () => {
    await ratedTherapist([5, 4, 3], { text: 'Some words.' });
    await ratedTherapist([2]);

    const q = await quality();

    expect(q.averageRating).toBe(3.5);
    expect(q.reviewCount).toBe(4);
    expect(q.writtenCount).toBe(3);
  });

  test('the recent feed is newest first and names the therapist', async () => {
    const name = await ratedTherapist([4]);
    const q = await quality();
    expect(q.recentReviews[0].therapist.name).toBe(name);
  });
});
