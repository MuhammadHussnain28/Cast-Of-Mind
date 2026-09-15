import http from 'node:http';
import env from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import app from './app.js';
import { createSocketServer } from './realtime/socketServer.js';

async function start() {
  await connectDB();

  // An explicit http.Server rather than app.listen(), because Socket.io needs
  // the raw server to attach to. `app` itself stays transport-free so the test
  // suite can mount it with supertest and no socket layer at all.
  const server = http.createServer(app);
  const io = createSocketServer(server);

  server.listen(env.port, () => {
    console.log(`Server listening on port ${env.port} [${env.nodeEnv}]`);
    console.log('Socket.io attached.');
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);

    // Sockets first: open connections would otherwise hold the HTTP server open
    // and server.close() would never call back.
    io.close(() => {
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
