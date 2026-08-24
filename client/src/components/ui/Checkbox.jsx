import { useId } from 'react'
import { cx } from '../../lib/cx'

/**
 * The real <input> is kept and visually hidden rather than replaced, so
 * keyboard, form submission and screen readers all behave normally.
 * The whole row is the label, so the tap area clears 44px easily.
 */
export default function Checkbox({ label, helper, error, className, id: idProp, ...rest }) {
  const auto = useId()
  const id = idProp || auto
  const helpId = `${id}-help`

  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-center gap-3 py-1"
      >
        <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            id={id}
            type="checkbox"
            aria-describedby={helper || error ? helpId : undefined}
            aria-invalid={error ? true : undefined}
            className={cx(
              'peer h-5 w-5 cursor-pointer appearance-none rounded-md border bg-paper',
              'transition-colors duration-200 ease-out',
              'checked:border-ink checked:bg-ink',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-clay' : 'border-ink/50 hover:border-ink/70',
            )}
            {...rest}
          />
          <svg
            className="pointer-events-none absolute h-3.5 w-3.5 text-paper opacity-0 peer-checked:opacity-100"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3.5 8.5l3 3 6-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="font-body text-ui text-ink-deep">{label}</span>
      </label>
      {(error || helper) && (
        <p
          id={helpId}
          role={error ? 'alert' : undefined}
          className={cx('pl-8 font-body text-caption', error ? 'text-clay' : 'text-ink/70')}
        >
          {error || helper}
        </p>
      )}
    </div>
  )
}
