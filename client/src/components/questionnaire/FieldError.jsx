/**
 * The error under a custom control (chips and cards), which have no Field
 * wrapper of their own. Text inputs keep the Input/Select `error` prop.
 *
 * `role="alert"` so it is announced when it appears — someone who pressed
 * Continue and stayed where they were needs to be told why.
 */
export default function FieldError({ id, message }) {
  if (!message) return null

  return (
    <p id={id} role="alert" className="mt-3 font-body text-caption text-clay">
      {message}
    </p>
  )
}
