import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/User.js';
import { TherapistApplication } from '../models/TherapistApplication.js';
import { hashPassword } from '../utils/password.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { TREND_MONTHS } from '../constants/adminStats.js';
import { loginRateLimiter, sessionRateLimiter } from './auth.routes.js';
import { adminRateLimiter } from './admin.routes.js';
import { startMemoryMongo, stopMemoryMongo } from '../test/mongoMemory.js';

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const STATS = '/api/v1/admin/stats';

const EMAILS = {
  [ROLES.CLIENT]: 'stats-client@example.com',
  [ROLES.THERAPIST]: 'stats-therapist@example.com',
  [ROLES.ADMIN]: 'stats-admin@example.com',
};

const NO_TOKEN = Symbol('no token');
const tokens = {};

function resetRateLimits() {
  LOOPBACK_KEYS.forEach((key) => {
    loginRateLimiter.resetKey(key);
    sessionRateLimiter.resetKey(key);
    adminRateLimiter.resetKey(key);
  });
}

function get(path, token = tokens[ROLES.ADMIN]) {
  const req = request(app).get(path);
  return token === NO_TOKEN ? req : req.set('Authorization', `Bearer ${token}`);
}

const utcMonthStart = (offset) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 5));
};

beforeAll(async () => {
  await startMemoryMongo();
  await User.init();
  await TherapistApplication.init();

  const passwordHash = await hashPassword(PASSWORD);

  for (const role of Object.values(ROLES)) {
    await User.create({
      email: EMAILS[role],
      passwordHash,
      role,
      status: USER_STATUS.ACTIVE,
    });

    resetRateLimits();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: EMAILS[role], password: PASSWORD });

    tokens[role] = res.body.accessToken;
  }
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(() => {
  resetRateLimits();
});

describe('the empty database — the chunk\'s verify step', () => {
  test('loads without error and every money figure is 0', async () => {
    const res = await get(STATS);

    expect(res.status).toBe(200);
    expect(res.body.money).toEqual({
      monthlyRecurringRevenue: 0,
      currency: 'EUR',
      activeSubscriptions: 0,
      newThisMonth: 0,
      newLastMonth: 0,
      cancelledOrExpiredThisMonth: 0,
    });
  });

  test('reads collections that do not exist yet without crashing', async () => {
    // `sessions` and `reviews` still have no model, so these collections have
    // never been created. MongoDB answers 0 and [] rather than throwing, which
    // is what lets these figures switch on by themselves when their slice ships.
    //
    // UPDATED IN CHUNK 6.4. This test used to assert `subscriptions` was absent
    // too. It no longer is: chunk 6.1 added the model, and Mongoose builds its
    // indexes on connect, which creates the (empty) collection. The dashboard
    // behaviour is unchanged — every figure below still reads zero — but the
    // premise "the collection does not exist" stopped being true, so asserting
    // it would only pin an accident of when a model happened to be written.
    const names = (await mongoose.connection.db.listCollections().toArray()).map(
      (c) => c.name,
    );
    expect(names).not.toContain('sessions');
    expect(names).not.toContain('reviews');

    const res = await get(STATS);
    expect(res.status).toBe(200);
    expect(res.body.activity.sessionsThisMonth).toBe(0);
    expect(res.body.quality.reviewCount).toBe(0);
    expect(res.body.quality.recentReviews).toEqual([]);
  });

  test('average rating is NULL, not 0, when nothing has been rated', async () => {
    const res = await get(STATS);

    // 0 would claim every therapist scored the lowest possible mark. The
    // absence of a rating and a rating of zero are different statements.
    expect(res.body.quality.averageRating).toBeNull();
    expect(res.body.quality.averageRating).not.toBe(0);
  });

  test('the trend returns a full year of buckets with a label and a key', async () => {
    const res = await get(STATS);
    const { signups } = res.body.activity;

    expect(signups).toHaveLength(TREND_MONTHS);
    expect(signups.every((point) => /^\d{4}-\d{2}$/.test(point.month))).toBe(true);
    expect(signups.every((point) => typeof point.label === 'string')).toBe(true);
    expect(signups.every((point) => Number.isInteger(point.count))).toBe(true);
    // Every month is present, including the ones with nothing in them — a
    // trend with its empty months dropped is a different shape from the truth.
    expect(signups.slice(0, TREND_MONTHS - 1).every((p) => p.count === 0)).toBe(true);
  });

  test('on a GENUINELY empty database every figure reads zero', async () => {
    // The suite seeds one user per role so it can hold three tokens, and a
    // client account is itself a signup. Removing them makes this the real
    // empty-database check the chunk asks to verify, rather than one that
    // quietly tolerates the fixtures.
    const clients = await User.find({ role: ROLES.CLIENT }).lean();
    await User.deleteMany({ role: ROLES.CLIENT });

    const res = await get(STATS);

    expect(res.status).toBe(200);
    expect(res.body.people).toEqual({
      activeClients: 0,
      inactiveClients: 0,
      totalClients: 0,
      totalTherapists: 0,
      pendingApplications: 0,
    });
    expect(res.body.activity.sessionsThisMonth).toBe(0);
    expect(res.body.activity.signups.every((point) => point.count === 0)).toBe(true);
    expect(res.body.quality.reviewCount).toBe(0);
    expect(res.body.money.monthlyRecurringRevenue).toBe(0);

    // Restored through the raw collection so _id and createdAt survive.
    if (clients.length) await User.collection.insertMany(clients);
  });

  test('the last bucket is the current UTC month', async () => {
    const res = await get(STATS);
    const { signups } = res.body.activity;
    const now = new Date();
    const expected = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

    expect(signups[signups.length - 1].month).toBe(expected);
  });
});

