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
              <th
                scope="col"
                className="py-2 pr-4 font-body text-caption font-medium text-ink/70"
              >
                <span className="sr-only">Day</span>
              </th>
              <th
                scope="col"
                className="py-2 pr-4 font-body text-caption font-medium text-ink/70"
              >
                {detail.hoursTheirs}
              </th>
              <th
                scope="col"
                className="py-2 font-body text-caption font-medium text-ink"
              >
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
                    "whitespace-nowrap py-3 pr-4 font-body text-ui",
                    row.enabled ? "text-ink/70" : "text-ink/60",
                  )}
                >
                  {row.enabled ? row.theirs : detail.hoursClosed}
                </td>

                <td
                  data-numeric
                  className={cx(
                    "whitespace-nowrap py-3 font-body text-ui",
                    row.enabled ? "text-ink" : "text-ink/60",
                  )}
                >
                  {row.enabled ? (
                    <>
                      {row.crossesDay && (
                        <span className="text-ink/70">
                          {row.yours.startDay}{" "}
                        </span>
                      )}
                      {row.yours.startTime}
                      <span className="text-ink/70"> – </span>
                      {row.crossesDay &&
                        row.yours.endDay !== row.yours.startDay && (
                          <span className="text-ink/70">
                            {row.yours.endDay}{" "}
                          </span>
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

     

      <div className="mt-5 rounded-xl border border-ink/10 bg-mist/70 p-4">
        {/* Timezone Badges */}
        <div className="flex flex-wrap items-center gap-2 font-body text-caption">
          <div className="flex items-center gap-1.5 text-ink/70">
            <svg
              className="h-4 w-4 text-sage-deep"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>{detail.hoursTheirs}:</span>
          </div>
          <span className="rounded-md border border-ink/10 bg-paper px-2 py-0.5 font-mono text-[12px] font-medium text-ink">
            {theirZone}
          </span>
          <span className="text-ink/40 font-mono">→</span>
          <span className="text-ink/70">{detail.hoursYours}:</span>
          <span className="rounded-md border border-sage/40 bg-sage/15 px-2 py-0.5 font-mono text-[12px] font-medium text-ink">
            {yourZone}
          </span>
        </div>

        {/* Helpful Footnote */}
        <div className="mt-3 space-y-1.5 border-t border-ink/8 pt-3 font-body text-caption leading-relaxed text-ink/75">
          {anyCrossing && (
            <p className="flex items-center gap-2 font-medium text-amber-900">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
              {detail.crossesDay}
            </p>
          )}
          <p className="text-ink/65">{detail.hoursNote}</p>
        </div>
      </div>

    </div>
  );
}
