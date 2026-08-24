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
  console.error(err);

  const body = { error: { message, code } };
  if (err.details) {
    body.error.details = err.details;
  }

  res.status(statusCode).json(body);
}
