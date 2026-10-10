// Strips anything personal or clinical from a browser Sentry event (12.4). The
// second wall after `dataCollection` in lib/sentry.js. Mirrors
// server/utils/sentryScrub.js; keep the two in step.

const OBJECT_ID = /^[a-f0-9]{24}$/i
const JWT = /eyJ[\w-]+\.[\w-]+\.[\w-]+/g
const EMAIL = /[^\s@"'`<>()]+@[^\s@"'`<>()]+\.[a-z]{2,}/gi
const QUOTED = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g
const SENSITIVE_KEY =
  /pass|token|secret|authori[sz]|cookie|session|text|message|body|content|note|journal|email|name|card|cvc|iban|tax|payload|address|phone/i
const SAFE_HEADERS = new Set(['user-agent'])
// Navigation and API calls help debugging; console and click trails do not.
const KEPT_BREADCRUMBS = new Set(['navigation', 'xhr', 'fetch'])
const MAX_MESSAGE = 300
const REDACTED = '[redacted]'

export function redactText(value) {
  if (typeof value !== 'string') return value
  const out = value.replace(JWT, REDACTED).replace(EMAIL, REDACTED).replace(QUOTED, REDACTED)
  return out.length > MAX_MESSAGE ? `${out.slice(0, MAX_MESSAGE)}…` : out
}

// `/reset-password?token=…` and `/welcome?session_id=…` must never leave.
export function stripQuery(url) {
  if (typeof url !== 'string') return url
  return url.split(/[?#]/)[0]
}

function scrubDeep(value, depth = 0) {
  if (depth > 6) return REDACTED
  if (typeof value === 'string') return redactText(value)
  if (Array.isArray(value)) return value.map((item) => scrubDeep(item, depth + 1))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [key, inner] of Object.entries(value)) {
      if (SENSITIVE_KEY.test(key)) continue
      out[key] = scrubDeep(inner, depth + 1)
    }
    return out
  }
  return value
}

/** Only navigation and API calls, URLs without query strings, no payloads. */
export function scrubBreadcrumb(breadcrumb) {
  if (!breadcrumb || !KEPT_BREADCRUMBS.has(breadcrumb.category)) return null
  const data = breadcrumb.data ?? {}
  const kept =
    breadcrumb.category === 'navigation'
      ? { from: stripQuery(data.from), to: stripQuery(data.to) }
      : { method: data.method, status_code: data.status_code, url: stripQuery(data.url) }
  return { category: breadcrumb.category, type: breadcrumb.type, level: breadcrumb.level, timestamp: breadcrumb.timestamp, data: kept }
}

function scrubUser(user) {
  const id = user?.id === undefined ? null : String(user.id)
  return id && OBJECT_ID.test(id) ? { id } : undefined
}

export function scrubEvent(event) {
  if (!event) return event
  const out = { ...event }

  if (event.request) {
    const headers = {}
    for (const [key, value] of Object.entries(event.request.headers ?? {})) {
      if (SAFE_HEADERS.has(key.toLowerCase())) headers[key] = value
    }
    out.request = { url: stripQuery(event.request.url), headers }
  }

  const user = scrubUser(event.user)
  if (user) out.user = user
  else delete out.user

  if (typeof out.message === 'string') out.message = redactText(out.message)

  if (event.exception?.values) {
    out.exception = {
      ...event.exception,
      values: event.exception.values.map((entry) => ({
        ...entry,
        value: redactText(entry.value),
        stacktrace: entry.stacktrace
          ? {
              ...entry.stacktrace,
              frames: (entry.stacktrace.frames ?? []).map((frame) => {
                const { vars, ...rest } = frame
                void vars
                return rest
              }),
            }
          : entry.stacktrace,
      })),
    }
  }

  if (out.extra) out.extra = scrubDeep(event.extra)
  if (out.contexts) out.contexts = scrubDeep(event.contexts)
  if (out.tags) out.tags = scrubDeep(event.tags)
  out.breadcrumbs = (event.breadcrumbs ?? []).map(scrubBreadcrumb).filter(Boolean)

  return out
}
