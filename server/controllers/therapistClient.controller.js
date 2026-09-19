import { asyncHandler } from '../middleware/asyncHandler.js';
import { getTherapistClient } from '../services/therapistClient.service.js';

/**
 * GET /api/v1/therapist/clients/:bookingId — master spec §8.2.
 *
 * The therapist comes from the token; the booking id comes from the URL and is
 * therefore attacker-controlled. Ownership is proved in the service against the
 * stored booking, and every refusal is the same 404.
 */
export const getClient = asyncHandler(async (req, res) => {
  res.status(200).json(await getTherapistClient(req.params.bookingId, req.user.id));
});

export default { getClient };
