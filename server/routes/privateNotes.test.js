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
const { Journal } = await import('../models/Journal.js');
const { PrivateNote } = await import('../models/PrivateNote.js');
const { Message } = await import('../models/Message.js');
const { Session } = await import('../models/Session.js');
const { hashPassword } = await import('../utils/password.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { SUBSCRIPTION_STATUS, SUBSCRIPTION_AMOUNT_MINOR, BOOKING_STATUS } = await import(
  '../constants/payments.js'
);
const { NOTE_TEXT_MAX } = await import('../constants/journal.js');
const { loginRateLimiter, sessionRateLimiter } = await import('./auth.routes.js');
const { therapistRateLimiter } = await import('./therapist.routes.js');
const { clientRateLimiter, journalWriteRateLimiter } = await import('./client.routes.js');
const { chatReadRateLimiter, chatSendRateLimiter } = await import('./chat.routes.js');
const { sessionsReadRateLimiter } = await import('./sessions.routes.js');
const { startMemoryMongo, stopMemoryMongo } = await import('../test/mongoMemory.js');

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const DAY = 24 * 60 * 60 * 1000;
const GONE_ID = '64b7f0c2a1b2c3d4e5f60718';

// The canary. If this string ever appears in a client's response, the chunk failed.
const SECRET = 'CLINICAL-IMPRESSION-avoidant-attachment-pattern';

const users = {};
const tokens = {};
const bookings = {};

function resetLimits() {
  LOOPBACK.forEach((key) => {
    [loginRateLimiter, sessionRateLimiter, therapistRateLimiter, clientRateLimiter,
      journalWriteRateLimiter, chatReadRateLimiter, chatSendRateLimiter, sessionsReadRateLimiter]
      .filter(Boolean)
      .forEach((limiter) => limiter.resetKey(key));
  });
}

const auth = (req, token) => req.set('Authorization', `Bearer ${token}`);
const notesUrl = (bookingId = bookings.mine._id) => `/api/v1/therapist/notes/${bookingId}`;

const listNotes = (bookingId, token = tokens.therapist) =>
  auth(request(app).get(notesUrl(bookingId)), token);
const addNote = (body, bookingId, token = tokens.therapist) =>
  auth(request(app).post(notesUrl(bookingId)), token).send(body);
const editNote = (id, body, bookingId, token = tokens.therapist) =>
  auth(request(app).patch(`${notesUrl(bookingId)}/${id}`), token).send(body);
const dropNote = (id, bookingId, token = tokens.therapist) =>
  auth(request(app).delete(`${notesUrl(bookingId)}/${id}`), token);

async function makeUser(key, role) {
  users[key] = await User.create({
    email: `pn86-${key}@example.com`,
    passwordHash: await hashPassword(PASSWORD),
    role,
    status: USER_STATUS.ACTIVE,
  });
  resetLimits();
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: `pn86-${key}@example.com`, password: PASSWORD });
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
    age: 29,
    gender: 'male',
    country: 'Ireland',
    city: 'Cork',
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

const noteFixture = (bookingKey, therapistKey, text) =>
  PrivateNote.create({
    bookingId: bookings[bookingKey]._id,
    therapistId: users[therapistKey]._id,
    text,
  });

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([User.init(), Booking.init(), Subscription.init(), PrivateNote.init()]);

  await makeUser('therapist', ROLES.THERAPIST);
  await makeUser('otherTherapist', ROLES.THERAPIST);
  await makeUser('client', ROLES.CLIENT);
  await makeUser('otherClient', ROLES.CLIENT);
  await makeUser('admin', ROLES.ADMIN);

  await makeTherapistProfile('therapist');
  await makeClientBooking('mine', 'client', 'therapist');
  await makeClientBooking('theirs', 'otherClient', 'otherTherapist');
}, 120000);

afterAll(async () => {
  await stopMemoryMongo();
}, 120000);

beforeEach(async () => {
  resetLimits();
  await Promise.all([
    PrivateNote.deleteMany({}),
    Journal.deleteMany({}),
    Message.deleteMany({}),
    Session.deleteMany({}),
  ]);
  await Subscription.updateMany({}, { $set: { status: SUBSCRIPTION_STATUS.ACTIVE } });
  await Booking.updateMany({}, { $set: { status: BOOKING_STATUS.ACTIVE } });
});

