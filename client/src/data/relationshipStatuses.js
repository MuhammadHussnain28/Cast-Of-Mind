/**
 * Relationship statuses — the fixed dropdown list.
 *
 * MIRROR OF server/constants/clientProfile.js, byte for byte. Same reasoning as
 * the specialty tags (see data/specialtyTags.js): a copy rather than an endpoint,
 * kept honest by server/test/constantsParity.test.js, which fails the build if
 * the two files stop matching.
 *
 * DEVELOPER-CHOSEN LIST, approved 2026-09-05 — not supplied by the client.
 * §10.2 types this as a bare String and names no options. Worth Asad confirming
 * before launch. Values are stored verbatim, so never reword or re-case one once
 * real profiles exist.
 */
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
