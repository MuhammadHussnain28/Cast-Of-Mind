import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { TherapistProfile } = await import('../models/TherapistProfile.js');
const { Notification } = await import('../models/Notification.js');
const { Worksheet } = await import('../models/Worksheet.js');
const { hashPassword } = await import('../utils/password.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { SUBSCRIPTION_STATUS, SUBSCRIPTION_AMOUNT_MINOR } = await import('../constants/payments.js');
const { NOTIFICATION_TYPE, RETENTION_SECONDS } = await import('../constants/notifications.js');
const { notify } = await import('../services/notification.service.js');
const { sendMessage, postSessionNotice } = await import('../services/chat.service.js');
const { loginRateLimiter, sessionRateLimiter } = await import('./auth.routes.js');
const { notificationRateLimiter } = await import('./notifications.routes.js');
const { chatSendRateLimiter, chatReadRateLimiter } = await import('./chat.routes.js');
const { startMemoryMongo, stopMemoryMongo } = await import('../test/mongoMemory.js');

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const BASE = '/api/v1/notifications';
const DAY = 24 * 60 * 60 * 1000;

const users = {};
const tokens = {};
const bookings = {};
const profiles = {};

function resetLimits() {
  const limiters = [
    loginRateLimiter, sessionRateLimiter, notificationRateLimiter,
    chatSendRateLimiter, chatReadRateLimiter,
  ];
  for (const key of LOOPBACK) for (const limiter of limiters) limiter?.resetKey(key);
}

const auth = (req, token) => (token ? req.set('Authorization', `Bearer ${token}`) : req);
const get = (path, key) => {
  resetLimits();
  return auth(request(app).get(path), tokens[key]);
};
const post = (path, key) => {
  resetLimits();
  return auth(request(app).post(path).send({}), tokens[key]);
};

async function makeUser(key, role) {
  users[key] = await User.create({
    email: `nt-${key.toLowerCase()}@example.com`,
    passwordHash: await hashPassword(PASSWORD),
    role,
    status: USER_STATUS.ACTIVE,
  });
  resetLimits();
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: `nt-${key.toLowerCase()}@example.com`, password: PASSWORD });
  tokens[key] = res.body.accessToken;
}

async function makeTherapist(key) {
  await makeUser(key, ROLES.THERAPIST);
  profiles[key] = await TherapistProfile.create({
    userId: users[key]._id,
    applicationId: new mongoose.Types.ObjectId(),
    title: 'Dr.', firstName: 'Priya', lastName: 'Raman', gender: 'female',
    dateOfBirth: new Date('1985-04-02'),
    photoUrl: 'https://res.cloudinary.com/x/image/upload/v1/p.jpg',
    streetAddress: '1 Quay Street', city: 'Galway', stateProvince: 'Connacht',
    zipPostal: 'H91', country: 'Ireland', timezone: 'Europe/Dublin',
    languages: ['English'],
    workingHours: { monday: { enabled: true, start: '09:00', end: '17:00' } },
    therapistType: 'Clinical Psychologist', credentialType: 'License',
    credentialInitials: 'PhD', yearsExperience: 9,
    educationSummary: 'Doctorate.', currentWorkSituation: 'Private practice.',
    specialtyTags: ['Anxiety', 'Depression', 'Grief'], treatmentOrientations: ['CBT'],
    bio: 'Works with anxiety.', licensingStatus: 'Licensed in Ireland.',
    disciplinaryActions: false, malpracticeInsurance: true,
    certificateUrl1: 'https://res.cloudinary.com/x/image/authenticated/s--a--/v1/c.pdf',
    status: 'active',
  });
}

