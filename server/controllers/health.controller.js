import { asyncHandler } from '../middleware/asyncHandler.js';
import { getHealthStatus } from '../services/systemStatus.service.js';
import { HEALTH_STATUS } from '../constants/systemStatus.js';

// GET /api/v1/health (12.4). 503 only when the database is down — the one
// failure that stops the platform — so an uptime monitor alerts on what matters.
export const getHealth = asyncHandler(async (req, res) => {
  const health = await getHealthStatus();
  res
    .status(health.status === HEALTH_STATUS.DOWN ? 503 : 200)
    .set('Cache-Control', 'no-store')
    .json(health);
});
