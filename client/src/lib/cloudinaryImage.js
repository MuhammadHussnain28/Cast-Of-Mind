// Therapist photos are stored as uploaded — up to 5 MB. Cloudinary can resize
// and re-encode on its CDN from the URL alone (12.4). c_limit never upscales.
const PHOTO_TRANSFORM = 'f_auto,q_auto,c_limit,w_800'
const UPLOAD_SEGMENT = '/image/upload/'

/** Any non-Cloudinary or already-transformed URL is returned unchanged. */
export function optimisedPhoto(url, transform = PHOTO_TRANSFORM) {
  if (typeof url !== 'string') return url
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return url
  }
  if (parsed.hostname !== 'res.cloudinary.com') return url

  const at = parsed.pathname.indexOf(UPLOAD_SEGMENT)
  if (at === -1) return url
  const head = parsed.pathname.slice(0, at + UPLOAD_SEGMENT.length)
  const rest = parsed.pathname.slice(at + UPLOAD_SEGMENT.length)
  // A first segment like `w_400` or `f_auto,q_auto` is already a transformation.
  if (/^[a-z]{1,3}_[^/]*$/.test(rest.split('/')[0])) return url

  parsed.pathname = `${head}${transform}/${rest}`
  return parsed.toString()
}
