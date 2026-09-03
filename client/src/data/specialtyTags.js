/**
 * Concern / specialty tags — the fixed master list. THIS DRIVES MATCHING.
 *
 * MIRROR OF server/constants/specialtyTags.js — 27 items, byte for byte.
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

export const SPECIALTY_TAGS = Object.freeze([
  "Anger Management",
  "Anxiety",
  "Career Counselling",
  "Depression",
  "Family Issues",
  "Social Anxiety",
  "Stress",
  "Panic Attacks",
  "Procrastination",
  "Sleep Issues or Insomnia",
  "Self Esteem",
  "Relationship Issues",
  "Trauma and/or Abuse",
  "Parenting",
  "Weight Loss",
  "Addictions",
  "ADHD & Attention Issues",
  "Alzheimer's",
  "Autism",
  "Children & Teens",
  "Divorce",
  "Domestic Violence",
  "Eating & Food Disorders",
  "Grief",
  "Marriage Issues",
  "Phobias",
  "Speech Anxiety",
])

export const SPECIALTY_TAGS_MIN = 3
export const SPECIALTY_TAGS_MAX = 4
