import { jest } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import mongoose from 'mongoose';
import { createEmailServiceMock } from '../test/emailServiceMock.js';

// Bulk-safety (10.6). No admin action may touch more than the one record in its
// URL: proven statically (no multi-document writes in admin code) and over the
// wire (an id shaped like a query operator changes nothing, anywhere).

const sendPasswordResetEmail = jest.fn(async () => ({ delivered: true }));
const stripeUpdate = jest.fn(async () => ({ id: 'sub_test', cancel_at_period_end: true }));

jest.unstable_mockModule('../services/email/email.service.js', () =>
  createEmailServiceMock({ sendPasswordResetEmail }),
);

jest.unstable_mockModule('../config/stripe.js', () => ({
  stripe: { subscriptions: { update: stripeUpdate } },
  isStripeConfigured: true,
  isTestKey: true,
  default: { subscriptions: { update: stripeUpdate } },
}));

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { TherapistProfile } = await import('../models/TherapistProfile.js');
const { TherapistApplication } = await import('../models/TherapistApplication.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { hashPassword } = await import('../utils/password.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { SUBSCRIPTION_STATUS, SUBSCRIPTION_AMOUNT_MINOR, BOOKING_STATUS } = await import(
  '../constants/payments.js'
);
const { loginRateLimiter, sessionRateLimiter } = await import('./auth.routes.js');
const { adminRateLimiter } = await import('./admin.routes.js');
const { startMemoryReplSet, stopMemoryMongo } = await import('../test/mongoMemory.js');

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const MULTI_WRITE = /\.\s*(updateMany|deleteMany|bulkWrite|insertMany)\s*\(/;

// Each is refused as a malformed id; none may be read as "every record".
const HOSTILE_IDS = [
  encodeURIComponent('{"$ne":null}'),
  encodeURIComponent('{"$gt":""}'),
  encodeURIComponent('[object Object]'),
  '000000000000000000000000,111111111111111111111111',
  '*',
  '.*',
];

let adminToken;
let therapist;
let client;
let application;

function resetRateLimits() {
  LOOPBACK_KEYS.forEach((key) => {
    loginRateLimiter.resetKey(key);
    sessionRateLimiter.resetKey(key);
    adminRateLimiter.resetKey(key);
  });
}

const importsOf = (file) =>
  [...fs.readFileSync(file, 'utf8').matchAll(/(?:\bfrom\s+|\bimport\s*\(?\s*)['"](\.[^'"]+)['"]/g)]
    .map((match) => path.resolve(path.dirname(file), match[1]));

function reachableFrom(entry) {
  const seen = new Set();
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file) || !fs.existsSync(file)) continue;
    seen.add(file);
    queue.push(...importsOf(file));
  }
  return seen;
}

/** Every stored document the admin can act on, in a stable order. */
async function snapshot() {
  const models = [User, ClientProfile, TherapistProfile, TherapistApplication, Booking, Subscription];
  const dumps = await Promise.all(
    models.map((Model) => Model.find().select('+passwordHash').sort({ _id: 1 }).lean()),
  );
  return JSON.stringify(dumps);
}

/** The ten admin routes that write, with a body that passes validation. */
const writeRoutes = (id) => [
  ['post', `/api/v1/admin/applications/${id}/approve`, {}],
  ['post', `/api/v1/admin/applications/${id}/reject`, {}],
  ['patch', `/api/v1/admin/therapists/${id}`, { firstName: 'Mass' }],
  ['post', `/api/v1/admin/therapists/${id}/deactivate`, {}],
  ['post', `/api/v1/admin/therapists/${id}/reactivate`, {}],
  ['post', `/api/v1/admin/therapists/${id}/reset-password`, {}],
  ['post', `/api/v1/admin/clients/${id}/cancel-subscription`, {}],
  ['post', `/api/v1/admin/clients/${id}/deactivate`, {}],
  ['post', `/api/v1/admin/clients/${id}/reactivate`, {}],
  ['post', `/api/v1/admin/clients/${id}/reset-password`, {}],
];

function send(method, url, body) {
  return request(app)[method](url).set('Authorization', `Bearer ${adminToken}`).send(body);
}

