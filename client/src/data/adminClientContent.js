/**
 * Every word the admin's client screens say — master spec §9.4.
 *
 * In one file so the list, the detail header and the confirmation dialogs
 * cannot word the same state three different ways. No placeholder content: each
 * line is a spec fact or a plain description of what a control does.
 */

// The state labels and tones live in `data/subscriptionStates.js`, shared with
// the bookings overview (10.2).

/** What the gate would answer, said in words on the header. */
export const ACCESS_LINES = Object.freeze({
  active: 'Full access to their portal.',
  past_due: 'Still has access — §13 gives a short grace period after a failed payment, not a lockout.',
  ending: 'Cancelled, and keeps full access until the period they have paid for runs out.',
  ended: 'No portal access. Their chat, journal and worksheets are all kept.',
})

export const LIST = Object.freeze({
  note: 'Clients are created by a successful payment — there is no other way in.',
  searchLabel: 'Search clients by name or email',
  searchPlaceholder: 'Search by name or email',
  emptyTitle: 'No clients yet',
  emptyBody: 'A client appears here the moment their first payment is confirmed.',
  filteredEmptyBody: 'Nothing in this state right now.',
})

export const DETAIL = Object.freeze({
  back: 'Back to clients',
  intake: 'What they told us',
  intakeNote: 'Their own answers from the questionnaire — nothing here is editable',
  concerns: 'What they came for',
  concernsNote: 'The tags that decided their match',
  partners: 'Both partners',
  partnersNote: 'One account, two people (§6)',
  therapist: 'Their therapist',
  subscription: 'Subscription',
  history: 'Earlier subscriptions',
  historyEmpty: 'This is their first subscription.',
  noSubscription: 'No subscription record at all. That should not be possible — the payment transaction creates one — so it is worth investigating in Stripe before doing anything here.',
  noTherapist: 'No therapist is linked to this client.',
  stripeRef: 'Stripe reference',
  stripeRefNote: 'For finding this subscription in your Stripe dashboard',
  loading: 'Loading the client',
  notFound: 'Client not found',
})

export const ACTIONS = Object.freeze({
  heading: 'Account',
  reset: 'Send a password reset',
  deactivate: 'Deactivate',
  reactivate: 'Reactivate',
  cancel: 'Cancel subscription',

  resetTitle: (name) => `Send ${name} a password reset?`,
  resetBody:
    'They receive the same link as the Forgot password flow and choose a new password themselves. You cannot see or set their password — nobody can, because it is stored only as a one-way hash.',
  resetConfirm: 'Send the reset link',

  deactivateTitle: (name) => `Deactivate ${name}?`,
  deactivateBody: 'They will not be able to sign in. Everything they have written is kept.',
  // The trap worth naming out loud: the login and the billing are separate
  // things, and deactivating only touches the first.
  deactivateWarning:
    'This does not stop the billing. Their card is still charged €250 a month until the subscription is cancelled as well.',
  reactivateTitle: (name) => `Reactivate ${name}?`,
  reactivateBody: 'They will be able to sign in again, and pick up exactly where they left off.',

  cancelTitle: (name) => `Cancel ${name}'s subscription?`,
  cancelBody:
    'Stripe is told to stop at the end of the period they have already paid for. No further payment is taken.',
  cancelKeepsAccess: (date) =>
    `They keep full access until ${date}, then their portal is replaced by the re-subscribe screen. Their chat, journal, worksheets and therapist match are all kept.`,
  cancelKeepsAccessUnknown:
    'They keep full access until the end of the period they have already paid for.',
  cancelIrreversible:
    'You cannot undo this here. If they want to continue, they re-subscribe and a new subscription starts.',
  cancelConfirm: 'Cancel the subscription',
  keep: 'Keep it running',
})
