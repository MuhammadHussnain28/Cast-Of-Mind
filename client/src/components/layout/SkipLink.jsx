/**
 * Hidden until it is focused. Without it, a keyboard user has to tab past
 * every navbar link on every page before reaching the content.
 */
export default function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70]
                 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-full
                 focus:bg-ink focus:px-5 focus:font-body focus:text-caption focus:text-paper"
    >
      Skip to content
    </a>
  )
}
