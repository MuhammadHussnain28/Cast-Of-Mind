import mongoose from 'mongoose';
import env from './env.js';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectDB() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await mongoose.connect(env.mongodbUri);
      console.log('MongoDB connected.');
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);

      if (attempt === MAX_RETRIES) {
        console.error('MongoDB connection failed after maximum retries. Exiting.');
        process.exit(1);
      }

      const backoff = BASE_DELAY_MS * 2 ** (attempt - 1);
      await delay(backoff);
    }
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  console.log('MongoDB disconnected.');
}
