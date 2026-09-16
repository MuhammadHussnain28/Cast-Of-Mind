import { useEffect, useState } from 'react'

/**
 * Whether the browser believes it has a network.
 *
 * DELIBERATELY NOT "is the socket connected". Chat works completely over REST
 * with no socket at all (§14), so a dropped websocket is invisible to the
 * person using it and telling them something is wrong would worry them about
 * nothing. `navigator.onLine` is the only signal that actually predicts a send
 * failing, which is the only thing worth saying out loud.
 *
 * It is a coarse signal — it reports the network interface, not whether the
 * server is reachable — so it is used to explain a failure, never to prevent an
 * attempt. Sending is always tried.
 */
export function useOnline() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  )

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}
