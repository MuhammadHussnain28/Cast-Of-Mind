import { jest } from '@jest/globals';

// 12.4: what the error handler reports to Sentry, and what the logs contain.
// Sentry is mocked — nothing here can reach the network.

const captureError = jest.fn();
jest.unstable_mockModule('../config/sentry.js', () => ({
  captureError,
  initSentry: () => false,
  isSentryEnabled: () => false,
  flushSentry: async () => {},
  PRIVATE_DATA_COLLECTION: {},
}));

const { errorHandler } = await import('../middleware/errorHandler.js');
const { requestLogger } = await import('../middleware/requestLogger.js');
const { AppError } = await import('../utils/AppError.js');

const USER_ID = '64b7f0c2a1b2c3d4e5f60718';

function fakeRes() {
  const listeners = {};
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json: jest.fn(),
    on: (event, fn) => {
      listeners[event] = fn;
    },
    emit: (event) => listeners[event]?.(),
  };
}

const req = (extra = {}) => ({ method: 'POST', path: '/journal', user: { id: USER_ID }, ...extra });

beforeEach(() => {
  captureError.mockReset();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('errorHandler → Sentry (12.4)', () => {
  it('REPORTS A GENUINE FAULT, with only the pseudonymous user id', () => {
    const fault = new TypeError('Cannot read properties of undefined');
    errorHandler(fault, req(), fakeRes(), () => {});
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledWith(fault, { userId: USER_ID });
  });

  it('NEVER REPORTS AN EXPECTED REFUSAL — a wrong password, a 404, a bad form', () => {
    for (const [status, code] of [[401, 'INVALID_CREDENTIALS'], [403, 'FORBIDDEN'], [404, 'NOT_FOUND'], [422, 'VALIDATION_ERROR'], [429, 'RATE_LIMITED']]) {
      errorHandler(new AppError('Expected.', status, code), req(), fakeRes(), () => {});
    }
    expect(captureError).not.toHaveBeenCalled();
  });

  it('reports a known error that is still a server fault (5xx)', () => {
    errorHandler(new AppError('Payment provider unavailable.', 502, 'PAYMENT_UNAVAILABLE'), req(), fakeRes(), () => {});
    expect(captureError).toHaveBeenCalledTimes(1);
  });

  it('works with no signed-in user', () => {
    errorHandler(new Error('boom'), req({ user: undefined }), fakeRes(), () => {});
    expect(captureError).toHaveBeenCalledWith(expect.any(Error), { userId: undefined });
  });

  it('still answers the client with the safe shape', () => {
    const res = fakeRes();
    errorHandler(new AppError('Not here.', 404, 'NOT_FOUND'), req(), res, () => {});
    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'Not here.', code: 'NOT_FOUND' } });
  });
});

describe('requestLogger (12.4, the C2 fix)', () => {
  it('NEVER LOGS THE QUERY STRING — search terms and payment session ids stay out', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const res = fakeRes();
    requestLogger(
      { method: 'GET', originalUrl: '/api/v1/admin/clients?q=Rosa%20Client&sessionId=cs_test_123' },
      res,
      () => {},
    );
    res.emit('finish');

    const line = log.mock.calls.map((args) => args.join(' ')).join('\n');
    expect(line).toContain('GET /api/v1/admin/clients 200');
    expect(line).not.toContain('Rosa');
    expect(line).not.toContain('cs_test_123');
    expect(line).not.toContain('?');
  });
});
