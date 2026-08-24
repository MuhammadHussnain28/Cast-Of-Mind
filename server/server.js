import env from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import app from './app.js';

async function start() {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
