import { cx } from '../../lib/cx'

/**
 * A two-button yes/no. Extracted in chunk 3.5 because the disciplinary question
 * (step 4) and the insurance question (step 5) are the same control, and two
 * copies would drift.
 *
 * Real radio inputs behind the labels, so arrow keys, form semantics and screen
 * readers all behave normally — only the presentation is custom.
 */
export default function YesNoField({
  name,
  legend,
  hint,
  value,
  register,
  error,
  reassurance,
  children,
}) {
  return (
    <fieldset>
      <legend className="font-body text-caption font-medium text-ink">
        {legend}
        <span className="ml-1 text-clay" aria-hidden="true">*</span>
        <span className="sr-only"> (required)</span>
      </legend>

      {hint && (
        <p className="mt-1 max-w-measure font-body text-caption leading-relaxed text-ink/70">
          {hint}
        </p>
      )}

      <div className="mt-3 flex gap-3">
        {[
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ].map((option) => (
          <label
            key={option.value}
            className={cx(
              'inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border px-5 font-body text-ui transition-colors duration-200 sm:min-w-32 sm:flex-none',
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink',
              value === option.value
                ? 'border-ink bg-ink text-paper'
                : 'border-ink/50 text-ink hover:border-ink hover:bg-mist',
            )}
          >
            <input type="radio" value={option.value} className="sr-only" {...register(name)} />
            {option.label}
          </label>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-2 font-body text-caption text-clay">
          {error}
        </p>
      )}

      {reassurance && (
        <p className="mt-2 max-w-measure font-body text-caption leading-relaxed text-ink/70">
          {reassurance}
        </p>
      )}

      {children}
    </fieldset>
  )
}
