import { Text } from '../../ui'

const DAYS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
]

/**
 * The applicant's week, read back the way they filled it in.
 *
 * Fourteen separate time values in a field list is unreadable, and the shape of
 * someone's availability is the thing the reviewer is actually judging. Days
 * off are shown rather than omitted, so the week is complete at a glance.
 *
 * These are wall-clock times in the applicant's own timezone, not timestamps —
 * "09:00 on Mondays" is a recurring local intention. The timezone is shown
 * beside them, which is what makes them meaningful.
 */
/*
======================================================================
PREVIOUS IMPLEMENTATION (SAVED FOR BACKUP):
======================================================================
export default function WorkingHoursSummary({ workingHours, timezone }) {
  if (!workingHours) {
    return (
      <Text size="ui" tone="muted">
        Not provided
      </Text>
    )
  }

  return (
    <div className="rounded-2xl border border-ink/12 ">
      <ul className="divide-y divide-ink/12">
        {DAYS.map(([key, label]) => {
          const day = workingHours[key]
          const open = Boolean(day?.enabled && day.start && day.end)

          return (
            <li key={key} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
              <span className="font-body text-caption text-ink/70">{label}</span>
              {open ? (
                <span className="font-body text-ui tabular-nums text-ink">
                  {day.start} – {day.end}
                </span>
              ) : (
                <span className="font-body text-caption text-ink/60">Not available</span>
              )}
            </li>
          )
        })}
      </ul>

      <div className="border-t border-ink/12 px-4 py-3">
        <Text size="caption" tone="muted">
          Times are in the applicant&rsquo;s own timezone
          {timezone ? `, ${timezone}` : ''}.
        </Text>
        {workingHours.note && (
          <Text size="caption" className="mt-2 whitespace-pre-line">
            {workingHours.note}
          </Text>
        )}
      </div>
    </div>
  )
}
======================================================================
*/

export default function WorkingHoursSummary({ workingHours, timezone }) {
  if (!workingHours) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 bg-mist/40 p-5 text-center">
        <Text size="ui" tone="muted">
          Not provided
        </Text>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-2xs">
      <ul className="divide-y divide-ink/8">
        {DAYS.map(([key, label]) => {
          const day = workingHours[key]
          const open = Boolean(day?.enabled && day.start && day.end)

          return (
            <li
              key={key}
              className={`flex items-center justify-between gap-4 px-4 py-3 transition-colors sm:px-5 ${
                open ? 'hover:bg-mist/30' : 'bg-mist/15'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`size-2 shrink-0 rounded-full ${
                    open ? 'bg-sage-deep' : 'bg-ink/20'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`font-body ${
                    open ? 'text-ui font-medium text-ink' : 'text-caption text-ink/60'
                  }`}
                >
                  {label}
                </span>
              </div>

              {open ? (
                <span className="inline-flex items-center rounded-lg border border-ink/10 bg-mist/60 px-2.5 py-1 font-body text-ui font-semibold tabular-nums text-ink shadow-2xs">
                  {day.start} – {day.end}
                </span>
              ) : (
                <span className="font-body text-caption italic text-ink/40">
                  Not available
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <div className="border-t border-ink/8 bg-mist/30 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 text-ink/70">
          <svg
            className="size-3.5 shrink-0 text-sage-deep"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <Text size="caption" tone="muted" className="text-ink/70">
            Times are in the applicant&rsquo;s own timezone
            {timezone ? `, ${timezone}` : ''}.
          </Text>
        </div>

        {workingHours.note && (
          <div className="mt-2.5 rounded-xl border border-ink/8 bg-paper p-3 text-ink/80 shadow-2xs">
            <span className="mb-0.5 block font-body text-[0.7rem] font-semibold uppercase tracking-wider text-ink/60">
              Therapist note
            </span>
            <Text size="caption" className="whitespace-pre-line leading-relaxed text-ink/80">
              {workingHours.note}
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}
