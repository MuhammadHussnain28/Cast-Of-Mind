import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';

// Cloudinary is faked: no real account, no quota, and every call is inspectable.
const uploadCalls = [];
const destroyCalls = [];
let failNextUpload = false;

const fakeCloudinary = {
  uploader: {
    upload_stream(options, callback) {
      uploadCalls.push(options);
      return {
        end(buffer) {
          if (failNextUpload) {
            failNextUpload = false;
            return callback(Object.assign(new Error('boom'), { http_code: 500 }));
          }
          const raw = options.resource_type === 'raw';
          const ext = raw ? '' : `.${options.format}`;
          callback(null, {
            secure_url: `https://res.cloudinary.com/test/${raw ? 'raw' : 'image'}/authenticated/${options.public_id}${ext}`,
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
  utils: {
    private_download_url: (publicId, format, options) =>
      `https://api.cloudinary.test/download?id=${encodeURIComponent(publicId)}&format=${format ?? ''}&rt=${options.resource_type}`,
  },
};

jest.unstable_mockModule('../config/cloudinary.js', () => ({
  isCloudinaryConfigured: true,
  cloudinary: fakeCloudinary,
  default: fakeCloudinary,
}));

const { default: app } = await import('../app.js');
const { User } = await import('../models/User.js');
const { Booking } = await import('../models/Booking.js');
const { Worksheet } = await import('../models/Worksheet.js');
const { hashPassword } = await import('../utils/password.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { BOOKING_STATUS } = await import('../constants/payments.js');
const { WORKSHEET_STATUS } = await import('../constants/worksheets.js');
const { loginRateLimiter, sessionRateLimiter } = await import('./auth.routes.js');
const { therapistRateLimiter, worksheetUploadRateLimiter } = await import('./therapist.routes.js');
const { downloadFilename } = await import('../services/worksheet.service.js');
const { docx } = await import('../test/zipFixture.js');
const { startMemoryMongo, stopMemoryMongo } = await import('../test/mongoMemory.js');

const PASSWORD = 'correct-horse-battery-staple';
const LOOPBACK = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
const PDF = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(512)]);
const DOC = Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), Buffer.alloc(64)]);
const EXE = Buffer.concat([Buffer.from([0x4d, 0x5a, 0x90, 0x00]), Buffer.alloc(64)]);

const users = {};
const tokens = {};
const bookings = {};
const NO_TOKEN = Symbol('none');

function resetLimits() {
  LOOPBACK.forEach((key) => {
    loginRateLimiter.resetKey(key);
    sessionRateLimiter.resetKey(key);
    therapistRateLimiter.resetKey(key);
    worksheetUploadRateLimiter.resetKey(key);
  });
}

const auth = (req, token) => (token === NO_TOKEN ? req : req.set('Authorization', `Bearer ${token}`));

function upload({ bookingId, title = 'Grief reflection', file = PDF, name = 'w.pdf', token = tokens.therapist } = {}) {
  const req = auth(request(app).post('/api/v1/therapist/worksheets'), token);
  if (bookingId !== undefined) req.field('bookingId', String(bookingId));
  if (title !== undefined) req.field('title', title);
  if (file) req.attach('file', file, { filename: name, contentType: 'application/octet-stream' });
  return req;
}

const list = (bookingId, token = tokens.therapist, query = '') =>
  auth(request(app).get(`/api/v1/therapist/worksheets/${bookingId}${query}`), token);
const fileOf = (bookingId, id, which = 'assigned', token = tokens.therapist) =>
  auth(request(app).get(`/api/v1/therapist/worksheets/${bookingId}/${id}/file/${which}`), token);
const withdraw = (bookingId, id, token = tokens.therapist) =>
  auth(request(app).delete(`/api/v1/therapist/worksheets/${bookingId}/${id}`), token);

async function makeUser(key, role) {
  users[key] = await User.create({
    email: `ws84-${key}@example.com`,
    passwordHash: await hashPassword(PASSWORD),
    role,
    status: USER_STATUS.ACTIVE,
  });
  resetLimits();
  const res = await request(app).post('/api/v1/auth/login').send({ email: `ws84-${key}@example.com`, password: PASSWORD });
  tokens[key] = res.body.accessToken;
}

// A completed worksheet written straight to the model — the client side is 8.5.
const completedFixture = (bookingId, title = 'Returned one') =>
  Worksheet.create({
    bookingId,
    title,
    status: WORKSHEET_STATUS.COMPLETED,
    assignedFileUrl: 'https://res.cloudinary.com/test/image/authenticated/a.pdf',
    assignedFilePublicId: 'cast-of-mind/worksheets/a',
    assignedFileResourceType: 'image',
    assignedFileFormat: 'pdf',
    assignedFileBytes: 10,
    completedFileUrl: 'https://res.cloudinary.com/test/image/authenticated/b.png',
    completedFilePublicId: 'cast-of-mind/worksheets/b',
    completedFileResourceType: 'image',
    completedFileFormat: 'png',
    completedFileBytes: 20,
    completedAt: new Date(),
  });

beforeAll(async () => {
  await startMemoryMongo();
  await Promise.all([User.init(), Booking.init(), Worksheet.init()]);

  await makeUser('therapist', ROLES.THERAPIST);
  await makeUser('other', ROLES.THERAPIST);
  await makeUser('client', ROLES.CLIENT);
  await makeUser('client2', ROLES.CLIENT);
  await makeUser('client3', ROLES.CLIENT);
  await makeUser('admin', ROLES.ADMIN);

  bookings.mine = await Booking.create({ clientId: users.client._id, therapistId: users.therapist._id });
  bookings.theirs = await Booking.create({ clientId: users.client2._id, therapistId: users.other._id });
  const ended = await Booking.create({ clientId: users.client3._id, therapistId: users.therapist._id });
  await Booking.updateOne({ _id: ended._id }, { $set: { status: BOOKING_STATUS.ENDED, endedAt: new Date() } });
  bookings.ended = ended;
}, 120000);

afterAll(async () => {
  await stopMemoryMongo();
}, 120000);

beforeEach(async () => {
  resetLimits();
  uploadCalls.length = 0;
  destroyCalls.length = 0;
  failNextUpload = false;
  await Worksheet.deleteMany({});
});

describe('the worksheets model (§10.8)', () => {
  it('refuses an unknown status', async () => {
    const bad = new Worksheet({ bookingId: bookings.mine._id, title: 't', status: 'lost', assignedFileUrl: 'u', assignedFilePublicId: 'p' });
    await expect(bad.validate()).rejects.toThrow(/Status must be one of/);
  });

  it('refuses a worksheet with no file', async () => {
    await expect(new Worksheet({ bookingId: bookings.mine._id, title: 't' }).validate()).rejects.toThrow(/its file/);
  });

  it('refuses "completed" without the returned file and its date', async () => {
    const bad = new Worksheet({ bookingId: bookings.mine._id, title: 't', status: WORKSHEET_STATUS.COMPLETED, assignedFileUrl: 'u', assignedFilePublicId: 'p' });
    await expect(bad.validate()).rejects.toThrow(/returned file/);
  });

  it('refuses "assigned" that already carries a returned file', async () => {
    const bad = new Worksheet({ bookingId: bookings.mine._id, title: 't', assignedFileUrl: 'u', assignedFilePublicId: 'p', completedAt: new Date() });
    await expect(bad.validate()).rejects.toThrow(/cannot carry/);
  });

  it('stamps assignedAt and starts as assigned', async () => {
    const ws = await Worksheet.create({ bookingId: bookings.mine._id, title: 't', assignedFileUrl: 'u', assignedFilePublicId: 'p', assignedFileFormat: 'pdf' });
    expect(ws.status).toBe(WORKSHEET_STATUS.ASSIGNED);
    expect(ws.assignedAt).toBeInstanceOf(Date);
  });
});

describe('POST /therapist/worksheets — who may assign', () => {
  it('refuses no token, a client and the admin', async () => {
    expect((await upload({ bookingId: bookings.mine._id, token: NO_TOKEN })).status).toBe(401);
    expect((await upload({ bookingId: bookings.mine._id, token: tokens.client })).status).toBe(403);
    expect((await upload({ bookingId: bookings.mine._id, token: tokens.admin })).status).toBe(403);
    expect(uploadCalls).toHaveLength(0);
  });

  it('refuses another therapist\'s client BEFORE anything is uploaded', async () => {
    const res = await upload({ bookingId: bookings.theirs._id });
    expect(res.status).toBe(404);
    expect(uploadCalls).toHaveLength(0);
    expect(await Worksheet.countDocuments()).toBe(0);
  });

  it('gives an identical 404 for someone else\'s booking, a missing one and junk', async () => {
    const theirs = await upload({ bookingId: bookings.theirs._id });
    const missing = await upload({ bookingId: new mongoose.Types.ObjectId() });
    const junk = await upload({ bookingId: 'not-an-id' });
    expect(JSON.stringify(theirs.body)).toBe(JSON.stringify(missing.body));
    expect(JSON.stringify(junk.body)).toBe(JSON.stringify(missing.body));
  });

  it('refuses an ended booking with 409 and stores nothing', async () => {
    const res = await upload({ bookingId: bookings.ended._id });
    expect(res.status).toBe(409);
    expect(uploadCalls).toHaveLength(0);
  });
});

describe('POST /therapist/worksheets — the file', () => {
  it('assigns a PDF, privately, and returns no storage details', async () => {
    const res = await upload({ bookingId: bookings.mine._id });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Grief reflection', status: 'assigned', assignedFile: { format: 'pdf' }, completedFile: null });
    expect(uploadCalls[0]).toMatchObject({ type: 'authenticated', folder: 'cast-of-mind/worksheets' });

    const body = JSON.stringify(res.body);
    expect(body).not.toContain('cloudinary');
    expect(body).not.toContain('cast-of-mind/worksheets');
  });

  it('assigns a real .docx as a raw file with its extension in the id', async () => {
    const res = await upload({ bookingId: bookings.mine._id, file: docx(), name: 'w.docx' });
    expect(res.status).toBe(201);
    expect(res.body.assignedFile.format).toBe('docx');
    expect(uploadCalls[0].resource_type).toBe('raw');
    expect(uploadCalls[0].public_id).toMatch(/\.docx$/);
  });

  it('refuses a .docm with macros', async () => {
    const res = await upload({ bookingId: bookings.mine._id, file: docx({ 'word/vbaProject.bin': 'x' }), name: 'w.docm' });
    expect(res.status).toBe(422);
    expect(uploadCalls).toHaveLength(0);
  });

  it('refuses an old .doc with a way to fix it', async () => {
    const res = await upload({ bookingId: bookings.mine._id, file: DOC, name: 'w.doc' });
    expect(res.status).toBe(422);
    expect(res.body.error.message).toMatch(/save it as a PDF or a \.docx/);
  });

  it('refuses an executable renamed to .pdf', async () => {
    const res = await upload({ bookingId: bookings.mine._id, file: EXE, name: 'w.pdf' });
    expect(res.status).toBe(422);
    expect(uploadCalls).toHaveLength(0);
  });

  it('refuses a file over 10 MB', async () => {
    const big = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(10 * 1024 * 1024 + 1)]);
    const res = await upload({ bookingId: bookings.mine._id, file: big });
    expect(res.status).toBe(400);
    expect(uploadCalls).toHaveLength(0);
  });

  it('refuses a missing file and a missing title', async () => {
    expect((await upload({ bookingId: bookings.mine._id, file: null })).status).toBe(400);
    expect((await upload({ bookingId: bookings.mine._id, title: '   ' })).status).toBe(422);
    expect((await upload({ bookingId: bookings.mine._id, title: 'x'.repeat(121) })).status).toBe(422);
  });

  it('reports a storage failure as 502 and saves no record', async () => {
    failNextUpload = true;
    const res = await upload({ bookingId: bookings.mine._id });
    expect(res.status).toBe(502);
    expect(await Worksheet.countDocuments()).toBe(0);
  });

  it('DELETES THE STORED FILE if the record cannot be saved', async () => {
    const spy = jest.spyOn(Worksheet, 'create').mockRejectedValueOnce(new Error('db down'));
    const res = await upload({ bookingId: bookings.mine._id });
    spy.mockRestore();

    expect(res.status).toBe(500);
    expect(destroyCalls).toHaveLength(1);
    expect(destroyCalls[0].publicId).toBe(`cast-of-mind/worksheets/${uploadCalls[0].public_id}`);
    expect(destroyCalls[0].type).toBe('authenticated');
  });
});

