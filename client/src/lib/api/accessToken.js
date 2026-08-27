/**
 * The access token. In memory, and nowhere else.
 *
 * This is a plain module variable — a closure. It cannot be serialised, does
 * not appear in Redux DevTools, and is gone the moment the tab reloads or
 * closes. That is the entire point.
 *
 * WHY IT IS NOT IN REDUX (master spec §11):
 * The rule is "never localStorage, never sessionStorage, never persisted
 * Redux". The safest way to honour a rule about persistence is to keep the
 * value somewhere that CANNOT be persisted, rather than to keep it somewhere
 * persistable and remember not to. Redux holds the user and their role; the
 * token is not in the store at all. If anyone adds redux-persist in two
 * years, there is nothing here for it to leak.
 *
 * The cost, and it is deliberate: a page reload loses the token. The app
 * asks /auth/refresh for a new one on load, using the httpOnly cookie the
 * browser kept. See components/auth/AuthBootstrap.jsx.
 *
 * NEVER write this value to storage, a cookie, a URL, or the console.
 */

let accessToken = null

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export function clearAccessToken() {
  accessToken = null
}
