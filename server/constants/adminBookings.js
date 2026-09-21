// Bookings and subscriptions overview — master spec §9.5.
//
// The operational "who is paired with whom right now" view. It reads bookings,
// profiles and subscriptions only. NOTHING HERE READS `messages`, `journals` OR
// `privateNotes` — §11, and routes/privateNotes.test.js walks the admin
// router's import graph to prove it.
//
// DELIBERATELY NOT A SECOND DASHBOARD. No money figure, no month comparison, no
// trend: the dashboard (4.4) owns those. The per-status counts here describe the
// table the admin is looking at, scoped to their search, not the business.

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
export const SEARCH_MAX_LENGTH = 100;

/**
 * THE SORT ALLOWLIST.
 *
 * A key from the query string never reaches `$sort` directly — it is looked up
 * here, and anything not named is refused by the schema. Sorting on an
 * arbitrary field name would let a caller order by, and so probe, fields this
 * endpoint never returns.
 */
export const SORT_KEYS = Object.freeze({
  CLIENT: 'client',
  THERAPIST: 'therapist',
  STATUS: 'status',
  PAIRED_SINCE: 'pairedSince',
  NEXT_PAYMENT: 'nextPayment',
});

export const SORT_KEY_VALUES = Object.freeze(Object.values(SORT_KEYS));

export const SORT_DIRECTIONS = Object.freeze(['asc', 'desc']);

// Newest pairings first — the ones most likely to need a look.
export const DEFAULT_SORT = SORT_KEYS.PAIRED_SINCE;
export const DEFAULT_DIRECTION = 'desc';

/**
 * Status in LIFECYCLE order, not alphabetical.
 *
 * Alphabetical would put "cancelled" before "active" and "past_due" after
 * "expired", which is an order nobody thinks in. Ascending walks a
 * subscription's life; descending surfaces the ended and the broken first.
 */
export const STATUS_RANK = Object.freeze({
  active: 1,
  past_due: 2,
  cancelled: 3,
  expired: 4,
  none: 5,
});
