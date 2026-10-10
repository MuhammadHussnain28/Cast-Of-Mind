// Accountability trail for the admin portal — master spec §18 asks for IP
// logging on admin actions.
//
// Destination is the SERVER LOG, not a collection. §20 defers an audit trail as
// overkill for a single admin and §10 fixes the schema at 14 collections;
// adding a 15th here would contradict both. Decision recorded 2026-09-04.
//
// Mounted BEFORE the guards, so a rejected attempt is logged too — a client
// token reaching an admin path is exactly the event worth having a record of.
// The line is written on response finish, by which point requireAuth has
// already run, so a refused attempt still names the account that made it.
// Only a request carrying no valid token at all logs as anonymous.

// Never the request body, and never the query string either: an admin searching
// a client list would otherwise write that person's name into the log. Only the
// path is recorded. Same privacy rule as requestLogger.js.
import { logger } from '../utils/logger.js';

function safePath(req) {
  return `${req.baseUrl}${req.path}`;
}

export function adminActionLog(req, res, next) {
  res.on('finish', () => {
    const who = req.user?.id ?? 'anonymous';
    // A controller may attach `res.locals.adminActionDetail` to record WHAT it
    // changed — field names only, never values, for the same privacy reason the
    // query string is left out.
    const detail = res.locals.adminActionDetail ? ` ${res.locals.adminActionDetail}` : '';

    logger.info(
      `[admin] ${new Date().toISOString()} user=${who} ${req.method} ${safePath(req)} ${res.statusCode} ip=${req.ip}${detail}`,
      {
        tag: 'admin',
        user: who,
        method: req.method,
        path: safePath(req),
        status: res.statusCode,
        ip: req.ip,
        ...(res.locals.adminActionDetail ? { detail: res.locals.adminActionDetail } : {}),
      },
    );
  });

  next();
}
