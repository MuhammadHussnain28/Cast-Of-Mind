import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  createSession,
  updateSession,
  cancelSession,
  listSessions,
  markSessionHeld,
  markSessionNotHeld,
} from '../services/session.service.js';

// Sessions — §8.4 (therapist writes), §7.4 (client reads). Clients have no write handler.

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await createSession(req.user.id, req.body));
});

export const update = asyncHandler(async (req, res) => {
  res.status(200).json(await updateSession(req.user.id, req.params.sessionId, req.body));
});

export const cancel = asyncHandler(async (req, res) => {
  res.status(200).json(await cancelSession(req.user.id, req.params.sessionId));
});

export const list = asyncHandler(async (req, res) => {
  const { scope, cursor, limit } = req.validatedQuery;
  res.status(200).json(await listSessions(req.user, req.params.bookingId, { scope, cursor, limit }));
});

export const held = asyncHandler(async (req, res) => {
  res.status(200).json(await markSessionHeld(req.user.id, req.params.sessionId));
});

export const notHeld = asyncHandler(async (req, res) => {
  res.status(200).json(await markSessionNotHeld(req.user.id, req.params.sessionId));
});
