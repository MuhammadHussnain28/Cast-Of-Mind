import env from '../config/env.js';
import { captureError } from '../config/sentry.js';
import { logger } from '../utils/logger.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  const isKnownError = err.isOperational === true;
  const message = isKnownError || env.nodeEnv !== 'production'
    ? err.message
    : 'Something went wrong. Please try again.';

  // Sentry gets real faults only — never a wrong password or a 404 (12.4).
  if (!isKnownError || statusCode >= 500) {
    captureError(err, { userId: req.user?.id });
  }

  // Full detail stays server-side only — never in the client response.
  //
  // Known (operational) errors are logged as ONE line. A wrong password is an
  // expected event, not a fault, and a stack trace for it points only at our own
  // throw statement. Dumping one per failed login would flood the logs during a
  // brute-force attempt and bury the real errors underneath.
  //
  // Unknown errors still get the complete dump — those are genuine bugs and the
  // stack is the whole point.
  if (isKnownError) {
    logger.warn(`${code} ${statusCode} ${req.method} ${req.path} — ${err.message}`, {
      code,
      status: statusCode,
      method: req.method,
      path: req.path,
    });
  } else if (!env.isProduction) {
    console.error(err);
  } else {
    // The stack, never the request: an error's message can echo user input.
    logger.error(`${err.name ?? 'Error'} ${statusCode} ${req.method} ${req.path}`, {
      name: err.name,
      status: statusCode,
      method: req.method,
      path: req.path,
      // Frames only: a stack's first line repeats the message.
      stack: err.stack?.split('\n').slice(1).join('\n'),
    });
  }

  const body = { error: { message, code } };
  if (err.details) {
    body.error.details = err.details;
  }

  res.status(statusCode).json(body);
}
