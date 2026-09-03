import { useEffect, useRef } from 'react'
import { cx } from '../../lib/cx'

/**
 * Lists what still needs fixing on the current step, each item a link that
 * focuses the field it names.
 *
 * On a step with eight fields, "something is wrong" is not help — the reader
 * has to hunt. This turns that into one click per problem.
 *
 * It takes focus when it appears, which is the WCAG-recommended pattern for a
 * validation summary: a screen reader reads the list immediately, and Tab from
 * there walks the links rather than restarting at the top of the page.
 */
export default function ErrorSummary({ items, className }) {
  const ref = useRef(null)
  const count = items?.length ?? 0

  useEffect(() => {
    if (count > 0) ref.current?.focus()
  }, [count])

  if (count === 0) return null

  function jumpTo(event, name) {
    event.preventDefault()

    // The field's own control, however it is built: a plain input, a radio
    // group's first button, or a custom control that opted in with data-field.
    const target =
      document.querySelector(`[name="${name}"]`) ??
      document.querySelector(`[data-field="${name}"]`)

    if (!target) return

    const focusable = target.matches('input, select, textarea, button, [tabindex]')
      ? target
      : target.querySelector('input, select, textarea, button, [tabindex]')

    focusable?.focus()
    focusable?.scrollIntoView({ block: 'center', behavior: 'auto' })
  }

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className={cx(
        'rounded-2xl border border-clay/40 bg-clay/5 p-5 outline-none',
        className,
      )}
    >
      <h3 className="font-body text-ui font-medium text-clay">
        {count === 1
          ? 'One answer needs attention'
          : `${count} answers need attention`}
      </h3>

      <ul className="mt-3 space-y-1.5">
        {items.map((item) => (
          <li key={item.name}>
            <a
              href={`#${item.name}`}
              onClick={(e) => jumpTo(e, item.name)}
              className="inline-block min-h-11 py-2 font-body text-ui text-clay underline decoration-clay/40 underline-offset-4 transition-colors duration-200 hover:decoration-clay"
            >
              {item.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
