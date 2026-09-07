import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cx } from '../../lib/cx'
import { Check, Cross, Search } from './QuestionnaireIcons'
import SelectionMarks from './SelectionMarks'
import { filterThemes } from '../../data/concernThemes'
import { screens } from '../../data/questionnaireContent'
import { CONCERN_TAGS_ASK_MIN, CONCERN_TAGS_MAX } from '../../lib/validation/questionnaire'

/**
 * The emotional core of the flow (§24.7): naming what you are struggling with.
 *
 * NO ICONS ON THE THEMES, deliberately. A pictogram for someone's depression or
 * abuse is where this screen turns twee, and the clinical-cute register is what
 * §24.1 rules out. The warmth is carried by the language, the grouping and the
 * space around it.
 *
 * Grouped into five themes — the same five the home page uses — so the reader
 * scans five things rather than twenty-seven, with search for anyone who
 * already knows the word they want.
 *
 * Toggle buttons with `aria-pressed`, not checkboxes: this is a multi-select of
 * up to four, and each chip reports its own state.
 */
export default function ConcernPicker({ value, onChange, error }) {
  const copy = screens.concerns
  const reduceMotion = useReducedMotion()
  const [term, setTerm] = useState('')

  const chosen = value ?? []
  const atLimit = chosen.length >= CONCERN_TAGS_MAX
  const themes = useMemo(() => filterThemes(term), [term])
  const matchCount = themes.reduce((total, theme) => total + theme.tags.length, 0)

  function toggle(tag) {
    if (chosen.includes(tag)) {
      onChange(chosen.filter((entry) => entry !== tag))
      return
    }
    if (atLimit) return
    onChange([...chosen, tag])
  }

  // One line under the marks that changes with where they are, so the limit is
  // never something they discover by being blocked.
  const status = atLimit
    ? copy.atLimit
    : chosen.length > 0 && chosen.length < CONCERN_TAGS_ASK_MIN
      ? copy.nudge
      : copy.limitHelp

  return (
    <div>
      {/* ---------- count, limit, and what has been named ---------- */}
      <div className="rounded-2xl border border-ink/12 bg-mist p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-body text-ui font-medium text-ink">{copy.chosenHeading}</h2>
          <SelectionMarks count={chosen.length} max={CONCERN_TAGS_MAX} />
        </div>

        <div className="mt-4 min-h-11">
          {chosen.length === 0 ? (
            <p className="font-body text-ui text-ink/60">{copy.chosenEmpty}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {chosen.map((tag) => (
                <motion.li
                  key={tag}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(tag)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-sage-deep bg-sage/15 px-4 font-body text-ui font-medium text-ink transition-colors duration-200 hover:bg-sage/20"
                  >
                    {tag}
                    <Cross aria-hidden="true" className="h-4 w-4 shrink-0 text-sage-deep" />
                    <span className="sr-only">
                      — {copy.removeLabel} {tag}
                    </span>
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        <p
          role="status"
          className={cx(
            'mt-4 font-body text-caption',
            atLimit ? 'text-sage-deep' : 'text-ink/70',
          )}
        >
          {status}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-3 font-body text-caption text-clay">
          {error}
        </p>
      )}

      {/* ---------- search ---------- */}
      <div className="relative mt-8">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/60"
        >
          <Search className="h-5 w-5" />
        </span>
        <input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          aria-label={copy.searchLabel}
          placeholder={copy.searchPlaceholder}
          className="min-h-11 w-full rounded-full border border-ink/50 bg-paper py-2 pl-12 pr-4 font-body text-ui text-ink placeholder:text-ink/60 focus:border-sage focus:shadow-[0_0_0_4px_rgb(124_144_130_/_0.15)] focus:outline-none"
        />
      </div>

      <p className="sr-only" role="status">
        {matchCount} concerns listed
      </p>

      {/* ---------- the list ---------- */}
      {themes.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-ink/12 bg-mist p-6">
          <h3 className="font-body text-ui font-medium text-ink">{copy.noMatchHeading}</h3>
          <p className="mt-2 max-w-measure font-body text-ui text-ink/70">{copy.noMatchBody}</p>
          <button
            type="button"
            onClick={() => setTerm('')}
            className="mt-4 min-h-11 font-body text-ui text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink"
          >
            {copy.clearSearch}
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {themes.map((theme) => (
            <section key={theme.id}>
              <h3 className="font-body text-ui font-medium text-ink">{theme.name}</h3>
              <div aria-hidden="true" className="mt-2 h-px w-full bg-sage/40" />

              <ul className="mt-4 flex flex-wrap gap-2.5">
                {theme.tags.map((tag) => {
                  const isChosen = chosen.includes(tag)
                  const locked = atLimit && !isChosen

                  return (
                    <li key={tag}>
                      <button
                        type="button"
                        aria-pressed={isChosen}
                        disabled={locked}
                        onClick={() => toggle(tag)}
                        className={cx(
                          'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-body text-ui transition-colors duration-200',
                          isChosen && 'border-sage-deep bg-sage/15 font-medium text-ink',
                          !isChosen && !locked && 'border-ink/50 bg-paper text-ink hover:bg-mist',
                          // Recessed, never illegible: the whole point of the
                          // locked state is that you can still read the tag to
                          // decide what to give up. ink/60 on mist is 4.56:1.
                          locked && 'cursor-not-allowed border-transparent bg-mist text-ink/60',
                        )}
                      >
                        {isChosen && (
                          <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-sage-deep" />
                        )}
                        {tag}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
