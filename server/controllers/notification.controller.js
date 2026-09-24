import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  listNotifications,
  markAllRead,
  markRead,
} from '../services/notification.service.js';

// The recipient is ALWAYS the token's user. No route takes a user id, so one
// person's feed cannot be reached from another's session.
export const listController = asyncHandler(async (req, res) => {
  res.status(200).json(await listNotifications(req.user.id, req.validatedQuery));
});

export const readController = asyncHandler(async (req, res) => {
  res.status(200).json(await markRead(req.user.id, req.params.id));
});

export const readAllController = asyncHandler(async (req, res) => {
  res.status(200).json(await markAllRead(req.user.id));
});
