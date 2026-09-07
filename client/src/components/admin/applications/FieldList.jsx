import { Text } from '../../ui'
import { cx } from '../../../lib/cx'

/**
 * One step's worth of the application, as a definition list.
 *
 * A real <dl> rather than a grid of divs, because that is what this is: a list
 * of terms and their values. A screen reader then announces "Country, United
 * Kingdom" as a pair instead of reading two unrelated lines.
 *
 * An empty optional field says "Not provided" rather than rendering blank —
 * a gap in a review screen reads as a loading bug, not as an answer.
 */
export default function FieldList({ fields }) {
  return (
    <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label} className={cx(field.wide && 'sm:col-span-2')}>
          <dt className="font-body text-caption text-ink/70">{field.label}</dt>
          <dd className="mt-1">
            {field.render ? (
              field.render
            ) : field.value === null || field.value === undefined || field.value === '' ? (
              <Text size="ui" tone="muted">
                Not provided
              </Text>
            ) : (
              <Text size="ui" className="whitespace-pre-line">
                {field.value}
              </Text>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
