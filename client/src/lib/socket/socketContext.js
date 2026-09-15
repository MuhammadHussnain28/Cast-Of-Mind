import { createContext, useContext } from 'react'

/**
 * The portal's live connection, provided by the shell.
 *
 * Kept in its own file so the provider module exports only a component and
 * fast refresh keeps working — the trap caught in StepIcons, ContactIcons and
 * CheckoutIcons.
 */
export const SocketContext = createContext(null)

/** Null-safe: chat must still work over REST when there is no socket. */
export function useSocket() {
  return useContext(SocketContext)
}
