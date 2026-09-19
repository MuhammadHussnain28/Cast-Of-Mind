import { asyncHandler } from '../middleware/asyncHandler.js';
import { listTherapistClients } from '../services/therapistClients.service.js';

/**
 * GET /api/v1/therapist/clients — master spec §8.1.
 *
 * The therapist comes from the token, never from the request, so there is no
 * id here to verify ownership of. The query string is already validated and
 * coerced by the time it reaches this line.
 */
export const listClients = asyncHandler(async (req, res) => {
  const { cursor, limit } = req.validatedQuery;
  res.status(200).json(await listTherapistClients(req.user.id, { cursor, limit }));
});

export default { listClients };
