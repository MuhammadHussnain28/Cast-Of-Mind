import { useState } from 'react'
import { commonLanguages } from '../../data/joinContent'
import { Close, Plus } from './JoinIcons'
import { cx } from '../../lib/cx'

/**
 * Languages as chips.
 *
 * The suggestion list is a starting point, never the limit — a therapist
 * working in Pashto or Yoruba must not be shut out by my list, so anything can
 * be typed in. The backend accepts any string array (max 20, no duplicates).
 */
export default function LanguagePicker({ value = [], onChange, error, id = 'languages' }) {
  const [draft, setDraft] = useState('')

  const has = (lang) => value.some((v) => v.toLowerCase() === lang.toLowerCase())

  function toggle(lang) {
    onChange(has(lang) ? value.filter((v) => v.toLowerCase() !== lang.toLowerCase()) : [...value, lang])
  }

  function addDraft() {
    const next = draft.trim()
    if (!next || has(next) || value.length >= 20) {
      setDraft('')
      return
    }
    onChange([...value, next])
    setDraft('')
  }

  const suggestions = commonLanguages.filter((l) => !has(l))

  return (
    <div className="flex flex-col gap-2" data-field="languages">
      <span className="font-body text-caption font-medium text-ink">
        Languages you work in
        <span className="ml-1 text-clay" aria-hidden="true">*</span>
        <span className="sr-only"> (required)</span>
      </span>

      {/* Chosen languages. Each chip removes itself. */}
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Chosen languages">
          {value.map((lang) => (
            <li key={lang}>
              <button
                type="button"
                onClick={() => toggle(lang)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-sage bg-sage/12 px-4 font-body text-ui text-ink transition-colors duration-200 hover:bg-sage/20"
              >
                {lang}
                <Close className="h-3.5 w-3.5 text-ink/60" />
                <span className="sr-only">Remove {lang}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {suggestions.length > 0 && (
        <>
          <p className="mt-1 font-body text-caption text-ink/70">
            {value.length > 0 ? 'Add another' : 'Tap the ones you work in'}
          </p>
          <ul className="flex flex-wrap gap-2">
            {suggestions.map((lang) => (
              <li key={lang}>
                <button
                  type="button"
                  onClick={() => toggle(lang)}
                  className="inline-flex min-h-11 items-center rounded-full border border-ink/25 px-4 font-body text-ui text-ink/80 transition-colors duration-200 hover:border-ink/50 hover:text-ink"
                >
                  {lang}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Anything not on the list. */}
      <div className="mt-2 flex gap-2">
        <input
          id={id}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // Otherwise Enter submits the whole form.
              e.preventDefault()
              addDraft()
            }
          }}
          placeholder="Another language"
          aria-label="Add another language"
          aria-describedby={error ? `${id}-err` : undefined}
          className={cx(
            'min-h-11 w-full max-w-64 rounded-xl border bg-paper px-4 font-body text-ui text-ink-deep',
            'transition-[border-color,box-shadow] duration-200 placeholder:text-ink/60',
            'focus:border-sage focus:shadow-[0_0_0_4px_rgb(124_144_130_/_0.15)]',
            error ? 'border-clay' : 'border-ink/50',
          )}
        />
        <button
          type="button"
          onClick={addDraft}
          disabled={!draft.trim()}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-ink/50 px-4 text-ink transition-colors duration-200 hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add language</span>
        </button>
      </div>

      {error && (
        <p id={`${id}-err`} role="alert" className="font-body text-caption text-clay">
          {error}
        </p>
      )}
    </div>
  )
}
