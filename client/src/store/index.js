import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'

/**
 * The auth slice replaces the identity-function placeholder from chunk 0.6.
 *
 * Note what is NOT registered here: no redux-persist, no storage middleware.
 * The access token is not in this store at all (see store/authSlice.js), so
 * there is nothing here that could reach localStorage even by accident.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})
