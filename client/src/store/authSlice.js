import { createSlice } from '@reduxjs/toolkit'

/**
 * Who is signed in, and whether we know yet.
 *
 * THE ACCESS TOKEN IS NOT IN HERE, ON PURPOSE. It lives in
 * lib/api/accessToken.js as a plain module variable. Master spec §11 forbids
 * persisting it, and the surest way to keep a value out of storage is to keep
 * it somewhere that cannot be stored — not to keep it somewhere storable and
 * rely on nobody adding redux-persist later.
 *
 * `status` exists because "not signed in" and "we have not checked yet" are
 * different, and confusing them is a real bug: on a page reload there is no
 * token for a moment while /auth/refresh runs. Without `bootstrapping`,
 * ProtectedRoute would see "no user" and bounce a signed-in admin to the
 * login page every single time they pressed refresh.
 */

const initialState = {
  // 'bootstrapping' — asking the server whether the cookie is still good.
  // 'authenticated' — we have a user.
  // 'anonymous'     — checked, and nobody is signed in.
  status: 'bootstrapping',
  user: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    credentialsReceived(state, action) {
      state.status = 'authenticated'
      state.user = action.payload.user
    },

    sessionEnded(state) {
      state.status = 'anonymous'
      state.user = null
    },
  },
})

export const { credentialsReceived, sessionEnded } = authSlice.actions

export const selectAuthStatus = (state) => state.auth.status
export const selectUser = (state) => state.auth.user
export const selectRole = (state) => state.auth.user?.role ?? null
export const selectIsAuthenticated = (state) => state.auth.status === 'authenticated'
export const selectIsBootstrapping = (state) => state.auth.status === 'bootstrapping'

export default authSlice.reducer
