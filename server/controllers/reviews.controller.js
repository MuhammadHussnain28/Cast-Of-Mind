import { asyncHandler } from '../middleware/asyncHandler.js';
import { submitReview } from '../services/reviewSubmission.service.js';

// THE CLIENT'S HALF ONLY. This file must never import adminReviews.service.js:
// the client router reaches it, and anything it imports is reachable too. The
// admin's half lives in adminReviews.controller.js.
//
// The body is already validated to stars and optional text; the text is never
// logged, here or anywhere.
export const submitReviewController = asyncHandler(async (req, res) => {
  res.status(201).json(await submitReview(req.user.id, req.body));
});