describe('GET /therapist/worksheets/:bookingId', () => {
  it('lists newest first, with counts, and no storage details', async () => {
    await upload({ bookingId: bookings.mine._id, title: 'First' });
    await upload({ bookingId: bookings.mine._id, title: 'Second' });
    await completedFixture(bookings.mine._id);

    const res = await list(bookings.mine._id);
    expect(res.status).toBe(200);
    expect(res.body.data.map((w) => w.title)).toEqual(['Returned one', 'Second', 'First']);
    expect(res.body.meta.counts).toEqual({ assigned: 2, completed: 1 });

    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/Url|PublicId|ResourceType|cloudinary/);
    expect(body).not.toContain(String(users.client._id));
  });

  it('pages without repeats', async () => {
    for (const title of ['a', 'b', 'c']) await upload({ bookingId: bookings.mine._id, title });
    const first = await list(bookings.mine._id, tokens.therapist, '?limit=2');
    const second = await list(bookings.mine._id, tokens.therapist, `?limit=2&cursor=${encodeURIComponent(first.body.meta.nextCursor)}`);
    const ids = [...first.body.data, ...second.body.data].map((w) => w.id);
    expect(new Set(ids).size).toBe(3);
    expect(second.body.meta.hasMore).toBe(false);
  });

  it('refuses another therapist\'s booking with the client 404', async () => {
    expect((await list(bookings.theirs._id)).status).toBe(404);
  });

  it('still lists an ended booking — the record is the therapist\'s', async () => {
    expect((await list(bookings.ended._id)).status).toBe(200);
  });
});

