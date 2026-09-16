import { createContext, useContext } from 'react'
import { EMPTY_UNREAD, countFor } from './unreadStore'

/**
 * The portal's unread counts — master spec §14.
 *
 * Provided by the shell rather than by the chat screen, because the badge has
 * to be right on every screen: someone reading their journal is exactly who the
 * badge exists for.
 *
 * Kept in its own file so the provider module exports only a component and fast
 * refresh keeps working — the trap caught in StepIcons, ContactIcons and
 * CheckoutIcons.
 */
export const UnreadContext = createContext({
  unread: EMPTY_UNREAD,
  setReadingBooking: () => {},
  markBookingRead: () => {},
})

export function useUnread() {
  return useContext(UnreadContext)
}

/** The number on one booking's badge. */
export function useUnreadFor(bookingId) {
  const { unread } = useUnread()
  return countFor(unread, bookingId)
}
