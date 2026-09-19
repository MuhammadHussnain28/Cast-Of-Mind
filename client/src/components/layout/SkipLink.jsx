/**
 * Hidden until it is focused. Without it, a keyboard user has to tab past
 * every navbar link on every page before reaching the content.
 *
 * `target` exists for the therapist inbox (8.1), where the primary content is
 * not always `#main`: at the phone's list view the workspace column is not
 * rendered, so a link pointing at it would move focus nowhere at all — worse
 * than no skip link, because it looks like it worked.
 */
export default function SkipLink({ target = '#main' }) {
  return (
    <a
      href={target}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70]
                 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-full
                 focus:bg-ink focus:px-5 focus:font-body focus:text-caption focus:text-paper"
    >
      Skip to content
    </a>
  )
}
