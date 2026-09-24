import { createContext, useContext } from 'react'

/**
 * The bell's state — master spec §8.8.
 *
 * Route-scoped like the portal's other context: it exists inside /portal and
 * dies with it. Returns a safe empty shape outside a provider so a screen that
 * reads it cannot crash the portal over a bell.
 */
export const NotificationContext = createContext(null)

const NONE = Object.freeze({
  rows: [],
  unread: 0,
  failed: false,
  reload: () => {},
  readOne: () => {},
  readAll: () => {},
})

export function useNotifications() {
  return useContext(NotificationContext) ?? NONE
}
