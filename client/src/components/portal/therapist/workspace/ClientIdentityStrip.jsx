import ClientMonogram from '../ClientMonogram'
import ConcernChips from './ConcernChips'
import { LeafIcon } from '../TherapistPortalIcons'
import { formatDate } from '../../../../lib/dateFormat'
import { IDENTITY_STRIP } from '../../../../data/therapistPortalContent'

/**
 * Who the therapist is looking at — master spec §8.2.
 *
 * IT STAYS VISIBLE. The workspace makes this and the tabs ONE sticky block, so
 * the strip never scrolls away from the tabs it belongs to. The one failure
 * mode of an inbox is losing track of whose record is on screen; everything
 * below swaps when a tab changes, and this does not.
 *
 * Name, where they are, what they came with, and how long they have been a
 * client — §8.2's own four. The concerns are chips rather than prose because
 * they are what a therapist actually reads here.
 *
 * At phone widths the chips run on ONE horizontally scrolling line rather than
 * wrapping. Four tags wrapping to three rows would push the tabs off a 360px
 * screen, and a sticky header that eats a third of the viewport is not a header
 * that helps.
 */
export default function ClientIdentityStrip({ client, ended }) {
  const { name, country, city, concernTags } = client.client
  const where = [city, country].filter(Boolean).join(', ')

  return (
    <div className="px-4 pb-4 pt-5 sm:px-6 lg:px-10 ">
      <div className="flex items-start gap-4">
        {/* Light tone: this sits on paper, not on the ink rail. */}
        <ClientMonogram name={name} size="lg" tone="light" />

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-body text-subsection font-medium text-ink">{name}</h1>

          <p className="mt-1 font-body text-caption text-ink/70">
            {where && <span>{where}</span>}
            {where && <span aria-hidden="true"> · </span>}
            <span>{IDENTITY_STRIP.since(formatDate(client.matchedAt))}</span>
          </p>
        </div>
      </div>

      {concernTags?.length > 0 && (
        <div className="mt-3.5">
          <h2 className="sr-only">{IDENTITY_STRIP.concernsLabel}</h2>
          <ConcernChips
            tags={concernTags}
            className="flex-nowrap overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible"
          />
        </div>
      )}

      {/* An ended booking still loads — 7.2 keeps the record clinically theirs
          — so the strip has to say which it is rather than looking identical to
          a live one. Sage, not clay: nothing has gone wrong. */}
      {ended && (
        <p className="mt-3.5 flex items-start gap-2 border-t border-ink/12 pt-3 font-body text-caption text-ink/70">
          <LeafIcon size={16} className="mt-0.5 shrink-0 text-sage-deep" />
          {IDENTITY_STRIP.endedNotice}
        </p>
      )}
    </div>
  )
}
