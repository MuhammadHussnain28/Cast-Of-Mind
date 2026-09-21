/**
 * How a subscription's state is WORDED and TONED, everywhere the admin sees one.
 *
 * Extracted in chunk 10.2 from the client screens (10.1): the clients list, the
 * client detail and the bookings overview all show the same five states, and
 * three copies is how one screen ends up saying "Past due" while another says
 * "Payment failed" about the same row.
 */

export const SUBSCRIPTION_STATES = Object.freeze({
  active: { label: 'Active', tone: 'success' },
  // Clay, because this is the one state that is an action item: a card has
  // failed and there is a ~3-day grace period running (§13).
  past_due: { label: 'Payment failed', tone: 'danger' },
  // Gold, not clay. A client who cancelled has not done anything wrong, and
  // they still have access until the period they paid for runs out.
  cancelled: { label: 'Cancelled', tone: 'accent' },
  expired: { label: 'Ended', tone: 'neutral' },
  none: { label: 'No subscription', tone: 'danger' },
})

export const subscriptionState = (status) =>
  SUBSCRIPTION_STATES[status] ?? SUBSCRIPTION_STATES.none

/** The filter buckets, in lifecycle order — the same order the server sorts by. */
export const STATUS_FILTERS = Object.freeze([
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'past_due', label: 'Payment failed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'expired', label: 'Ended' },
  // Only ever offered when the count is above zero — a permanent filter for a
  // broken state that does not exist reads as though it is expected to.
  { key: 'none', label: 'No subscription', onlyWhenPresent: true },
])
