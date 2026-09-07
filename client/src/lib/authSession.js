import { setAccessToken, clearAccessToken } from './api/accessToken'
import { logout as logoutRequest } from './api/authApi'
import { credentialsReceived, sessionEnded } from '../store/authSlice'

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

/**
 * Ends the session: revoke it on the server, then forget it here.
 *
 * The local state is cleared whether or not the server call succeeds. If the
 * network is down the person still expects to be signed out — leaving them
 * apparently signed in on a shared computer because a request failed would be
 * the wrong way round.
 *
 * Shared by the sign-out button and the admin idle timeout, so "signed out"
 * means the same thing however it was triggered. The caller navigates.
 */
export async function endSession(dispatch) {
  try {
    await logoutRequest()
  } catch {
    // Deliberately swallowed — see above.
  } finally {
    clearAccessToken()
    dispatch(sessionEnded())
  }
}
