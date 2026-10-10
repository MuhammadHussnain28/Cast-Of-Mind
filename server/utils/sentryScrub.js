// Strips anything personal or clinical from a Sentry event before it is sent
// (12.4). The second wall after `dataCollection` in config/sentry.js: this file
// assumes the SDK collected everything, and removes it anyway.
//
// Kept: error type, redacted message, stack frames (our own code), environment,
// release, and the pseudonymous user id. Removed: everything a person wrote or is.

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const JWT = /eyJ[\w-]+\.[\w-]+\.[\w-]+/g;
const EMAIL = /[^\s@"'`<>()]+@[^\s@"'`<>()]+\.[a-z]{2,}/gi;
// Quoted values are where Mongoose and the drivers echo user input back.
const QUOTED = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g;
const SENSITIVE_KEY =
  /pass|token|secret|authori[sz]|cookie|session|text|message|body|content|note|journal|email|name|card|cvc|iban|tax|payload|address|phone/i;
const SAFE_HEADERS = new Set(['user-agent', 'content-type']);
const MAX_MESSAGE = 300;
const REDACTED = '[redacted]';

export function redactText(value) {
  if (typeof value !== 'string') return value;
  const out = value
    .replace(JWT, REDACTED)
    .replace(EMAIL, REDACTED)
    .replace(QUOTED, REDACTED);
  return out.length > MAX_MESSAGE ? `${out.slice(0, MAX_MESSAGE)}…` : out;
}

export function stripQuery(url) {
  if (typeof url !== 'string') return url;
  return url.split(/[?#]/)[0];
}

/** Drops sensitive keys at any depth and redacts every remaining string. */
function scrubDeep(value, depth = 0) {
  if (depth > 6) return REDACTED;
  if (typeof value === 'string') return redactText(value);
  if (Array.isArray(value)) return value.map((item) => scrubDeep(item, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, inner] of Object.entries(value)) {
      if (SENSITIVE_KEY.test(key)) continue;
      out[key] = scrubDeep(inner, depth + 1);
    }
    return out;
  }
  return value;
}

function scrubRequest(request) {
  if (!request) return undefined;
  const headers = {};
  for (const [key, value] of Object.entries(request.headers ?? {})) {
    if (SAFE_HEADERS.has(key.toLowerCase())) headers[key] = value;
  }
  return {
    method: request.method,
    url: stripQuery(request.url),
    headers,
  };
}

function scrubFrames(frames) {
  return (frames ?? []).map((frame) => {
    const { vars, ...rest } = frame;
    void vars;
    return rest;
  });
}

/** Only the pseudonymous MongoDB id survives — never a name, email or IP. */
function scrubUser(user) {
  const id = user?.id === undefined ? null : String(user.id);
  return id && OBJECT_ID.test(id) ? { id } : undefined;
}

export function scrubEvent(event) {
  if (!event) return event;
  const out = { ...event };

  out.request = scrubRequest(event.request);
  out.user = scrubUser(event.user);
  if (typeof out.message === 'string') out.message = redactText(out.message);
  if (out.logentry) out.logentry = { message: redactText(out.logentry.message) };

  if (event.exception?.values) {
    out.exception = {
      ...event.exception,
      values: event.exception.values.map((entry) => ({
        ...entry,
        value: redactText(entry.value),
        stacktrace: entry.stacktrace
          ? { ...entry.stacktrace, frames: scrubFrames(entry.stacktrace.frames) }
          : entry.stacktrace,
      })),
    };
  }

  if (out.extra) out.extra = scrubDeep(event.extra);
  if (out.contexts) out.contexts = scrubDeep(event.contexts);
  if (out.tags) out.tags = scrubDeep(event.tags);
  // Server breadcrumbs carry our own log lines; none of them are needed.
  out.breadcrumbs = [];

  for (const key of ['request', 'user']) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

export default scrubEvent;
