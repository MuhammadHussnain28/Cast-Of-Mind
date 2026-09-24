/**
 * Every word the bell says — master spec §8.8.
 *
 * NO CONTENT, ANYWHERE. A line names the person, the kind and how many. It
 * never quotes a message or a worksheet title: this panel sits open in a rail,
 * which is the least private surface the therapist portal has.
 *
 * No placeholder content: each line is a spec fact or a plain description.
 */

export const BELL = Object.freeze({
  label: 'Notifications',
  // The count belongs in the button's own name — a bare numeral announced on
  // its own means nothing (the 7.6 rule).
  labelWith: (n) => (n === 1 ? 'Notifications, 1 new' : `Notifications, ${n} new`),
  panelLabel: 'Recent notifications',
  markAll: 'Mark all as read',
  seeAll: 'See all',
  empty: 'Nothing new',
  emptyBody: 'When a client writes, returns a worksheet, or is matched with you, it appears here.',
  failed: 'Your notifications could not be loaded.',
  retry: 'Try again',
})

/**
 * What each kind says. The count is the subject of the sentence, because the
 * whole point is "how much happened while I was elsewhere".
 */
export const KIND = Object.freeze({
  new_message: {
    icon: 'message',
    line: (n) => (n === 1 ? 'New message' : `${n} new messages`),
    tab: 'chat',
  },
  worksheet_submitted: {
    icon: 'worksheet',
    line: (n) => (n === 1 ? 'Worksheet returned' : `${n} worksheets returned`),
    tab: 'worksheets',
  },
  new_client: {
    icon: 'client',
    line: () => 'New client matched with you',
    tab: 'chat',
  },
})

export const kindOf = (type) => KIND[type] ?? KIND.new_message

export const FEED = Object.freeze({
  title: 'Notifications',
  lead: 'Everything that happened while you were somewhere else. Opening one takes you straight to that client.',
  today: 'Today',
  yesterday: 'Yesterday',
  earlier: 'Earlier',
  loadEarlier: 'Load earlier notifications',
  emptyTitle: 'Nothing here yet',
  emptyBody:
    'When a client writes to you, returns a worksheet, or is matched with you, it appears here. Your unread counts beside each client keep working either way.',
  // Said once, quietly: this is not a second unread badge.
  note: 'This is what happened elsewhere. The count beside each client in your list is the per-conversation one.',
})