describe('GET …/file/:which — downloads', () => {
  let fetchSpy;
  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('FILEBYTES', { status: 200, headers: { 'content-type': 'text/html', 'content-length': '9' } }),
    );
  });
  afterEach(() => fetchSpy.mockRestore());

  it('streams the file with our own type, never the upstream\'s', async () => {
    const created = await upload({ bookingId: bookings.mine._id, title: 'Sleep diary (week 2)' });
    const res = await fileOf(bookings.mine._id, created.body.id);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toMatch(/^attachment; filename="Sleep diary week 2\.pdf"/);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['cache-control']).toMatch(/no-store/);
  });

  it('asks storage for a raw .docx without a separate format', async () => {
    const created = await upload({ bookingId: bookings.mine._id, file: docx(), name: 'w.docx' });
    await fileOf(bookings.mine._id, created.body.id);
    const asked = String(fetchSpy.mock.calls[0][0]);
    expect(asked).toContain('rt=raw');
    expect(asked).toContain('format=&');
  });

  it('serves the returned file once there is one', async () => {
    const ws = await completedFixture(bookings.mine._id);
    const res = await fileOf(bookings.mine._id, ws._id, 'completed');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
  });

  it('404s for a returned file that does not exist yet', async () => {
    const created = await upload({ bookingId: bookings.mine._id });
    expect((await fileOf(bookings.mine._id, created.body.id, 'completed')).status).toBe(404);
  });

  it('refuses another therapist, a worksheet from another booking, and junk', async () => {
    const created = await upload({ bookingId: bookings.mine._id });
    expect((await fileOf(bookings.mine._id, created.body.id, 'assigned', tokens.other)).status).toBe(404);
    expect((await fileOf(bookings.ended._id, created.body.id)).status).toBe(404);
    expect((await fileOf(bookings.mine._id, 'junk')).status).toBe(404);
    expect((await fileOf(bookings.mine._id, created.body.id, 'secrets')).status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('reports a storage failure as 502', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('', { status: 404 }));
    const created = await upload({ bookingId: bookings.mine._id });
    expect((await fileOf(bookings.mine._id, created.body.id)).status).toBe(502);
  });
});

