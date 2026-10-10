// System status card on the admin dashboard (10.6).
//
// Four fixed words per service, never a vendor's own error text: a raw message
// can carry an account id or an internal host, and the admin needs the state,
// not the stack trace.

export const SERVICE_STATE = Object.freeze({
  OPERATIONAL: 'operational',
  ATTENTION: 'attention',
  DOWN: 'down',
  NOT_CONFIGURED: 'not_configured',
});

export const SERVICE_KEY = Object.freeze({
  DATABASE: 'database',
  PAYMENTS: 'payments',
  EMAIL: 'email',
  STORAGE: 'storage',
});

export const SERVICE_DETAIL = Object.freeze({
  TEST_MODE: 'test_mode',
  LIVE_MODE: 'live_mode',
  // Resend's shared sender only delivers to the account owner (blocker 7).
  TEST_SENDER: 'test_sender',
  DOMAIN_VERIFIED: 'domain_verified',
  DOMAIN_UNVERIFIED: 'domain_unverified',
  // A sending-only key cannot read domains, so verification is not checkable.
  SENDING_KEY: 'sending_key',
});

// Each check is raced against this, so one slow vendor cannot hold the card.
export const PROBE_TIMEOUT_MS = 4000;

export const RESEND_TEST_DOMAIN = 'resend.dev';

// Public GET /api/v1/health (12.4). States only — the admin card keeps details.
export const HEALTH_STATUS = Object.freeze({
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  DOWN: 'down',
});

// One probe run is shared for this long: the endpoint is public, and each run
// calls Resend's and Cloudinary's admin APIs, which have quotas.
export const HEALTH_CACHE_MS = 60 * 1000;

export const HEALTH_RATE_LIMIT = Object.freeze({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many health checks. Please try again in a minute.',
});
