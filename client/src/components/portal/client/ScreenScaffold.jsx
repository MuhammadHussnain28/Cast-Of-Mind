import { Heading, Text } from '../../ui'
import { cx } from '../../../lib/cx'

export function ScreenHeader({ title, lead, icon: Icon, category, badge, className }) {
  return (
    <header
      className={cx(
        'rounded-2xl sm:rounded-3xl bg-paper border border-ink/8 p-6 sm:p-7 shadow-[0_10px_30px_-12px_rgba(25,18,43,0.08),0_2px_8px_-2px_rgba(25,18,43,0.03)]  border-l-4 border-l-ink',
        className,
      )}
    >

      {(Icon || category || badge) && (
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-xl bg-sage/15 text-sage-deep ring-1 ring-sage/20 shrink-0"
              >
                <Icon size={18} className="stroke-[1.75]" />
              </div>
            )}
            {category && (
              <span className="font-body text-caption font-semibold uppercase tracking-wider text-sage-deep truncate">
                {category}
              </span>
            )}
          </div>

          {badge && (
            <span className="inline-flex items-center px-3 py-1 rounded-full font-body text-caption font-semibold bg-mist text-ink border border-ink/8 shadow-2xs shrink-0">
              {badge}
            </span>
          )}
        </div>
      )}

      <div>
        <Heading
          level={1}
          size="section"
          className="font-display text-2xl sm:text-3xl font-normal text-ink-deep tracking-tight"
        >
          {title}
        </Heading>

        {lead && (
          <Text tone="muted" className="mt-2 max-w-2xl leading-relaxed text-sm sm:text-base">
            {lead}
          </Text>
        )}
      </div>
    </header>
  )
}

/**
 * Facts about how something works, threaded on one hairline.
 *
 * Not four cards — same-size cards of mark plus text as the page structure is
 * the category default, and it would turn three different facts into three
 * identical rectangles. The rail makes them read as one connected explanation.
 */
export function TruthList({ items }) {
  return (
    <ul className="relative mt-7 space-y-5 border-l border-sage/40 pl-6">
      {items.map((item) => (
        <li key={item} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[1.6875rem] top-[0.5625rem] size-2 rounded-full bg-sage-deep ring-4 ring-mist"
          />
          <Text size="ui" tone="muted" className="max-w-measure">
            {item}
          </Text>
        </li>
      ))}
    </ul>
  )
}

/**
 * Said plainly on every screen this chunk leaves unbuilt.
 *
 * A screen that describes a feature warmly and does nothing would otherwise
 * read as broken software, and someone paying €200 a month deserves to be told
 * which it is. NO TIMELINE — none has been agreed, and a missed date reads
 * worse than saying nothing, the same call made on the therapist application's
 * confirmation screen (3.5).
 */
export function BuildNote({ children }) {
  return (
    <p className="mt-8 border-t border-ink/12 pt-4 font-body text-caption text-ink/70">
      {children}
    </p>
  )
}
