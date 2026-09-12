import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import questionnaireReducer, { buildInitialQuestionnaireState } from './questionnaireSlice'
import { writeQuestionnaireDraft, hasAnyAnswer } from '../lib/questionnaireDraft'

/**
 * The auth slice replaces the identity-function placeholder from chunk 0.6.
 *
 * Note what is NOT registered here: no redux-persist, no storage middleware.
 * The access token is not in this store at all (see store/authSlice.js), so
 * there is nothing here that could reach localStorage even by accident.
 */
/**
 * The questionnaire slice starts from its saved draft, not from blank.
 *
 * Seeded HERE rather than in an effect, because the guards on /checkout and
 * /checkout/cancel run on the first render — an effect would restore after they
 * had already redirected. Returning from Stripe is a full page load, so this is
 * the only point at which the store can be correct before anything renders.
 *
 * Reading storage cannot throw out of here: readQuestionnaireDraft swallows a
 * blocked private-window store and returns null, which falls back to blank.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    questionnaire: questionnaireReducer,
  },
  preloadedState: {
    questionnaire: buildInitialQuestionnaireState(),
  },
})

/**
 * And the other direction: the draft follows the store.
 *
 * Subscribed here rather than from a component, because the two things worth
 * keeping are answered in different places — the questionnaire on /questionnaire,
 * the therapist on /therapist/:id. Any component-mounted effect would miss
 * whichever route it was not mounted on, which is exactly how the chosen
 * therapist came to be the one thing never saved.
 *
 * Blank state writes nothing: opening the flow and leaving should store no
 * health answers at all. "Start over" clears the key explicitly, and the guard
 * below then keeps it clear.
 */
let previous = store.getState().questionnaire

store.subscribe(() => {
  const current = store.getState().questionnaire
  if (current === previous) return
  previous = current

  if (!hasAnyAnswer(current.answers, current.selectedTherapist)) return
  writeQuestionnaireDraft(current.answers, current.stepIndex, current.selectedTherapist)
})
