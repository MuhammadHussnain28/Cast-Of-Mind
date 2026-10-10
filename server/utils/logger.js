import env from '../config/env.js';

// Structured logging (12.4). Production writes one JSON line per entry so the
// host can filter by level; development and tests keep today's plain text, so
// nothing reading the console changes. Never pass request bodies or user text.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[env.logLevel] ?? LEVELS.info;
const json = env.isProduction;

function write(level, message, fields) {
  if (LEVELS[level] < threshold) return;
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  if (!json) {
    sink(message);
    return;
  }
  sink(JSON.stringify({ time: new Date().toISOString(), level, msg: message, ...fields }));
}

export const logger = {
  debug: (message, fields) => write('debug', message, fields),
  info: (message, fields) => write('info', message, fields),
  warn: (message, fields) => write('warn', message, fields),
  error: (message, fields) => write('error', message, fields),
};

export default logger;
