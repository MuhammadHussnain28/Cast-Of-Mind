import env from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  const isKnownError = err.isOperational === true;
  const message = isKnownError || env.nodeEnv !== 'production'
    ? err.message
    : 'Something went wrong. Please try again.';

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
    console.error(`${code} ${statusCode} ${req.method} ${req.path} — ${err.message}`);
  } else {
    console.error(err);
  }

  const body = { error: { message, code } };
  if (err.details) {
    body.error.details = err.details;
  }

  res.status(statusCode).json(body);
}
