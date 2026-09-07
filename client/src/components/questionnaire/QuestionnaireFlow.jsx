import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button, Text } from '../ui'
import QuestionnaireAside from './QuestionnaireAside'
import QuestionScreen from './QuestionScreen'
import StepWhoFor from './steps/StepWhoFor'
import StepAboutYou from './steps/StepAboutYou'
import StepLocation from './steps/StepLocation'
import StepRelationship from './steps/StepRelationship'
import StepContact from './steps/StepContact'
import StepPartner from './steps/StepPartner'
import StepConcerns from './steps/StepConcerns'
import StepPreference from './steps/StepPreference'
import ReviewScreen from './ReviewScreen'
import ScopeMarker from './ScopeMarker'
import {
  selectAnswers,
  selectActiveAnswers,
  selectAnswerEcho,
  selectAtReview,
  selectReviewRows,
  selectCurrentStep,
  selectStepIndex,
  selectSteps,
  answersUpdated,
  partnerUpdated,
  stepAdvanced,
  stepWentBack,
  stepJumped,
  reviewOpened,
  draftRestored,
  questionnaireReset,
} from '../../store/questionnaireSlice'
import { validateStep } from '../../lib/validation/questionnaire'
import {
  readQuestionnaireDraft,
  writeQuestionnaireDraft,
  clearQuestionnaireDraft,
  hasAnyAnswer,
} from '../../lib/questionnaireDraft'
import { screens, nav, review } from '../../data/questionnaireContent'

/**
 * The intake flow: a standing panel on the left, one question on the right.
 *
 * Answers live in Redux, not here, so Back never loses anything and the values
 * survive the move to /matches and /checkout later.
 *
 * WHAT IS BUILT: both branches. The individual path is chunk 5.2, the couple
 * path 5.3. The concerns and preference screens are 5.4 and still render a
 * marked placeholder naming what they will ask for.
 */

/** Screens that belong to one partner rather than to both (chunk 5.3). */
const PARTNER_STEPS = { partner1: 'partner1', partner2: 'partner2' }

const SCREENS = {
  type: StepWhoFor,
  about: StepAboutYou,
  location: StepLocation,
  relationship: StepRelationship,
  concerns: StepConcerns,
  preference: StepPreference,
  contact: StepContact,
}

