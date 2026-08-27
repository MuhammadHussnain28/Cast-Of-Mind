import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { cleanupExpiredRefreshTokens } from '../services/auth.service.js';

// Clears refresh tokens that have passed their expiry.
//
// Run with:  npm run cleanup:tokens
//
// This is housekeeping, not a security control. An expired token is already
// refused twice over — by the JWT signature check and by the
// `refreshTokenExpiresAt` check inside refresh(). This just stops dead hashes
// accumulating in the database.
//
// Safe to run at any time, including while the server is live: it only ever
// clears tokens that are ALREADY expired, so no signed-in user is disturbed.
//
// WARNING FOR WHOEVER AUTOMATES THIS LATER: do not swap it for a MongoDB TTL
// index. That is the obvious-looking answer and it would be a catastrophe — the
// refresh token lives ON the `users` record, so a TTL index on
// `refreshTokenExpiresAt` would delete THE ENTIRE USER ACCOUNT when the token
// expired. Every client and therapist, silently gone. A scheduled call to this
// script is the correct approach.

async function run() {
  await connectDB();

  const cleaned = await cleanupExpiredRefreshTokens();

  if (cleaned === 0) {
    console.log('No expired refresh tokens to clear.');
  } else {
    console.log(`Cleared expired refresh tokens for ${cleaned} user(s).`);
    console.log('Only the two token fields were touched. No account was deleted.');
  }
}

run()
  .then(async () => {
    await disconnectDB();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(`Cleanup failed: ${err.message}`);
    if (mongoose.connection.readyState === 1) {
      await disconnectDB();
    }
    process.exit(1);
  });
