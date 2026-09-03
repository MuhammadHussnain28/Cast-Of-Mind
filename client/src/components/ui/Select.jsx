import Field from './Field'
import { controlBase, controlBorder, controlFocus } from '../../lib/controlStyles'
import { cx } from '../../lib/cx'

/**
 * Native <select>. The browser's own dropdown is used on purpose: it is
 * keyboard and screen-reader correct everywhere, and on phones it opens the
 * platform picker, which is easier than any custom list.
 * Only the arrow is restyled, drawn inline so no icon file is needed.
 */
// `ref` accepted as a plain prop (React 19) for react-hook-form. Chunk 3.3.
export default function Select({
  ref,
  label,
  helper,
  error,
  required,
  hideLabel,
  options = [],
  placeholder,
  className,
  children,
  ...rest
}) {
  return (
    <Field
      label={label}
      helper={helper}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            required={required}
            className={cx(
              controlBase,
              controlFocus,
              controlBorder(invalid),
              'cursor-pointer appearance-none pr-11',
            )}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children ??
              options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
          </select>
          <svg
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </Field>
  )
}
