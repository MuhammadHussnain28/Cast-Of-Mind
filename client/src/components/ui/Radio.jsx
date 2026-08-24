import { useId } from 'react'
import { cx } from '../../lib/cx'

/**
 * RadioGroup renders a real <fieldset> with a <legend>. That is what tells a
 * screen reader the options belong together — a plain div with a heading does
 * not. Arrow-key movement between options is the browser's own behaviour.
 */
export function RadioGroup({ legend, name, value, onChange, options = [], error, helper, className }) {
  const id = useId()
  const msgId = `${id}-msg`

  return (
    <fieldset
      className={cx('flex flex-col gap-1 border-0 p-0', className)}
      aria-describedby={error || helper ? msgId : undefined}
    >
      <legend className="mb-2 font-body text-caption font-medium text-ink">
        {legend}
      </legend>

      {options.map((o) => (
        <label
          key={o.value}
          className="flex min-h-11 cursor-pointer items-center gap-3 py-1"
        >
          <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange?.(o.value)}
              aria-invalid={error ? true : undefined}
              className={cx(
                'peer h-5 w-5 cursor-pointer appearance-none rounded-full border bg-paper',
                'transition-colors duration-200 ease-out',
                'checked:border-ink disabled:cursor-not-allowed disabled:opacity-50',
                error ? 'border-clay' : 'border-ink/50 hover:border-ink/70',
              )}
            />
            <span className="pointer-events-none absolute h-2.5 w-2.5 scale-0 rounded-full bg-ink transition-transform duration-200 ease-out peer-checked:scale-100" />
          </span>
          <span className="font-body text-ui text-ink-deep">{o.label}</span>
        </label>
      ))}

      {(error || helper) && (
        <p
          id={msgId}
          role={error ? 'alert' : undefined}
          className={cx('pl-8 font-body text-caption', error ? 'text-clay' : 'text-ink/70')}
        >
          {error || helper}
        </p>
      )}
    </fieldset>
  )
}

export default RadioGroup
