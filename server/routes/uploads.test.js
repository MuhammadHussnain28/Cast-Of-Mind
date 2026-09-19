import { jest } from '@jest/globals';
import request from 'supertest';

// Cloudinary is faked so the suite never touches a real account, never spends
// storage quota, and can inspect exactly what would have been sent.
const uploadStreamCalls = [];

function fakeUploadStream(options, callback) {
  uploadStreamCalls.push(options);

  return {
    end(buffer) {
      // Mirrors the shape the real SDK returns on success.
      const format = options.format ?? 'png';
      callback(null, {
        secure_url: `https://res.cloudinary.com/test/${options.type}/${options.public_id}.${format}`,
        public_id: `${options.folder}/${options.public_id}`,
        format,
        bytes: buffer.length,
      });
    },
  };
}

const uploadStreamMock = jest.fn(fakeUploadStream);

jest.unstable_mockModule('../config/cloudinary.js', () => ({
  isCloudinaryConfigured: true,
  cloudinary: { uploader: { upload_stream: uploadStreamMock } },
  default: { uploader: { upload_stream: uploadStreamMock } },
}));

const { default: app } = await import('../app.js');
const { uploadRateLimiter } = await import('./upload.routes.js');
const { UPLOAD_KINDS } = await import('../constants/uploads.js');
const { docx } = await import('../test/zipFixture.js');

// Real file headers. The point of the endpoint is that it reads these rather
// than trusting the filename or the declared content type.
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(256),
]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(256)]);
const PDF = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(256)]);
const EXE = Buffer.concat([Buffer.from([0x4d, 0x5a, 0x90, 0x00]), Buffer.alloc(256)]);

function post({ kind, file, filename = 'file.png', contentType = 'image/png' }) {
  const req = request(app).post('/api/v1/uploads');
  if (kind !== undefined) req.field('kind', kind);
  if (file) req.attach('file', file, { filename, contentType });
  return req;
}

beforeEach(() => {
  uploadStreamMock.mockClear();
  uploadStreamCalls.length = 0;
  uploadRateLimiter.resetKey('::ffff:127.0.0.1');
  uploadRateLimiter.resetKey('127.0.0.1');
});

describe('POST /api/v1/uploads — accepted files', () => {
  it('accepts a PNG profile photo and returns a URL and public id', async () => {
    const res = await post({ kind: 'photo', file: PNG });

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^https:\/\//);
    expect(res.body.publicId).toBeTruthy();
    expect(res.body.kind).toBe('photo');
    expect(uploadStreamMock).toHaveBeenCalledTimes(1);
  });

  it('accepts a JPEG', async () => {
    const res = await post({
      kind: 'photo',
      file: JPEG,
      filename: 'portrait.jpg',
      contentType: 'image/jpeg',
    });
    expect(res.status).toBe(201);
  });

  it('accepts a PDF certificate', async () => {
    const res = await post({
      kind: 'certificate',
      file: PDF,
      filename: 'degree.pdf',
      contentType: 'application/pdf',
    });

    expect(res.status).toBe(201);
    expect(uploadStreamCalls[0].format).toBe('pdf');
  });

  it('accepts a scanned image as a certificate, not only a PDF', async () => {
    const res = await post({ kind: 'certificate', file: PNG });
    expect(res.status).toBe(201);
  });

  it('accepts a licence document', async () => {
    const res = await post({
      kind: 'license',
      file: PDF,
      filename: 'licence.pdf',
      contentType: 'application/pdf',
    });
    expect(res.status).toBe(201);
  });
});

describe('POST /api/v1/uploads — content is checked by bytes, not by label', () => {
  // The reason the magic-byte check exists.
  it('rejects a Windows executable renamed to .pdf and declared as application/pdf', async () => {
    const res = await post({
      kind: 'certificate',
      file: EXE,
      filename: 'certificate.pdf',
      contentType: 'application/pdf',
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('UPLOAD_REJECTED');
    expect(uploadStreamMock).not.toHaveBeenCalled();
  });

  it('rejects an executable renamed to .png for a profile photo', async () => {
    const res = await post({ kind: 'photo', file: EXE, filename: 'me.png' });

    expect(res.status).toBe(422);
    expect(uploadStreamMock).not.toHaveBeenCalled();
  });

  it('rejects a PDF for a profile photo, where only images are allowed', async () => {
    const res = await post({
      kind: 'photo',
      file: PDF,
      filename: 'me.pdf',
      contentType: 'application/pdf',
    });

    expect(res.status).toBe(422);
    expect(res.body.error.message).toMatch(/JPEG, PNG, WebP/);
    expect(uploadStreamMock).not.toHaveBeenCalled();
  });

  it('rejects a plain text file dressed as an image', async () => {
    const res = await post({ kind: 'photo', file: Buffer.from('just some text') });
    expect(res.status).toBe(422);
  });

  it('names the accepted formats so the applicant knows what would work', async () => {
    const res = await post({ kind: 'certificate', file: EXE, filename: 'x.pdf' });
    expect(res.status).toBe(422);
    expect(res.body.error.message).toMatch(/PDF/);
  });
});

describe('POST /api/v1/uploads — size limits', () => {
  it('rejects a file over the global ceiling', async () => {
    const tooBig = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(11 * 1024 * 1024),
    ]);

    const res = await post({ kind: 'certificate', file: tooBig });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('UPLOAD_REJECTED');
    expect(uploadStreamMock).not.toHaveBeenCalled();
  });

  it('rejects a photo over the tighter 5 MB photo cap', async () => {
    const sixMb = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(6 * 1024 * 1024),
    ]);

    const res = await post({ kind: 'photo', file: sixMb });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/5 MB/);
    expect(uploadStreamMock).not.toHaveBeenCalled();
  });

  it('accepts a document at a size that a photo would reject', async () => {
    const sixMb = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(6 * 1024 * 1024),
    ]);

    const res = await post({ kind: 'certificate', file: sixMb });
    expect(res.status).toBe(201);
  });
});

