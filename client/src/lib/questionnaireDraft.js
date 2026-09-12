/**
 * Keeps the questionnaire alive across an accidental reload.
 *
 * SESSIONSTORAGE, NOT LOCALSTORAGE — decided 2026-09-05.
 *
 * The therapist application uses localStorage for 14 days, which is right for a
 * job application. It is wrong here. The most sensitive thing in this flow is
 * `concernTags`: a list of someone's mental health concerns, next to their name,
 * age and email. localStorage would leave that on a shared or family computer
 * for a fortnight after they closed the tab.
 *
 * sessionStorage survives a refresh — which is exactly what the chunk asks for —
 * and is discarded when the tab closes, so nothing outlives the visit.
 *
 * Every read and write is wrapped: storage throws outright in some private-window
 * modes, and a saved draft is a convenience that must never be the reason the
 * questionnaire fails to load.
 *
 * IT CARRIES THE CHOSEN THERAPIST TOO, since 2026-09-10.
 *
 * Redux lives in memory and is never persisted, so ANY full page load starts it
 * empty — a refresh, or coming back from Stripe's hosted checkout. Without the
 * therapist in here, returning from Stripe's cancel button landed on a page
 * whose guard saw no selection and bounced the visitor to /questionnaire.
 *
 * sessionStorage survives leaving to another origin and returning, because it
 * is scoped to the tab and the checkout redirect keeps the same tab.
 *
 * The therapist snapshot is a name, a photo and a professional title — all
 * public on /matches. It adds no sensitivity to a record that already holds
 * concern tags.
 */

const KEY = 'com.castofmind.questionnaire.draft'

// 2 since 2026-09-10, when `selectedTherapist` joined the draft. A v1 draft is
// discarded rather than restored, because restoring one would put the answers
// back with no therapist — the exact half-state this version exists to fix.
const VERSION = 2

// A tab can stay open for days. Short by design — these are health answers.
const MAX_AGE_MS = 24 * 60 * 60 * 1000

export function readQuestionnaireDraft() {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null

    const saved = JSON.parse(raw)
    if (saved?.version !== VERSION) return null
    if (!saved.savedAt || Date.now() - saved.savedAt > MAX_AGE_MS) return null
    if (!saved.answers || typeof saved.answers !== 'object') return null

    return {
      answers: saved.answers,
      stepIndex: saved.stepIndex ?? 0,
      selectedTherapist: saved.selectedTherapist ?? null,
      savedAt: saved.savedAt,
    }
  } catch {
    return null
  }
}

export function writeQuestionnaireDraft(answers, stepIndex, selectedTherapist = null) {
  try {
    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({
        version: VERSION,
        savedAt: Date.now(),
        stepIndex,
        answers,
        selectedTherapist,
      }),
    )
  } catch {
    // Quota exceeded or storage blocked. Silent by design.
  }
}

/**
 * Has anyone actually answered anything yet?
 *
 * Two jobs. It stops the mount-time save from writing blanks over the draft it
 * is in the middle of restoring — the same trap chunk 3.6 fixed on the therapist
 * form. And it means simply opening the page stores nothing at all, which is the
 * right default when the thing being stored is a list of health concerns.
 */
export function hasAnyAnswer(answers, selectedTherapist = null) {
  // A chosen therapist is worth saving on its own — it is the thing that was
  // being lost on the way back from Stripe.
  if (selectedTherapist?.id) return true
  if (!answers) return false
  if (answers.concernTags?.length) return true

  const scalars = [
    answers.type,
    answers.country,
    answers.city,
    answers.relationshipStatus,
    answers.therapistGenderPreference,
    answers.email,
    answers.name,
    answers.age,
    answers.gender,
  ]
  if (scalars.some(Boolean)) return true

  return [answers.partner1, answers.partner2].some(
    (partner) => partner && (partner.name || partner.age || partner.gender),
  )
}

export function clearQuestionnaireDraft() {
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    // Nothing to do — the draft is a convenience, not state we depend on.
  }
}
