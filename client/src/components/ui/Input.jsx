import Field from './Field'
import { controlBase, controlBorder } from '../../lib/controlStyles'
import { cx } from '../../lib/cx'

export default function Input({
  label,
  helper,
  error,
  required,
  hideLabel,
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
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={cx(controlBase, controlBorder(invalid))}
          {...rest}
        />
      )}
    </Field>
  )
}
