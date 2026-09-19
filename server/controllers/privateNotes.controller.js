import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  listNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../services/privateNotes.service.js';

/**
 * THERAPIST ONLY — master spec §8.5/8.6, §10.10.
 *
 * Mounted exclusively on the `/api/v1/therapist` router, which is guarded by
 * `requireTherapist`. No client-facing route may ever import this file.
 */

export const list = asyncHandler(async (req, res) => {
  const { cursor, limit } = req.validatedQuery;
  res.status(200).json(await listNotes(req.user.id, req.params.bookingId, { cursor, limit }));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await createNote(req.user.id, req.params.bookingId, req.body));
});

export const update = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(await updateNote(req.user.id, req.params.bookingId, req.params.noteId, req.body));
});

export const remove = asyncHandler(async (req, res) => {
  res.status(200).json(await deleteNote(req.user.id, req.params.bookingId, req.params.noteId));
});
