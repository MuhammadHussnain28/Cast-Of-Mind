// Logs method, path, status, and duration only — never the request body.
// This is a mental health platform: message content, journal text, private
// notes, and payment details must never reach the logs.
export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
}
