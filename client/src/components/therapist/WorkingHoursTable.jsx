import { cx } from '../../lib/cx'
import { detail } from '../../data/matchesContent'

/**
 * Their hours and yours, side by side.
 *
 * Both columns rather than only the converted one (developer's decision), and
 * it turns out to be the safer choice: seeing what was converted FROM makes the
 * daylight-saving caveat legible instead of hidden behind numbers the reader
 * has no way to check.
 *
 * A real <table>, because this genuinely is tabular — three columns of related
 * values with row and column headers a screen reader should announce.
 */
export default function WorkingHoursTable({ rows, theirZone, yourZone }) {
  const anyCrossing = rows.some((row) => row.crossesDay)

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Working hours in {theirZone} and in your time zone, {yourZone}
          </caption>
          <thead>
            <tr className="border-b border-ink/12">
              <th scope="col" className="py-2 pr-4 font-body text-caption font-medium text-ink/70">
                <span className="sr-only">Day</span>
              </th>
              <th scope="col" className="py-2 pr-4 font-body text-caption font-medium text-ink/70">
                {detail.hoursTheirs}
              </th>
              <th scope="col" className="py-2 font-body text-caption font-medium text-ink">
                {detail.hoursYours}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-ink/8 last:border-0">
                <th
                  scope="row"
                  className="whitespace-nowrap py-3 pr-4 font-body text-ui font-normal text-ink"
                >
                  {row.label}
                </th>

                <td
                  data-numeric
                  className={cx(
                    'whitespace-nowrap py-3 pr-4 font-body text-ui',
                    row.enabled ? 'text-ink/70' : 'text-ink/60',
                  )}
                >
                  {row.enabled ? row.theirs : detail.hoursClosed}
                </td>

                <td
                  data-numeric
                  className={cx(
                    'whitespace-nowrap py-3 font-body text-ui',
                    row.enabled ? 'text-ink' : 'text-ink/60',
                  )}
                >
                  {row.enabled ? (
                    <>
                      {row.crossesDay && (
                        <span className="text-ink/70">{row.yours.startDay} </span>
                      )}
                      {row.yours.startTime}
                      <span className="text-ink/70"> – </span>
                      {row.crossesDay && row.yours.endDay !== row.yours.startDay && (
                        <span className="text-ink/70">{row.yours.endDay} </span>
                      )}
                      {row.yours.endTime}
                    </>
                  ) : (
                    detail.hoursClosed
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 space-y-1">
        <p className="font-body text-caption text-ink/70">
          {detail.hoursTheirs}: {theirZone} · {detail.hoursYours}: {yourZone}
        </p>
        {anyCrossing && (
          <p className="font-body text-caption text-ink/70">{detail.crossesDay}</p>
        )}
        <p className="font-body text-caption text-ink/70">{detail.hoursNote}</p>
      </div>
    </div>
  )
}
