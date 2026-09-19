import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';

// Cloudinary faked, as in the 8.4 suite.
const uploadCalls = [];
const destroyCalls = [];

const fakeCloudinary = {
  uploader: {
    upload_stream(options, callback) {
      uploadCalls.push(options);
      return {
        end(buffer) {
          const raw = options.resource_type === 'raw';
          callback(null, {
            secure_url: `https://res.cloudinary.com/test/${raw ? 'raw' : 'image'}/authenticated/${options.public_id}`,
            public_id: `${options.folder}/${options.public_id}`,
            format: raw ? undefined : options.format,
            resource_type: raw ? 'raw' : 'image',
            bytes: buffer.length,
          });
        },
      };
    },
    destroy: jest.fn(async (publicId, options) => {
      destroyCalls.push({ publicId, ...options });
      return { result: 'ok' };
    }),
  },
  utils: { private_download_url: (id) => `https://api.cloudinary.test/d?id=${encodeURIComponent(id)}` },
};

jest.unstable_mockModule('../config/cloudinary.js', () => ({
  isCloudinaryConfigured: true,
  cloudinary: fakeCloudinary,
  default: fakeCloudinary,
}));

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { Worksheet } = await import('../models/Worksheet.js');
const { hashPassword } = await import('../utils/password.js');
const { setSocketServer } = await import('../realtime/emitter.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { SUBSCRIPTION_STATUS, SUBSCRIPTION_AMOUNT_MINOR } = await import('../constants/payments.js');
const { SOCKET_EVENTS, userRoom } = await import('../constants/socket.js');
const { WORKSHEET_STATUS } = await import('../constants/worksheets.js');
const { loginRateLimiter, sessionRateLimiter } = await import('./auth.routes.js');
const { therapistRateLimiter, worksheetUploadRateLimiter } = await import('./therapist.routes.js');
const { clientRateLimiter, clientWorksheetUploadRateLimiter } = await import('./client.routes.js');
const { docx } = await import('../test/zipFixture.js');
const { startMemoryMongo, stopMemoryMongo } = await import('../test/mongoMemory.js');

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const DAY = 24 * 60 * 60 * 1000;
const pad = (head) => Buffer.concat([Buffer.from(head), Buffer.alloc(256)]);
const PDF = pad('%PDF-1.7\n');
const PNG = pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = pad([0xff, 0xd8, 0xff, 0xe0]);
const WEBP = pad([0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const EXE = pad([0x4d, 0x5a, 0x90, 0x00]);
const DOC = pad([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

const users = {};
const tokens = {};
const bookings = {};
const NO_TOKEN = Symbol('none');

// Emits are recorded rather than sent: [room, event, payload].
const emitted = [];
const fakeIo = {
  to: (room) => ({ emit: (event, payload) => emitted.push([room, event, payload]) }),
  in: () => ({ socketsJoin: () => {} }),
};

function resetLimits() {
  LOOPBACK.forEach((key) => {
    [loginRateLimiter, sessionRateLimiter, therapistRateLimiter, worksheetUploadRateLimiter,
      clientRateLimiter, clientWorksheetUploadRateLimiter].forEach((limiter) => limiter.resetKey(key));
  });
}

const auth = (req, token) => (token === NO_TOKEN ? req : req.set('Authorization', `Bearer ${token}`));

const clientList = (token = tokens.client) => auth(request(app).get('/api/v1/client/worksheets'), token);
const clientFile = (id, which = 'assigned', token = tokens.client) =>
  auth(request(app).get(`/api/v1/client/worksheets/${id}/file/${which}`), token);
function submit(id, { file = PDF, name = 'answers.pdf', token = tokens.client } = {}) {
  const req = auth(request(app).post(`/api/v1/client/worksheets/${id}/submit`), token);
  if (file) req.attach('file', file, { filename: name, contentType: 'application/octet-stream' });
  return req;
}
const review = (id, token = tokens.therapist, bookingId = bookings.mine._id) =>
  auth(request(app).post(`/api/v1/therapist/worksheets/${bookingId}/${id}/review`), token);
function assign(title = 'Thought record') {
  return auth(request(app).post('/api/v1/therapist/worksheets'), tokens.therapist)
    .field('bookingId', String(bookings.mine._id))
    .field('title', title)
    .attach('file', PDF, { filename: 'w.pdf', contentType: 'application/pdf' });
}

async function makeUser(key, role) {
  users[key] = await User.create({
    email: `ws85-${key}@example.com`,
    passwordHash: await hashPassword(PASSWORD),
    role,
    status: USER_STATUS.ACTIVE,
  });
  resetLimits();
  const res = await request(app).post('/api/v1/auth/login').send({ email: `ws85-${key}@example.com`, password: PASSWORD });
  tokens[key] = res.body.accessToken;
}

async function makeClientBooking(key, clientKey, therapistKey) {
  await ClientProfile.create({
    userId: users[clientKey]._id,
    type: 'individual',
    name: `Client ${clientKey}`,
    age: 30,
    gender: 'female',
    country: 'Ireland',
    city: 'Cork',
    relationshipStatus: 'Single',
    concernTags: ['Anxiety'],
    therapistGenderPreference: 'no_preference',
  });
  bookings[key] = await Booking.create({ clientId: users[clientKey]._id, therapistId: users[therapistKey]._id });
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

const assignedFixture = (bookingKey = 'mine', title = 'Sleep diary') =>
  Worksheet.create({
    bookingId: bookings[bookingKey]._id,
    title,
    assignedFileUrl: 'https://res.cloudinary.com/test/image/authenticated/a',
    assignedFilePublicId: 'cast-of-mind/worksheets/a',
    assignedFileResourceType: 'image',
    assignedFileFormat: 'pdf',
    assignedFileBytes: 100,
  });

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([User.init(), Booking.init(), Subscription.init(), Worksheet.init()]);

  await makeUser('therapist', ROLES.THERAPIST);
  await makeUser('otherTherapist', ROLES.THERAPIST);
  await makeUser('client', ROLES.CLIENT);
  await makeUser('otherClient', ROLES.CLIENT);
  await makeUser('admin', ROLES.ADMIN);

  await makeClientBooking('mine', 'client', 'therapist');
  await makeClientBooking('theirs', 'otherClient', 'otherTherapist');
}, 120000);

afterAll(async () => {
  setSocketServer(null);
  await stopMemoryMongo();
}, 120000);

beforeEach(async () => {
  resetLimits();
  uploadCalls.length = 0;
  destroyCalls.length = 0;
  emitted.length = 0;
  setSocketServer(null);
  await Worksheet.deleteMany({});
  await Subscription.updateMany({}, { $set: { status: SUBSCRIPTION_STATUS.ACTIVE } });
});

describe('GET /client/worksheets', () => {
  it('lists only the client\'s own booking, with no storage details', async () => {
    await assignedFixture('mine', 'Mine');
    await assignedFixture('theirs', 'Not mine');

    const res = await clientList();
    expect(res.status).toBe(200);
    expect(res.body.data.map((w) => w.title)).toEqual(['Mine']);
    expect(res.body.meta.counts).toEqual({ assigned: 1, completed: 0 });
    expect(JSON.stringify(res.body)).not.toMatch(/Url|PublicId|cloudinary|Not mine/);
  });

  it('refuses no token, a therapist and the admin', async () => {
    expect((await clientList(NO_TOKEN)).status).toBe(401);
    expect((await clientList(tokens.therapist)).status).toBe(403);
    expect((await clientList(tokens.admin)).status).toBe(403);
  });

  it('is closed to a client whose subscription has ended (§13)', async () => {
    await Subscription.updateOne({ bookingId: bookings.mine._id }, { $set: { status: SUBSCRIPTION_STATUS.EXPIRED } });
    expect((await clientList()).status).toBe(403);
  });
});

describe('GET /client/me — the Worksheets nav dot', () => {
  it('reports how many worksheets are still to complete, and nothing else about them', async () => {
    await assignedFixture('mine', 'A private title');
    await assignedFixture('mine');
    const res = await auth(request(app).get('/api/v1/client/me'), tokens.client);
    expect(res.body.pendingWorksheets).toBe(2);
    expect(JSON.stringify(res.body)).not.toContain('A private title');
  });
});

describe('GET /client/worksheets/:id/file/:which', () => {
  let fetchSpy;
  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('BYTES', { status: 200 }));
  });
  afterEach(() => fetchSpy.mockRestore());

  it('downloads the assigned sheet', async () => {
    const ws = await assignedFixture();
    const res = await clientFile(ws._id);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="Sleep diary\.pdf"/);
  });

  it('gives the same 404 for another client\'s worksheet, a missing one and junk', async () => {
    const theirs = await assignedFixture('theirs');
    const a = await clientFile(theirs._id);
    const b = await clientFile(new mongoose.Types.ObjectId());
    const c = await clientFile('junk');
    expect(a.status).toBe(404);
    expect(JSON.stringify(a.body)).toBe(JSON.stringify(b.body));
    expect(JSON.stringify(c.body)).toBe(JSON.stringify(b.body));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('404s for a returned file that does not exist yet', async () => {
    const ws = await assignedFixture();
    expect((await clientFile(ws._id, 'completed')).status).toBe(404);
  });
});

describe('POST /client/worksheets/:id/submit', () => {
  it('returns a PDF: status flips to completed', async () => {
    const ws = await assignedFixture();
    const res = await submit(ws._id);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'completed', completedFile: { format: 'pdf' }, reviewedAt: null });
    expect(uploadCalls[0]).toMatchObject({ type: 'authenticated', folder: 'cast-of-mind/worksheet-returns' });
    expect(JSON.stringify(res.body)).not.toMatch(/Url|PublicId|cloudinary/);
  });

  it.each([
    ['a phone photo (JPEG)', JPEG, 'jpeg'],
    ['a PNG', PNG, 'png'],
    ['a WebP', WEBP, 'webp'],
    ['a Word file', docx(), 'docx'],
  ])('accepts %s', async (_label, file, format) => {
    const ws = await assignedFixture();
    const res = await submit(ws._id, { file, name: `answers.${format}` });
    expect(res.status).toBe(200);
    expect(res.body.completedFile.format).toBe(format);
  });

  it('refuses a renamed executable, a macro file and an old .doc', async () => {
    const ws = await assignedFixture();
    expect((await submit(ws._id, { file: EXE })).status).toBe(422);
    expect((await submit(ws._id, { file: docx({ 'word/vbaProject.bin': 'x' }) })).status).toBe(422);
    const doc = await submit(ws._id, { file: DOC });
    expect(doc.status).toBe(422);
    expect(doc.body.error.message).toMatch(/save it as a PDF or a \.docx/);
    expect(uploadCalls).toHaveLength(0);
    expect((await Worksheet.findById(ws._id)).status).toBe(WORKSHEET_STATUS.ASSIGNED);
  });

  it('refuses a missing file and one over 10 MB', async () => {
    const ws = await assignedFixture();
    expect((await submit(ws._id, { file: null })).status).toBe(400);
    const big = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(10 * 1024 * 1024 + 1)]);
    expect((await submit(ws._id, { file: big })).status).toBe(400);
  });

  it('refuses another client\'s worksheet with 404, before uploading anything', async () => {
    const theirs = await assignedFixture('theirs');
    expect((await submit(theirs._id)).status).toBe(404);
    expect(uploadCalls).toHaveLength(0);
  });

  it('REPLACES before review, and deletes the file it replaced', async () => {
    const ws = await assignedFixture();
    await submit(ws._id);
    const first = uploadCalls[0].public_id;

    const res = await submit(ws._id, { file: PNG, name: 'redo.png' });
    expect(res.status).toBe(200);
    expect(res.body.completedFile.format).toBe('png');
    expect(destroyCalls.map((d) => d.publicId)).toEqual([`cast-of-mind/worksheet-returns/${first}`]);
  });

  it('REFUSES once reviewed — nothing uploaded, nothing changed', async () => {
    const ws = await assignedFixture();
    await submit(ws._id);
    await review(ws._id);
    uploadCalls.length = 0;

    const res = await submit(ws._id, { file: PNG });
    expect(res.status).toBe(409);
    expect(uploadCalls).toHaveLength(0);
    expect((await Worksheet.findById(ws._id)).completedFileFormat).toBe('pdf');
  });

  it('refuses a review that lands between the check and the write, and deletes the new file', async () => {
    const ws = await assignedFixture();
    const real = Worksheet.findOneAndUpdate.bind(Worksheet);
    const spy = jest.spyOn(Worksheet, 'findOneAndUpdate').mockImplementationOnce(async (...args) => {
      await Worksheet.updateOne({ _id: ws._id }, {
        $set: {
          status: WORKSHEET_STATUS.COMPLETED,
          completedAt: new Date(),
          completedFileUrl: 'u',
          completedFilePublicId: 'p',
          reviewedAt: new Date(),
        },
      });
      return real(...args);
    });

    const res = await submit(ws._id);
    spy.mockRestore();
    expect(res.status).toBe(409);
    expect(destroyCalls).toHaveLength(1);
  });

  it('deletes the new file if the record cannot be saved', async () => {
    const ws = await assignedFixture();
    const spy = jest.spyOn(Worksheet, 'findOneAndUpdate').mockRejectedValueOnce(new Error('db down'));
    const res = await submit(ws._id);
    spy.mockRestore();
    expect(res.status).toBe(500);
    expect(destroyCalls).toHaveLength(1);
    expect((await Worksheet.findById(ws._id)).status).toBe(WORKSHEET_STATUS.ASSIGNED);
  });

  it('is closed to a client whose subscription has ended', async () => {
    const ws = await assignedFixture();
    await Subscription.updateOne({ bookingId: bookings.mine._id }, { $set: { status: SUBSCRIPTION_STATUS.EXPIRED } });
    expect((await submit(ws._id)).status).toBe(403);
    expect(uploadCalls).toHaveLength(0);
  });
});

