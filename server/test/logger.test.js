import { jest } from '@jest/globals';

// 12.4: in production the logger writes one JSON line per entry, by level.
jest.unstable_mockModule('../config/env.js', () => ({
  default: { isProduction: true, logLevel: 'info' },
}));

const { logger } = await import('../utils/logger.js');

afterEach(() => jest.restoreAllMocks());

describe('logger in production (12.4)', () => {
  it('writes one parseable JSON line with time, level, msg and fields', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('GET /api/v1/health 200 3ms', { path: '/api/v1/health', status: 200 });

    expect(log).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(log.mock.calls[0][0]);
    expect(entry).toMatchObject({ level: 'info', msg: 'GET /api/v1/health 200 3ms', path: '/api/v1/health', status: 200 });
    expect(Number.isNaN(Date.parse(entry.time))).toBe(false);
  });

  it('sends warnings and errors to the right streams', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    logger.warn('w');
    logger.error('e');
    expect(JSON.parse(warn.mock.calls[0][0]).level).toBe('warn');
    expect(JSON.parse(error.mock.calls[0][0]).level).toBe('error');
  });

  it('drops entries below LOG_LEVEL', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    logger.debug('noise');
    expect(log).not.toHaveBeenCalled();
  });
});
