import { logger } from '../utils/logger.js';

// Logs method, path, status, and duration only — never the request body, and
// never the query string (12.4, the C2 fix): it carries admin search terms
// (client names, emails) and Stripe checkout session ids.
// This is a mental health platform: message content, journal text, private
// notes, and payment details must never reach the logs.
export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const path = req.originalUrl.split('?')[0];
    logger.info(`${req.method} ${path} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      path,
      status: res.statusCode,
      ms: duration,
    });
  });

  next();
}
