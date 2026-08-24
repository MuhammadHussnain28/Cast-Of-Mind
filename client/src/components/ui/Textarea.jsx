import Field from './Field'
import { controlBase, controlBorder } from '../../lib/controlStyles'
import { cx } from '../../lib/cx'

export default function Textarea({
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
          id={id}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={cx(controlBase, controlBorder(invalid), 'resize-y leading-relaxed')}
          {...rest}
        />
      )}
    </Field>
  )
}
