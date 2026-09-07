import { asyncHandler } from '../middleware/asyncHandler.js';
import { getOwnProfile, updateOwnProfile } from '../services/therapistProfile.service.js';

// The user id comes from the verified access token, never from the request.
export const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json(await getOwnProfile(req.user.id));
});

export const updateProfile = asyncHandler(async (req, res) => {
  res.status(200).json(await updateOwnProfile(req.user.id, req.body));
});
