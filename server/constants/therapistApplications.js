// Therapist application submission settings — master spec §23.

// ONE message for every "this address is already known" case: an existing
// client, therapist or admin account, or a pending application.
//
// The wording is deliberate. Chunk 1.2 built login so it never reveals whether
// an email has an account, and on a mental health platform "this address
// belongs to a client" is itself sensitive. A different message per case would
// hand that back. This still tells a stranger the address is known to us — an
// accepted trade-off, approved 2026-09-02 — but never what kind of account it
// is, which is the part that matters.
export const DUPLICATE_EMAIL_MESSAGE =
  'An account or application already exists for this email address. If that is you, sign in or use forgot password.';

export const DUPLICATE_EMAIL_CODE = 'APPLICATION_EMAIL_TAKEN';

export const SUBMISSION_SUCCESS_MESSAGE =
  'Your application has been received. We have sent a confirmation to your email address.';

// Submitting writes to the database and sends two emails, so it is costed
// tightly. A real applicant submits once.
export const SUBMIT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const SUBMIT_RATE_LIMIT_MAX = 5;
export const SUBMIT_RATE_LIMIT_MESSAGE =
  'Too many applications from this connection. Please try again in a little while.';

// The status check is cheap and an anxious applicant may refresh it, so it is
// far more generous than submission.
export const STATUS_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const STATUS_RATE_LIMIT_MAX = 30;
export const STATUS_RATE_LIMIT_MESSAGE =
  'Too many status checks. Please try again in a few minutes.';

export const APPLICATION_NOT_FOUND_MESSAGE = 'We could not find that application.';
export const INVALID_ID_MESSAGE = 'That application reference is not valid.';
