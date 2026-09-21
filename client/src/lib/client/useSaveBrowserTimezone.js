import { useEffect } from 'react'
import { saveClientTimezone } from '../api/clientPortalApi'

// Quietly saves the browser's own zone when it differs from the stored one (9.2),
// so the therapist sees when a session lands. A failure changes nothing on screen.
export function useSaveBrowserTimezone(stored, enabled) {
  useEffect(() => {
    if (!enabled) return
    let zone = null
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      zone = null
    }
    // No guess when the browser will not say.
    if (!zone || zone === stored) return
    saveClientTimezone(zone).catch(() => {})
  }, [stored, enabled])
}

export default useSaveBrowserTimezone
