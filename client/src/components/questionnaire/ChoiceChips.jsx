import { cx } from '../../lib/cx'
import { Check } from './QuestionnaireIcons'

/**
 * A radio group as chips — for questions with a handful of fixed answers, so
 * gender and relationship status are one tap rather than a dropdown to open,
 * scan and close.
 *
 * Same chip language as the therapist form's TagPicker, so a chosen option
 * looks the same on both sides of the platform. Real radios underneath, hidden
 * rather than replaced, so arrow keys and screen readers behave normally.
 *
 * SELECTION IS NEVER COLOUR ALONE — a check accompanies the fill.
 */
export default function ChoiceChips({ name, options, value, onChange, error, columns = false }) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={`${name}-label`}
      aria-invalid={error ? 'true' : undefined}
      className={cx('flex flex-wrap gap-2.5', columns && 'sm:grid sm:grid-cols-2')}
    >
      {options.map((option) => {
        const selected = value === option.value

        return (
          <label
            key={option.value}
            className={cx(
              'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 font-body text-ui transition-colors duration-200',
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus-ring)]',
              selected
                ? 'border-sage-deep bg-sage/15 font-medium text-ink'
                : 'border-ink/50 bg-paper text-ink hover:bg-mist',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {selected && <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-sage-deep" />}
            {option.label}
          </label>
        )
      })}
    </div>
  )
}
