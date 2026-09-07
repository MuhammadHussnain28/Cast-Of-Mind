import { cloudinary } from '../config/cloudinary.js';
import { isOwnCloudinaryUrl } from './cloudinaryUrl.js';
import { SIGNED_URL_TTL_SECONDS } from '../constants/adminApplications.js';

/**
 * Signed, short-lived access to the `authenticated` documents from chunk 3.1.
 *
 * WORTH KNOWING, because it is not what the name suggests: an `authenticated`
 * Cloudinary asset's stored `secure_url` already carries an embedded signature
 * and works for anyone who holds it, for ever. Strip the `s--…--` segment and it
 * returns 401; keep it and it returns the file. Verified against the real asset,
 * 2026-09-04.
 *
 * So the stored URL is itself a permanent credential, and it must never be sent
 * to a browser. The admin's viewer streams bytes through our own server
 * instead — see services/adminApplications.service.js.
 */

/**
 * Reads the resource type and format back out of a stored delivery URL.
 *
 * Cloudinary paths are /<cloud>/<resourceType>/<deliveryType>/…/<publicId>.<ext>
 * and chunk 3.1 did not record either value separately. Both are needed to sign
 * a download URL, and guessing is not safe: a PDF and a scanned JPEG certificate
 * live in the same folder under different resource types.
 */
export function parseDeliveryInfo(storedUrl) {
  if (!isOwnCloudinaryUrl(storedUrl)) return null;

  const { pathname } = new URL(storedUrl);
  const segments = pathname.split('/').filter(Boolean);

  // [cloudName, resourceType, deliveryType, ...rest]
  const resourceType = segments[1];
  if (!resourceType) return null;

  const last = segments[segments.length - 1] ?? '';
  const dot = last.lastIndexOf('.');
  const format = dot > 0 ? last.slice(dot + 1).toLowerCase() : null;

  return { resourceType, format };
}

/**
 * A signed URL our server can fetch, valid for a few minutes.
 *
 * `private_download_url` is used rather than a plain signed delivery URL
 * because it actually expires. It serves the file as an attachment, which does
 * not matter here: we set our own Content-Disposition on the response we send
 * to the browser.
 */
export function signedDocumentUrl({ publicId, resourceType, format }) {
  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS,
  });
}
