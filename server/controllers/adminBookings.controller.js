import { asyncHandler } from '../middleware/asyncHandler.js';
import { listBookings } from '../services/adminBookings.service.js';

export const listBookingsController = asyncHandler(async (req, res) => {
  res.status(200).json(await listBookings(req.validatedQuery));
});
