// Admin portal settings — master spec §18 (admin-specific security).

// Session timeout after ~30 minutes of inactivity (§18).
//
// Enforced in the browser: the idle timer calls POST /auth/logout, which clears
// the stored refresh hash, so the session is genuinely revoked rather than only
// hidden. Served from here so the client cannot drift from the spec's value.
//
// KNOWN GAP, carried to chunk 12.3: if the tab dies (closed laptop) no timer
// fires, and the refresh cookie stays valid for its remaining 7 days. Closing
// it needs a `lastSeenAt` field on `users` — a schema addition, deliberately
// not made in this chunk.
export const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

// How long BEFORE the timeout the warning appears.
export const ADMIN_IDLE_WARNING_MS = 2 * 60 * 1000;

// One admin, so this is abuse protection rather than a usage limit.
export const ADMIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const ADMIN_RATE_LIMIT_MAX = 200;
export const ADMIN_RATE_LIMIT_MESSAGE = 'Too many requests. Please try again in a few minutes.';
