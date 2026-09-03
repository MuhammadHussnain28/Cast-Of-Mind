import { useEffect, useRef } from 'react'

/**
 * Keeps the application form alive across an accidental reload.
 *
 * THE PASSWORD IS NEVER STORED. `.claude/rules/frontend.md` permits draft
 * persistence of non-sensitive answers and forbids persisting passwords, so it
 * is stripped on write and re-typed by the applicant if they come back. Nothing
 * else on this form is a credential.
 *
 * Every read and write is wrapped: localStorage throws outright in a private
 * window on some browsers, and a saved draft is a convenience — it must never
 * be the reason the form fails to load.
 */

const KEY = 'com.castofmind.therapistApplication.draft'
const VERSION = 1

// A draft older than this is dropped rather than restored. Fields change
// between releases, and a month-old half-form is more confusing than helpful.
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

export function readDraft() {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null

    const saved = JSON.parse(raw)
    if (saved?.version !== VERSION) return null
    if (!saved.savedAt || Date.now() - saved.savedAt > MAX_AGE_MS) return null

    // Belt and braces: even if an older build had written one, it never loads.
    if (saved.values) delete saved.values.password

    return saved
  } catch {
    return null
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // Nothing to do — the draft is a convenience, not state we depend on.
  }
}

/**
 * Writes the draft whenever the watched values change.
 *
 * @param {object} values Current form values.
 * @param {number} step   Which step the applicant is on.
 * @param {boolean} enabled Set false once submitted, so the success screen
 *   cannot write the draft back after it has been cleared.
 */
export function useApplicationDraft(values, step, enabled = true) {
  const timer = useRef(null)

  useEffect(() => {
    if (!enabled) return undefined

    // Debounced: this fires on every keystroke, and serialising a 34-field
    // object that often is wasted work.
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      try {
        const { password, ...safe } = values ?? {}
        void password // named only to drop it

        window.localStorage.setItem(
          KEY,
          JSON.stringify({ version: VERSION, savedAt: Date.now(), step, values: safe }),
        )
      } catch {
        // Quota exceeded or storage blocked. Silent by design.
      }
    }, 500)

    return () => clearTimeout(timer.current)
  }, [values, step, enabled])
}

export default useApplicationDraft
