import { connectDB, disconnectDB } from '../config/db.js';
import { runLifecycleSweep } from '../services/subscriptionLifecycle.service.js';

// One subscription-lifecycle sweep, by hand.
//
// Run with:  npm run lifecycle:run
//
// The web server already does this every few minutes (11.2). Safe to run at any
// time and alongside the server: every expiry is a conditional update.
// WRITES TO WHICHEVER DATABASE YOUR .env POINTS AT, and cancels at Stripe.

async function run() {
  await connectDB();

  const { grace, cancelled, reminders } = await runLifecycleSweep();
  console.log(`Grace ended: ${grace.expired} expired, ${grace.waiting} paid at Stripe (waiting), ${grace.failed} failed.`);
  console.log(`Cancelled plans run out: ${cancelled.expired} expired.`);
  console.log(`Renewal reminders: ${reminders.sent} sent, ${reminders.failed} failed (retried next sweep).`);

  await disconnectDB();
}

run().catch(async (error) => {
  console.error(`Lifecycle sweep failed: ${error?.name ?? 'Error'}`);
  await disconnectDB();
  process.exitCode = 1;
});
