import { MEETING_LINK_HOSTS, MEETING_LINK_MAX } from '../constants/sessions.js';

// The session link a client will click. Checked on the PARSED host, so tricks
// like `https://zoom.us@evil.example` or `zoom.us.evil.example` are refused.

function hostAllowed(hostname) {
  return MEETING_LINK_HOSTS.some(
    ({ host, subdomains }) => hostname === host || (subdomains && hostname.endsWith(`.${host}`)),
  );
}

export function isAllowedMeetingLink(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MEETING_LINK_MAX) {
    return false;
  }
  if (/\s/.test(value)) return false;

  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') return false;
  if (url.username || url.password || url.port) return false;
  // A bare host is not a meeting.
  if (url.pathname === '/' || url.pathname === '') return false;

  return hostAllowed(url.hostname.toLowerCase());
}

export default isAllowedMeetingLink;
