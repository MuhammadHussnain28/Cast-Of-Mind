// Client questionnaire values — master spec §10.2 and §6.
//
// The concern tags themselves are NOT redeclared here. They are the same fixed
// master list therapists pick from (constants/specialtyTags.js) — that is the
// whole mechanism matching runs on, and a second copy is how the two sides stop
// overlapping.

import { SPECIALTY_TAGS } from './specialtyTags.js';

export const CLIENT_TYPE = Object.freeze({
  INDIVIDUAL: 'individual',
  COUPLE: 'couple',
});

export const CLIENT_TYPE_VALUES = Object.freeze(Object.values(CLIENT_TYPE));

// Same four values the therapist application uses, so one person's gender means
// the same thing everywhere. Recorded only — a client's own gender never affects
// matching (§15).
export const CLIENT_GENDERS = Object.freeze(['male', 'female', 'other', 'prefer_not_to_say']);

// §6: Male / Female / No preference. A SOFT SORT, never a filter — "no_preference"
// means gender is ignored entirely. See §15.
export const THERAPIST_GENDER_PREFERENCE = Object.freeze({
  MALE: 'male',
  FEMALE: 'female',
  NO_PREFERENCE: 'no_preference',
});

export const THERAPIST_GENDER_PREFERENCE_VALUES = Object.freeze(
  Object.values(THERAPIST_GENDER_PREFERENCE),
);

// DEVELOPER-CHOSEN LIST, approved 2026-09-05 — NOT supplied by the client.
// §10.2 types relationshipStatus as a bare String and names no options, so this
// list is mine. Worth Asad confirming before launch. Stored verbatim, so an
// entry must never be reworded or re-cased once real profiles exist.
export const RELATIONSHIP_STATUSES = Object.freeze([
  'Single',
  'In a relationship',
  'Married',
  'Civil partnership',
  'Separated',
  'Divorced',
  'Widowed',
  'Prefer not to say',
]);

// The client-facing name for the same list therapists select from.
export const CONCERN_TAGS = SPECIALTY_TAGS;

// TWO FLOORS, ON PURPOSE — decided 2026-09-05.
//
// The spec disagrees with itself: §10.2's comment says "3-4", §6 says "select
// 3–4 tags (minimum 1)", and this chunk's brief says 1–4. The only reading where
// all three hold is that STORAGE accepts 1 and the SCREEN asks for 3–4. Two
// named numbers rather than one number and a comment, so neither can be read as
// the other.
//
// A client with one tag simply matches fewer therapists, which is safe: zero
// overlap shows every therapist silently (§15), so nobody reaches a dead end.
export const CONCERN_TAGS_MIN = 1; // what the database accepts
export const CONCERN_TAGS_ASK_MIN = 3; // what the questionnaire screen asks for
export const CONCERN_TAGS_MAX = 4;

// Sanity bounds only. Developer's decision 2026-09-05: NO 18+ restriction —
// §10.2 sets no minimum and one was deliberately not invented here.
export const MIN_CLIENT_AGE = 1;
export const MAX_CLIENT_AGE = 120;

export const CLIENT_NAME_MAX = 80;
export const CLIENT_PLACE_MAX = 100;
