import { useState } from 'react'
import { Text } from '../../ui'

/**
 * A value the admin needs but should not have permanently on screen.
 *
 * §23 flags the taxpayer identification number as sensitive. The admin is
 * trusted with it, but a review screen gets shared and screenshotted — and if
 * Asad delegates review to an assistant, a stranger's tax number sitting in
 * plain view is exposure with no purpose. Masked by default, one click away.
 */
export default function SensitiveValue({ value, label }) {
  const [revealed, setRevealed] = useState(false)

  if (!value) {
    return (
      <Text size="ui" tone="muted">
        Not provided
      </Text>
    )
  }

  const tail = String(value).slice(-4)

  return (
    <span className="flex flex-wrap items-center gap-3">
      <span className="font-body text-ui tabular-nums text-ink">
        {revealed ? value : `••••${tail}`}
      </span>
      <button
        type="button"
        onClick={() => setRevealed((on) => !on)}
        className="inline-flex min-h-11 items-center rounded-lg font-body text-caption font-medium text-ink underline underline-offset-4 transition-colors duration-200 ease-out hover:text-ink-deep"
      >
        {revealed ? 'Hide' : 'Reveal'}
        <span className="sr-only"> {label}</span>
      </button>
    </span>
  )
}
