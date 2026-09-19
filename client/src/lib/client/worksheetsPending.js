import { createContext, useContext } from 'react'

// How many worksheets the client still has to complete — the nav dot (8.5).
export const WorksheetsPendingContext = createContext({ pending: 0, setPending: () => {} })

export function useWorksheetsPending() {
  return useContext(WorksheetsPendingContext)
}

// "Worksheets, 1 to complete" — the count lives in the link's name, not the dot.
export function pendingLabel(base, count) {
  return count > 0 ? `${base}, ${count} to complete` : base
}
