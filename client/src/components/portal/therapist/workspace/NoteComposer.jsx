import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '../../../ui'
import { JOURNAL_NOTES } from '../../../../data/therapistPortalContent'
import { cx } from '../../../../lib/cx'

const TEXT_MAX = 10000

/** Write a clinical note. Used for a new note and for rewriting an existing one. */
export default function NoteComposer({
  initialText = '',
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus = false,
}) {
  const fieldId = useId()
  const textarea = useRef(null)
  const [text, setText] = useState(initialText)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

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
      await onSubmit({ text: trimmed })
      setText('')
    } catch (failure) {
      setError(failure.message || JOURNAL_NOTES.notes.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} noValidate>
      <label htmlFor={fieldId} className="sr-only">
        {JOURNAL_NOTES.notes.composerLabel}
      </label>

      <textarea
        ref={textarea}
        id={fieldId}
        value={text}
        rows={3}
        autoFocus={autoFocus}
        disabled={saving}
        placeholder={JOURNAL_NOTES.notes.placeholder}
        onChange={(event) => setText(event.target.value)}
        className={cx(
          'block w-full resize-none rounded-xl bg-paper px-4 py-3',
          'font-body text-ui leading-relaxed text-ink placeholder:text-ink/60',
          'border border-ink/50 focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink',
          'disabled:opacity-70',
        )}
      />

      {error && (
        <p role="alert" className="mt-2.5 font-body text-caption text-clay">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <Button type="submit" size="sm" disabled={!ready} loading={saving}>
          {submitLabel ?? JOURNAL_NOTES.notes.save}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
            {JOURNAL_NOTES.notes.cancel}
          </Button>
        )}
      </div>
    </form>
  )
}
