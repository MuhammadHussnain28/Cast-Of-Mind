import { useId } from 'react'
import { cx } from '../../../lib/cx'

// Four sessions a cycle, one a week, drawn as four marks on a thread: filled for
// what is left. Shared by both portals (9.4, 9.5) and the admin's client screen
// (10.1), so all three draw it identically.
// `row` sets the marks beside the words, for a wide column.
// `bare` drops the card, for a caller that already has its own surface —
// nesting a second shadowed card inside one is what it avoids.
export default function SessionCounter({
  left,
  total = 4,
  title,
  caption,
  layout = 'stack',
  bare = false,
  className,
}) {
  const headingId = useId()
  if (left == null) return null
  const row = layout === 'row'

  const marks = (
    <div aria-hidden="true" className={cx('relative flex items-center justify-between px-1', row ? 'w-40 shrink-0' : 'mt-4')}>
      <span className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-ink/12" />
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cx(
            'relative size-5 rounded-full transition-colors duration-200',
            i < left ? 'bg-sage-deep' : 'bg-paper ring-[1.5px] ring-inset ring-ink/50',
          )}
        />
      ))}
    </div>
  )

  return (
    <section
      aria-labelledby={headingId}
      className={cx(
        !bare && 'rounded-2xl bg-paper px-5 py-5 shadow-[0_18px_50px_-28px_rgba(25,18,43,0.35)] sm:px-6',
        row && 'flex flex-wrap items-center gap-x-6 gap-y-3',
        className,
      )}
    >
      {row && marks}
      <div className={cx(row && 'min-w-0 flex-1 basis-48')}>
        <h2 id={headingId} className="font-body text-ui font-medium text-ink">
          {title}
        </h2>
        {!row && marks}
        {caption && (
          <p className={cx('font-body text-caption leading-relaxed text-ink/70', row ? 'mt-0.5' : 'mt-4')}>{caption}</p>
        )}
      </div>
    </section>
  )
}
