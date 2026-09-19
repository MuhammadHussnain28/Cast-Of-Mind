import { useId, useState } from 'react'
import { MOODS, MOOD_TAG_MAX, isPresetMood } from '../../../../lib/client/moods'
import { MoodStroke } from '../../journal/JournalIcons'
import { JOURNAL } from '../../../../data/clientPortalContent'
import { cx } from '../../../../lib/cx'

/**
 * Optional, and it stays optional — there is no default and no nudge to pick.
 *
 * Toggle buttons rather than radios, because pressing the chosen one clears it;
 * a radio group cannot be emptied once set, which would make an optional field
 * behave like a required one.
 */
export default function MoodPicker({ value, onChange, disabled }) {
  const inputId = useId()
  const custom = Boolean(value) && !isPresetMood(value)
  const [typing, setTyping] = useState(custom)

  const choose = (label) => onChange(value === label ? null : label)

  return (
    <div>
      <p className="font-body text-caption font-medium text-ink">{JOURNAL.mood.label}</p>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {MOODS.map((mood) => {
          const on = value === mood.label
          return (
            <Chip key={mood.label} on={on} disabled={disabled} onClick={() => choose(mood.label)}>
              <MoodStroke
                label={mood.label}
                width={26}
                className={on ? 'text-paper' : 'text-sage-deep'}
              />
              <span>{mood.label}</span>
            </Chip>
          )
        })}

        <Chip
          on={custom}
          disabled={disabled}
          onClick={() => {
            if (custom) {
              onChange(null)
              setTyping(false)
            } else {
              setTyping((open) => !open)
            }
          }}
          aria-expanded={typing}
          aria-controls={inputId}
        >
          <MoodStroke label="" width={26} className={custom ? 'text-paper' : 'text-sage-deep'} />
          <span>{custom ? value : JOURNAL.mood.other}</span>
        </Chip>
      </div>

      {typing && !custom && (
        <div className="mt-3">
          <label htmlFor={inputId} className="block font-body text-caption text-ink/70">
            {JOURNAL.mood.otherLabel}
          </label>
          <input
            id={inputId}
            type="text"
            autoComplete="off"
            maxLength={MOOD_TAG_MAX}
            disabled={disabled}
            placeholder={JOURNAL.mood.otherPlaceholder}
            onChange={(event) => onChange(event.target.value.trim() ? event.target.value : null)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault()
            }}
            className="mt-1.5 block w-full max-w-xs rounded-xl border border-ink/50 bg-paper px-3 py-2.5 font-body text-ui text-ink placeholder:text-ink/60 focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          />
        </div>
      )}
    </div>
  )
}

function Chip({ on, children, className, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      className={cx(
        'inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 font-body text-caption',
        'transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
        on
          ? 'bg-ink text-paper'
          : 'border border-ink/50 bg-paper text-ink/70 hover:border-ink hover:text-ink',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
