import http from 'node:http';
import env from './config/env.js';
import { initSentry, flushSentry } from './config/sentry.js';
import { logger } from './utils/logger.js';
import { connectDB, disconnectDB } from './config/db.js';
import app from './app.js';
import { createSocketServer } from './realtime/socketServer.js';
import { startSessionReminders, stopSessionReminders } from './services/sessionReminders.service.js';
import { startLifecycleSweep, stopLifecycleSweep } from './services/subscriptionLifecycle.service.js';

// Before anything runs, so a startup crash is reported too. Off outside
// production or without SENTRY_DSN.
if (initSentry()) logger.info('Sentry error reporting enabled.', { tag: 'startup' });

async function start() {
  await connectDB();

  // An explicit http.Server rather than app.listen(), because Socket.io needs
  // the raw server to attach to. `app` itself stays transport-free so the test
  // suite can mount it with supertest and no socket layer at all.
  const server = http.createServer(app);
  const io = createSocketServer(server);

  server.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port} [${env.nodeEnv}]`, { tag: 'startup', port: env.port });
    logger.info('Socket.io attached.', { tag: 'startup' });
  });

  // Session reminders (9.6): a sweep every few minutes inside this process.
  // Two instances are safe — each reminder is claimed atomically before sending.
  if (env.sessionReminders) {
    startSessionReminders();
    logger.info('Session reminders scheduled.', { tag: 'startup' });
  }

  // The lifecycle sweep (11.2): expires past-due subscriptions whose grace has
  // ended. Two instances are safe — every expiry is a conditional update.
  if (env.lifecycleSweep) {
    startLifecycleSweep();
    logger.info('Subscription lifecycle sweep scheduled.', { tag: 'startup' });
  }

  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`, { tag: 'shutdown' });

    // Sockets first: open connections would otherwise hold the HTTP server open
    // and server.close() would never call back.
    stopSessionReminders();
    stopLifecycleSweep();

    io.close(() => {
      server.close(async () => {
        await disconnectDB();
        await flushSentry();
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();



