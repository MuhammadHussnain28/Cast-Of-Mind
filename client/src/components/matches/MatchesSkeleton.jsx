/**
 * Shown while matching runs. Skeleton cards rather than a spinner, so the page
 * does not jump when the real ones arrive — the same choice the admin DataTable
 * made in chunk 4.1.
 */
export default function MatchesSkeleton({ count = 4 }) {
  return (
    <div aria-hidden="true" className="grid gap-6 sm:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-ink/12 bg-paper">
          <div className="aspect-[4/5] w-full bg-ink/8 motion-safe:animate-pulse" />
          <div className="space-y-3 p-6">
            <div className="h-5 w-2/3 rounded bg-ink/10 motion-safe:animate-pulse" />
            <div className="h-3 w-1/3 rounded bg-ink/8 motion-safe:animate-pulse" />
            <div className="flex gap-2 pt-2">
              <div className="h-6 w-20 rounded-full bg-ink/8 motion-safe:animate-pulse" />
              <div className="h-6 w-24 rounded-full bg-ink/8 motion-safe:animate-pulse" />
            </div>
            <div className="h-3 w-full rounded bg-ink/8 motion-safe:animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-ink/8 motion-safe:animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
