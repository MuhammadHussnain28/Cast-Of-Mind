import { asyncHandler } from '../middleware/asyncHandler.js';
import { getClientPortalState, saveClientTimezone } from '../services/clientPortal.service.js';

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(await getClientPortalState(req.user.id));
});

export const saveTimezone = asyncHandler(async (req, res) => {
  res.status(200).json(await saveClientTimezone(req.user.id, req.body.timezone));
});
