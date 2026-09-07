import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { getPublicTherapist } from '../services/therapistDirectory.service.js';

/**
 * GET /api/v1/therapists/:id — public.
 *
 * A malformed id and an unknown id both return the same 404. Distinguishing
 * them would let someone probe which ids exist, and there is nothing a visitor
 * could do with the difference anyway.
 */
export const getTherapist = asyncHandler(async (req, res) => {
  const therapist = await getPublicTherapist(req.params.id);

  if (!therapist) {
    throw new AppError('Therapist not found.', 404, 'THERAPIST_NOT_FOUND');
  }

  res.status(200).json({ data: therapist });
});

export default { getTherapist };
