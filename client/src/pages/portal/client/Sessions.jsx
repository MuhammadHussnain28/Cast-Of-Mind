import {
  BuildNote,
  ScreenHeader,
  TruthList,
} from '../../../components/portal/client/ScreenScaffold'
import { SCREENS } from '../../../data/clientPortalContent'

/**
 * §7.4. View-only for the client, by design — they cannot create, edit or
 * request a session, and the screen says so rather than leaving them hunting
 * for a button that will never exist.
 *
 * The session counter is deliberately NOT here: it is one number and it already
 * sits on the account screen, where the rest of the subscription lives. Two
 * copies of one figure is how they start disagreeing.
 */
export default function Sessions() {
  const screen = SCREENS.sessions

  return (
    <section>
      <ScreenHeader title={screen.title} lead={screen.lead} />
      <TruthList items={screen.truths} />
      <BuildNote>
        The session list is not switched on yet. Your therapist will still be in
        touch through the chat when it is.
      </BuildNote>
    </section>
  )
}
