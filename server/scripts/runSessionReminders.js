import { connectDB, disconnectDB } from '../config/db.js';
import { runSessionReminders } from '../services/sessionReminders.service.js';

// One session-reminder sweep, by hand.
//
// Run with:  npm run reminders:run
//
// The web server already does this every few minutes (9.6). This exists for the
// chunk's own verify step, for checking a live deployment, and as the command a
// Render Cron Job would run if the timer is ever moved out of the web service.
// Safe to run at any time and alongside the server: every reminder is claimed
// atomically, so nothing is ever sent twice.

async function run() {
  await connectDB();

  const { sent, completed } = await runSessionReminders();

  console.log(`Reminders sent: ${sent.length}. Sessions completed: ${completed}.`);
  for (const one of sent) {
    console.log(`  ${one.kind} — session ${one.sessionId}${one.skipped ? ` (skipped: ${one.skipped})` : ''}`);
  }

  await disconnectDB();
}

run().catch(async (error) => {
  console.error(`Reminder sweep failed: ${error?.name ?? 'Error'}`);
  await disconnectDB();
  process.exitCode = 1;
});
