import { createContext, useContext } from 'react'

/**
 * The portal's own state, fetched once by the shell.
 *
 * NOT Redux, deliberately. The store holds auth and the questionnaire because
 * both genuinely cross the whole app; this is route-scoped — it exists only
 * inside /portal and dies with it. Putting it in the store would also mean a
 * client's concern tags sat in a global object long after they navigated away.
 *
 * `refresh` is here because later chunks will need it: sending the mandatory
 * first message (7.5) and cancelling a subscription (11.3) both change what
 * /client/me answers.
 */
export const ClientPortalContext = createContext(null)

export function useClientPortal() {
  const value = useContext(ClientPortalContext)
  if (!value) {
    throw new Error('useClientPortal must be used inside the client portal shell.')
  }
  return value
}