describe('POST /api/v1/uploads — bad requests', () => {
  it('rejects an unknown kind', async () => {
    const res = await post({ kind: 'passport', file: PNG });

    expect(res.status).toBe(422);
    expect(res.body.error.message).toMatch(/photo, certificate, license/);
    expect(uploadStreamMock).not.toHaveBeenCalled();
  });

  it('rejects a missing kind', async () => {
    const res = await post({ file: PNG });
    expect(res.status).toBe(422);
  });

  it('rejects a request with no file', async () => {
    const res = await post({ kind: 'photo' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('UPLOAD_REJECTED');
  });

  it('rejects a file sent under the wrong field name', async () => {
    const res = await request(app)
      .post('/api/v1/uploads')
      .field('kind', 'photo')
      .attach('document', PNG, { filename: 'a.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/"file"/);
  });

  it('returns the project error shape, never a stack trace', async () => {
    const res = await post({ kind: 'photo', file: EXE });

    expect(res.body).toHaveProperty('error.message');
    expect(res.body).toHaveProperty('error.code');
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js:\d+/);
  });
});

describe('POST /api/v1/uploads — how files are stored', () => {
  it('puts credential documents behind authenticated delivery, not public URLs', async () => {
    await post({ kind: 'certificate', file: PDF, contentType: 'application/pdf' });
    expect(uploadStreamCalls[0].type).toBe('authenticated');

    uploadStreamCalls.length = 0;
    await post({ kind: 'license', file: PDF, contentType: 'application/pdf' });
    expect(uploadStreamCalls[0].type).toBe('authenticated');
  });

  it('leaves the profile photo publicly deliverable, since clients see it', async () => {
    await post({ kind: 'photo', file: PNG });
    expect(uploadStreamCalls[0].type).toBe('upload');
  });

  it('reports the visibility back to the caller', async () => {
    const photo = await post({ kind: 'photo', file: PNG });
    expect(photo.body.visibility).toBe('public');

    const cert = await post({ kind: 'certificate', file: PDF, contentType: 'application/pdf' });
    expect(cert.body.visibility).toBe('authenticated');
  });

  it('separates the three kinds into their own folders', async () => {
    await post({ kind: 'photo', file: PNG });
    expect(uploadStreamCalls[0].folder).toBe(UPLOAD_KINDS.photo.folder);

    uploadStreamCalls.length = 0;
    await post({ kind: 'certificate', file: PNG });
    expect(uploadStreamCalls[0].folder).toBe(UPLOAD_KINDS.certificate.folder);

    uploadStreamCalls.length = 0;
    await post({ kind: 'license', file: PNG });
    expect(uploadStreamCalls[0].folder).toBe(UPLOAD_KINDS.license.folder);
  });

  // The original filename can carry the applicant's own name into a URL.
  it('discards the original filename and uses a random public id', async () => {
    await post({ kind: 'photo', file: PNG, filename: 'amara-okafor-passport.png' });

    const { public_id: publicId } = uploadStreamCalls[0];
    expect(publicId).toMatch(/^[0-9a-f]{32}$/);
    expect(publicId).not.toMatch(/amara/i);
  });

  it('generates a different public id for every upload', async () => {
    await post({ kind: 'photo', file: PNG });
    await post({ kind: 'photo', file: PNG });

    expect(uploadStreamCalls[0].public_id).not.toBe(uploadStreamCalls[1].public_id);
  });

  it('never overwrites an existing asset', async () => {
    await post({ kind: 'photo', file: PNG });
    expect(uploadStreamCalls[0].overwrite).toBe(false);
  });
});

describe('POST /api/v1/uploads — rate limiting', () => {
  // This endpoint is public and unauthenticated, so the limiter is the only
  // thing between a stranger and the storage quota.
  it('returns 429 once the hourly limit is passed', async () => {
    for (let i = 0; i < 10; i += 1) {
      const res = await post({ kind: 'photo', file: PNG });
      expect(res.status).toBe(201);
    }

    const blocked = await post({ kind: 'photo', file: PNG });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });

  it('counts rejected uploads towards the limit too', async () => {
    for (let i = 0; i < 10; i += 1) {
      await post({ kind: 'photo', file: EXE });
    }

    const blocked = await post({ kind: 'photo', file: PNG });
    expect(blocked.status).toBe(429);
  });
});

describe('POST /api/v1/uploads — worksheets stay off the public endpoint (8.4)', () => {
  it('refuses kind=worksheet from a stranger', async () => {
    const res = await post({ kind: 'worksheet', file: PDF, filename: 'w.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(422);
    expect(uploadStreamMock).not.toHaveBeenCalled();
  });

  it('still refuses a Word document as a certificate', async () => {
    const res = await post({
      kind: 'certificate',
      file: docx(),
      filename: 'cert.docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    expect(res.status).toBe(422);
    expect(uploadStreamMock).not.toHaveBeenCalled();
  });
});
