import { useEffect, useState } from 'react'
import { SocketContext } from '../../../lib/socket/socketContext'
import { createSocket } from '../../../lib/socket/socketClient'

/**
 * Opens the portal's socket for as long as the portal is mounted.
 *
 * The instance is built in a lazy state initialiser rather than assigned from
 * inside an effect — the React Compiler objection fixed at the root in 0.6,
 * 4.2 and 5.1 rather than silenced. Construction is inert: `autoConnect` is
 * false, so nothing happens on the wire until the effect calls `connect`.
 *
 * Deliberately null-tolerant for consumers: if the connection never opens —
 * offline, a blocked websocket, a proxy that eats upgrades — every consumer
 * falls back to REST and the conversation still works (§14). Nothing here is
 * allowed to become a dependency of being able to read or send a message.
 */
export default function PortalSocketProvider({ children }) {
  const [socket] = useState(() => createSocket())

  useEffect(() => {
    socket.connect()

    return () => {
      socket.removeAllListeners()
      socket.close()
    }
  }, [socket])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}