async function makeClient(key, therapistKey, { couple = null } = {}) {
  await makeUser(key, ROLES.CLIENT);
  profiles[key] = await ClientProfile.create({
    userId: users[key]._id,
    type: couple ? 'couple' : 'individual',
    country: 'Ireland', city: 'Cork', relationshipStatus: 'Single',
    concernTags: ['Anxiety'], therapistGenderPreference: 'no_preference',
    ...(couple
      ? { coupleData: { partner1: { name: couple[0], age: 34, gender: 'female' }, partner2: { name: couple[1], age: 36, gender: 'male' } } }
      : { name: `Client ${key}`, age: 29, gender: 'male' }),
  });
  bookings[key] = await Booking.create({
    clientId: users[key]._id,
    therapistId: users[therapistKey]._id,
  });
  await Subscription.create({
    bookingId: bookings[key]._id,
    clientId: users[key]._id,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    amount: SUBSCRIPTION_AMOUNT_MINOR,
    currentPeriodEnd: new Date(Date.now() + 25 * DAY),
    nextBillingDate: new Date(Date.now() + 25 * DAY),
    platformSubscriptionId: `sub_${Math.random().toString(36).slice(2, 12)}`,
  });
}

const asClient = (key) => ({ id: String(users[key]._id), role: ROLES.CLIENT });
const asTherapist = (key) => ({ id: String(users[key]._id), role: ROLES.THERAPIST });

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([
    User.init(), Booking.init(), Subscription.init(), Notification.init(),
    ClientProfile.init(), TherapistProfile.init(), Worksheet.init(),
  ]);

  await makeTherapist('therapist');
  await makeTherapist('otherTherapist');
  await makeClient('marta', 'therapist');
  await makeClient('joris', 'therapist');
  await makeClient('couple', 'therapist', { couple: ['Marta', 'Joris'] });
  await makeUser('admin', ROLES.ADMIN);
}, 180000);

afterAll(async () => {
  await stopMemoryMongo();
}, 120000);

beforeEach(async () => {
  await Notification.deleteMany({});
  resetLimits();
});

describe('what raises an alert', () => {
  test("a client's message alerts THEIR therapist, and nobody else", async () => {
    await sendMessage(bookings.marta._id, asClient('marta'), 'I had a hard week and wanted to say so.');

    const rows = await Notification.find({}).lean();

    expect(rows).toHaveLength(1);
    expect(String(rows[0].userId)).toBe(String(users.therapist._id));
    expect(rows[0].type).toBe(NOTIFICATION_TYPE.NEW_MESSAGE);
    expect(String(rows[0].bookingId)).toBe(String(bookings.marta._id));
    expect(rows[0].count).toBe(1);
    expect(rows[0].read).toBe(false);
  });

  test('A THERAPIST IS NEVER ALERTED BY THEIR OWN MESSAGE — and nor is the client', async () => {
    await sendMessage(bookings.marta._id, asClient('marta'), 'An opening message, long enough to pass.');
    await Notification.deleteMany({});

    await sendMessage(bookings.marta._id, asTherapist('therapist'), 'Thank you for writing.');

    expect(await Notification.countDocuments({})).toBe(0);
  });

  test('a system message the platform wrote raises nothing', async () => {
    await postSessionNotice(bookings.marta, users.therapist._id, {
      event: 'scheduled',
      sessionId: new mongoose.Types.ObjectId(),
      scheduledAt: new Date(Date.now() + 3 * DAY),
    });

    expect(await Notification.countDocuments({})).toBe(0);
  });

  test('a returned worksheet alerts the therapist', async () => {
    await notify({
      userId: users.therapist._id,
      type: NOTIFICATION_TYPE.WORKSHEET_SUBMITTED,
      bookingId: bookings.marta._id,
    });

    const row = await Notification.findOne({}).lean();
    expect(row.type).toBe(NOTIFICATION_TYPE.WORKSHEET_SUBMITTED);
  });
});

