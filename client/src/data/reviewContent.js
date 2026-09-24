/**
 * Every word the review surfaces say — master spec §9.6.
 *
 * No placeholder content. The client-facing lines are TRUE statements about
 * where a rating goes (approved 2026-09-21: the admin sees the client's name,
 * the therapist never sees any of it) — nothing that invites, nudges or thanks
 * more than once. The admin lines carry §9.6's own caveat.
 */

export const RATE = Object.freeze({
  heading: (name) => (name ? `How was your time with ${name}?` : 'How was your time with your therapist?'),
  lead: 'If you would like to, you can rate it. It is entirely up to you, and it helps Cast of Mind look after the service.',
  legend: 'Your rating',
  starLabel: (n) => `${n} of 5`,
  chosen: (n) => `${n} of 5`,
  unchosen: 'Choose from one to five stars.',
  wordsLabel: 'Anything you would like to tell us?',
  wordsHelper: 'Optional. A rating on its own is welcome.',
  // The approved disclosure: the team reads it with your name; your therapist never does.
  privacy: 'Only the Cast of Mind team reads this, with your name. Your therapist never sees your rating or your words.',
  send: 'Send my rating',
  sending: 'Sending',
  failed: 'That did not send. Everything you wrote is still here — please try again.',
  thanksTitle: 'Thank you.',
  thanksBody: 'Your rating went to the Cast of Mind team only. Your therapist never sees it.',
})

export const ADMIN_RATINGS = Object.freeze({
  panelTitle: 'Therapist ratings',
  none: 'No ratings yet',
  noneBody: 'Clients are asked to rate their therapist when a subscription is cancelled or ends.',
  from: (count, written) =>
    `From ${count.toLocaleString('en-GB')} ${count === 1 ? 'rating' : 'ratings'} · ${written.toLocaleString('en-GB')} with written words`,
  // §9.6's caveat, verbatim in substance and visible where the numbers are.
  caveatTitle: 'How to read this',
  caveat:
    'Stars are required and words are optional, so most ratings arrive without context. Read an average as a trend across many clients — never as a verdict on any single rating.',
  highest: 'Highest rated',
  attention: 'Needs attention',
  noneRanked: (min) => `No one is ranked yet — a therapist needs ${min} ratings first.`,
  unranked: (n, min) =>
    n === 0
      ? null
      : `${n} ${n === 1 ? 'therapist has' : 'therapists have'} fewer than ${min} ratings, so ${n === 1 ? 'is' : 'are'} not ranked yet.`,
  recent: 'Recent ratings',
  starsOnly: 'Stars only — no written review.',
  // Therapist detail.
  sectionTitle: 'Ratings',
  sectionNote: 'Admin-only — never shown to the therapist, to clients or publicly',
  distributionLabel: (star) => `${star} ${star === 1 ? 'star' : 'stars'}`,
  everyReview: 'Every review',
  loadEarlier: 'Load earlier reviews',
  loadFailed: 'The reviews could not be loaded.',
  retry: 'Try again',
  unknownClient: 'A former client',
})
