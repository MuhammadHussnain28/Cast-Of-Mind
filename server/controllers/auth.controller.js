import { asyncHandler } from '../middleware/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import {
  setRefreshCookie,
  clearRefreshCookie,
  readRefreshCookie,
} from '../utils/refreshCookie.js';
import {
  FORGOT_PASSWORD_MESSAGE,
  PASSWORD_RESET_SUCCESS_MESSAGE,
} from '../constants/auth.js';

export const login = asyncHandler(async (req, res) => {
  // req.body has already been validated and normalised by validate(loginSchema).
  const { email, password } = req.body;

  const { accessToken, refreshToken, user } = await authService.login({ email, password });

  // Full 7 days — this is the start of the window.
  setRefreshCookie(res, refreshToken);

  // The refresh token is deliberately NOT in the body — cookie only.
  res.status(200).json({ accessToken, user });
});

export const refresh = asyncHandler(async (req, res) => {
  const {
    accessToken,
    refreshToken,
    refreshTokenMaxAgeMs,
    user,
  } = await authService.refresh(readRefreshCookie(req));

  // Only the time REMAINING in the original 7-day window, so the cookie can
  // never outlive the record in the database.
  setRefreshCookie(res, refreshToken, refreshTokenMaxAgeMs);

  res.status(200).json({ accessToken, user });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(readRefreshCookie(req));

  // Cleared no matter what happened above. A logout that leaves the cookie
  // sitting in the browser is worse than no logout at all, because it looks
  // like it worked.
  clearRefreshCookie(res);

  // Always 200. Whether a session existed is not something to report.
  res.status(200).json({ message: 'Signed out.' });
});

export const me = asyncHandler(async (req, res) => {
  // req.user is set by the authenticate middleware.
  const user = await authService.getMe(req.user.id);

  res.status(200).json({ user });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);

  // The SAME reply every time — whether the address has an account, has none, or
  // belongs to a deactivated user. The service never signals which happened.
  res.status(200).json({ message: FORGOT_PASSWORD_MESSAGE });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  await authService.resetPassword(token, password);

  // Every session is gone at this point, so nothing is issued here. The user
  // signs in again with the new password, which is also a useful confirmation
  // that it took effect.
  clearRefreshCookie(res);

  res.status(200).json({ message: PASSWORD_RESET_SUCCESS_MESSAGE });
});
