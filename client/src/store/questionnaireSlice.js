import { createSlice } from '@reduxjs/toolkit'
import { emptyAnswers } from '../lib/validation/questionnaire.js'
import { readQuestionnaireDraft } from '../lib/questionnaireDraft.js'
// .js extensions so this module also loads in plain Node, which is how its
// reducer logic is executed and checked. Vite resolves either form.
import {
  stepsFor,
  THERAPIST_GENDER_PREFERENCES,
  CLIENT_GENDERS,
} from '../data/questionnaireSteps.js'
import { review as reviewCopy } from '../data/questionnaireContent.js'

/**
 * The intake questionnaire's answers.
 *
 * WHY REDUX HERE, WHEN THE THERAPIST FORM USES ONE useForm.
 * That form submits from a single page, so React Hook Form owning its state is
 * correct. These answers have to OUTLIVE the /questionnaire route: /matches,
 * /therapist/:id and /checkout all read them, and RHF state dies the moment the
 * route unmounts. Redux survives the navigation; that is the whole reason.
 *
 * NOTHING SENSITIVE IS PERSISTED BY THIS STORE. Draft saving is sessionStorage
 * only and lives in lib/questionnaireDraft.js — see the note there on why not
 * localStorage. No redux-persist is registered anywhere in this app.
 *
 * SHAPE NOTE: `partner1` / `partner2` sit flat here because that is what a form
 * binds to. The API nests them under `coupleData` (§10.2). Slice 6 maps between
 * the two at submission — the same translation layer the therapist form needed
 * in chunk 3.5, and the same place type mismatches will show up.
 */

const initialState = {
  answers: { ...emptyAnswers },
  stepIndex: 0,
  // True once a saved draft has been put back, so the flow can say so instead of
  // silently repopulating a screen someone did not expect to be filled in.
  restoredFromDraft: false,
  // The review screen sits one past the last question rather than being another
  // step, so the progress bar keeps reading "7 of 7" and stepIndex never has to
  // mean an index that is out of range.
  atReview: false,
  // The therapist chosen on /therapist/:id. The id is what matters; the rest
  // is a small snapshot so checkout can show WHO was chosen without a second
  // request. SLICE 6 MUST RE-VERIFY the therapist is still active before
  // taking payment — a snapshot taken now could be minutes or days old.
  selectedTherapist: null,
}

/**
 * The slice's starting state, with a saved draft already in it.
 *
 * READ ONCE AT MODULE LOAD, BEFORE REACT RENDERS — not in an effect.
 *
 * An effect restores AFTER the first render, and the guards on /checkout and
 * /checkout/cancel run during that first render. They would see an empty store,
 * redirect, and the restore would land on a page nobody is looking at any more.
 * That is the same ordering trap chunk 1.6 hit with the login page flash, and
 * seeding the store removes it rather than working around it.
 *
 * Returns a COMPLETE slice state: preloadedState replaces initialState, it does
 * not merge into it, so every key has to be present.
 */
export function buildInitialQuestionnaireState() {
  const draft = readQuestionnaireDraft()
  if (!draft) return initialState

  return {
    ...initialState,
    answers: { ...emptyAnswers, ...draft.answers },
    stepIndex: draft.stepIndex ?? 0,
    selectedTherapist: draft.selectedTherapist ?? null,
    restoredFromDraft: true,
  }
}

const questionnaireSlice = createSlice({
  name: 'questionnaire',
  initialState,
  reducers: {
    answersUpdated(state, action) {
      Object.assign(state.answers, action.payload)
    },

    partnerUpdated(state, action) {
      const { partner, values } = action.payload
      Object.assign(state.answers[partner], values)
    },

    /**
     * Switching branch KEEPS both branches' answers.
     *
     * Someone who fills the individual path, switches to couple, then switches
     * back should find their answers where they left them. Only the active
     * branch is ever validated or sent — `selectActiveAnswers` drops the other,
     * which is what keeps the model's cross-branch guard satisfied.
     */
    branchSelected(state, action) {
      state.answers.type = action.payload
    },

    stepAdvanced(state) {
      const total = stepsFor(state.answers.type).length
      state.stepIndex = Math.min(state.stepIndex + 1, total - 1)
    },

    therapistChosen(state, action) {
      state.selectedTherapist = action.payload
    },

    reviewOpened(state) {
      state.atReview = true
    },

    reviewClosed(state) {
      state.atReview = false
    },

    stepWentBack(state) {
      // Back from the review returns to the last question, not past it.
      if (state.atReview) {
        state.atReview = false
        return
      }
      state.stepIndex = Math.max(state.stepIndex - 1, 0)
    },

    stepJumped(state, action) {
      const total = stepsFor(state.answers.type).length
      state.stepIndex = Math.min(Math.max(action.payload, 0), total - 1)
      // Editing from the review screen leaves it.
      state.atReview = false
    },

    draftRestored(state, action) {
      state.answers = { ...emptyAnswers, ...action.payload.answers }
      state.stepIndex = action.payload.stepIndex ?? 0
      state.selectedTherapist = action.payload.selectedTherapist ?? null
      state.restoredFromDraft = true
      state.atReview = false
    },

    questionnaireReset() {
      return { ...initialState, answers: { ...emptyAnswers } }
    },
  },
})

export const {
  answersUpdated,
  partnerUpdated,
  branchSelected,
  stepAdvanced,
  stepWentBack,
  stepJumped,
  reviewOpened,
  reviewClosed,
  therapistChosen,
  draftRestored,
  questionnaireReset,
} = questionnaireSlice.actions

