import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_VARS = ['PORT', 'NODE_ENV', 'CLIENT_ORIGIN', 'MONGODB_URI'];

function loadEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    // Fail loudly — a missing var must stop the server, never fall back silently.
    console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
    console.error('Copy .env.example to .env and fill in the missing values.');
    process.exit(1);
  }

  return {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    clientOrigin: process.env.CLIENT_ORIGIN,
    mongodbUri: process.env.MONGODB_URI,
  };
}

export default loadEnv();