beforeAll(async () => {
  // A replica set: the therapist edit runs in a transaction.
  await startMemoryReplSet();
  await Promise.all([User.init(), TherapistApplication.init()]);
  const passwordHash = await hashPassword(PASSWORD);

  await User.create({
    email: 'bulk-admin@example.com',
    passwordHash,
    role: ROLES.ADMIN,
    status: USER_STATUS.ACTIVE,
  });
  resetRateLimits();
  adminToken = (
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bulk-admin@example.com', password: PASSWORD })
  ).body.accessToken;

  // Two of each, so a write that escaped its one id would have somewhere to land.
  therapist = [];
  client = [];
  application = [];
  for (let i = 0; i < 2; i += 1) {
    const tUser = await User.create({
      email: `bulk-t${i}@example.com`,
      passwordHash,
      role: ROLES.THERAPIST,
      status: USER_STATUS.ACTIVE,
    });
    therapist.push(
      await TherapistProfile.create({
        userId: tUser._id,
        applicationId: new mongoose.Types.ObjectId(),
        title: 'Dr.',
        firstName: `Tess${i}`,
        lastName: 'Keane',
        gender: 'female',
        dateOfBirth: new Date('1984-01-01'),
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
        educationSummary: 'Doctorate.',
        currentWorkSituation: 'Private practice.',
        specialtyTags: ['Anxiety', 'Depression', 'Grief'],
        treatmentOrientations: ['CBT'],
        bio: 'Works with anxiety.',
        licensingStatus: 'Licensed.',
        disciplinaryActions: false,
        malpracticeInsurance: true,
        certificateUrl1: 'https://res.cloudinary.com/x/image/authenticated/s--a--/v1/c.pdf',
        status: USER_STATUS.ACTIVE,
      }),
    );

    const cUser = await User.create({
      email: `bulk-c${i}@example.com`,
      passwordHash,
      role: ROLES.CLIENT,
      status: USER_STATUS.ACTIVE,
    });
    const profile = await ClientProfile.create({
      userId: cUser._id,
      type: 'individual',
      country: 'Ireland',
      city: 'Dublin',
      relationshipStatus: 'Single',
      concernTags: ['Anxiety', 'Stress', 'Grief'],
      therapistGenderPreference: 'no_preference',
      name: `Client ${i}`,
      age: 30,
      gender: 'female',
    });
    const booking = await Booking.create({
      clientId: cUser._id,
      therapistId: tUser._id,
      status: BOOKING_STATUS.ACTIVE,
    });
    await Subscription.create({
      bookingId: booking._id,
      clientId: cUser._id,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      amount: SUBSCRIPTION_AMOUNT_MINOR,
      currentPeriodEnd: new Date(Date.now() + 20 * 86400000),
      nextBillingDate: new Date(Date.now() + 20 * 86400000),
      platformSubscriptionId: `sub_bulk_${i}`,
    });
    client.push(profile);

    application.push(
      await TherapistApplication.create({
        title: 'Dr.',
        firstName: 'Ada',
        lastName: `Applicant${i}`,
        gender: 'female',
        dateOfBirth: new Date('1985-03-02'),
        email: `bulk-applicant${i}@example.com`,
        passwordHash,
        photoUrl: 'https://res.cloudinary.com/testcloud/image/upload/v1/p.jpg',
        streetAddress: '12 Analytical Way',
        city: 'London',
        stateProvince: 'Greater London',
        zipPostal: 'W1A 1AA',
        country: 'United Kingdom',
        timezone: 'Europe/London',
        languages: ['English'],
        workingHours: { monday: { enabled: true, start: '09:00', end: '17:00' } },
        therapistType: 'Clinical Psychologist',
        credentialType: 'License',
        credentialInitials: 'PhD',
        yearsExperience: 9,
        educationSummary: 'PhD.',
        currentWorkSituation: 'Private practice.',
        specialtyTags: ['Anxiety', 'Depression', 'Grief'],
        treatmentOrientations: ['CBT'],
        bio: 'Adults with anxiety.',
        licensingStatus: 'Licensed in the UK.',
        disciplinaryActions: false,
        malpracticeInsurance: true,
        certificateUrl1: 'https://res.cloudinary.com/testcloud/image/authenticated/s--sig--/v1/c1.pdf',
        certificatePublicId1: 'c1',
      }),
    );
  }
}, 120000);

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(() => {
  resetRateLimits();
  stripeUpdate.mockClear();
  sendPasswordResetEmail.mockClear();
});

describe('no admin code can write more than one document at a time', () => {
  test('nothing reachable from the admin router under an admin* name uses a multi-document write', () => {
    const adminFiles = [...reachableFrom(path.join(serverRoot, 'routes', 'admin.routes.js'))].filter(
      (file) => path.basename(file).startsWith('admin'),
    );
    const names = adminFiles.map((file) => path.basename(file));

    // Non-vacuous: the walk really does reach the admin write layer.
    expect(names).toEqual(
      expect.arrayContaining([
        'admin.routes.js',
        'adminClients.service.js',
        'adminTherapists.service.js',
        'adminApprovals.service.js',
        'adminApplications.service.js',
        'adminClients.controller.js',
        'adminTherapists.controller.js',
      ]),
    );

    const offenders = adminFiles
      .filter((file) => MULTI_WRITE.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.basename(file));

    expect(offenders).toEqual([]);
  });

  test('the pattern really catches each forbidden call', () => {
    ['Model.updateMany(', 'Model.deleteMany (', 'Model.bulkWrite(', 'x.\n  insertMany('].forEach(
      (source) => expect(MULTI_WRITE.test(source)).toBe(true),
    );
    expect(MULTI_WRITE.test('Model.updateOne(')).toBe(false);
  });
});

describe('an id shaped like a query operator changes nothing', () => {
  test(
    'every admin write route refuses every hostile id with 400, and no record moves',
    async () => {
      const before = await snapshot();

      for (const id of HOSTILE_IDS) {
        for (const [method, url, body] of writeRoutes(id)) {
          const res = await send(method, url, body);
          expect({ url, status: res.status }).toEqual({ url, status: 400 });
        }
        resetRateLimits();
      }

      expect(await snapshot()).toBe(before);
      expect(stripeUpdate).not.toHaveBeenCalled();
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    },
    120000,
  );

  test('a body that names another record or an operator is refused, and nothing moves', async () => {
    const before = await snapshot();
    const id = therapist[0]._id;

    for (const body of [
      { _id: therapist[1]._id.toString() },
      { userId: new mongoose.Types.ObjectId().toString() },
      { status: 'inactive' },
      { $set: { firstName: 'Everyone' } },
      { firstName: { $ne: null } },
    ]) {
      const res = await send('patch', `/api/v1/admin/therapists/${id}`, body);
      expect(res.status).toBe(422);
    }

    expect(await snapshot()).toBe(before);
  });

  test('a real id still changes exactly its own record — the guard is not refusing everything', async () => {
    const res = await send('patch', `/api/v1/admin/therapists/${therapist[0]._id}`, {
      firstName: 'Renamed',
    });

    expect(res.status).toBe(200);
    const names = (await TherapistProfile.find().sort({ _id: 1 }).lean()).map((t) => t.firstName);
    expect(names).toEqual(['Renamed', 'Tess1']);
  });
});
