/**
 * Validator factory for a multi-select bound to a fixed master list.
 *
 * Checks three things, and the third is the one a naive implementation misses:
 * count, membership of the master list, and NO DUPLICATES. Without the duplicate
 * check, ['Anxiety','Anxiety','Anxiety'] satisfies "3 to 4 tags" while leaving
 * effectively one specialty — quietly broken matching rather than a visible error.
 *
 * Extracted in chunk 5.1. It already existed verbatim in both TherapistApplication
 * and TherapistProfile; clientProfiles would have been a third copy. Shared for the
 * same reason as models/workingHours.js — a duplicated validator drifts once and
 * then silently accepts on one model what another rejects.
 */
export function fixedListValidator({ allowed, min, max, label }) {
  const allowedSet = new Set(allowed);

  return {
    validator(values) {
      if (!Array.isArray(values)) return false;
      if (values.length < min || values.length > max) return false;
      if (new Set(values).size !== values.length) return false;
      return values.every((value) => allowedSet.has(value));
    },
    message: `Select ${min} to ${max} different ${label}, each from the approved list.`,
  };
}

export default fixedListValidator;
