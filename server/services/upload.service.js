import crypto from 'node:crypto';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { AppError } from '../utils/AppError.js';
import { detectFileType } from '../utils/fileSignature.js';
import {
  FILE_TYPES,
  TYPE_LABELS,
  UPLOAD_KINDS,
  UPLOAD_NOT_CONFIGURED_MESSAGE,
} from '../constants/uploads.js';

// Upload business logic — master spec Section 17.
//
// THIS ENDPOINT IS PUBLIC. A therapist applicant has no account yet (Section
// 10.4), so nothing here can be gated behind a token. Everything below assumes
// the caller is a stranger.

/**
 * Cloudinary's SDK is callback-based for uploads. Promisified here so the
 * service reads linearly.
 */
function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error('Cloudinary returned no result.'));
      return resolve(result);
    });

    stream.end(buffer);
  });
}

/**
 * Verify a file and store it on Cloudinary.
 *
 * @param {{ buffer: Buffer, kind: string }} input
 * @returns {Promise<{ url: string, publicId: string, kind: string, format: string, bytes: number, visibility: string }>}
 */
export async function uploadFile({ buffer, kind }) {
  if (!isCloudinaryConfigured) {
    // 503, not 500: the service is correctly built and temporarily unavailable.
    throw new AppError(UPLOAD_NOT_CONFIGURED_MESSAGE, 503, 'UPLOADS_UNAVAILABLE');
  }

  const config = UPLOAD_KINDS[kind];

  if (!config) {
    throw new AppError('Unknown upload type.', 422, 'UPLOAD_REJECTED');
  }

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new AppError('No file was received. Please choose a file and try again.', 400, 'UPLOAD_REJECTED');
  }

  // Per-kind size cap. Multer already enforced the global ceiling; this is the
  // tighter limit for this particular kind (a photo may not be 10 MB).
  if (buffer.length > config.maxBytes) {
    const limitMb = Math.round(config.maxBytes / (1024 * 1024));
    throw new AppError(
      `That ${config.label} is too large. The maximum is ${limitMb} MB.`,
      400,
      'UPLOAD_REJECTED',
    );
  }

  // THE CONTENT CHECK. The filename and the browser-declared MIME type are both
  // written by the sender and are worth nothing on their own — an executable
  // renamed to "certificate.pdf" and sent as application/pdf passes every check
  // that trusts the label. Only the leading bytes are decided by the real format.
  const detectedType = detectFileType(buffer);

  if (!detectedType || !config.allowedTypes.includes(detectedType)) {
    const accepted = config.allowedTypes.map((type) => TYPE_LABELS[type]).join(', ');
    throw new AppError(
      `That file type is not accepted for a ${config.label}. Please upload one of: ${accepted}.`,
      422,
      'UPLOAD_REJECTED',
    );
  }

  // The original filename is discarded. It can carry the applicant's own name
  // (a privacy leak into a URL) or characters that make a messy public id.
  const publicId = crypto.randomBytes(16).toString('hex');

  // 'authenticated' means the plain URL returns nothing — viewing needs a signed
  // request, which slice 4 generates for the admin. 'upload' is public, used for
  // the profile photo, which clients see on the matching page anyway.
  const deliveryType = config.visibility === 'authenticated' ? 'authenticated' : 'upload';

  // PDFs must not be classified as images. 'auto' lets Cloudinary decide, which
  // keeps a scanned JPEG certificate and a PDF certificate in one folder.
  const resourceType = detectedType === FILE_TYPES.PDF ? 'auto' : 'image';

  let result;

  try {
    result = await uploadBuffer(buffer, {
      folder: config.folder,
      public_id: publicId,
      type: deliveryType,
      resource_type: resourceType,
      // We already know the format from the bytes; do not let Cloudinary infer
      // it from anything the sender supplied.
      format: detectedType === FILE_TYPES.PDF ? 'pdf' : undefined,
      overwrite: false,
      invalidate: false,
    });
  } catch (error) {
    // Log our side, return something the applicant can act on. The raw
    // Cloudinary error can contain account details and never goes to the client.
    //
    // The status code is logged alongside the message because the SDK's message
    // alone is often just "Server returned unexpected status code - 403", which
    // hides the real cause. 403 here almost always means the API key is missing
    // the `create` permission rather than anything being wrong with the request.
    const status = error?.http_code ? ` [http ${error.http_code}]` : '';
    console.error(`Cloudinary upload failed${status}:`, error?.message ?? error);
    throw new AppError(
      'We could not store that file. Please try again in a moment.',
      502,
      'UPLOAD_FAILED',
    );
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
    kind,
    format: result.format ?? detectedType,
    bytes: result.bytes ?? buffer.length,
    visibility: config.visibility,
  };
}

export default { uploadFile };
