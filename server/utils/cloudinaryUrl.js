import env from '../config/env.js';

// Guard for the file URLs submitted with a therapist application.
//
// WHY THIS EXISTS: chunk 3.1 uploads a file and hands the browser back a URL.
// The application form then submits that URL as ordinary text. Nothing stops
// someone posting `photoUrl: "http://evil.example/tracker.jpg"` instead — and
// the admin portal would faithfully load it when reviewing the application,
// leaking the admin's IP at best and rendering hostile content at worst.
//
// So a submitted URL is only accepted if it actually points at our own
// Cloudinary account.

const CLOUDINARY_HOST = 'res.cloudinary.com';

/**
 * True when the value is an https URL served from our Cloudinary account.
 *
 * When no cloud name is configured (allowed in development), the host check
 * still applies — it just cannot pin the URL to one specific account.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isOwnCloudinaryUrl(value) {
  if (typeof value !== 'string' || value.length === 0) return false;

  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  // https only — an http URL would be downgraded and is never what we issued.
  if (url.protocol !== 'https:') return false;
  if (url.hostname !== CLOUDINARY_HOST) return false;

  // Cloudinary paths start with the cloud name: /<cloud>/image/upload/...
  // Pinning to our own cloud stops a URL from somebody else's account.
  if (env.cloudinaryCloudName) {
    return url.pathname.startsWith(`/${env.cloudinaryCloudName}/`);
  }

  return true;
}

export default isOwnCloudinaryUrl;
