import * as Sentry from '@sentry/react'
import { scrubEvent, scrubBreadcrumb } from './sentryScrub'

// Browser error reporting (12.4). OFF unless a production build AND
// VITE_SENTRY_DSN is set. NO Session Replay, ever: it records the screen, and
// on this platform the screen is therapy content.

// Sentry 11 collects bodies, headers, cookies and query strings BY DEFAULT.
const PRIVATE_DATA_COLLECTION = {
  userInfo: false,
  cookies: false,
  httpHeaders: { request: false, response: false },
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
}

let enabled = false

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!import.meta.env.PROD || !dsn) return false

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production',
    dataCollection: PRIVATE_DATA_COLLECTION,
    // Errors only: no tracing, no replay, no profiling.
    tracesSampleRate: 0,
    beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
    beforeSend: (event) => scrubEvent(event),
  })

  enabled = true
  return true
}

/** The pseudonymous MongoDB id only — never the email or role. */
export function trackSignedInUser(store) {
  if (!enabled) return
  let last
  const sync = () => {
    const id = store.getState().auth?.user?.id ?? null
    if (id === last) return
    last = id
    Sentry.setUser(id ? { id: String(id) } : null)
  }
  sync()
  store.subscribe(sync)
}

/** Wraps a React root error callback so it also reports, when enabled. */
export const withSentry = (callback) => (enabled ? Sentry.reactErrorHandler(callback) : callback)
