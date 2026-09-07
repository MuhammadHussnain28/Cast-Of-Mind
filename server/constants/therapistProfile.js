// The therapist's own profile — master spec §8.7.

/**
 * THE ONLY TWO FIELDS A THERAPIST MAY CHANGE.
 *
 * Everything else on their profile is admin-controlled, and §8.7 gives the
 * reason plainly: matching integrity and client trust depend on specialties and
 * credentials being admin-verified. If a therapist could edit them freely, the
 * verification would mean nothing.
 *
 * This is a hard allowlist enforced SERVER-SIDE. Hiding a field in the UI is
 * not access control — anyone can send whatever body they like.
 *
 * It must never overlap `EDITABLE_PROFILE_FIELDS` in constants/adminTherapists.js:
 * a field editable by both parties, under different rules, is a field whose
 * value nobody owns. A test asserts the two lists are disjoint.
 */
export const THERAPIST_EDITABLE_FIELDS = Object.freeze(['photoUrl', 'bio']);

/**
 * What the therapist's own profile endpoint returns — exactly §8.7's display
 * list, plus the two editable fields.
 *
 * Deliberately absent: the taxpayer id and the street address (not on the
 * display list, and there is no reason to put either back on the wire),
 * the credential documents, and the disciplinary and insurance answers. A
 * therapist needs none of those to read their own profile page.
 */
export const THERAPIST_DISPLAY_FIELDS = Object.freeze([
  'title',
  'firstName',
  'lastName',
  'therapistType',
  'credentialType',
  'credentialInitials',
  'licenseNumber',
  'specialtyTags',
  'treatmentOrientations',
  'languages',
  'country',
  'timezone',
  'workingHours',
  'educationSummary',
  'licensingStatus',
  'yearsExperience',
  'photoUrl',
  'bio',
  'status',
  'createdAt',
]);

export const PROFILE_NOT_FOUND_MESSAGE =
  'We could not find your profile. Please contact support if this persists.';

export const FOREIGN_PHOTO_MESSAGE =
  'That photo could not be used. Please upload it again rather than pasting a link.';

export const NOTHING_TO_UPDATE_MESSAGE = 'No changes were supplied.';

export const BIO_MAX = 1200;