export const selectAnswers = (state) => state.questionnaire.answers
export const selectClientType = (state) => state.questionnaire.answers.type
export const selectStepIndex = (state) => state.questionnaire.stepIndex
export const selectRestoredFromDraft = (state) => state.questionnaire.restoredFromDraft
export const selectAtReview = (state) => state.questionnaire.atReview
export const selectSelectedTherapist = (state) => state.questionnaire.selectedTherapist
export const selectSelectedTherapistId = (state) =>
  state.questionnaire.selectedTherapist?.id ?? null
export const selectSteps = (state) => stepsFor(state.questionnaire.answers.type)

export const selectCurrentStep = (state) =>
  selectSteps(state)[state.questionnaire.stepIndex] ?? selectSteps(state)[0]

/**
 * The answers for the branch actually chosen, with the other branch's fields
 * removed. The model rejects a document carrying both shapes, so this is the
 * boundary where "we kept your other answers just in case" stops.
 */
export const selectActiveAnswers = (state) => {
  const { partner1, partner2, name, age, gender, ...shared } = state.questionnaire.answers

  return shared.type === 'couple'
    ? { ...shared, partner1, partner2 }
    : { ...shared, name, age, gender }
}

/**
 * Every answer given so far, for the standing panel.
 *
 * CONCERN TAGS ARE SHOWN HERE — developer's decision, 2026-09-05, reversing the
 * chunk 5.2 build. The panel is meant to show the client their whole answer set
 * accumulating, and leaving out the one answer that actually decides their match
 * made it look incomplete.
 *
 * The trade-off that was weighed and accepted: this panel stays on screen for
 * the rest of the flow, so the tags are visible to anyone near the reader —
 * on a train, in a shared office. Discoverability was chosen over that risk.
 *
 * An item carries either `value` (a string) or `values` (a list, rendered as
 * pills) — never both.
 */
export const selectAnswerEcho = (state) => {
  const a = state.questionnaire.answers
  const items = []

  if (a.type) {
    items.push({ label: 'Who this is for', value: a.type === 'couple' ? 'Two of us' : 'Just me' })
  }

  // Two rows rather than one joined line (developer's decision, 2026-09-05), so
  // both partners' captured details are visible on screen — including the ages,
  // which a joined "Marta and Joris" was throwing away.
  if (a.type === 'couple') {
    for (const [key, label] of [
      ['partner1', 'First partner'],
      ['partner2', 'Second partner'],
    ]) {
      const partner = a[key]
      if (!partner?.name) continue
      items.push({
        label,
        value: partner.age ? `${partner.name} · ${partner.age}` : partner.name,
      })
    }
  } else if (a.name) {
    items.push({ label: 'Name', value: a.age ? `${a.name} · ${a.age}` : a.name })
  }

  const place = [a.city, a.country].filter(Boolean).join(', ')
  if (place) items.push({ label: 'Where', value: place })

  if (a.relationshipStatus) {
    items.push({ label: 'Relationship', value: a.relationshipStatus })
  }

  // Step 5 (chunk 5.4). A list rather than a joined string, so four long tag
  // names wrap as pills instead of one paragraph in a narrow panel.
  if (a.concernTags?.length) {
    items.push({ label: 'What brings you here', values: [...a.concernTags] })
  }

  // Step 6 (chunk 5.4). Read back in the words the screen offered, not the
  // stored value — "no_preference" is a database string, not something to
  // show a person.
  if (a.therapistGenderPreference) {
    const preference = THERAPIST_GENDER_PREFERENCES.find(
      (option) => option.value === a.therapistGenderPreference,
    )
    if (preference) items.push({ label: 'Therapist preference', value: preference.label })
  }

  if (a.email) items.push({ label: 'Email', value: a.email })

  return items
}

export default questionnaireSlice.reducer

/**
 * The review rows: every answer, with the step index each one jumps back to.
 *
 * Built from the branch's own step list rather than a hardcoded order, so the
 * couple path reviews its two partners and the individual path its one person,
 * and neither can drift from the flow it actually walked.
 */
const reviewLabels = reviewCopy.sections

export const selectReviewRows = (state) => {
  const a = state.questionnaire.answers
  const steps = stepsFor(a.type)
  const indexOf = (id) => steps.findIndex((step) => step.id === id)
  const rows = []
  const add = (id, label, body) => {
    const stepIndex = indexOf(id)
    if (stepIndex === -1) return
    rows.push({ id, label, stepIndex, ...body })
  }

  add('type', reviewLabels.type, {
    value: a.type === 'couple' ? 'My partner and me' : 'Just me',
  })

  if (a.type === 'couple') {
    add('partner1', reviewLabels.partner1, { value: describePerson(a.partner1) })
    add('partner2', reviewLabels.partner2, { value: describePerson(a.partner2) })
  } else {
    add('about', reviewLabels.about, { value: describePerson(a) })
  }

  add('location', reviewLabels.location, {
    value: [a.city, a.country].filter(Boolean).join(', ') || notAnswered,
  })
  add('relationship', reviewLabels.relationship, {
    value: a.relationshipStatus || notAnswered,
  })
  add('concerns', reviewLabels.concerns, {
    values: a.concernTags?.length ? [...a.concernTags] : undefined,
    value: a.concernTags?.length ? undefined : notAnswered,
  })
  add('preference', reviewLabels.preference, {
    value:
      THERAPIST_GENDER_PREFERENCES.find((o) => o.value === a.therapistGenderPreference)?.label ??
      notAnswered,
  })
  add('contact', reviewLabels.contact, { value: a.email || notAnswered })

  return rows
}

const notAnswered = 'Not answered yet'

/** Name, age and gender as one line — the shape both branches share. */
function describePerson(person) {
  if (!person?.name) return notAnswered
  const gender = CLIENT_GENDERS.find((option) => option.value === person.gender)?.label
  return [person.name, person.age, gender].filter(Boolean).join(' · ')
}