describe('grouping — one alert per client per kind', () => {
  test('TWELVE MESSAGES ARE ONE ALERT THAT SAYS TWELVE, not twelve alerts', async () => {
    for (let i = 0; i < 12; i += 1) {
      await sendMessage(bookings.marta._id, asClient('marta'), `Message number ${i} in a long run.`);
    }

    const rows = await Notification.find({}).lean();

    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(12);
  });

  test('a different client, or a different kind, is its own alert', async () => {
    await sendMessage(bookings.marta._id, asClient('marta'), 'One from Marta, long enough to send.');
    await sendMessage(bookings.joris._id, asClient('joris'), 'One from Joris, long enough to send.');
    await notify({
      userId: users.therapist._id,
      type: NOTIFICATION_TYPE.WORKSHEET_SUBMITTED,
      bookingId: bookings.marta._id,
    });

    expect(await Notification.countDocuments({})).toBe(3);
  });

  test('READING ONE CLOSES IT — the next message opens a fresh alert', async () => {
    await sendMessage(bookings.marta._id, asClient('marta'), 'The first one, long enough to send.');
    const first = await Notification.findOne({}).lean();

    await post(`${BASE}/${first._id}/read`, 'therapist');
    await sendMessage(bookings.marta._id, asClient('marta'), 'The second one, after it was read.');

    const rows = await Notification.find({}).sort({ createdAt: 1 }).lean();
    expect(rows).toHaveLength(2);
    expect(rows[0].read).toBe(true);
    expect(rows[0].count).toBe(1);
    expect(rows[1].read).toBe(false);
    expect(rows[1].count).toBe(1);
  });

  test('two messages racing each other still leave ONE alert counting two', async () => {
    await Promise.all([
      sendMessage(bookings.marta._id, asClient('marta'), 'Racing message one, long enough.'),
      sendMessage(bookings.marta._id, asClient('marta'), 'Racing message two, long enough.'),
    ]);

    const rows = await Notification.find({}).lean();
    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(2);
  });
});

describe('the feed', () => {
  test('is the caller’s own, newest activity first, with the unread total', async () => {
    await sendMessage(bookings.marta._id, asClient('marta'), 'From Marta, long enough to send.');
    await sendMessage(bookings.joris._id, asClient('joris'), 'From Joris, long enough to send.');

    const res = await get(BASE, 'therapist');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].client.name).toBe('Client joris');
    expect(res.body.meta.unread).toBe(2);
  });

  test('NAMES A COUPLE WITH BOTH PARTNERS', async () => {
    await sendMessage(bookings.couple._id, asClient('couple'), 'From both of us, long enough.');

    const res = await get(BASE, 'therapist');
    expect(res.body.data[0].client.name).toBe('Marta and Joris');
  });

  test('CARRIES NO MESSAGE TEXT, NO WORKSHEET TITLE, AND NO USER ID', async () => {
    const secret = 'CANARY-the-thing-I-could-not-say-out-loud';
    await sendMessage(bookings.marta._id, asClient('marta'), secret);

    const res = await get(BASE, 'therapist');
    const body = JSON.stringify(res.body);

    expect(body).not.toContain(secret);
    expect(body).not.toContain(String(users.marta._id));
    expect(body).not.toContain(String(users.therapist._id));
    expect(body.toLowerCase()).not.toContain('"text"');
    expect(body.toLowerCase()).not.toContain('title');
    // What it DOES carry: the booking to open, the kind, the count.
    expect(res.body.data[0].bookingId).toBe(String(bookings.marta._id));
  });

  test('ANOTHER THERAPIST SEES NOTHING OF IT', async () => {
    await sendMessage(bookings.marta._id, asClient('marta'), 'For my own therapist only.');

    const res = await get(BASE, 'otherTherapist');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.unread).toBe(0);
  });

  test('a client gets an empty feed rather than a refusal (v1 is therapist-only)', async () => {
    await sendMessage(bookings.marta._id, asClient('marta'), 'Something for the bell, long enough.');

    const res = await get(BASE, 'marta');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('pages, and refuses an absurd page size', async () => {
    await sendMessage(bookings.marta._id, asClient('marta'), 'From Marta, long enough to send.');
    await sendMessage(bookings.joris._id, asClient('joris'), 'From Joris, long enough to send.');

    const first = await get(`${BASE}?limit=1`, 'therapist');
    expect(first.body.data).toHaveLength(1);
    expect(first.body.meta.total).toBe(2);
    expect(first.body.meta.pages).toBe(2);

    expect((await get(`${BASE}?limit=5000`, 'therapist')).status).toBe(422);
  });

  test('refuses without a token', async () => {
    resetLimits();
    expect((await request(app).get(BASE)).status).toBe(401);
  });
});

