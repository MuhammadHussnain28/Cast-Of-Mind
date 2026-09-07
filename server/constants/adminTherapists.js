// Admin therapist management — master spec §9.3.

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const SEARCH_MAX_LENGTH = 100;
export const STATUS_FILTER_ALL = 'all';

/**
 * THE ONLY FIELDS THE ADMIN MAY CHANGE — §8.7 and §9.3.
 *
 * These are locked out of the therapist's own profile on purpose: matching
 * integrity and client trust depend on specialties and credentials being
 * admin-verified, and a therapist who could edit them freely would make the
 * verification meaningless.
 *
 * The list is a hard allowlist, not a starting point. Anything not named here
 * is REFUSED rather than quietly dropped — a bio silently ignored is worse than
 * a bio rejected, because the admin believes it saved.
 *
 * Deliberately absent: bio and photo (the therapist's own to edit, §8.7),
 * working hours and languages (their availability, not a credential), education
 * summary and current work situation (their own account of their career —
 * correcting a licence number is a different act from rewriting someone's
 * professional history), and the password, which nobody can set (§11).
 */
export const EDITABLE_PROFILE_FIELDS = Object.freeze([
  'title',
  'firstName',
  'lastName',
  'therapistType',
  'credentialType',
  'credentialInitials',
  'licenseNumber',
  'specialtyTags',
]);

// Lives on `users`, not the profile — which is why an edit touching it has to
// be a transaction across two collections.
export const EDITABLE_USER_FIELDS = Object.freeze(['email']);

export const THERAPIST_NOT_FOUND_MESSAGE = 'No therapist found with that reference.';
export const EMAIL_TAKEN_MESSAGE =
  'Another account already uses that email address, so it cannot be assigned here.';
export const NOTHING_TO_UPDATE_MESSAGE = 'No changes were supplied.';
export const RESET_SENT_MESSAGE =
  'A password reset link has been emailed to this therapist. You cannot see or choose their password — nobody can.';
// The public forgot-password endpoint stays silent about deactivated accounts
// because saying anything leaks whether an address exists. Here the admin
// already knows the account exists, so silence would just be confusing.
export const RESET_SKIPPED_INACTIVE_MESSAGE =
  'No email was sent: this therapist is deactivated, so a reset would not let them back in. Reactivate them first.';

export const REVIEWS_LIMIT = 20;
