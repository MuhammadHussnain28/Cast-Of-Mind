import { useEffect, useMemo, useState } from 'react'
import { useSocket } from '../../../lib/socket/socketContext'
import { SOCKET_EVENTS } from '../../../lib/socket/socketClient'
import { WorksheetsPendingContext } from '../../../lib/client/worksheetsPending'

// Starts from /client/me, then follows the server's live count.
export default function WorksheetsPendingProvider({ initial = 0, children }) {
  const socket = useSocket()
  const [pending, setPending] = useState(initial)

  useEffect(() => {
    if (!socket) return undefined
    const onUpdate = (payload) => {
      if (Number.isFinite(payload?.pending)) setPending(Math.max(0, payload.pending))
    }
    socket.on(SOCKET_EVENTS.WORKSHEETS_UPDATE, onUpdate)
    return () => socket.off(SOCKET_EVENTS.WORKSHEETS_UPDATE, onUpdate)
  }, [socket])

  const value = useMemo(() => ({ pending, setPending }), [pending])
  return <WorksheetsPendingContext.Provider value={value}>{children}</WorksheetsPendingContext.Provider>
}
