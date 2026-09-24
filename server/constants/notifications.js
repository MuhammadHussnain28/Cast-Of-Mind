// Notifications — master spec §8.8 and §10.13.
//
// THE POINT IS CROSS-CLIENT AWARENESS, NOT A SECOND UNREAD BADGE. §8.8: a
// therapist reading Client A needs to know Client B wrote, without checking
// every client by hand. The per-client counts in the sidebar (7.6, 8.1) already
// answer "how many from this person" — these answer "something happened
// somewhere else".
//
// NOTHING HERE CARRIES CONTENT. No message text, no worksheet title. A panel
// that sits open in a rail is over a shoulder, in a screen share and in a
// screenshot of something else — 8.1's rule, and the reason it exists.

export const NOTIFICATION_TYPE = Object.freeze({
  NEW_MESSAGE: 'new_message',
  WORKSHEET_SUBMITTED: 'worksheet_submitted',
  NEW_CLIENT: 'new_client',
});

export const NOTIFICATION_TYPE_VALUES = Object.freeze(Object.values(NOTIFICATION_TYPE));

/**
 * RETENTION: 60 DAYS FROM THE LAST EVENT, by a TTL index — approved 2026-09-23.
 *
 * The brief asks for a cleanup job; a TTL index is the same thing without a
 * scheduler to run, monitor or forget. It is safe here for the reason it was
 * unsafe in 1.3: THE WHOLE DOCUMENT IS THE DISPOSABLE THING. A TTL on
 * `users.refreshTokenExpiresAt` would have deleted entire accounts, because the
 * field lived on a record that had to survive. A notification is nothing but
 * the alert, so deleting all of it is precisely the intent.
 *
 * It expires from `lastAt`, not `createdAt`: a group still being added to is
 * still live, and should not vanish because its first event was two months ago.
 */
export const RETENTION_DAYS = 60;
export const RETENTION_SECONDS = RETENTION_DAYS * 24 * 60 * 60;

export const DEFAULT_PAGE_SIZE = 15;
export const MAX_PAGE_SIZE = 50;

// What the panel shows before "See all" — enough to answer "anything else?"
export const PANEL_LIMIT = 8;

export const NOT_FOUND_MESSAGE = 'No notification found with that reference.';

// A therapist reading their own bell. Generous: the provider fetches on mount
// and on every reconnect.
export const NOTIFICATION_RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests. Please try again in a few minutes.',
});