describe('DELETE — withdraw', () => {
  it('withdraws an assigned worksheet and deletes its file', async () => {
    const created = await upload({ bookingId: bookings.mine._id });
    const res = await withdraw(bookings.mine._id, created.body.id);

    expect(res.status).toBe(200);
    expect(await Worksheet.countDocuments()).toBe(0);
    expect(destroyCalls).toHaveLength(1);
  });

  it('REFUSES once the client has returned it — their work is never lost', async () => {
    const ws = await completedFixture(bookings.mine._id);
    const res = await withdraw(bookings.mine._id, ws._id);

    expect(res.status).toBe(409);
    expect(await Worksheet.countDocuments()).toBe(1);
    expect(destroyCalls).toHaveLength(0);
  });

  it('refuses another therapist and a missing worksheet with 404', async () => {
    const created = await upload({ bookingId: bookings.mine._id });
    expect((await withdraw(bookings.mine._id, created.body.id, tokens.other)).status).toBe(404);
    expect((await withdraw(bookings.mine._id, new mongoose.Types.ObjectId())).status).toBe(404);
    expect(await Worksheet.countDocuments()).toBe(1);
  });

  it('still succeeds if the stored file cannot be deleted', async () => {
    fakeCloudinary.uploader.destroy.mockRejectedValueOnce(new Error('storage down'));
    const created = await upload({ bookingId: bookings.mine._id });
    expect((await withdraw(bookings.mine._id, created.body.id)).status).toBe(200);
  });
});

describe('downloadFilename', () => {
  it('keeps words, drops unsafe characters, never goes empty', () => {
    expect(downloadFilename('Grief reflection (week 2)', 'pdf')).toBe('Grief reflection week 2.pdf');
    expect(downloadFilename('../../etc/passwd', 'pdf')).toBe('etcpasswd.pdf');
    expect(downloadFilename('"; rm -rf', 'docx')).toBe('rm -rf.docx');
    expect(downloadFilename('!!!', 'pdf')).toBe('worksheet.pdf');
    expect(downloadFilename('x'.repeat(200), 'pdf')).toHaveLength(84);
  });
});
