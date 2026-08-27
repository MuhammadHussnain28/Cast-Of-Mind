const GENERIC_MESSAGE = 'Something went wrong. Please try again.'
const NETWORK_MESSAGE =
  "We couldn't reach the server. Please check your connection and try again."
const TIMEOUT_MESSAGE = 'That took too long. Please try again.'

/**
 * One shape for every failure the API client can produce, with a message
 * that is always safe to show a user.
 *
 * The server's own error responses (chunk 0.2's `{ error: { message, code } }`)
 * were already written to be shown to a user — never a stack trace, never
 * internal detail — so when that shape is present, its message is used
 * directly instead of being replaced with something generic.
 */
export class ApiError extends Error {
  constructor(message, { code, status, cause } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code || 'UNKNOWN_ERROR'
    this.status = status ?? null
    this.cause = cause
  }
}

/**
 * Turns whatever axios throws into an ApiError. Called from one place
 * (useApi) so every caller gets the same safe message, not a different
 * raw error shape per call site.
 */
/**
 * Statuses that mean "the request was understood and refused for a reason the
 * user can act on" — a wrong password, an expired reset link, a rate limit.
 * These are expected events, not faults.
 */
const HANDLED_STATUSES = new Set([400, 401, 403, 404, 409, 422, 429])

export function toApiError(error) {
  const status = error?.response?.status

  // Expected refusals get ONE line. A wrong password is not a bug, and its
  // stack points only at axios — dumping it makes the console useless during
  // real debugging and looks broken to anyone who opens DevTools.
  //
  // Genuine faults — no network, a 500, something unrecognised — still get the
  // full object, because there the stack is the entire point. Same reasoning as
  // the server-side error handler (server/middleware/errorHandler.js).
  if (HANDLED_STATUSES.has(status)) {
    const code = error?.response?.data?.error?.code || 'SERVER_ERROR'
    console.info(`[api] ${status} ${code} ${error?.config?.method?.toUpperCase() || ''} ${error?.config?.url || ''}`)
  } else {
    console.error(error)
  }

  if (error?.code === 'ECONNABORTED') {
    return new ApiError(TIMEOUT_MESSAGE, { code: 'TIMEOUT', cause: error })
  }

  const response = error?.response
  if (response) {
    const body = response.data?.error
    if (body?.message) {
      return new ApiError(body.message, {
        code: body.code || 'SERVER_ERROR',
        status: response.status,
        cause: error,
      })
    }
    return new ApiError(GENERIC_MESSAGE, {
      code: 'SERVER_ERROR',
      status: response.status,
      cause: error,
    })
  }

  if (error?.request) {
    return new ApiError(NETWORK_MESSAGE, { code: 'NETWORK_ERROR', cause: error })
  }

  return new ApiError(GENERIC_MESSAGE, { code: 'UNKNOWN_ERROR', cause: error })
}
