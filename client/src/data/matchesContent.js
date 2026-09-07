/**
 * Copy for the results and therapist detail pages.
 *
 * NOTHING HERE SCORES OR RANKS ANYONE. There is no "best match", no "matches 3
 * of your concerns", no count and no badge — deliberately. On the silent
 * fallback path (§15) nothing overlaps, so any match-strength display would
 * show zero on every card, and the grid itself would become the "no exact
 * match found" message the client explicitly rejected.
 */

export const DAY_KEYS = Object.freeze([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

export const DAY_LABELS = Object.freeze([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
])

/** Matches what `Intl` returns for `weekday: 'short'` in en-US. */
export const DAY_SHORT = Object.freeze(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])

export const matches = {
  heading: 'Therapists you can work with',
  // No count, no "we found N for you" — that phrasing turns into an
  // uncomfortable sentence when the fallback returns everyone.
  intro:
    'Take your time. Read a few profiles, and choose the person you would find it easiest to talk to.',
  viewProfile: 'View profile',
  loading: 'Finding therapists',
  languagesLabel: 'Speaks',

  errorHeading: 'We could not load therapists just now',
  errorBody: 'This is usually a connection problem rather than anything you did.',
  retry: 'Try again',

  // NOT the no-match fallback — that returns everyone silently. This is the
  // genuinely empty roster, which is a different and much rarer thing.
  emptyHeading: 'No therapists are available right now',
  emptyBody:
    'This is unusual and it is on our side, not yours. Please try again shortly, or contact us and we will help.',

  noAnswersHeading: 'Let us ask a few questions first',
  noAnswersBody: 'We need to know what you are looking for before we can show you anyone.',
  noAnswersCta: 'Start the questionnaire',
}

export const detail = {
  back: 'Back to therapists',
  about: 'About',
  specialties: 'What they work with',
  // §23 and §15: orientation is METHOD, specialty is PROBLEM. The distinction
  // is stated because a client seeing two chip lists would otherwise assume
  // both decide their match, and only one does.
  approach: 'How they work',
  approachNote:
    'Their methods and training. These describe how a therapist works, not what they treat — they play no part in matching.',
  specialtiesNote: 'These are the areas they work with, and the only thing matching uses.',
  languages: 'Languages',
  credentials: 'Credentials',
  experience: 'Years in practice',
  basedIn: 'Based in',
  hours: 'When they work',
  hoursTheirs: 'Their time',
  hoursYours: 'Your time',
  hoursClosed: '—',
  hoursNote:
    'Times shift by an hour when either country changes its clocks, so treat these as close rather than exact.',
  hoursNone: 'They have not listed regular hours. You can ask them directly once you are matched.',
  crossesDay: 'This runs into another day in your time zone.',

  choose: 'Choose this therapist',
  chooseNote: 'Nothing is charged yet — you will see the price before anything is confirmed.',
  chosen: 'Chosen',
  notFoundHeading: 'We could not find that therapist',
  notFoundBody:
    'They may no longer be taking new clients. The others are still here.',
  notFoundCta: 'Back to therapists',
  // 5.7 / slice 6 wires the checkout; until then the CTA records the choice.
  nextStepPending: 'Checkout is built in slice 6 — your choice is saved until then.',
}
