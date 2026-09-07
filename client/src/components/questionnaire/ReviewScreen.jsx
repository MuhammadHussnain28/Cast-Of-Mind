import { Heading, Text } from '../ui'
import { review } from '../../data/questionnaireContent'

/**
 * Everything back in one place before the flow hands over to matching (§24.7).
 *
 * Each row jumps to the step that owns it rather than editing in place, so
 * there is one implementation of every question and no second set of controls
 * to keep in step with the first.
 *
 * It sits one past the last question, so the progress bar still reads "7 of 7"
 * — the same treatment the therapist application's review screen gets.
 */
export default function ReviewScreen({ rows, onEdit, headingRef }) {
  return (
    <div>
      <Heading
        level={1}
        size="section"
        ref={headingRef}
        tabIndex={-1}
        className="max-w-measure focus-visible:outline-none"
      >
        {review.heading}
      </Heading>

      <Text tone="muted" className="mt-4 max-w-measure">
        {review.reassurance}
      </Text>

      <dl className="mt-9 divide-y divide-ink/12 border-y border-ink/12">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid gap-1 py-4 sm:grid-cols-[160px_1fr_auto] sm:items-baseline sm:gap-4 lg:grid-cols-[180px_1fr_auto]"
          >
            <dt className="font-body text-caption text-ink/70">{row.label}</dt>

            <dd className="font-body text-ui text-ink-deep">
              {row.values ? (
                <ul className="flex flex-wrap gap-2">
                  {row.values.map((entry) => (
                    <li
                      key={entry}
                      className="rounded-full bg-sage/15 px-3 py-1 font-body text-caption text-ink"
                    >
                      {entry}
                    </li>
                  ))}
                </ul>
              ) : (
                row.value
              )}
            </dd>

            <div className="sm:justify-self-end">
              <button
                type="button"
                onClick={() => onEdit(row.stepIndex)}
                className="min-h-11 font-body text-caption text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
              >
                {review.edit}
                <span className="sr-only"> {row.label}</span>
              </button>
            </div>
          </div>
        ))}
      </dl>

      <Text tone="muted" size="caption" className="mt-6 max-w-measure">
        {review.next}
      </Text>
    </div>
  )
}
