import { v2 as cloudinary } from 'cloudinary';
import env from './env.js';

// Cloudinary client — master spec Section 17.
//
// Files are not written to the server's own disk: hosts restart, redeploy and
// run multiple instances, so anything on local disk can vanish without notice.
//
// Configuration is REQUIRED IN PRODUCTION (checked at startup in config/env.js)
// and optional in development, so someone working on auth is not forced to hold
// Cloudinary credentials. When it is unconfigured the upload endpoint returns a
// clear 503 rather than failing somewhere deeper with a confusing error.

export const isCloudinaryConfigured = Boolean(
  env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret,
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true, // always https URLs
  });
}

export { cloudinary };
export default cloudinary;
