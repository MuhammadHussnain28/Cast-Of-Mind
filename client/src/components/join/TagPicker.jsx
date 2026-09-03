import { cx } from '../../lib/cx'
import { Check } from './JoinIcons'

/**
 * Fixed-list multi-select with a hard ceiling.
 *
 * One component, two configurations. Specialty tags get `prominent` — filled
 * chips and the slot row — because that choice drives matching. Treatment
 * orientations get the quiet outline treatment, because they are display only
 * and must not look equally consequential.
 *
 * THE LIMIT IS SHOWN, NOT EXPLAINED. At the ceiling the unchosen chips go quiet
 * and stop responding, so you see the rule arrive instead of being told about
 * it after you break it.
 */
export default function TagPicker({
  fieldName,
  legend,
  hint,
  options,
  value = [],
  onChange,
  min,
  max,
  prominent = false,
  slots = false,
  error,
}) {
  const full = value.length >= max
  const has = (tag) => value.includes(tag)

  function toggle(tag) {
    if (has(tag)) {
      onChange(value.filter((v) => v !== tag))
      return
    }
    if (full) return
    onChange([...value, tag])
  }

  return (
    <fieldset className="min-w-0" data-field={fieldName}>
      <legend
        className={cx(
          'font-body font-medium text-ink',
          prominent ? 'text-subsection' : 'text-caption',
        )}
      >
        {legend}
        <span className="ml-1 text-clay" aria-hidden="true">*</span>
        <span className="sr-only"> (required)</span>
      </legend>

      <p className="mt-1 max-w-measure font-body text-caption leading-relaxed text-ink/70">
        {hint}
      </p>

      {/* The rule, drawn. Four boxes fill as you pick, so "3 to 4" is legible
          at a glance rather than being a sentence you have to parse. */}
      {slots && (
        <ul aria-hidden="true" className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: max }, (_, i) => {
            const filled = value[i]
            const optional = i >= min

            return (
              <li
                key={i}
                className={cx(
                  'flex min-h-11 flex-1 basis-full items-center gap-2 rounded-xl border px-3 font-body text-caption transition-colors duration-200 sm:basis-40',
                  filled
                    ? 'border-sage bg-sage/12 text-ink'
                    : 'border-dashed border-ink/40 text-ink/60',
                )}
              >
                {filled ? (
                  <>
                    <Check className="h-3.5 w-3.5 shrink-0 text-sage-deep" />
                    <span className="truncate">{filled}</span>
                  </>
                ) : (
                  <span>{optional ? 'Optional' : `Choice ${i + 1}`}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-4 font-body text-caption text-ink" role="status">
        {value.length} of {max} chosen
        {value.length < min && ` — pick at least ${min}`}
      </p>

      <ul className="mt-3 flex flex-wrap gap-2">
        {options.map((tag) => {
          const chosen = has(tag)
          const locked = full && !chosen

          return (
            <li key={tag}>
              <button
                type="button"
                onClick={() => toggle(tag)}
                aria-pressed={chosen}
                disabled={locked}
                className={cx(
                  'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-body text-ui transition-colors duration-200',
                  chosen && prominent && 'border-sage bg-sage/15 text-ink',
                  chosen && !prominent && 'border-ink bg-ink text-paper',
                  !chosen && !locked && 'border-ink/50 text-ink hover:border-ink hover:bg-mist',
                  // WCAG exempts disabled controls from contrast, but the point
                  // of the locked state is that you can still READ the tag to
                  // decide what to give up. ink/40 was 2.57:1; this is 4.56:1
                  // and reads as inactive through the filled ground instead.
                  locked && 'cursor-not-allowed border-ink/15 bg-mist text-ink/60',
                )}
              >
                {chosen && prominent && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-sage-deep" />
                )}
                {tag}
              </button>
            </li>
          )
        })}
      </ul>

      {full && (
        <p className="mt-3 font-body text-caption text-ink/70" role="status">
          That is the maximum. Remove one to choose a different {legend.toLowerCase()}.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 font-body text-caption text-clay">
          {error}
        </p>
      )}
    </fieldset>
  )
}
