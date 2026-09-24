import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSocket } from '../../lib/socket/socketContext'
import { SOCKET_EVENTS } from '../../lib/socket/socketClient'
import { NotificationContext } from '../../lib/notifications/notificationContext'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../lib/api/notificationsApi'
import { PANEL_LIMIT, mergeIncoming, withRead, withAllRead } from '../../lib/notifications/notificationStore'

/**
 * The bell's state for the whole portal — master spec §8.8.
 *
 * THE SERVER IS THE TRUTH; THE SOCKET IS THE SPEED — the same shape 7.6 settled
 * for unread counts. `GET /notifications` on mount and on every reconnect is
 * what makes the list right; `notification:new` is what makes it instant.
 *
 * Role-agnostic and kept beside UnreadProvider: only therapists are given
 * notifications in v1, and a client simply holds an empty list rather than the
 * provider knowing anything about roles.
 *
 * Works with no socket at all — the REST read still loads, and every reconnect
 * re-reads. A blocked websocket costs immediacy, not correctness.
 */
export default function NotificationProvider({ children }) {
  const socket = useSocket()
  const [rows, setRows] = useState([])
  const [unread, setUnread] = useState(0)
  const [failed, setFailed] = useState(false)

  const load = useCallback(() => {
    let cancelled = false

    // No synchronous setState before the first await — the React Compiler rule
    // this project fixes at the root rather than silences (0.6, 7.4, 7.6).
    fetchNotifications({ limit: PANEL_LIMIT })
      .then(({ data, meta }) => {
        if (cancelled) return
        setRows(data)
        setUnread(meta.unread)
        setFailed(false)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => load(), [load])

  useEffect(() => {
    if (!socket) return undefined

    const onNotification = (payload) => {
      if (!payload?.notification) return
      setRows((current) => mergeIncoming(current, payload.notification))
      if (typeof payload.unread === 'number') setUnread(payload.unread)
    }

    // A reconnect may have missed any number of alerts. Re-read the truth.
    const onConnect = () => load()

    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, onNotification)
    socket.on('connect', onConnect)

    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, onNotification)
      socket.off('connect', onConnect)
    }
  }, [socket, load])

  /**
   * Reading is a deliberate act — opening the panel never marks anything.
   * Marking alerts read that nobody looked at is a lie the bell then tells
   * (7.6's rule, for the same reason).
   */
  const readOne = useCallback(async (id) => {
    setRows((current) => withRead(current, id))
    setUnread((current) => Math.max(0, current - 1))
    try {
      const { unread: server } = await markNotificationRead(id)
      setUnread(server)
    } catch {
      // The server's next read corrects it; a bell is not worth an error banner.
    }
  }, [])

  const readAll = useCallback(async () => {
    setRows(withAllRead)
    setUnread(0)
    try {
      await markAllNotificationsRead()
    } catch {
      load()
    }
  }, [load])

  const value = useMemo(
    () => ({ rows, unread, failed, reload: load, readOne, readAll }),
    [rows, unread, failed, load, readOne, readAll],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
