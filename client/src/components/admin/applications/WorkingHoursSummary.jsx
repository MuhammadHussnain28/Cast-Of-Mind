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
export default function WorkingHoursSummary({ workingHours, timezone }) {
  if (!workingHours) {
    return (
      <Text size="ui" tone="muted">
        Not provided
      </Text>
    )
  }

  return (
    <div className="rounded-2xl border border-ink/12">
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
