/**
 * The thread, arranged for reading rather than as a flat list.
 *
 * Five separate bubbles from one person, each with its own timestamp, is what
 * makes a chat look like a spreadsheet. Consecutive messages from the same
 * person within a few minutes are one cluster carrying one timestamp — which is
 * also how the eye actually reads a conversation.
 *
 * EVERY DATE DECISION IS MADE IN THE VIEWER'S OWN TIMEZONE. §15: stored UTC,
 * displayed converted. "Today" for a client in Dublin and for their therapist
 * in Perth are different days, and a boundary computed in UTC would put the
 * separator in the wrong place for one of them.
 */

/** How long a gap breaks a cluster. Long enough to group a burst of typing. */
export const CLUSTER_GAP_MS = 5 * 60 * 1000;

/** The calendar day a moment falls on, in a given zone. */
export function dayKeyIn(value, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));

  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * "Today", "Yesterday", or a written date — relative to the viewer's own clock.
 */
export function dayLabel(value, timeZone, now = new Date(), locale = undefined) {
  const key = dayKeyIn(value, timeZone);
  if (key === dayKeyIn(now, timeZone)) return 'Today';

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (key === dayKeyIn(yesterday, timeZone)) return 'Yesterday';

  const sameYear =
    key.slice(0, 4) === dayKeyIn(now, timeZone).slice(0, 4);

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(new Date(value));
}

export function timeIn(value, timeZone, locale = undefined) {
  return new Intl.DateTimeFormat(locale, { timeZone, timeStyle: 'short' }).format(new Date(value));
}

/**
 * @returns a flat list of `{ kind: 'day' }` and `{ kind: 'cluster' }` rows,
 *   ready to render in order.
 *
 * System messages never cluster with anything — they are notices from the
 * platform, not something either person said, and grouping one into a run of
 * someone's messages would read as if they had written it.
 */
export function groupMessages(
  messages,
  timeZone,
  now = new Date(),
  locale = undefined,
  { openingId = null } = {},
) {
  const rows = [];
  let currentDay = null;
  let cluster = null;

  const closeCluster = () => {
    cluster = null;
  };

  for (const message of messages) {
    const key = dayKeyIn(message.createdAt, timeZone);

    if (key !== currentDay) {
      currentDay = key;
      closeCluster();
      rows.push({
        kind: 'day',
        key: `day-${key}`,
        label: dayLabel(message.createdAt, timeZone, now, locale),
      });
    }

    if (message.type === 'system') {
      closeCluster();
      rows.push({ kind: 'system', key: `sys-${message.id ?? message.clientMessageId}`, message });
      continue;
    }

    /**
     * THE OPENING MESSAGE STANDS ALONE (8.3).
     *
     * It is the one message in the relationship with a label, so it gets a run
     * of its own — otherwise "Opening message" would sit over a bubble and the
     * three short follow-ups clustered under it, and a therapist could not tell
     * which of them the client actually opened with.
     */
    if (openingId && message.id === openingId) {
      closeCluster();
      rows.push({
        kind: 'cluster',
        key: `cl-${message.id}`,
        senderRole: message.senderRole,
        mine: message.mine,
        opening: true,
        messages: [message],
      });
      continue;
    }

    const withinGap =
      cluster &&
      new Date(message.createdAt).getTime() -
        new Date(cluster.messages[cluster.messages.length - 1].createdAt).getTime() <=
        CLUSTER_GAP_MS;

    if (cluster && cluster.senderRole === message.senderRole && withinGap) {
      cluster.messages.push(message);
      continue;
    }

    cluster = {
      kind: 'cluster',
      key: `cl-${message.id ?? message.clientMessageId}`,
      senderRole: message.senderRole,
      mine: message.mine,
      messages: [message],
    };
    rows.push(cluster);
  }

  return rows;
}
