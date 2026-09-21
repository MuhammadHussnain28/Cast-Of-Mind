import { useId, useState } from 'react'
import { STATUS_FILTERS } from '../../../data/subscriptionStates'
import { LEDGER } from '../../../data/adminBookingContent'
import { cx } from '../../../lib/cx'

/**
 * The summary the brief asks for, as the control the admin steers the table by.
 *
 * One thin bar draws the mix of states in what the admin is looking at; the
 * chips beneath it are both its legend and the filter. Each number appears
 * ONCE, in its chip — the bar is the drawing of those numbers, not a second copy
 * of them — and every count follows the search, so this summarises the table,
 * never the business. The dashboard owns the business (4.4).
 *
 * Hovering or focusing a chip lights its slice and dims the rest; choosing one
 * keeps it lit. The bar answers "which part of the whole am I looking at?".
 *
 * On ink because that is the only ground in this portal where gold can mark the
 * cancelled slice (11.08:1 against 1.63:1 on paper), and because the same dark
 * command surface opens every admin detail screen.
 *
 * COLOUR IS NEVER ALONE. The bar is aria-hidden; the chips carry every word and
 * number. "No subscription" is drawn HOLLOW rather than filled, so it differs
 * from "Payment failed" by shape as well as hue.
 */

// Validated against ink-deep with the dataviz checker: colourblind separation
// ΔE 10.9 (worst adjacent, sage↔clay), normal vision 19.1, every fill ≥ 3:1.
// It flags gold as too light and sage and the grey as low-chroma: those are
// categorical-palette checks, this is a status encoding on a fixed brand
// palette, and the grey is meant to read as neutral.
const MARKS = {
  active: { bar: 'bg-sage', dotDark: 'bg-sage', dotLight: 'bg-sage' },
  past_due: { bar: 'bg-clay', dotDark: 'bg-clay', dotLight: 'bg-clay' },
  cancelled: { bar: 'bg-gold', dotDark: 'bg-gold', dotLight: 'bg-gold ring-1 ring-inset ring-ink/30' },
  expired: { bar: 'bg-paper/35', dotDark: 'bg-paper/35', dotLight: 'bg-ink/35' },
  none: {
    bar: 'ring-1 ring-inset ring-clay',
    dotDark: 'ring-[1.5px] ring-inset ring-clay',
    dotLight: 'ring-[1.5px] ring-inset ring-clay',
  },
}

const SEGMENT_ORDER = ['active', 'past_due', 'cancelled', 'expired', 'none']

export default function StatusLedger({ counts, status, onSelect, searching = false }) {
  const headingId = useId()
  const [hovered, setHovered] = useState(null)

  const ready = counts != null
  const total = ready ? SEGMENT_ORDER.reduce((sum, key) => sum + (counts[key] ?? 0), 0) : null
  const lit = hovered ?? (status !== 'all' ? status : null)

  const filters = STATUS_FILTERS.filter(
    (filter) => !filter.onlyWhenPresent || (counts?.[filter.key] ?? 0) > 0,
  )

  return (
    <section
      data-surface="dark"
      aria-labelledby={headingId}
      className="relative overflow-hidden rounded-3xl bg-ink-deep px-5 py-6 sm:px-7 sm:py-7"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-20 size-72 rounded-full bg-sage/10 blur-[130px]"
      />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 id={headingId} className="font-body text-ui font-medium text-paper">
            {LEDGER.heading}
          </h2>
          {ready && (
            <p className="font-body text-caption text-paper/70">
              {total === 0
                ? LEDGER.empty
                : searching
                  ? LEDGER.searchCaption(total)
                  : LEDGER.allCaption(total)}
            </p>
          )}
        </div>

        {/* The drawing. 2px ink gaps separate the slices, so neighbours read as
            distinct because of the gap rather than a stroke drawn round them. */}
        <div aria-hidden="true" className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-[4px]">
          {!ready || total === 0 ? (
            <span
              className={cx('flex-1 rounded-[4px] bg-paper/10', !ready && 'motion-safe:animate-pulse')}
            />
          ) : (
            SEGMENT_ORDER.filter((key) => counts[key] > 0).map((key) => (
              <span
                key={key}
                style={{ flexGrow: counts[key] }}
                className={cx(
                  'min-w-1.5 basis-0 transition-[flex-grow,opacity] duration-200 ease-out motion-reduce:transition-none',
                  MARKS[key].bar,
                  lit && lit !== key && 'opacity-30',
                )}
              />
            ))
          )}
        </div>

        <div role="group" aria-label={LEDGER.groupLabel} className="flex flex-wrap gap-1.5">
          {filters.map((filter) => {
            const selected = filter.key === status
            const count = filter.key === 'all' ? total : counts?.[filter.key]
            const mark = MARKS[filter.key]

            return (
              <button
                key={filter.key}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(filter.key)}
                onMouseEnter={() => setHovered(filter.key === 'all' ? null : filter.key)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(filter.key === 'all' ? null : filter.key)}
                onBlur={() => setHovered(null)}
                className={cx(
                  'inline-flex min-h-11 items-center gap-2 rounded-full px-4',
                  'font-body text-caption font-medium transition-colors duration-200 ease-out',
                  selected ? 'bg-paper text-ink' : 'text-paper hover:bg-paper/10',
                )}
              >
                {mark && (
                  <span
                    aria-hidden="true"
                    className={cx('size-2 shrink-0 rounded-full', selected ? mark.dotLight : mark.dotDark)}
                  />
                )}
                {filter.label}
                {count != null && (
                  <span className={cx('tabular-nums', selected ? 'text-ink/70' : 'text-paper/70')}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
