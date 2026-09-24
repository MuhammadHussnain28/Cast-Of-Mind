import { asyncHandler } from '../middleware/asyncHandler.js';
import { listReviews } from '../services/adminReviews.service.js';

// Mounted only under the admin router. §9.6: reviews are admin-only.
export const listReviewsController = asyncHandler(async (req, res) => {
  res.status(200).json(await listReviews(req.validatedQuery));
});
