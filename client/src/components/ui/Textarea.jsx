import Field from './Field'
import { controlBase, controlBorder, controlFocus } from '../../lib/controlStyles'
import { cx } from '../../lib/cx'

// `ref` accepted as a plain prop (React 19) for react-hook-form. Chunk 3.3.
export default function Textarea({
  ref,
  label,
  helper,
  error,
  required,
  hideLabel,
  rows = 4,
  className,
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
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={cx(controlBase, controlFocus, controlBorder(invalid), 'resize-y leading-relaxed')}
          {...rest}
        />
      )}
    </Field>
  )
}
