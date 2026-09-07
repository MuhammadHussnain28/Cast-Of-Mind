import { TherapistApplication } from '../models/TherapistApplication.js';
import { AppError } from '../utils/AppError.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { containsIgnoringCase, nameClauses } from '../utils/search.js';
import { parseDeliveryInfo, signedDocumentUrl } from '../utils/cloudinaryDelivery.js';
import {
  APPLICATION_NOT_FOUND_MESSAGE,
  DELIVERABLE_CONTENT_TYPES,
  DOCUMENT_FIELDS,
  DOCUMENT_MISSING_MESSAGE,
  DOCUMENT_UNAVAILABLE_MESSAGE,
  LIST_FIELDS,
  STATUS_FILTER_ALL,
} from '../constants/adminApplications.js';
import { UPLOAD_NOT_CONFIGURED_MESSAGE } from '../constants/uploads.js';

/**
 * Name and email search. The escaping and the two-word name handling live in
 * utils/search.js, shared with the therapist list.
 */
function buildSearchFilter(q) {
  if (!q) return null;
  return { $or: [...nameClauses(q), { email: containsIgnoringCase(q) }] };
}

/**
 * Paginated list for the review screen.
 *
 * The status counts travel with the results so the pending badge and the filter
 * chips come from this one request rather than three more.
 */
export async function listApplications({ status, q, page, limit }) {
  const filter = {};
  if (status !== STATUS_FILTER_ALL) filter.status = status;

  const search = buildSearchFilter(q);
  if (search) Object.assign(filter, search);

  const skip = (page - 1) * limit;

  const [data, total, grouped] = await Promise.all([
    TherapistApplication.find(filter)
      .select(LIST_FIELDS.join(' '))
      // Newest first, per the chunk brief. The { status: 1, submittedAt: -1 }
      // index from chunk 3.1 serves the filtered case directly.
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TherapistApplication.countDocuments(filter),
    // Counts are over ALL applications, not the current filter — a badge that
    // changed when you clicked a chip would be reporting the chip, not the work.
    TherapistApplication.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const counts = { pending: 0, approved: 0, rejected: 0 };
  for (const row of grouped) {
    if (row._id in counts) counts[row._id] = row.count;
  }

  return {
    data,
    meta: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      counts,
    },
  };
}

/**
 * Which documents this application actually carries.
 *
 * METADATA ONLY — never the stored URL. An `authenticated` asset's stored URL
 * carries a permanent embedded signature and works for anyone who holds it, so
 * returning it here would hand the browser unrevocable access to a stranger's
 * credentials and make the streaming route pointless.
 */
function documentSummary(application) {
  return Object.entries(DOCUMENT_FIELDS).map(([field, config]) => {
    const url = application[config.urlField];
    const publicId = application[config.publicIdField];
    const info = url ? parseDeliveryInfo(url) : null;

    return {
      field,
      label: config.label,
      present: Boolean(url && publicId),
      format: info?.format ?? null,
    };
  });
}

export async function getApplication(id) {
  const application = await TherapistApplication.findById(id)
    .select('-passwordHash')
    .lean();

  if (!application) {
    throw new AppError(APPLICATION_NOT_FOUND_MESSAGE, 404, 'APPLICATION_NOT_FOUND');
  }

  const documents = documentSummary(application);

  // The raw document URLs are removed from the payload for the reason above.
  // The profile photo stays: chunk 3.1 uploaded it as a public asset.
  for (const config of Object.values(DOCUMENT_FIELDS)) {
    delete application[config.urlField];
    delete application[config.publicIdField];
  }

  return { ...application, documents };
}

/**
 * Fetches one document from Cloudinary so the controller can stream it.
 *
 * The bytes pass through our server on purpose. A redirect would hand the
 * browser a Cloudinary URL that outlives the admin's session and cannot be
 * revoked; this way nothing leaves our origin, and every view is recorded by
 * the admin action log from chunk 4.1.
 */
export async function fetchApplicationDocument(id, field) {
  const config = DOCUMENT_FIELDS[field];

  const application = await TherapistApplication.findById(id)
    .select(`${config.urlField} ${config.publicIdField}`)
    .lean();

  if (!application) {
    throw new AppError(APPLICATION_NOT_FOUND_MESSAGE, 404, 'APPLICATION_NOT_FOUND');
  }

  const url = application[config.urlField];
  const publicId = application[config.publicIdField];

  if (!url || !publicId) {
    throw new AppError(DOCUMENT_MISSING_MESSAGE, 404, 'DOCUMENT_MISSING');
  }

  if (!isCloudinaryConfigured) {
    throw new AppError(UPLOAD_NOT_CONFIGURED_MESSAGE, 503, 'UPLOADS_NOT_CONFIGURED');
  }

  const info = parseDeliveryInfo(url);
  if (!info) {
    // The URL was validated on submission, so this means the record was edited
    // outside the application. Refuse rather than fetch something unknown.
    throw new AppError(DOCUMENT_UNAVAILABLE_MESSAGE, 502, 'DOCUMENT_UNAVAILABLE');
  }

  let upstream;
  try {
    upstream = await fetch(
      signedDocumentUrl({ publicId, resourceType: info.resourceType, format: info.format }),
    );
  } catch (error) {
    console.error('Cloudinary document fetch failed:', error?.message ?? error);
    throw new AppError(DOCUMENT_UNAVAILABLE_MESSAGE, 502, 'DOCUMENT_UNAVAILABLE');
  }

  if (!upstream.ok) {
    console.error(`Cloudinary document fetch failed [http ${upstream.status}]`);
    throw new AppError(DOCUMENT_UNAVAILABLE_MESSAGE, 502, 'DOCUMENT_UNAVAILABLE');
  }

  // Never echo an upstream content type unchecked. If that path ever served
  // text/html, passing it through would run someone else's markup on our origin.
  const upstreamType = (upstream.headers.get('content-type') ?? '').split(';')[0].trim();
  const contentType = DELIVERABLE_CONTENT_TYPES.includes(upstreamType)
    ? upstreamType
    : 'application/octet-stream';

  return {
    body: upstream.body,
    contentType,
    contentLength: upstream.headers.get('content-length'),
    // Named for the reviewer, not after the stored id — and it deliberately
    // carries no part of the applicant's name.
    filename: `${field}.${info.format ?? 'bin'}`,
  };
}
