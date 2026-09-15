/**
 * The first load of the portal shell.
 *
 * A skeleton of the real thing rather than a spinner floating in an empty
 * content area — the lesson recorded in chunk 4.4, where a refetch replacing
 * correct data with grey bars jumped the layout. This renders the shape the
 * portal is about to take, so nothing moves when the data lands.
 *
 * The pulse carries `motion-safe:` so it holds still for anyone who asked for
 * less motion — the same modifier the admin DataTable's skeleton rows use.
 */
export default function PortalSkeleton() {
  return (
    <div className="min-h-dvh bg-mist lg:grid lg:grid-cols-[272px_1fr]">
      <div aria-hidden="true" className="hidden bg-ink lg:block">
        <div className="flex items-start gap-3 px-5 pb-5 pt-6">
          <div className="size-12 shrink-0 rounded-full bg-paper/10 motion-safe:animate-pulse" />
          <div className="mt-1 flex-1 space-y-2">
            <div className="h-3.5 w-28 rounded bg-paper/10 motion-safe:animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-paper/10 motion-safe:animate-pulse" />
          </div>
        </div>

        <div className="space-y-1 px-3">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex min-h-11 items-center gap-3 px-3">
              <div className="size-5 shrink-0 rounded bg-paper/10 motion-safe:animate-pulse" />
              <div className="h-3 w-24 rounded bg-paper/10 motion-safe:animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-8 sm:px-6 lg:px-10">
        <div aria-hidden="true" className="max-w-2xl space-y-4">
          <div className="h-7 w-40 rounded bg-ink/10 motion-safe:animate-pulse" />
          <div className="h-4 w-full max-w-md rounded bg-ink/10 motion-safe:animate-pulse" />
          <div className="h-32 rounded-2xl bg-ink/10 motion-safe:animate-pulse" />
        </div>
        <p className="sr-only" role="status">
          Loading your portal
        </p>
      </div>
    </div>
  )
}
