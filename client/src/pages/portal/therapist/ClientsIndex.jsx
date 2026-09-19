import { InboxIcon } from '../../../components/portal/therapist/TherapistPortalIcons'
import { NO_CLIENT_SELECTED } from '../../../data/therapistPortalContent'

/**
 * The right-hand pane with nobody selected — desktop only.
 *
 * On a phone the list IS `/portal`, so this never renders there; the shell
 * hides the workspace column entirely at that width.
 *
 * Designed rather than blank (§24.8), and quiet rather than instructive: the
 * list beside it already shows what to do, so a panel explaining how to click a
 * name would be furniture. It says what this space is for and stops.
 */
export default function ClientsIndex() {
  return (
    <div className="relative flex flex-1 items-center justify-center py-10">
      {/* The house wash, behind the content, felt before it is noticed. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 size-72 -translate-x-1/2 rounded-full bg-sage/10 blur-[130px]"
      />

      <div className="relative max-w-sm text-center">
        <span
          aria-hidden="true"
          className="inline-flex size-14 items-center justify-center rounded-full bg-sage/15 text-sage-deep"
        >
          <InboxIcon size={26} />
        </span>

        <h1 className="mt-5 font-body text-subsection font-medium text-ink">
          {NO_CLIENT_SELECTED.title}
        </h1>
        <p className="mt-2.5 font-body text-ui leading-relaxed text-ink/70">
          {NO_CLIENT_SELECTED.body}
        </p>
      </div>
    </div>
  )
}
