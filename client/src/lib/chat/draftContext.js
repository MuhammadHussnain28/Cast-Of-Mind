import { createContext, useContext } from 'react'

/**
 * The therapist portal's unsent replies — see draftStore.js (8.3).
 *
 * Provided by the shell, because the drafts must outlive the chat instance for
 * any one client: that instance is remounted per client, deliberately, so that
 * nothing else about a conversation can carry over.
 *
 * Its own file so the provider module exports only a component and fast
 * refresh keeps working — the trap caught in StepIcons, ContactIcons and
 * unreadContext.
 */
export const DraftContext = createContext(null)

export function useDrafts() {
  return useContext(DraftContext)
}
