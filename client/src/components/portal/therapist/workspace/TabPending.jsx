import { TAB_PENDING, TAB_PENDING_NOTE } from '../../../../data/therapistPortalContent'
import { WORKSPACE_TAB_ICONS } from '../workspaceIcons'

/**
 * A tab whose feature is not built yet — chat (8.3), worksheets (8.4),
 * sessions (9.2), journal and notes (8.6).
 *
 * ONE COMPONENT, FOUR DIFFERENT EXPLANATIONS. Each carries what §8 says that
 * tab will actually do, so these are four honest descriptions rather than the
 * same sentence under four titles — which is precisely the stack of identical
 * rectangles the standing directive rules out.
 *
 * It says plainly that the part is not switched on. A screen that describes a
 * feature warmly and then does nothing reads as broken software, and a
 * therapist is entitled to know which it is. NO TIMELINE — none has been
 * agreed, and a missed date reads worse than saying nothing (3.5, 7.1, 8.1).
 */
export default function TabPending({ slug }) {
  const copy = TAB_PENDING[slug]
  const Icon = WORKSPACE_TAB_ICONS[slug]

  if (!copy) return null

  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl bg-paper px-5 py-6 shadow-[0_18px_50px_-28px_rgba(25,18,43,0.35)] sm:px-7 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-sage/10 blur-[130px]"
      />

      <div className="relative flex items-start gap-4">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-sage/15 text-sage-deep"
        >
          <Icon size={20} />
        </span>

        <div className="min-w-0">
          <h2 className="font-body text-ui font-medium text-ink">{copy.title}</h2>
          <p className="mt-1.5 max-w-measure font-body text-ui leading-relaxed text-ink/70">
            {copy.body}
          </p>
        </div>
      </div>

      <p className="relative mt-6 border-t border-ink/12 pt-4 font-body text-caption text-ink/70">
        {TAB_PENDING_NOTE}
      </p>
    </section>
  )
}
