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
    <>
      {/* ========================================================
          PREVIOUS VERSION (SAVED FOR BACKUP)
          ========================================================
      <div className="px-4 pb-4 pt-5 sm:px-6 lg:px-10 ">
        <div className="flex items-start gap-4">
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

        {ended && (
          <p className="mt-3.5 flex items-start gap-2 border-t border-ink/12 pt-3 font-body text-caption text-ink/70">
            <LeafIcon size={16} className="mt-0.5 shrink-0 text-sage-deep" />
            {IDENTITY_STRIP.endedNotice}
          </p>
        )}
      </div>
      ======================================================== */}

      {/* ========================================================
          NEW VERSION (ACTIVE: INK BAND IDENTITY STRIP)
          ======================================================== */}
      <div
        data-surface="dark"
        className="relative overflow-hidden bg-ink text-paper px-4 py-4 sm:px-6 sm:py-5 lg:px-10 lg:pt-6 lg:pb-5"
      >
        {/* Ambient sage glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-sage/15 blur-[90px]"
        />

        <div className="relative flex items-center lg:items-start gap-3.5 sm:gap-4">
          <ClientMonogram name={name} size="lg" tone="dark" selected />

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl sm:text-2xl lg:text-3xl font-normal text-paper tracking-tight">
              {name}
            </h1>

            <p className="mt-0.5 sm:mt-1 font-body text-caption text-paper/70 truncate">
              {where && <span>{where}</span>}
              {where && <span aria-hidden="true"> · </span>}
              <span>{IDENTITY_STRIP.since(formatDate(client.matchedAt))}</span>
            </p>

            {/* Concern chips: visible on desktop, hidden on mobile/tablet to liberate space */}
            {concernTags?.length > 0 && (
              <div className="mt-3 hidden lg:flex flex-wrap gap-1.5">
                <h2 className="sr-only">{IDENTITY_STRIP.concernsLabel}</h2>
                {concernTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-paper/10 border border-paper/15 px-3 py-0.5 font-body text-caption font-medium text-paper/85"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {ended && (
          <p className="relative mt-3 flex items-start gap-2 border-t border-paper/15 pt-2.5 font-body text-caption text-paper/75">
            <LeafIcon size={16} className="mt-0.5 shrink-0 text-sage" />
            {IDENTITY_STRIP.endedNotice}
          </p>
        )}
      </div>
    </>
  )
}
