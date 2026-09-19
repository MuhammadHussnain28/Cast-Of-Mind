import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  listOwnEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  listClientEntries,
} from '../services/journal.service.js';

// Journal — §7.3, §8.5/8.6. This controller never imports the notes service.

// ── client ──

export const listMine = asyncHandler(async (req, res) => {
  const { cursor, limit } = req.validatedQuery;
  res.status(200).json(await listOwnEntries(req.user.id, { cursor, limit }));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await createEntry(req.user.id, req.body));
});

export const update = asyncHandler(async (req, res) => {
  res.status(200).json(await updateEntry(req.user.id, req.params.entryId, req.body));
});

export const remove = asyncHandler(async (req, res) => {
  res.status(200).json(await deleteEntry(req.user.id, req.params.entryId));
});

// ── therapist ──

// Read only. There is deliberately no write handler for a client's entries.
export const listForClient = asyncHandler(async (req, res) => {
  const { cursor, limit } = req.validatedQuery;
  res
    .status(200)
    .json(await listClientEntries(req.user.id, req.params.bookingId, { cursor, limit }));
});
