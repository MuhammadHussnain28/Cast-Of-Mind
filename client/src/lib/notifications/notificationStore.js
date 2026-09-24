/**
 * The bell's list rules, kept out of the component so they can be checked
 * directly — the client has no Jest suite, so these run as logic checks.
 *
 * ONE ROW PER ALERT, matched by id. The server groups by client and kind, so an
 * incoming alert is usually an UPDATE to a row already on screen (its count
 * went up), not a new line. Appending instead would show the same client twice
 * and make the panel disagree with the server's own grouping.
 */

export const PANEL_LIMIT = 8

export function mergeIncoming(rows, incoming) {
  if (!incoming?.id) return rows

  const without = rows.filter((row) => row.id !== incoming.id)
  // Newest activity first, and never longer than the panel shows.
  return [incoming, ...without].slice(0, PANEL_LIMIT)
}

export const withRead = (rows, id) =>
  rows.map((row) => (row.id === id ? { ...row, read: true } : row))

export const withAllRead = (rows) =>
  rows.every((row) => row.read) ? rows : rows.map((row) => ({ ...row, read: true }))

/** Unread first is NOT the order: newest is. An alert read a minute ago is
 *  still the most recent thing that happened, and reordering under someone's
 *  cursor as they read is how a click lands on the wrong row. */
export const byNewest = (rows) =>
  [...rows].sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt))
