import { useEffect, useState } from 'react'

// The current time, refreshed every `interval` ms.
export function useNow(interval = 60000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), interval)
    return () => clearInterval(id)
  }, [interval])

  return now
}

export default useNow
