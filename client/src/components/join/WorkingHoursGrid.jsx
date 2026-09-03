import { DAYS } from '../../lib/validation/therapistApplication'
import { cx } from '../../lib/cx'

/**
 * Working hours as a week you can see.
 *
 * Each enabled day draws its span across a shared 24-hour track, so a therapist
 * checks the SHAPE of their week at a glance instead of re-reading fourteen
 * time values. The bar is the point of this control; the inputs are how you
 * change it.
 *
 * Times are native <input type="time"> — a real picker, keyboard-correct, and
 * its value is always 24-hour "HH:MM" regardless of the locale it displays in,
 * which is exactly the format the API stores.
 */

const MINUTES_IN_DAY = 24 * 60

function toMinutes(time) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time ?? '')
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

/** Left offset and width as percentages of the 24-hour track. */
function span(start, end) {
  const from = toMinutes(start)
  const to = toMinutes(end)
  if (from === null || to === null || to <= from) return null

  return {
    left: `${(from / MINUTES_IN_DAY) * 100}%`,
    width: `${((to - from) / MINUTES_IN_DAY) * 100}%`,
  }
}

export default function WorkingHoursGrid({ value, onChange, errors = {}, rootError }) {
  const update = (dayKey, patch) => {
    onChange({ ...value, [dayKey]: { ...value[dayKey], ...patch } })
  }

  /** Applies the first enabled day's times to every other enabled day. */
  const copyToAll = () => {
    const source = DAYS.map((d) => value[d.key]).find((d) => d?.enabled)
    if (!source) return

    const next = { ...value }
    for (const day of DAYS) {
      if (next[day.key]?.enabled) {
        next[day.key] = { ...next[day.key], start: source.start, end: source.end }
      }
    }
    onChange(next)
  }

  const enabledCount = DAYS.filter((d) => value[d.key]?.enabled).length

  return (
    <fieldset className="min-w-0" data-field="workingHours">
      <legend className="font-body text-caption font-medium text-ink">
        When you are available
        <span className="ml-1 text-clay" aria-hidden="true">*</span>
        <span className="sr-only"> (required)</span>
      </legend>

      <p className="mt-1 font-body text-caption text-ink/70">
        Shown to clients in their own timezone, so they know when you are reachable.
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-ink/12">
        {/* Hour ruler — gives the bars below a scale to be read against. */}
        <div aria-hidden="true" className="hidden border-b border-ink/10 bg-mist px-4 py-2 sm:block">
          <div className="ml-[136px] flex justify-between font-body text-[10px] tabular-nums text-ink/60">
            {['00', '06', '12', '18', '24'].map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
        </div>

        <ul>
          {DAYS.map((day, i) => {
            const entry = value[day.key] ?? { enabled: false, start: '', end: '' }
            const bar = entry.enabled ? span(entry.start, entry.end) : null
            const dayError = errors[day.key]

            return (
              <li
                key={day.key}
                className={cx(
                  'px-4 py-3',
                  i > 0 && 'border-t border-ink/8',
                  entry.enabled ? 'bg-paper' : 'bg-mist/40',
                )}
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  {/* Toggle — a real checkbox, visually hidden behind its label. */}
                  <label className="flex min-h-11 w-full cursor-pointer items-center gap-3 sm:w-[120px] sm:shrink-0">
                    <input
                      type="checkbox"
                      checked={Boolean(entry.enabled)}
                      onChange={(e) => update(day.key, { enabled: e.target.checked })}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={cx(
                        'relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-200',
                        'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink',
                        // ink/20 alone was 1.53:1 and failed the 3:1 floor for a
                        // control boundary. The border carries it at 3.43:1.
                        entry.enabled ? 'border-sage bg-sage' : 'border-ink/50 bg-mist',
                      )}
                    >
                      <span
                        className={cx(
                          'absolute top-0.5 h-4 w-4 rounded-full transition-transform duration-200',
                          // A white knob is invisible on the light off-track, so
                          // off is a dark dot (4.56:1) and on is a white one (3.40:1).
                          entry.enabled ? 'translate-x-[17px] bg-paper' : 'translate-x-0.5 bg-ink/60',
                        )}
                      />
                    </span>
                    <span
                      className={cx(
                        'font-body text-ui',
                        entry.enabled ? 'text-ink' : 'text-ink/60',
                      )}
                    >
                      {day.label}
                    </span>
                  </label>

                  {entry.enabled ? (
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                      <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
                        <input
                          type="time"
                          value={entry.start}
                          onChange={(e) => update(day.key, { start: e.target.value })}
                          aria-label={`${day.label} start time`}
                          className="min-h-11 w-full min-w-0 flex-1 rounded-xl border border-ink/50 bg-paper px-2 font-body text-ui tabular-nums text-ink-deep sm:w-auto sm:flex-none sm:px-3 transition-[border-color,box-shadow] duration-200 focus:border-sage focus:shadow-[0_0_0_4px_rgb(124_144_130_/_0.15)]"
                        />
                        <span aria-hidden="true" className="font-body text-caption text-ink/60">
                          to
                        </span>
                        <input
                          type="time"
                          value={entry.end}
                          onChange={(e) => update(day.key, { end: e.target.value })}
                          aria-label={`${day.label} end time`}
                          className="min-h-11 w-full min-w-0 flex-1 rounded-xl border border-ink/50 bg-paper px-2 font-body text-ui tabular-nums text-ink-deep sm:w-auto sm:flex-none sm:px-3 transition-[border-color,box-shadow] duration-200 focus:border-sage focus:shadow-[0_0_0_4px_rgb(124_144_130_/_0.15)]"
                        />
                      </div>

                      {/* The span, drawn. Decorative — the times above are the data. */}
                      <div
                        aria-hidden="true"
                        className="relative hidden h-2 min-w-24 flex-1 rounded-full bg-ink/8 lg:block"
                      >
                        {bar && (
                          <span
                            className="absolute inset-y-0 rounded-full bg-sage transition-[left,width] duration-200 ease-out"
                            style={bar}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="font-body text-caption text-ink/60">Not available</span>
                  )}
                </div>

                {dayError && (
                  <p role="alert" className="mt-2 font-body text-caption text-clay">
                    {dayError}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-caption text-ink/60">
          {enabledCount === 0
            ? 'No days selected yet.'
            : `${enabledCount} ${enabledCount === 1 ? 'day' : 'days'} a week.`}
        </p>

        {enabledCount > 1 && (
          <button
            type="button"
            onClick={copyToAll}
            className="min-h-11 font-body text-caption text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
          >
            Use the same times every day
          </button>
        )}
      </div>

      {rootError && (
        <p role="alert" className="mt-2 font-body text-caption text-clay">
          {rootError}
        </p>
      )}
    </fieldset>
  )
}
