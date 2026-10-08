import { useId } from 'react'
import { cx } from '../../lib/cx'

/**
 * Shared shell for every form control: label, the control itself, then either
 * helper text or an error. It generates the ids and wires htmlFor,
 * aria-describedby and aria-invalid so no control has to repeat that work.
 *
 * `children` is a function so the control receives the ids it needs.
 *
 * Note on error copy: the spec asks errors to say HOW to fix the problem,
 * not just that something is wrong. That wording is the caller's job.
 */
export default function Field({
  label,
  helper,
  error,
  required = false,
  hideLabel = false,
  className,
  children,
}) {
  const id = useId()
  const helpId = `${id}-help`
  const errId = `${id}-err`
  const describedBy = [error ? errId : null, helper ? helpId : null]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label
        htmlFor={id}
        className={cx(
          "font-body text-caption font-medium text-ink",
          hideLabel && "sr-only",
        )}
      >
        {label}
        {required && (
          <span className="ml-1 text-clay" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {error ? (

        <p
          id={errId}
          className="font-body text-caption font-semibold text-clay flex items-center gap-1.5"
          role="alert"
        >
          <svg
            className="size-3.5 shrink-0 stroke-[2.5]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </p>


      ) : helper ? (
        <p id={helpId} className="font-body text-caption text-ink/70">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