describe('people counts', () => {
  test('counts clients by status and does not count therapists or admins', async () => {
    await User.create([
      { email: 'c1@example.com', passwordHash: 'x', role: ROLES.CLIENT, status: USER_STATUS.ACTIVE },
      { email: 'c2@example.com', passwordHash: 'x', role: ROLES.CLIENT, status: USER_STATUS.INACTIVE },
    ]);

    const res = await get(STATS);

    // One client seeded in beforeAll, plus these two.
    expect(res.body.people.activeClients).toBe(2);
    expect(res.body.people.inactiveClients).toBe(1);
    expect(res.body.people.totalClients).toBe(3);
  });

  test('therapists are counted from PROFILES, not from user records', async () => {
    // A therapist user exists from beforeAll, but approval never ran, so no
    // profile was created — and a therapist without a profile is invisible to
    // matching. The dashboard must not report them as onboarded.
    const res = await get(STATS);
    expect(res.body.people.totalTherapists).toBe(0);
  });

  test('counts pending applications only', async () => {
    const base = {
      title: 'Dr.',
      firstName: 'Ada',
      lastName: 'Lovelace',
      gender: 'female',
      dateOfBirth: new Date('1985-03-02'),
      passwordHash: 'x',
      photoUrl: 'https://res.cloudinary.com/x/image/upload/v1/p.jpg',
      streetAddress: '12 Way',
      city: 'London',
      stateProvince: 'London',
      zipPostal: 'W1',
      country: 'UK',
      timezone: 'Europe/London',
      languages: ['English'],
      workingHours: { monday: { enabled: true, start: '09:00', end: '17:00' } },
      therapistType: 'Clinical Psychologist',
      credentialType: 'License',
      credentialInitials: 'PhD',
      yearsExperience: 9,
      educationSummary: 'PhD.',
      currentWorkSituation: 'Practice.',
      specialtyTags: ['Anxiety', 'Depression', 'Grief'],
      treatmentOrientations: ['CBT'],
      bio: 'Bio.',
      licensingStatus: 'Licensed.',
      disciplinaryActions: false,
      malpracticeInsurance: true,
      certificateUrl1: 'https://res.cloudinary.com/x/image/authenticated/s--a--/v1/c.pdf',
    };

    await TherapistApplication.create({ ...base, email: 'p1@example.com' });
    await TherapistApplication.create({
      ...base,
      email: 'p2@example.com',
      status: 'approved',
    });

    const res = await get(STATS);
    expect(res.body.people.pendingApplications).toBe(1);
  });
});

describe('the signups trend', () => {
  test('counts client signups into the right month, ignoring other roles', async () => {
    const [thisMonth, lastMonth] = [utcMonthStart(0), utcMonthStart(-1)];

    const made = await User.create([
      { email: 't1@example.com', passwordHash: 'x', role: ROLES.CLIENT, status: USER_STATUS.ACTIVE },
      { email: 't2@example.com', passwordHash: 'x', role: ROLES.CLIENT, status: USER_STATUS.ACTIVE },
      { email: 't3@example.com', passwordHash: 'x', role: ROLES.THERAPIST, status: USER_STATUS.ACTIVE },
    ]);

    // createdAt is a managed timestamp, so it is forced through the raw
    // collection — Mongoose ignores attempts to change it in an update.
    const col = User.collection;
    await col.updateOne({ _id: made[0]._id }, { $set: { createdAt: thisMonth } });
    await col.updateOne({ _id: made[1]._id }, { $set: { createdAt: lastMonth } });
    await col.updateOne({ _id: made[2]._id }, { $set: { createdAt: lastMonth } });

    const res = await get(STATS);
    const { signups } = res.body.activity;
    const byMonth = Object.fromEntries(signups.map((p) => [p.month, p.count]));

    const key = (d) =>
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

    // The therapist created last month must not appear in a signups trend.
    expect(byMonth[key(lastMonth)]).toBe(1);
    expect(byMonth[key(thisMonth)]).toBeGreaterThanOrEqual(1);
  });
});

describe('access', () => {
  test('a client token cannot read the stats', async () => {
    const res = await get(STATS, tokens[ROLES.CLIENT]);
    expect(res.status).toBe(403);
  });

  test('a therapist token cannot read the stats', async () => {
    const res = await get(STATS, tokens[ROLES.THERAPIST]);
    expect(res.status).toBe(403);
  });

  test('no token is 401', async () => {
    const res = await get(STATS, NO_TOKEN);
    expect(res.status).toBe(401);
  });
});
