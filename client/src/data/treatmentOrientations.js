/**
 * Treatment orientations — the fixed master list. DISPLAY ONLY, never matching.
 *
 * MIRROR OF server/constants/treatmentOrientations.js — 33 items, byte for byte.
 *
 * Copied rather than fetched: the list is client-fixed and will never change,
 * so an endpoint would add a round trip, a loading state and an error state to
 * every render for no benefit. The real risk is DRIFT, and that is covered by
 * server/test/constantsParity.test.js, which fails the build if these two
 * files stop matching.
 *
 * Values are stored in the database verbatim. Never reword, re-case or
 * re-punctuate an entry — existing documents hold the old string and would
 * silently stop matching.
 */

export const TREATMENT_ORIENTATIONS = Object.freeze([
  "ACT",
  "Art Therapy",
  "Behavioral Therapy",
  "CAT",
  "CBT",
  "Career Counseling",
  "Christian Counseling",
  "Cognitive Therapy",
  "Couples Therapy",
  "DBT",
  "Drama Therapy",
  "EMDR",
  "Emotionally Focused",
  "Existential Therapy",
  "Family Therapy",
  "Gestalt Therapy",
  "Group Therapy",
  "Human Givens Psychotherapy",
  "Humanistic Therapy",
  "Hypnotherapy",
  "Individual Therapy",
  "Intervention",
  "Jungian Therapy",
  "Life Coaching",
  "Mindfulness",
  "Music Therapy",
  "Play Therapy",
  "Psychoanalytic Therapy",
  "Psychodynamic Therapy",
  "Religious Counseling",
  "Transactional Analysis",
  "Transpersonal Psychology",
  "Trauma Focused",
])

export const TREATMENT_ORIENTATIONS_MIN = 1
export const TREATMENT_ORIENTATIONS_MAX = 5
