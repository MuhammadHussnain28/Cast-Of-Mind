import {
  BuildNote,
  ScreenHeader,
  TruthList,
} from '../../../components/portal/client/ScreenScaffold'
import { SCREENS } from '../../../data/clientPortalContent'
import { Text } from '../../../components/ui'

/**
 * §7.3. The transparency note LEADS this screen.
 *
 * The spec requires it visible in the UI for trust and legal clarity, and where
 * it sits is the whole point: a client deciding how honestly to write should
 * meet that fact before they start, not in small print underneath. It gets the
 * sage-edged panel treatment the specialty picker and the therapist's verified
 * fields use — this project's "read this one first" surface.
 */
export default function Journal() {
  const screen = SCREENS.journal

  return (
    <section>
      <ScreenHeader title={screen.title} lead={screen.lead} />

      <div className="mt-7 rounded-2xl bg-sage/8 px-5 py-5 ring-1 ring-sage/40">
        <p className="font-body text-ui font-medium text-ink">Your therapist reads this</p>
        <Text size="ui" tone="muted" className="mt-2 max-w-measure">
          {screen.transparency}
        </Text>
      </div>

      <TruthList items={screen.truths} />

      <BuildNote>
        Writing is not switched on yet, so there is nothing here to keep private
        or to share.
      </BuildNote>
    </section>
  )
}
