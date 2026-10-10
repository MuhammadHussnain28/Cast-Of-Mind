import * as Sentry from '@sentry/node';
import env from './env.js';
import { scrubEvent } from '../utils/sentryScrub.js';

// Error reporting (12.4). OFF unless production AND a DSN is set, so dev and
// the test suite never send anything. This is a mental health platform: the
// SDK is told to collect nothing, and scrubEvent removes it again regardless.

// Sentry 11 collects bodies, headers, cookies, query strings, user info and
// stack-frame variables BY DEFAULT. Every category is switched off here.
export const PRIVATE_DATA_COLLECTION = Object.freeze({
  userInfo: false,
  cookies: false,
  httpHeaders: { request: { allow: ['user-agent', 'content-type'] }, response: false },
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
});

let enabled = false;

export function initSentry() {
  if (!env.isProduction || !env.sentryDsn) return false;

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.sentryEnvironment,
    release: env.sentryRelease ?? undefined,
    dataCollection: PRIVATE_DATA_COLLECTION,
    includeLocalVariables: false,
    // Errors only: no tracing, no profiling.
    tracesSampleRate: 0,
    maxBreadcrumbs: 0,
    beforeBreadcrumb: () => null,
    beforeSend: (event) => scrubEvent(event),
    integrations: (defaults) => [
      ...defaults.filter((integration) => integration.name !== 'OnUnhandledRejection'),
      // 'strict' keeps Node's own behaviour: report, then exit (Render restarts).
      Sentry.onUnhandledRejectionIntegration({ mode: 'strict' }),
    ],
  });

  enabled = true;
  return true;
}

export const isSentryEnabled = () => enabled;

/** Reports a genuine fault. `userId` is the pseudonymous MongoDB id only. */
export function captureError(error, { userId } = {}) {
  if (!enabled) return;
  Sentry.withScope((scope) => {
    if (userId) scope.setUser({ id: String(userId) });
    Sentry.captureException(error);
  });
}

/** Gives queued events a moment to leave on shutdown. */
export async function flushSentry(timeoutMs = 2000) {
  if (!enabled) return;
  await Sentry.close(timeoutMs);
}
