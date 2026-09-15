import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  listMessages,
  sendMessage,
  markRead,
  unreadCount,
} from '../services/chat.service.js';

export const getMessages = asyncHandler(async (req, res) => {
  const { before, after, limit } = req.validatedQuery ?? {};
  res
    .status(200)
    .json(await listMessages(req.params.bookingId, req.user, { before, after, limit }));
});

export const postMessage = asyncHandler(async (req, res) => {
  // Only `text` is read. The service sets the type itself — see chat.service.js.
  res
    .status(201)
    .json(
      await sendMessage(req.params.bookingId, req.user, req.body.text, {
        clientMessageId: req.body.clientMessageId,
      }),
    );
});

export const postRead = asyncHandler(async (req, res) => {
  res.status(200).json(await markRead(req.params.bookingId, req.user));
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  res.status(200).json(await unreadCount(req.user));
});
