import { asyncHandler } from '../middleware/asyncHandler.js';
import { getClientPortalState } from '../services/clientPortal.service.js';

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(await getClientPortalState(req.user.id));
});
