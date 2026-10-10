import * as Sentry from '@sentry/node';
import { initSentry, flushSentry } from '../config/sentry.js';

// `npm run sentry:test` (12.4) — run once on Render after setting SENTRY_DSN.
// Sends ONE synthetic error carrying FAKE sensitive values through the real
// scrubber. Open it in Sentry: none of the FAKE_ values may appear.

if (!initSentry()) {
  console.error('Sentry is off: it needs NODE_ENV=production and SENTRY_DSN.');
  process.exit(1);
}

const error = new Error(
  'Sentry pipeline test. FAKE_EMAIL fake.client@example.com and "FAKE_JOURNAL quoted journal text"',
);

const eventId = Sentry.withScope((scope) => {
  scope.setUser({ id: '000000000000000000000000', email: 'fake.client@example.com', ip_address: '10.0.0.1' });
  scope.setExtra('password', 'FAKE_PASSWORD');
  scope.setExtra('text', 'FAKE_MESSAGE therapy content');
  scope.setTag('email', 'fake.client@example.com');
  return Sentry.captureException(error);
});

await flushSentry();
console.log(`Sent test event ${eventId}. Check Sentry: no FAKE_ value may appear.`);