export default function QuestionnaireFlow() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  const answers = useSelector(selectAnswers)
  const activeAnswers = useSelector(selectActiveAnswers)
  const echo = useSelector(selectAnswerEcho)
  const steps = useSelector(selectSteps)
  const stepIndex = useSelector(selectStepIndex)
  const step = useSelector(selectCurrentStep)
  const atReview = useSelector(selectAtReview)
  const reviewRows = useSelector(selectReviewRows)

  const [errors, setErrors] = useState({})
  const headingRef = useRef(null)
  const isFirstRender = useRef(true)

  // Read once, during render, via a lazy initialiser — reading a ref or setting
  // state during render is what the React Compiler rule objects to.
  const [savedDraft] = useState(readQuestionnaireDraft)

  useEffect(() => {
    if (savedDraft) dispatch(draftRestored(savedDraft))
  }, [dispatch, savedDraft])

  // The hasAnyAnswer guard is load-bearing: without it this fires on mount with
  // the still-empty answers and overwrites the draft the effect above restores.
  useEffect(() => {
    if (!hasAnyAnswer(answers)) return
    writeQuestionnaireDraft(answers, stepIndex)
  }, [answers, stepIndex])

  // Focus the question on each step change, so a screen reader lands on the new
  // screen rather than where the old Continue button used to be. First render is
  // skipped: taking focus on page load is disorienting.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    headingRef.current?.focus()
  }, [stepIndex, atReview])

  const isLast = stepIndex === steps.length - 1
  const isCouple = answers.type === 'couple'
  const partnerKey = PARTNER_STEPS[step.id]
  const Screen = SCREENS[step.id]

  // Branch-aware copy: the couple override when there is one, otherwise the
  // shared wording. One content file, no duplicated screens.
  const base = screens[step.id]
  const copy = isCouple && base?.couple ? { ...base, ...base.couple } : base

  // The second partner screen names the first, so it confirms what was captured
  // instead of appearing to ask for the same person again.
  const reassurance =
    step.id === 'partner2'
      ? answers.partner1?.name
        ? base.reassurance.replace('{name}', answers.partner1.name)
        : base.reassuranceFallback
      : copy?.reassurance

  /** Clears only the messages for the fields just corrected. */
  function clearErrorsFor(keys) {
    setErrors((current) => {
      const next = { ...current }
      for (const key of keys) delete next[key]
      return next
    })
  }

  function handleChange(patch) {
    dispatch(answersUpdated(patch))
    clearErrorsFor(Object.keys(patch))
  }

  function handlePartnerChange(partner, values) {
    dispatch(partnerUpdated({ partner, values }))
    // Partner errors are keyed by their full path, so clearing `partner1` alone
    // would leave "Enter a name." sitting under a name that has been fixed.
    clearErrorsFor(Object.keys(values).map((field) => `${partner}.${field}`))
  }

  function handleContinue() {
    const result = validateStep(step.id, activeAnswers)
    setErrors(result.errors)
    if (!result.ok) return

    // Past the last question is the review; past the review is matching.
    if (atReview) navigate('/matches')
    else if (isLast) dispatch(reviewOpened())
    else dispatch(stepAdvanced())
  }

  function handleEdit(index) {
    setErrors({})
    dispatch(stepJumped(index))
  }

  function handleBack() {
    setErrors({})
    dispatch(stepWentBack())
  }

  function handleStartOver() {
    clearQuestionnaireDraft()
    dispatch(questionnaireReset())
    setErrors({})
  }

  return (
    <div className="lg:grid lg:min-h-[calc(100dvh-72px)] lg:grid-cols-[minmax(320px,26rem)_1fr]">
      <QuestionnaireAside
        current={stepIndex + 1}
        total={steps.length}
        label={step.label}
        echo={echo}
      />

      <div className="px-5 py-12 sm:px-8 lg:px-14 lg:py-20">
        <div className="mx-auto w-full max-w-xl lg:mx-0">
          {/* Focus moves to the heading; this says where "here" is. */}
          <p className="sr-only" role="status">
            {atReview
              ? review.heading
              : `Step ${stepIndex + 1} of ${steps.length}: ${step.label}`}
          </p>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={atReview ? 'review' : step.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {atReview ? (
                <ReviewScreen
                  rows={reviewRows}
                  onEdit={handleEdit}
                  headingRef={headingRef}
                />
              ) : (
              <QuestionScreen
                ref={headingRef}
                heading={copy?.heading ?? step.label}
                reassurance={reassurance}
                marker={
                  isCouple && step.id !== 'type' ? (
                    <ScopeMarker scope={partnerKey ? 'one' : 'both'} />
                  ) : null
                }
              >
                {partnerKey ? (
                  <StepPartner
                    partner={partnerKey}
                    answers={answers}
                    onPartnerChange={handlePartnerChange}
                    errors={errors}
                  />
                ) : Screen ? (
                  <Screen answers={answers} onChange={handleChange} errors={errors} />
                ) : (
                  // Chunks 5.3 and 5.4 replace these.
                  <div className="rounded-xl border border-ink/12 bg-mist p-6">
                    <Text size="caption" tone="muted">
                      This screen is built in a later chunk. It will ask for:{' '}
                      {step.fields.join(', ')}.
                    </Text>
                  </div>
                )}
              </QuestionScreen>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={handleBack} disabled={stepIndex === 0}>
              {nav.back}
            </Button>

            {/* Never disabled. On the review screen this is the hand-off to
                matching (chunk 5.6); everywhere else it is Continue. */}
            <Button onClick={handleContinue}>
              {atReview ? review.submit : nav.continue}
            </Button>
          </div>

          {/* The standing panel is desktop-only, so the summary comes here on a
              phone rather than eating a third of a small screen. */}
          {echo.length > 0 && (
            <div className="mt-10 border-t border-ink/12 pt-6 lg:hidden">
              <dl className="flex flex-wrap gap-x-6 gap-y-2">
                {echo.map((item) => (
                  <div key={item.label} className="flex items-baseline gap-2">
                    <dt className="font-body text-caption text-ink/70">{item.label}</dt>
                    <dd className="font-body text-caption font-medium text-ink">
                      {/* A list item carries `values`, not `value` — reading the
                          wrong one here would print "undefined" on a phone. */}
                      {item.values ? item.values.join(', ') : item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="mt-8 border-t border-ink/12 pt-6 lg:mt-10">
            <button
              type="button"
              onClick={handleStartOver}
              className="min-h-11 font-body text-caption text-ink/70 underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:text-ink"
            >
              {nav.startOver}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
