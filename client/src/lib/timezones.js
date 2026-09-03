/**
 * IANA timezones and ISO country names, both derived at runtime rather than
 * hand-written. A typed list of 400 zones or 195 countries goes stale and is a
 * standing source of typos.
 */

// Zones the platform is unlikely to need, and which clutter the list.
const EXCLUDED_PREFIXES = ['Etc/', 'SystemV/', 'US/', 'Canada/', 'Mexico/', 'Brazil/', 'Chile/']

const FALLBACK_ZONES = [
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Africa/Lagos', 'Africa/Johannesburg', 'UTC',
]

/** The applicant's own zone, used as the starting value. */
export function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {
    return ''
  }
}

/**
 * Zones grouped by region, so a 400-item native select stays scannable.
 * Returns [{ region, zones: [{ value, label }] }].
 */
export function groupedTimezones() {
  let zones
  try {
    zones = Intl.supportedValuesOf('timeZone')
  } catch {
    zones = FALLBACK_ZONES
  }

  const groups = new Map()

  for (const zone of zones) {
    if (EXCLUDED_PREFIXES.some((p) => zone.startsWith(p))) continue

    const [region, ...rest] = zone.split('/')
    if (rest.length === 0) continue

    const label = `${rest.join(' / ').replace(/_/g, ' ')}${offsetSuffix(zone)}`
    if (!groups.has(region)) groups.set(region, [])
    groups.get(region).push({ value: zone, label })
  }

  return [...groups.entries()]
    .map(([region, list]) => ({
      region: region.replace(/_/g, ' '),
      zones: list.sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.region.localeCompare(b.region))
}

/** " (UTC+05:00)" — shown so a therapist can confirm they picked the right one. */
function offsetSuffix(timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      timeZoneName: 'longOffset',
    }).formatToParts(new Date())

    const name = parts.find((p) => p.type === 'timeZoneName')?.value
    return name ? ` (${name})` : ''
  } catch {
    return ''
  }
}

// ISO 3166-1 alpha-2. Only the codes are stored; the display names come from
// Intl.DisplayNames, so spellings stay current and correctly localised.
const COUNTRY_CODES =
  'AD AE AF AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW'.split(
    ' ',
  )

/** [{ value, label }] sorted by display name. */
export function countryOptions(locale = 'en') {
  let display
  try {
    display = new Intl.DisplayNames([locale], { type: 'region' })
  } catch {
    display = null
  }

  return COUNTRY_CODES.map((code) => ({
    value: display?.of(code) ?? code,
    label: display?.of(code) ?? code,
  })).sort((a, b) => a.label.localeCompare(b.label))
}
