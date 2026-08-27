import { setAccessToken } from './api/accessToken'
import { credentialsReceived } from '../store/authSlice'

/**
 * Records a successful sign-in: token into memory, user into the store.
 *
 * Lives in its own file rather than beside AuthBootstrap because a module
 * that exports a component must not also export plain functions — Vite's
 * fast refresh silently stops working for that file when it does.
 *
 * One function so the login form and the session restore on page load cannot
 * drift apart on what "signed in" means.
 */
export function applyCredentials(dispatch, { accessToken, user }) {
  setAccessToken(accessToken)
  dispatch(credentialsReceived({ user }))
}
