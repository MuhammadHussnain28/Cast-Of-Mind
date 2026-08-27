// Treatment orientations — the fixed master list. 33 items, confirmed by Asad.
// Source of truth: master spec Section 23, and docs/ongoing.md decision #3.
//
// DISPLAY ONLY. These NEVER affect matching — that is specialty tags alone
// (master spec Section 15, "Critical Rules"). A specialty is WHAT a therapist
// treats; an orientation is HOW they treat it. Two therapists may both treat
// anxiety while working in entirely different ways.
//
// Values are stored in the database verbatim as written here — same rule as
// specialtyTags.js: do not reword or re-case an entry.
//
// Note on spelling: "Career Counseling" here is the American single-L spelling,
// while specialtyTags.js has "Career Counselling" with a double L. Both are
// verbatim from the spec. This is not a typo — do not "fix" either one.
//
// Cleaned from an original 37-item list; 4 entries removed as data-entry errors
// or duplicates ("Emotionally", "Psychoanalytic", "Couples Counseling",
// "Coaching"). Two stale "37-item" references elsewhere were corrected to 33.
// "Christian Counseling" and "Religious Counseling" are BOTH retained
// deliberately — they are different offerings, not a duplicate.

export const TREATMENT_ORIENTATIONS = Object.freeze([
  'ACT',
  'Art Therapy',
  'Behavioral Therapy',
  'CAT',
  'CBT',
  'Career Counseling',
  'Christian Counseling',
  'Cognitive Therapy',
  'Couples Therapy',
  'DBT',
  'Drama Therapy',
  'EMDR',
  'Emotionally Focused',
  'Existential Therapy',
  'Family Therapy',
  'Gestalt Therapy',
  'Group Therapy',
  'Human Givens Psychotherapy',
  'Humanistic Therapy',
  'Hypnotherapy',
  'Individual Therapy',
  'Intervention',
  'Jungian Therapy',
  'Life Coaching',
  'Mindfulness',
  'Music Therapy',
  'Play Therapy',
  'Psychoanalytic Therapy',
  'Psychodynamic Therapy',
  'Religious Counseling',
  'Transactional Analysis',
  'Transpersonal Psychology',
  'Trauma Focused',
]);

// Therapists select 1-5 — master spec Section 23, Step 4.
export const TREATMENT_ORIENTATIONS_MIN = 1;
export const TREATMENT_ORIENTATIONS_MAX = 5;
