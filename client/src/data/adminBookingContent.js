/**
 * Every word the bookings overview says — master spec §9.5.
 *
 * No placeholder content: each line is a spec fact or a plain description of
 * what the screen does. The state labels are shared with the client screens and
 * live in `subscriptionStates.js`.
 */

export const LEDGER = Object.freeze({
  heading: 'Who is paired with whom',
  groupLabel: 'Filter pairings by subscription state',
  allCaption: (n) => `${n} ${n === 1 ? 'pairing' : 'pairings'}`,
  // Said out loud, because a number that changes when you type into a search
  // box reads as a bug unless the screen says it follows the search.
  searchCaption: (n) => `${n} ${n === 1 ? 'pairing matches' : 'pairings match'} your search`,
  empty: 'No pairings yet',
})

export const TABLE = Object.freeze({
  caption: 'Client and therapist pairings',
  // The control message: this table is the switchboard, and every action on a
  // pairing is one click away on the client's own screen.
  note: 'Open any row to act on that client — cancel their subscription, deactivate them or send a password reset.',
  searchLabel: 'Search by client or therapist',
  searchPlaceholder: 'Client or therapist name, or client email',
  emptyTitle: 'No pairings yet',
  emptyBody: 'A pairing appears here the moment a client’s first payment is confirmed.',
  filteredEmptyTitle: 'Nothing in this state',
  filteredEmptyBody: 'No pairing is in this state right now.',
})

export const COLUMNS = Object.freeze({
  client: 'Client',
  therapist: 'Therapist',
  status: 'Subscription',
  pairedSince: 'Paired since',
  nextPayment: 'Next payment',
})

export const MARKERS = Object.freeze({
  deactivated: 'Deactivated',
  // A therapist who can no longer sign in, with a client still paying for them —
  // exactly the pairing this screen exists to surface (§9.4: therapist departure).
  therapistDeactivated: 'Deactivated — cannot sign in',
  pairingEnded: 'Pairing ended',
  accessEnds: (date) => `Access ends ${date}`,
  noTherapist: 'No therapist linked',
})
