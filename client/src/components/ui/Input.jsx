import Field from './Field'
import { controlBase, controlBorder, controlFocus } from '../../lib/controlStyles'
import { cx } from '../../lib/cx'

// `ref` is accepted as a plain prop (React 19) so react-hook-form's register()
// can reach the real element. Added chunk 3.3.
export default function Input({
  ref,
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
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={cx(controlBase, controlFocus, controlBorder(invalid))}
          {...rest}
        />
      )}
    </Field>
  )
}
