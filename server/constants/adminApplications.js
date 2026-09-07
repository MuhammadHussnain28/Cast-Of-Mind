// Admin review of therapist applications — master spec §9.2, fields per §23.

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// A search term longer than this is a mistake or an attack, never a name.
export const SEARCH_MAX_LENGTH = 100;

// 'all' is not a stored status — it means "do not filter".
export const STATUS_FILTER_ALL = 'all';

/**
 * What the LIST returns. Deliberately narrow.
 *
 * The list shows who applied and when. It has no use for a home address, a
 * taxpayer id, an education summary or a document URL, and sending them to a
 * browser that will never display them is exposure of an applicant's personal
 * data for no benefit. The detail endpoint returns the rest.
 */
export const LIST_FIELDS = Object.freeze([
  'title',
  'firstName',
  'lastName',
  'email',
  'therapistType',
  'country',
  'yearsExperience',
  'status',
  'submittedAt',
  'reviewedAt',
]);

/**
 * The three viewable documents, and where each one's url and Cloudinary id live.
 *
 * The profile photo is NOT here on purpose: chunk 3.1 uploaded it as a public
 * asset because clients see it on the matching page anyway, so it renders
 * straight from its stored URL and needs no signing.
 */
export const DOCUMENT_FIELDS = Object.freeze({
  certificate1: Object.freeze({
    urlField: 'certificateUrl1',
    publicIdField: 'certificatePublicId1',
    label: 'Certificate 1',
  }),
  certificate2: Object.freeze({
    urlField: 'certificateUrl2',
    publicIdField: 'certificatePublicId2',
    label: 'Certificate 2',
  }),
  license: Object.freeze({
    urlField: 'licenseDocUrl',
    publicIdField: 'licenseDocPublicId',
    label: 'Licence document',
  }),
});

export const DOCUMENT_FIELD_VALUES = Object.freeze(Object.keys(DOCUMENT_FIELDS));

// How long the internal signed URL stays valid. It never reaches the browser —
// this only bounds the window in which the URL our own server generated would
// still work if it were somehow captured.
export const SIGNED_URL_TTL_SECONDS = 300;

/**
 * The only content types we will pass through to the browser.
 *
 * Never echo an upstream Content-Type unchecked. If anything ever served
 * text/html from that path, echoing it would run the attacker's markup on our
 * own origin. These are the four types chunk 3.1 accepts on upload.
 */
export const DELIVERABLE_CONTENT_TYPES = Object.freeze([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

// Approval and rejection — §9.2.
export const REJECTION_REASON_MAX = 1000;

// Approve and reject act only on a PENDING application. A rejected one is final
// and the applicant reapplies; a rejected record is never overwritten, so the
// original decision survives. Approving an already-approved application is
// idempotent instead of an error — see the service.
export const NOT_PENDING_APPROVE_MESSAGE =
  'This application cannot be approved because it was already rejected. The applicant can submit a new application.';
export const NOT_PENDING_REJECT_MESSAGE =
  'This application cannot be rejected because it was already approved. Deactivate the therapist from Therapists instead.';
export const EMAIL_TAKEN_MESSAGE =
  'An account already exists for that email address, so this application cannot be approved.';

export const DOCUMENT_MISSING_MESSAGE = 'That document was not included with this application.';
export const DOCUMENT_UNAVAILABLE_MESSAGE =
  'We could not load that document right now. Please try again in a moment.';
export const APPLICATION_NOT_FOUND_MESSAGE = 'No application found with that reference.';
