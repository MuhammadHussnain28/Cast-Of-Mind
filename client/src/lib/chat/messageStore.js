/**
 * The message list, as pure functions.
 *
 * Kept out of React so it can be executed directly — the client has no Jest
 * suite, and the merge rules below are exactly the kind of logic that is
 * silently wrong until a real conversation exposes it.
 *
 * THE PROBLEM THIS SOLVES. Sending a message produces THREE events, in no
 * guaranteed order:
 *   1. the optimistic bubble, drawn immediately so typing feels instant
 *   2. the server's acknowledgement, carrying the real id
 *   3. the socket echo of the same message — your own sockets receive it, so a
 *      second tab stays in step
 *
 * If the echo arrives before the ack, a naive list shows the message twice.
 * `clientMessageId` (added to the API in 7.4) is the browser's own id, echoed
 * back on both the ack and the emit, so reconciliation is exact rather than a
 * guess based on matching text and timestamps.
 */

export const MESSAGE_STATUS = Object.freeze({
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
});

/** Chronological, with a stable tiebreak so equal timestamps never swap. */
function compare(a, b) {
  const at = new Date(a.createdAt).getTime();
  const bt = new Date(b.createdAt).getTime();
  if (at !== bt) return at - bt;
  return String(a.id).localeCompare(String(b.id));
}

/**
 * Normalise anything arriving from either transport.
 *
 * The socket payload deliberately carries no `mine` flag — one emit reaches
 * both parties, so a viewer-relative field cannot be baked into it. It is
 * derived here from the role the viewer holds.
 */
export function normalise(message, myRole) {
  return {
    id: message.id,
    clientMessageId: message.clientMessageId ?? null,
    text: message.text,
    type: message.type ?? 'text',
    createdAt: message.createdAt,
    senderRole: message.senderRole,
    mine: message.mine ?? message.senderRole === myRole,
    status: message.status ?? MESSAGE_STATUS.SENT,
    // Explicitly null rather than absent: `upsert` merges over the existing
    // row, so a failure reason left off here would survive the retry that
    // cleared it and sit under a message that did send.
    error: null,
  };
}

/**
 * Insert or replace one message.
 *
 * Matched by real id first, then by `clientMessageId` — which is what turns an
 * optimistic bubble into the real thing rather than leaving two rows. Returns
 * the same array reference when nothing changed, so React can skip the render.
 */
export function upsert(messages, incoming) {
  const byId = messages.findIndex((m) => m.id && incoming.id && m.id === incoming.id);
  if (byId !== -1) {
    const next = messages.slice();
    next[byId] = { ...messages[byId], ...incoming };
    return next;
  }

  if (incoming.clientMessageId) {
    const byClientId = messages.findIndex(
      (m) => m.clientMessageId && m.clientMessageId === incoming.clientMessageId,
    );
    if (byClientId !== -1) {
      const next = messages.slice();
      next[byClientId] = { ...messages[byClientId], ...incoming };
      return next;
    }
  }

  // New. Almost always the newest, so check the tail before sorting.
  const next = messages.slice();
  const last = next[next.length - 1];
  if (!last || compare(last, incoming) <= 0) next.push(incoming);
  else {
    next.push(incoming);
    next.sort(compare);
  }
  return next;
}

/** A page of history, merged without duplicating anything already held. */
export function mergePage(messages, page) {
  return page.reduce((acc, message) => upsert(acc, message), messages);
}

/** The optimistic row, drawn before the server has heard anything. */
export function optimisticMessage({ clientMessageId, text, senderRole }) {
  return {
    id: null,
    clientMessageId,
    text,
    type: 'text',
    createdAt: new Date().toISOString(),
    senderRole,
    mine: true,
    status: MESSAGE_STATUS.SENDING,
    error: null,
  };
}

/**
 * Failed, and WHY when the server said why.
 *
 * "Not sent" alone is a dead end: someone who has hit the rate limit or the
 * 5,000-character cap can only guess, and guessing wrong means writing it all
 * again. The server's own sentence explains it better than any message the
 * browser could invent, so it is carried through and shown.
 */
export function markFailed(messages, clientMessageId, reason = null) {
  return messages.map((m) =>
    m.clientMessageId === clientMessageId
      ? { ...m, status: MESSAGE_STATUS.FAILED, error: reason }
      : m,
  );
}

export function markSending(messages, clientMessageId) {
  return messages.map((m) =>
    m.clientMessageId === clientMessageId
      ? { ...m, status: MESSAGE_STATUS.SENDING, error: null }
      : m,
  );
}

export function removeByClientId(messages, clientMessageId) {
  return messages.filter((m) => m.clientMessageId !== clientMessageId);
}

/** The newest real message — what a reconnect asks the server to continue from. */
export function newestSent(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].id && messages[i].status === MESSAGE_STATUS.SENT) return messages[i];
  }
  return null;
}
