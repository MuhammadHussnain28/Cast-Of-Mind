// Upload settings — master spec Section 17 (File Storage).
//
// POST /api/v1/uploads is PUBLIC and UNAUTHENTICATED, because a therapist
// applicant is not a user yet (Section 10.4) and cannot hold a token. Every
// limit in this file exists because of that: a stranger can call this endpoint.

// File signatures we accept, keyed by the canonical type name that
// utils/fileSignature.js returns after sniffing the actual bytes.
export const FILE_TYPES = Object.freeze({
  JPEG: 'jpeg',
  PNG: 'png',
  WEBP: 'webp',
  PDF: 'pdf',
});

const IMAGE_TYPES = Object.freeze([FILE_TYPES.JPEG, FILE_TYPES.PNG, FILE_TYPES.WEBP]);
const DOCUMENT_TYPES = Object.freeze([...IMAGE_TYPES, FILE_TYPES.PDF]);

const MB = 1024 * 1024;

// The three upload kinds, one per field group on the application form.
//
// `visibility` is the Decision B split, approved 2026-09-02:
//   public        — Cloudinary type 'upload'. Readable by anyone holding the URL.
//   authenticated — Cloudinary type 'authenticated'. The raw URL returns nothing;
//                   viewing needs a signed request, generated in slice 4 when the
//                   admin opens an application.
//
// Credentials and licence documents are a real person's professional papers and
// sometimes personal ID. A Cloudinary URL is unguessable but not secret, and once
// leaked it is public for ever. The profile photo is public because clients see
// it on the matching page anyway.
export const UPLOAD_KINDS = Object.freeze({
  photo: Object.freeze({
    folder: 'cast-of-mind/therapist-photos',
    allowedTypes: IMAGE_TYPES,
    maxBytes: 5 * MB,
    visibility: 'public',
    label: 'profile photo',
  }),
  certificate: Object.freeze({
    folder: 'cast-of-mind/certificates',
    allowedTypes: DOCUMENT_TYPES,
    maxBytes: 10 * MB,
    visibility: 'authenticated',
    label: 'certificate',
  }),
  license: Object.freeze({
    folder: 'cast-of-mind/licenses',
    allowedTypes: DOCUMENT_TYPES,
    maxBytes: 10 * MB,
    visibility: 'authenticated',
    label: 'licence document',
  }),
});

export const UPLOAD_KIND_VALUES = Object.freeze(Object.keys(UPLOAD_KINDS));

// Multer's own ceiling, applied before we ever see the buffer. Set to the
// largest per-kind cap; the exact per-kind limit is enforced afterwards, once
// we know which kind was requested.
export const MAX_UPLOAD_BYTES = Math.max(
  ...Object.values(UPLOAD_KINDS).map((kind) => kind.maxBytes),
);

// The multipart field name carrying the file.
export const UPLOAD_FIELD_NAME = 'file';

// Human-readable type names for error messages, so a rejection says what would
// have worked instead of only what failed.
export const TYPE_LABELS = Object.freeze({
  [FILE_TYPES.JPEG]: 'JPEG',
  [FILE_TYPES.PNG]: 'PNG',
  [FILE_TYPES.WEBP]: 'WebP',
  [FILE_TYPES.PDF]: 'PDF',
});

// A legitimate application needs at most four uploads: photo, two certificates,
// one licence. Ten an hour leaves room for retries and a corrected file without
// leaving the storage quota open to a stranger.
export const UPLOAD_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const UPLOAD_RATE_LIMIT_MAX = 10;
export const UPLOAD_RATE_LIMIT_MESSAGE =
  'Too many uploads from this connection. Please try again in a little while.';

export const UPLOAD_NOT_CONFIGURED_MESSAGE =
  'File uploads are not available right now. Please try again shortly.';
