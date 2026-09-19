/**
 * Unsent replies, one per conversation, IN MEMORY ONLY (8.3).
 *
 * A therapist half-way through a reply to Client A who clicks Client B should
 * find their words waiting when they come back. This holds them.
 *
 * NEVER WRITTEN TO BROWSER STORAGE, and that is the point rather than an
 * omission. A therapy reply left in localStorage or sessionStorage is readable
 * by whoever uses that machine next, and by any script that runs on the page.
 * Closing the tab loses the draft; that is the price, and it is the right one.
 *
 * KEYED BY BOOKING ID, and a lookup for one booking can only ever return that
 * booking's text — the same no-leak rule the thread holds, applied to the one
 * other place a client's context is kept.
 *
 * A plain factory rather than a module-level Map, so each portal session owns
 * its own and nothing survives sign-out in a shared module.
 */
export function createDraftStore() {
  const drafts = new Map()

  return {
    get(bookingId) {
      if (!bookingId) return ''
      return drafts.get(String(bookingId)) ?? ''
    },

    set(bookingId, text) {
      if (!bookingId) return
      const key = String(bookingId)
      // Whitespace is not a draft. Keeping it would bring back a composer that
      // looks empty but is not, and a send button that behaves oddly.
      if (!text || !text.trim()) drafts.delete(key)
      else drafts.set(key, text)
    },

    clear(bookingId) {
      if (bookingId) drafts.delete(String(bookingId))
    },

    /** For sign-out: nothing of anyone's unsent words outlives the session. */
    clearAll() {
      drafts.clear()
    },

    get size() {
      return drafts.size
    },
  }
}

export default createDraftStore
