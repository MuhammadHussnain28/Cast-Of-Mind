import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '../../../ui'
import MoodPicker from './MoodPicker'
import { QuillIcon } from '../../journal/JournalIcons'
import { JOURNAL } from '../../../../data/clientPortalContent'
import { cx } from '../../../../lib/cx'

const TEXT_MAX = 10000
const COUNTER_FROM = 9000

/**
 * A page to write on, not a form field — 7.5's opening-message surface reused,
 * because this is the same act. Borderless, body-size, growing with the words
 * so nothing they write scrolls away inside a fixed box.
 */
export default function JournalComposer({
  initialText = '',
  initialMood = null,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus = false,
}) {
  const fieldId = useId()
  const textarea = useRef(null)
  const [text, setText] = useState(initialText)
  const [mood, setMood] = useState(initialMood)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Measured after paint, never written to a ref during render (0.6's rule).
  useLayoutEffect(() => {
    const el = textarea.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  const trimmed = text.trim()
  const ready = trimmed.length > 0 && trimmed.length <= TEXT_MAX

  async function save(event) {
    event.preventDefault()
    if (!ready || saving) return

    setSaving(true)
    setError(null)
    try {
      await onSubmit({ text: trimmed, moodTag: mood })
      // Only cleared once the server has it — their words are never lost.
      setText('')
      setMood(null)
    } catch (failure) {
      setError(failure.message || JOURNAL.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} noValidate>
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="text-sage-deep">
          <QuillIcon size={20} />
        </span>
        <label htmlFor={fieldId} className="font-body text-ui font-medium text-ink">
          {JOURNAL.composer.heading}
        </label>
      </div>

      <textarea
        ref={textarea}
        id={fieldId}
        value={text}
        rows={4}
        autoFocus={autoFocus}
        disabled={saving}
        placeholder={JOURNAL.composer.placeholder}
        onChange={(event) => setText(event.target.value)}
        className={cx(
          'mt-3 block w-full resize-none rounded-xl bg-mist px-4 py-3.5',
          'font-body text-ui leading-relaxed text-ink placeholder:text-ink/60',
          'border border-transparent focus:border-sage focus:outline-none',
          'disabled:opacity-70',
        )}
      />

      {/* Only near the ceiling. A permanent counter on someone writing about
          their week reads as a limit on how much they are allowed to feel. */}
      {trimmed.length >= COUNTER_FROM && (
        <p
          className={cx(
            'mt-1.5 text-right font-body text-caption tabular-nums',
            trimmed.length > TEXT_MAX ? 'text-clay' : 'text-ink/70',
          )}
        >
          {trimmed.length.toLocaleString()} / {TEXT_MAX.toLocaleString()}
        </p>
      )}

      <div className="mt-5">
        <MoodPicker value={mood} onChange={setMood} disabled={saving} />
      </div>

      {error && (
        <p role="alert" className="mt-4 font-body text-caption text-clay">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!ready} loading={saving}>
          {submitLabel ?? JOURNAL.composer.save}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            {JOURNAL.composer.cancel}
          </Button>
        )}
      </div>
    </form>
  )
}
