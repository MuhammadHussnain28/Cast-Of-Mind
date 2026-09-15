import { z } from 'zod';
import {
  MESSAGE_TEXT_MAX,
  MESSAGES_PAGE_SIZE,
  MESSAGES_PAGE_SIZE_MAX,
  CLIENT_MESSAGE_ID_PATTERN,
} from '../constants/chat.js';

/**
 * `.strict()` is deliberately NOT used here.
 *
 * Elsewhere (the therapist profile, the admin edit) an unknown field is refused
 * by name, because silently dropping an edit tells someone their change saved
 * when it did not. Here the opposite is right: the one field a caller might try
 * to smuggle in is `type`, and refusing the whole message with a 422 would give
 * an attacker a probe. Unknown keys are stripped instead, and the service sets
 * `type` itself — so a forged system message is not rejected, it simply has no
 * effect. A test asserts a posted `type` never reaches the database.
 */
export const sendMessageSchema = z.object({
  text: z
    .string({ message: 'Write a message before sending.' })
    .trim()
    .min(1, 'Write a message before sending.')
    .max(MESSAGE_TEXT_MAX, `A message must be ${MESSAGE_TEXT_MAX} characters or fewer.`),

  // Echoed back so the sender can swap their optimistic bubble for the real
  // message. Never stored. Charset-restricted because it is round-tripped to
  // the other party — an opaque token, never something to interpret.
  clientMessageId: z
    .string()
    .regex(CLIENT_MESSAGE_ID_PATTERN, 'Invalid client message id.')
    .optional(),
});

export const listMessagesQuerySchema = z.object({
  // Opaque to the caller — the service decodes it and rejects anything it did
  // not issue. Bounded here so a megabyte of junk never reaches the decoder.
  before: z.string().min(1).max(255).optional(),
  // The reconnection direction (7.3): "what arrived since this point". Mutually
  // exclusive with `before` — the service refuses both together.
  after: z.string().min(1).max(255).optional(),
  limit: z.coerce
    .number()
    .int('Limit must be a whole number.')
    .min(1, 'Limit must be at least 1.')
    .max(MESSAGES_PAGE_SIZE_MAX, `Limit must be ${MESSAGES_PAGE_SIZE_MAX} or fewer.`)
    .optional()
    .default(MESSAGES_PAGE_SIZE),
});
