import { asyncHandler } from '../middleware/asyncHandler.js';
import { getAdminSession } from '../services/admin.service.js';
import { getDashboardStats } from '../services/adminStats.service.js';
import { getSystemStatus } from '../services/systemStatus.service.js';

export const getSession = asyncHandler(async (req, res) => {
  const session = await getAdminSession(req.user.id);
  res.status(200).json(session);
});

export const getStats = asyncHandler(async (req, res) => {
  res.status(200).json(await getDashboardStats());
});

export const getSystemStatusController = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).json(await getSystemStatus());
});