describe('POST /therapist/worksheets/:bookingId/:id/review', () => {
  it('marks a returned worksheet reviewed, once', async () => {
    const ws = await assignedFixture();
    await submit(ws._id);

    const first = await review(ws._id);
    expect(first.status).toBe(200);
    expect(first.body.reviewedAt).toBeTruthy();

    const second = await review(ws._id);
    expect(second.body.reviewedAt).toBe(first.body.reviewedAt);
  });

  it('refuses a worksheet that has not come back yet', async () => {
    const ws = await assignedFixture();
    expect((await review(ws._id)).status).toBe(409);
  });

  it('refuses another therapist, and a client', async () => {
    const ws = await assignedFixture();
    await submit(ws._id);
    expect((await review(ws._id, tokens.otherTherapist)).status).toBe(404);
    expect((await review(ws._id, tokens.client)).status).toBe(403);
    expect((await Worksheet.findById(ws._id)).reviewedAt).toBeUndefined();
  });

  it('the model refuses "reviewed" on an unreturned worksheet', async () => {
    const bad = new Worksheet({
      bookingId: bookings.mine._id,
      title: 't',
      assignedFileUrl: 'u',
      assignedFilePublicId: 'p',
      reviewedAt: new Date(),
    });
    await expect(bad.validate()).rejects.toThrow(/Only a returned worksheet/);
  });
});

describe('the live nav-dot count', () => {
  const pushes = () => emitted.filter(([, event]) => event === SOCKET_EVENTS.WORKSHEETS_UPDATE);

  it('tells the CLIENT, and only the client, when a worksheet is assigned', async () => {
    setSocketServer(fakeIo);
    await assign();
    expect(pushes()).toEqual([[userRoom(String(users.client._id)), SOCKET_EVENTS.WORKSHEETS_UPDATE, { pending: 1 }]]);
  });

  it('drops to zero when the client sends it back', async () => {
    const ws = await assignedFixture();
    setSocketServer(fakeIo);
    await submit(ws._id);
    expect(pushes().at(-1)[2]).toEqual({ pending: 0 });
  });

  it('updates when a worksheet is withdrawn', async () => {
    const ws = await assignedFixture();
    setSocketServer(fakeIo);
    await auth(request(app).delete(`/api/v1/therapist/worksheets/${bookings.mine._id}/${ws._id}`), tokens.therapist);
    expect(pushes().at(-1)[2]).toEqual({ pending: 0 });
  });

  it('carries a number only — never a title', async () => {
    setSocketServer(fakeIo);
    await assign('A very private title');
    expect(JSON.stringify(emitted)).not.toContain('private');
  });
});
