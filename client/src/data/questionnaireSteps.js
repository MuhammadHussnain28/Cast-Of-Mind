/**
 * The questionnaire's shape — one question or one tight group per screen (§24.7).
 *
 * The flow BRANCHES on the first answer (§6), so there are two lists rather than
 * one with conditional steps. A couple has one extra screen because each partner
 * gets their own: the alternative is six name/age/gender fields on one screen,
 * which is the wall of fields §24.7 rules out.
 *
 * `fields` is what the step validates and what the progress rail jumps to. The
 * screens themselves arrive in chunks 5.2 (individual), 5.3 (couple) and 5.4
 * (concerns and preference).
 */

export const INDIVIDUAL_STEPS = Object.freeze([
  {
    id: 'type',
    label: 'Who this is for',
    short: 'Start',
    fields: ['type'],
  },
  {
    id: 'about',
    label: 'About you',
    short: 'You',
    fields: ['name', 'age', 'gender'],
  },
  {
    id: 'location',
    label: 'Where you are',
    short: 'Place',
    // Records and session times only. NEVER a matching filter (§15).
    fields: ['country', 'city'],
  },
  {
    id: 'relationship',
    label: 'Relationship status',
    short: 'Status',
    fields: ['relationshipStatus'],
  },
  {
    id: 'concerns',
    label: 'What brings you here',
    short: 'Concerns',
    // The emotional core of the flow (§24.7) and the only answer that decides
    // who you are matched with (§15).
    fields: ['concernTags'],
  },
  {
    id: 'preference',
    label: 'Therapist preference',
    short: 'Preference',
    fields: ['therapistGenderPreference'],
  },
  {
    id: 'contact',
    label: 'Where to reach you',
    short: 'Email',
    fields: ['email'],
  },
]);

export const COUPLE_STEPS = Object.freeze([
  INDIVIDUAL_STEPS[0],
  {
    id: 'partner1',
    label: 'First partner',
    short: 'Partner 1',
    fields: ['partner1'],
  },
  {
    id: 'partner2',
    label: 'Second partner',
    short: 'Partner 2',
    fields: ['partner2'],
  },
  ...INDIVIDUAL_STEPS.slice(2),
]);

export const QUESTIONNAIRE_STEPS = Object.freeze({
  individual: INDIVIDUAL_STEPS,
  couple: COUPLE_STEPS,
});

/**
 * Which list applies. Falls back to the individual flow before the branch
 * question is answered, so step one always has a total to show.
 *
 * The total therefore changes from 7 to 8 the moment someone picks "couple".
 * That is one change, at the one moment it is explicable — the alternative is
 * hiding the total until they answer, which is worse for someone deciding
 * whether they have the energy to start.
 */
export function stepsFor(type) {
  return QUESTIONNAIRE_STEPS[type] ?? INDIVIDUAL_STEPS;
}

// Three options, and "no preference" means gender is ignored entirely (§15).
// A SOFT SORT — it reorders results and must never hide a therapist.
export const THERAPIST_GENDER_PREFERENCES = Object.freeze([
  { value: 'female', label: 'A female therapist' },
  { value: 'male', label: 'A male therapist' },
  { value: 'no_preference', label: 'No preference' },
]);

export const CLIENT_GENDERS = Object.freeze([
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]);

export const CLIENT_TYPES = Object.freeze([
  {
    value: 'individual',
    label: 'Just me',
    blurb: 'One person, one therapist.',
  },
  {
    value: 'couple',
    label: 'My partner and me',
    // §6, confirmed by Asad: one account, one login, shared between them.
    blurb: 'You will share one account and one therapist.',
  },
]);
