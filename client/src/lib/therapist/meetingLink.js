// Mirror of the server's meeting-link rule (utils/meetingLink.js), for checking on
// blur. The server still decides; a parity test keeps the two host lists equal.

export const MEETING_LINK_MAX = 2048

export const MEETING_LINK_HOSTS = Object.freeze([
  Object.freeze({ host: 'zoom.us', subdomains: true }),
  Object.freeze({ host: 'zoomgov.com', subdomains: true }),
  Object.freeze({ host: 'meet.google.com', subdomains: false }),
])

const PLATFORM_LABELS = Object.freeze({
  'zoom.us': 'Zoom',
  'zoomgov.com': 'Zoom for Government',
  'meet.google.com': 'Google Meet',
})

function matchHost(hostname) {
  return MEETING_LINK_HOSTS.find(
    ({ host, subdomains }) => hostname === host || (subdomains && hostname.endsWith(`.${host}`)),
  )
}

export function isAllowedMeetingLink(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MEETING_LINK_MAX) {
    return false
  }
  if (/\s/.test(value)) return false

  let url
  try {
    url = new URL(value)
  } catch {
    return false
  }

  if (url.protocol !== 'https:') return false
  if (url.username || url.password || url.port) return false
  if (url.pathname === '/' || url.pathname === '') return false

  return Boolean(matchHost(url.hostname.toLowerCase()))
}

/** "Zoom" or "Google Meet" for a link that passed the check, otherwise null. */
export function meetingPlatform(value) {
  if (!isAllowedMeetingLink(value)) return null
  const match = matchHost(new URL(value).hostname.toLowerCase())
  return match ? PLATFORM_LABELS[match.host] : null
}
