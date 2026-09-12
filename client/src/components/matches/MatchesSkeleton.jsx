export default function MatchesSkeleton() {
  return (
    <div aria-hidden="true" className="w-full select-none py-2">
      {/* Top Header Controls Placeholder */}
      <div className="mb-6 flex items-center justify-between px-2">
        <div className="h-5 w-48 rounded bg-ink/10 motion-safe:animate-pulse" />
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-full bg-ink/10 motion-safe:animate-pulse" />
          <div className="h-10 w-10 rounded-full bg-ink/10 motion-safe:animate-pulse" />
        </div>
      </div>

      {/* Center Horizontal Card Skeleton */}
      <div className="flex justify-center">
        <div className="w-[94vw] max-w-[750px] overflow-hidden rounded-3xl border border-ink/10 bg-paper shadow-md flex flex-col sm:flex-row">
          {/* Left Photo Placeholder */}
          <div className="h-44 sm:h-[370px] sm:w-[280px] shrink-0 bg-ink/10 motion-safe:animate-pulse" />

          {/* Right Content Placeholder */}
          <div className="flex flex-1 flex-col justify-between p-6 sm:p-8 space-y-4">
            <div className="space-y-3">
              <div className="h-6 w-3/4 rounded bg-ink/10 motion-safe:animate-pulse" />
              <div className="h-4 w-1/3 rounded bg-ink/10 motion-safe:animate-pulse" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-20 rounded-full bg-ink/10 motion-safe:animate-pulse" />
                <div className="h-6 w-24 rounded-full bg-ink/10 motion-safe:animate-pulse" />
              </div>
              <div className="h-4 w-full rounded bg-ink/10 motion-safe:animate-pulse pt-2" />
              <div className="h-4 w-5/6 rounded bg-ink/10 motion-safe:animate-pulse" />
            </div>

            <div className="pt-4 border-t border-ink/10 flex items-center justify-between">
              <div className="h-4 w-32 rounded bg-ink/10 motion-safe:animate-pulse" />
              <div className="h-10 w-28 rounded-xl bg-ink/10 motion-safe:animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}