describe('marking read', () => {
  test('one alert, and the unread total comes back with it', async () => {
    await sendMessage(bookings.marta._id, asClient('marta'), 'From Marta, long enough to send.');
    await sendMessage(bookings.joris._id, asClient('joris'), 'From Joris, long enough to send.');
    const [row] = await Notification.find({}).lean();

    const res = await post(`${BASE}/${row._id}/read`, 'therapist');

    expect(res.body).toEqual({ read: true, unread: 1 });
    expect((await Notification.findById(row._id)).read).toBe(true);
  });

  test('ANOTHER THERAPIST’S ALERT IS THE SAME 404 A MADE-UP ONE GETS', async () => {
    await sendMessage(bookings.marta._id, asClient('marta'), 'For my own therapist only.');
    const row = await Notification.findOne({}).lean();

    const theirs = await post(`${BASE}/${row._id}/read`, 'otherTherapist');
    const invented = await post(`${BASE}/${new mongoose.Types.ObjectId()}/read`, 'otherTherapist');
    const malformed = await post(`${BASE}/not-an-id/read`, 'otherTherapist');

    expect(theirs.status).toBe(404);
    expect(JSON.stringify(theirs.body)).toBe(JSON.stringify(invented.body));
    expect(JSON.stringify(malformed.body)).toBe(JSON.stringify(invented.body));
    // And it really is still unread for the therapist it belongs to.
    expect((await Notification.findById(row._id)).read).toBe(false);
  });

  test('read-all clears only the caller’s own', async () => {
    await sendMessage(bookings.marta._id, asClient('marta'), 'From Marta, long enough to send.');
    await sendMessage(bookings.joris._id, asClient('joris'), 'From Joris, long enough to send.');
    await notify({
      userId: users.otherTherapist._id,
      type: NOTIFICATION_TYPE.NEW_CLIENT,
      bookingId: bookings.marta._id,
    });

    const res = await post(`${BASE}/read-all`, 'therapist');

    expect(res.body).toEqual({ read: 2, unread: 0 });
    expect(await Notification.countDocuments({ userId: users.therapist._id, read: false })).toBe(0);
    expect(await Notification.countDocuments({ userId: users.otherTherapist._id, read: false })).toBe(1);
  });
});

describe('the bell never breaks what it reports on', () => {
  test('A MESSAGE STILL SENDS WHEN THE NOTIFICATION WRITE THROWS', async () => {
    const broken = jest
      .spyOn(Notification, 'findOneAndUpdate')
      .mockRejectedValue(new Error('notification store unavailable'));
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const sent = await sendMessage(bookings.marta._id, asClient('marta'), 'This must arrive regardless.');
      expect(sent.id).toBeDefined();
      expect(await Notification.countDocuments({})).toBe(0);
      // Logged by NAME only — never the error's message, which could carry text.
      const logged = errors.mock.calls.flat().join(' ');
      expect(logged).toContain('Error');
      expect(logged).not.toContain('notification store unavailable');
    } finally {
      broken.mockRestore();
      errors.mockRestore();
    }
  });
});

describe('retention', () => {
  test('a TTL index expires alerts 60 days after their LAST event', async () => {
    const indexes = await Notification.collection.indexes();
    const ttl = indexes.find((index) => index.expireAfterSeconds !== undefined);

    expect(ttl).toBeDefined();
    expect(ttl.key).toEqual({ lastAt: 1 });
    expect(ttl.expireAfterSeconds).toBe(RETENTION_SECONDS);
    expect(RETENTION_SECONDS).toBe(60 * 24 * 60 * 60);
  });

  test('the open-alert index is partial, so read history is kept', async () => {
    const indexes = await Notification.collection.indexes();
    const open = indexes.find((index) => index.name === 'one_open_alert_per_kind');

    expect(open.unique).toBe(true);
    expect(open.partialFilterExpression).toEqual({ read: false });
  });
});
