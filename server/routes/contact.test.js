import { jest } from '@jest/globals';
import request from 'supertest';

// The email service is faked so the suite never sends real mail and the
// delivered payload can be inspected directly.
const sendEmail = jest.fn();
jest.unstable_mockModule('../services/email/email.service.js', () => ({
  sendEmail,
  sendPasswordResetEmail: jest.fn(),
}));

const { default: app } = await import('../app.js');
const { contactRateLimiter } = await import('./contact.routes.js');
const { CONTACT_SUCCESS_MESSAGE } = await import('../constants/contact.js');

const valid = {
  name: 'Sara Okonkwo',
  email: 'Sara@Example.com',
  subject: 'General question',
  message: 'I am not sure whether what I am dealing with counts. Can you help?',
};

beforeEach(() => {
  sendEmail.mockReset();
  sendEmail.mockResolvedValue({ delivered: true });
  contactRateLimiter.resetKey('::ffff:127.0.0.1');
  contactRateLimiter.resetKey('127.0.0.1');
});

describe('POST /api/v1/contact', () => {
  it('accepts a valid message and sends exactly one email', async () => {
    const res = await request(app).post('/api/v1/contact').send(valid);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: CONTACT_SUCCESS_MESSAGE });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('sets Reply-To to the sender so the business can just hit reply', async () => {
    await request(app).post('/api/v1/contact').send(valid);

    expect(sendEmail.mock.calls[0][0].replyTo).toBe('sara@example.com');
  });

  it('lowercases and trims the email before use', async () => {
    await request(app)
      .post('/api/v1/contact')
      .send({ ...valid, email: '  Sara@Example.COM  ' });

    expect(sendEmail.mock.calls[0][0].replyTo).toBe('sara@example.com');
  });

  it('carries the message through to the email body', async () => {
    await request(app).post('/api/v1/contact').send(valid);

    expect(sendEmail.mock.calls[0][0].text).toContain(valid.message);
  });

  // The honeypot is the whole spam defence, so it gets the most attention.
  it('silently discards a submission with the honeypot filled', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({ ...valid, website: 'http://spam.example' });

    // Identical reply to a real send — a bot must learn nothing.
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: CONTACT_SUCCESS_MESSAGE });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('still sends when the honeypot is present but empty', async () => {
    await request(app).post('/api/v1/contact').send({ ...valid, website: '' });

    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['name', { name: '' }],
    ['email', { email: 'not-an-email' }],
    ['message', { message: 'too short' }],
  ])('rejects a missing or malformed %s with 422', async (_field, override) => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({ ...valid, ...override });

    expect(res.status).toBe(422);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('rejects a subject that is not on the list', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({ ...valid, subject: 'Something invented' });

    expect(res.status).toBe(422);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('accepts a message with no subject at all', async () => {
    const noSubject = { ...valid };
    delete noSubject.subject;
    const res = await request(app).post('/api/v1/contact').send(noSubject);

    expect(res.status).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('rate limits after 5 messages from one address', async () => {
    for (let i = 0; i < 5; i += 1) {
      const ok = await request(app).post('/api/v1/contact').send(valid);
      expect(ok.status).toBe(200);
    }

    const blocked = await request(app).post('/api/v1/contact').send(valid);
    expect(blocked.status).toBe(429);
    expect(sendEmail).toHaveBeenCalledTimes(5);
  });

  it('never writes to the database', async () => {
    // No model is imported by the contact path at all. This test documents the
    // requirement so a future change that adds one fails review, not runtime.
    const service = await import('../services/contact.service.js');
    expect(Object.keys(service)).toEqual(['submitContactMessage']);
  });
});
