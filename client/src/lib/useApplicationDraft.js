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

// Never written to localStorage, and dropped from any draft an older build saved.
// The taxpayer ID is flagged sensitive in §23 (12.3).
const NEVER_STORED = ['password', 'taxpayerIdNumber']

function withoutSensitive(values) {
  const safe = { ...(values ?? {}) }
  for (const field of NEVER_STORED) delete safe[field]
  return safe
}

// A draft older than this is dropped rather than restored. Fields change
// between releases, and a month-old half-form is more confusing than helpful.
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

/**
 * Detects whether an application has real user-entered progress.
 * An untouched form on Step 1 (or default blank values) is NOT a draft.
 */
export function hasDraftContent(values, step = 1) {
  if (!values) return false
  if (Number(step) > 1) return true

  // Check if any personal field in step 1 has been entered or selected
  const hasStep1Text = Boolean(
    values.firstName?.trim() ||
    values.lastName?.trim() ||
    values.email?.trim() ||
    values.title ||
    values.gender ||
    values.dateOfBirth ||
    values.photoUrl
  )

  if (hasStep1Text) return true

  // Also check if any other field happens to contain content
  return Boolean(
    values.streetAddress?.trim() ||
    values.city?.trim() ||
    values.stateProvince?.trim() ||
    values.zipPostal?.trim() ||
    values.country?.trim() ||
    (Array.isArray(values.languages) && values.languages.length > 0) ||
    values.therapistType?.trim() ||
    values.credentialType ||
    values.credentialInitials?.trim() ||
    values.bio?.trim() ||
    (Array.isArray(values.specialtyTags) && values.specialtyTags.length > 0) ||
    (Array.isArray(values.treatmentOrientations) && values.treatmentOrientations.length > 0)
  )
}

export function readDraft() {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null

    const saved = JSON.parse(raw)
    if (saved?.version !== VERSION) return null
    if (!saved.savedAt || Date.now() - saved.savedAt > MAX_AGE_MS) return null

    // If the saved draft has no real user-entered content, discard it
    if (!hasDraftContent(saved.values, saved.step)) {
      clearDraft()
      return null
    }

    // Belt and braces: even if an older build had written one, it never loads.
    if (saved.values) saved.values = withoutSensitive(saved.values)

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

    clearTimeout(timer.current)

    // Only save if the applicant has actually entered content
    if (!hasDraftContent(values, step)) {
      return undefined
    }

    // Debounced: this fires on every keystroke, and serialising a 34-field
    // object that often is wasted work.
    timer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(
          KEY,
          JSON.stringify({ version: VERSION, savedAt: Date.now(), step, values: withoutSensitive(values) }),
        )
      } catch {
        // Quota exceeded or storage blocked. Silent by design.
      }
    }, 500)

    return () => clearTimeout(timer.current)
  }, [values, step, enabled])
}

export default useApplicationDraft
