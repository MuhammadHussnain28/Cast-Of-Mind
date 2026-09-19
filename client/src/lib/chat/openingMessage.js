import { MESSAGE_STATUS } from './messageStore'

/**
 * Which message is the client's opening one? — master spec §7.1, §14 (8.3).
 *
 * The client's FIRST message in the booking. Their therapist may have written
 * before them (7.5 never blocks a therapist), so it is the first message FROM
 * THE CLIENT, not the first message in the thread.
 *
 * ONLY ONCE THE WHOLE HISTORY IS HELD. While older pages remain unloaded, the
 * earliest client message on screen may not be the real first one — so this
 * answers null rather than mark the wrong message. Marking a reply as somebody's
 * opening would be worse than marking nothing, and a young conversation (where
 * the opening matters most) fits on its first page anyway.
 *
 * Pure, so it can be executed directly: the client has no Jest suite.
 *
 * @param {Array} messages chronological, as the store keeps them
 * @param {{ hasMore: boolean, awaitingOpeningMessage: boolean }} state
 * @returns {string|null}
 */
export function openingMessageId(messages, { hasMore, awaitingOpeningMessage }) {
  if (hasMore || awaitingOpeningMessage) return null

  const first = messages.find(
    (message) =>
      message.senderRole === 'client' &&
      message.type !== 'system' &&
      message.id &&
      message.status === MESSAGE_STATUS.SENT,
  )

  return first?.id ?? null
}

export default openingMessageId