/* ────────────────────────────────────────────────────────────────────────────
 * THE BOUNDARY. This is the reason the chunk exists.
 * ──────────────────────────────────────────────────────────────────────────── */

describe('*** THE privateNotes BOUNDARY ***', () => {
  it('NO CLIENT ENDPOINT RETURNS NOTE TEXT, OR THE WORD "note", IN ANY FORM', async () => {
    await noteFixture('mine', 'therapist', SECRET);
    await auth(request(app).post('/api/v1/client/journal'), tokens.client).send({
      text: 'My own entry, which is mine to see.',
      moodTag: 'Flat',
    });
    // One upcoming and one cancelled session, so both session lists are non-empty.
    await Session.create([
      {
        bookingId: bookings.mine._id,
        scheduledAt: new Date(Date.now() + 3 * DAY),
        zoomLink: 'https://zoom.us/j/100200300',
        note: 'Bring the worksheet.',
      },
      {
        bookingId: bookings.mine._id,
        scheduledAt: new Date(Date.now() + 4 * DAY),
        zoomLink: 'https://zoom.us/j/100200301',
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    ]);

    const entryId = (await Journal.findOne({})).id;
    const c = (req) => auth(req, tokens.client);

    const responses = await Promise.all([
      c(request(app).get('/api/v1/client/me')),
      c(request(app).get('/api/v1/client/journal')),
      c(request(app).get('/api/v1/client/worksheets')),
      c(request(app).get(`/api/v1/chat/${bookings.mine._id}/messages`)),
      c(request(app).get('/api/v1/chat/unread-count')),
      c(request(app).get(`/api/v1/sessions/${bookings.mine._id}`)),
      c(request(app).get(`/api/v1/sessions/${bookings.mine._id}?scope=history`)),
      c(request(app).post('/api/v1/client/journal')).send({ text: 'Another entry.' }),
    ]);

    // Edit THEN delete, never together. Fired in parallel (as they were until
    // 10.3) the delete sometimes won, the edit found nothing, and the sweep
    // failed at random on an ordering it was never testing.
    responses.push(
      await c(request(app).patch(`/api/v1/client/journal/${entryId}`)).send({ text: 'Edited entry.' }),
    );
    responses.push(await c(request(app).delete(`/api/v1/client/journal/${entryId}`)));

    expect(responses.every((res) => res.status < 400)).toBe(true);
    // The two session lists really carried a session each.
    expect(responses[5].body.data).toHaveLength(1);
    expect(responses[6].body.data).toHaveLength(1);

    // NOT `"note"`: `workingHours.note` is the therapist's own availability
    // note (§10.3), a public profile field with nothing clinical about it.
    for (const res of responses) {
      const body = JSON.stringify(res.body);
      const lower = body.toLowerCase();
      expect(body).not.toContain(SECRET);
      expect(lower).not.toContain('privatenote');
      expect(lower).not.toContain('clinicalnote');
      expect(lower).not.toContain('"notes"');
      expect(lower).not.toContain('notetext');
    }

    // The note is genuinely there — otherwise the sweep above proves nothing.
    expect(await PrivateNote.countDocuments({})).toBe(1);
  });

  it('NO FILE ON THE CLIENT REQUEST PATH CAN EVEN REACH THE NOTES MODULES', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const serverRoot = path.resolve(here, '..');

    // Three import shapes, not one: `from '…'`, a bare side-effect `import '…'`,
    // and a dynamic `import('…')`. This matched only the first until 10.3, when a
    // mutation showed a bare import slipped past it unnoticed.
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

    const forbidden = [
      path.join(serverRoot, 'models', 'PrivateNote.js'),
      path.join(serverRoot, 'services', 'privateNotes.service.js'),
      path.join(serverRoot, 'controllers', 'privateNotes.controller.js'),
    ];

    const clientPath = reachableFrom([
      path.join(serverRoot, 'routes', 'client.routes.js'),
      path.join(serverRoot, 'routes', 'chat.routes.js'),
      // 9.1: clients read their sessions here.
      path.join(serverRoot, 'routes', 'sessions.routes.js'),
    ]);

    for (const file of forbidden) {
      expect(clientPath.has(file)).toBe(false);
    }

    // 10.1: the ADMIN is the third party with no window into clinical content.
    // §11 records that a conversation viewer was proposed and the client decided
    // against it, so the admin's whole router must be unable to reach the notes
    // as well — not merely lack an endpoint for them.
    const adminPath = reachableFrom([path.join(serverRoot, 'routes', 'admin.routes.js')]);
    for (const file of forbidden) {
      expect(adminPath.has(file)).toBe(false);
    }

    // THE WALKER MUST BE ABLE TO FIND THEM, or the assertions above are vacuous.
    const therapistPath = reachableFrom([path.join(serverRoot, 'routes', 'therapist.routes.js')]);
    expect(clientPath.size).toBeGreaterThan(10);
    expect(adminPath.size).toBeGreaterThan(10);
    for (const file of forbidden) {
      expect(therapistPath.has(file)).toBe(true);
    }
  });

  it('refuses a client on every notes route, with a valid token', async () => {
    const note = await noteFixture('mine', 'therapist', SECRET);
    const url = notesUrl(bookings.mine._id);
    const c = (req) => auth(req, tokens.client);

    const responses = await Promise.all([
      c(request(app).get(url)),
      c(request(app).post(url)).send({ text: 'Injected by the client.' }),
      c(request(app).patch(`${url}/${note._id}`)).send({ text: 'Rewritten by the client.' }),
      c(request(app).delete(`${url}/${note._id}`)),
    ]);

    for (const res of responses) {
      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).not.toContain(SECRET);
    }

    expect((await PrivateNote.findById(note._id)).text).toBe(SECRET);
    expect(await PrivateNote.countDocuments({})).toBe(1);
  });

  it('refuses an admin too — §11 gives them no window into clinical content', async () => {
    await noteFixture('mine', 'therapist', SECRET);

    const res = await listNotes(bookings.mine._id, tokens.admin);

    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain(SECRET);
  });

  it('ONE THERAPIST CANNOT READ ANOTHER\'S NOTES ON THE SAME BOOKING', async () => {
    const note = await noteFixture('mine', 'therapist', SECRET);

    // The other therapist is refused the booking outright.
    const listed = await listNotes(bookings.mine._id, tokens.otherTherapist);
    expect(listed.status).toBe(404);
    expect(JSON.stringify(listed.body)).not.toContain(SECRET);

    // And even on a booking that IS theirs, the note id is not theirs to fetch.
    const stolen = await editNote(note._id, { text: 'Taken' }, bookings.theirs._id, tokens.otherTherapist);
    expect(stolen.status).toBe(404);
    expect((await PrivateNote.findById(note._id)).text).toBe(SECRET);
  });

  /**
   * THE CASE THE CURRENT SCHEMA CANNOT PRODUCE, AND THE GUARD EXISTS FOR.
   *
   * A booking names one therapist, so `loadOwnBooking` refuses a colleague
   * before the note scope is ever reached — which is why the mutation run broke
   * nothing until this test existed. Reassignment (deferred to v2) puts two
   * therapists' notes on one booking, so the note is seeded directly here.
   */
  it('HIDES A COLLEAGUE\'S NOTE SITTING ON A BOOKING THAT IS NOW MINE', async () => {
    const colleagues = await PrivateNote.create({
      bookingId: bookings.mine._id,
      therapistId: users.otherTherapist._id,
      text: SECRET,
    });
    await noteFixture('mine', 'therapist', 'My own note on this client.');

    const listed = await listNotes(bookings.mine._id);
    const patched = await editNote(colleagues._id, { text: 'Taken' }, bookings.mine._id);
    const deleted = await dropNote(colleagues._id, bookings.mine._id);

    expect(listed.body.data.map((n) => n.text)).toEqual(['My own note on this client.']);
    expect(listed.body.meta.total).toBe(1);
    expect(JSON.stringify(listed.body)).not.toContain(SECRET);
    expect(patched.status).toBe(404);
    expect(deleted.status).toBe(404);
    expect((await PrivateNote.findById(colleagues._id)).text).toBe(SECRET);
  });

  it('never lets a note leak through the therapist\'s own journal endpoint', async () => {
    await noteFixture('mine', 'therapist', SECRET);
    await Journal.create({
      bookingId: bookings.mine._id,
      clientId: users.client._id,
      text: 'The client wrote this.',
    });

    const res = await auth(
      request(app).get(`/api/v1/therapist/journal/${bookings.mine._id}`),
      tokens.therapist,
    );

    expect(res.status).toBe(200);
    expect(res.body.data[0].text).toBe('The client wrote this.');
    expect(JSON.stringify(res.body)).not.toContain(SECRET);
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * The therapist's own use of their notes.
 * ──────────────────────────────────────────────────────────────────────────── */

describe('POST /therapist/notes/:bookingId', () => {
  it('writes a note against the booking and the calling therapist', async () => {
    const res = await addNote({ text: SECRET }, bookings.mine._id);

    expect(res.status).toBe(201);
    expect(res.body.text).toBe(SECRET);
    expect(res.body.edited).toBe(false);
    expect(Object.keys(res.body).sort()).toEqual(['createdAt', 'edited', 'id', 'text', 'updatedAt']);

    const stored = await PrivateNote.findById(res.body.id);
    expect(String(stored.therapistId)).toBe(String(users.therapist._id));
    expect(String(stored.bookingId)).toBe(String(bookings.mine._id));
  });

  it('refuses an empty note and one over the cap', async () => {
    expect((await addNote({ text: '  ' }, bookings.mine._id)).status).toBe(422);
    expect((await addNote({ text: 'x'.repeat(NOTE_TEXT_MAX + 1) }, bookings.mine._id)).status).toBe(422);
    expect(await PrivateNote.countDocuments({})).toBe(0);
  });

  it('refuses another therapist\'s booking with the identical 404', async () => {
    const foreign = await addNote({ text: SECRET }, bookings.theirs._id);
    const missing = await addNote({ text: SECRET }, GONE_ID);
    const junk = await addNote({ text: SECRET }, 'not-an-id');

    expect(foreign.status).toBe(404);
    expect(foreign.body).toEqual(missing.body);
    expect(foreign.body).toEqual(junk.body);
    expect(await PrivateNote.countDocuments({})).toBe(0);
  });

  it('still takes a note on an ended booking — a closing note comes after', async () => {
    await Booking.updateOne({ _id: bookings.mine._id }, { $set: { status: BOOKING_STATUS.ENDED } });

    expect((await addNote({ text: 'Closing summary.' }, bookings.mine._id)).status).toBe(201);
  });
});

describe('GET /therapist/notes/:bookingId', () => {
  it('returns only this therapist\'s notes on this booking, newest first', async () => {
    await noteFixture('mine', 'therapist', 'Older note');
    await noteFixture('mine', 'therapist', 'Newer note');
    await noteFixture('theirs', 'otherTherapist', 'A colleague\'s note');

    const res = await listNotes(bookings.mine._id);

    expect(res.status).toBe(200);
    expect(res.body.data.map((n) => n.text)).toEqual(['Newer note', 'Older note']);
    expect(res.body.meta.total).toBe(2);
    expect(JSON.stringify(res.body)).not.toContain('colleague');
  });

  it('pages with a cursor and refuses an unreadable one', async () => {
    for (let i = 0; i < 4; i += 1) await noteFixture('mine', 'therapist', `Note ${i}`);

    const first = await listNotes(bookings.mine._id).query({ limit: 2 });
    const second = await listNotes(bookings.mine._id).query({
      limit: 2,
      cursor: first.body.meta.nextCursor,
    });

    expect(new Set([...first.body.data, ...second.body.data].map((n) => n.id)).size).toBe(4);
    expect((await listNotes(bookings.mine._id).query({ cursor: 'rubbish' })).status).toBe(400);
  });
});

describe('PATCH and DELETE /therapist/notes/:bookingId/:noteId', () => {
  it('rewrites a note and marks it edited', async () => {
    const note = await noteFixture('mine', 'therapist', 'First impression.');

    const res = await editNote(note._id, { text: 'Revised impression.' }, bookings.mine._id);

    expect(res.status).toBe(200);
    expect(res.body.text).toBe('Revised impression.');
    expect(res.body.edited).toBe(true);
  });

  it('deletes a note permanently', async () => {
    const note = await noteFixture('mine', 'therapist', SECRET);

    const res = await dropNote(note._id, bookings.mine._id);

    expect(res.status).toBe(200);
    expect(await PrivateNote.findById(note._id)).toBeNull();
  });

  it('refuses a note id from another booking with the identical 404', async () => {
    const elsewhere = await noteFixture('theirs', 'otherTherapist', 'Not mine');

    const foreign = await dropNote(elsewhere._id, bookings.mine._id);

    expect(foreign.status).toBe(404);
    expect(foreign.body).toEqual((await dropNote(GONE_ID, bookings.mine._id)).body);
    expect(await PrivateNote.findById(elsewhere._id)).not.toBeNull();
  });
});
