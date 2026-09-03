import { useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Heading, Text } from '../ui'
import FormAlert from '../auth/FormAlert'
import StepRail from './StepRail'
import ResumePrompt from './ResumePrompt'
import ErrorSummary from './ErrorSummary'
import StepPersonalDetails from './StepPersonalDetails'
import StepLocationAvailability from './StepLocationAvailability'
import StepProfessionalBackground from './StepProfessionalBackground'
import StepPracticeSpecialties from './StepPracticeSpecialties'
import StepComplianceDocuments from './StepComplianceDocuments'
import ReviewScreen from './ReviewScreen'
import SubmittedScreen from './SubmittedScreen'
import { ArrowLeft, ArrowRight } from './JoinIcons'
import {
  applicationSchema,
  emptyApplication,
  STEP_FIELDS,
  TOTAL_STEPS,
} from '../../lib/validation/therapistApplication'
import { steps, stepIntros, review } from '../../data/joinContent'
import { detectTimezone } from '../../lib/timezones'
import { toApplicationPayload } from '../../lib/toApplicationPayload'
import { submitApplication } from '../../lib/api/applicationApi'
import { toApiError } from '../../lib/api/ApiError'
import { useApplicationDraft, readDraft, clearDraft } from '../../lib/useApplicationDraft'

// The review screen sits one past the last step rather than being a sixth step,
// so the rail keeps reading "5 of 5".
const REVIEW = TOTAL_STEPS + 1

/** Which step a given field belongs to, for jumping back on a server error. */
function stepForField(field) {
  for (const [step, fields] of Object.entries(STEP_FIELDS)) {
    if (fields.includes(field)) return Number(step)
  }
  return 1
}

/**
 * Flattens react-hook-form's error tree into a list for the summary.
 * Nested groups (working hours) carry their messages one level down, so a
 * top-level read alone would show nothing for the very step that needs it most.
 */
function errorsForStep(errors, step) {
  const items = []

  for (const name of STEP_FIELDS[step] ?? []) {
    const entry = errors[name]
    if (!entry) continue

    if (entry.message) {
      items.push({ name, message: entry.message })
      continue
    }

    for (const [key, nested] of Object.entries(entry)) {
      if (nested?.message) {
        items.push({ name: key === 'root' ? name : `${name}.${key}`, message: nested.message })
      }
    }
  }

  return items
}

/**
 * The multi-step shell.
 *
 * ONE useForm holds every field for the whole application. Steps only change
 * which inputs are rendered — the values live here, so Back and Forward never
 * lose anything, and moving forward validates only the current step's fields
 * rather than complaining about steps not yet reached.
 */
export default function ApplicationForm() {
  const reduceMotion = useReducedMotion()
  // Lazy state, not a ref: read once on mount, and safe to use during render.
  const [draft] = useState(readDraft)

  // A saved draft is offered, never applied silently — see ResumePrompt.
  const [deciding, setDeciding] = useState(Boolean(draft))
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [errorStep, setErrorStep] = useState(null)
  const [summary, setSummary] = useState([])
  const [announcement, setAnnouncement] = useState('')
  const [submittedId, setSubmittedId] = useState(null)
  const headingRef = useRef(null)

  const {
    register,
    control,
    trigger,
    reset,
    setValue,
    setError,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(applicationSchema),
    mode: 'onBlur',
    defaultValues: { ...emptyApplication, timezone: detectTimezone() },
  })

  const values = useWatch({ control })

  // Paused while the resume choice is open, so an unanswered prompt cannot
  // overwrite the very draft it is offering. Stops for good once submitted.
  useApplicationDraft(values, step, !deciding && !submittedId)

  function announce(target) {
    const meta = steps.find((s) => s.number === target)
    setAnnouncement(
      target === REVIEW
        ? 'Review your answers before submitting.'
        : `Step ${target} of ${TOTAL_STEPS}, ${meta?.label ?? ''}.`,
    )
  }

  function focusHeading() {
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function goTo(next, dir) {
    setDirection(dir)
    setStep(next)
    setSummary([])
    announce(next)
    focusHeading()
  }

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step], { shouldFocus: false })

    if (!valid) {
      // The summary takes focus itself, so shouldFocus is off above — two
      // things grabbing focus would fight and the summary would lose.
      setSummary(errorsForStep(errors, step))
      return
    }

    goTo(step + 1, 1)
  }

  function goBack() {
    if (step === 1) return
    goTo(step - 1, -1)
  }

  function resumeDraft() {
    reset({ ...emptyApplication, timezone: detectTimezone(), ...(draft.values ?? {}) })
    setStep(draft.step ?? 1)
    setDeciding(false)
    announce(draft.step ?? 1)
    focusHeading()
  }

  function startFresh() {
    clearDraft()
    setStep(1)
    setDeciding(false)
    announce(1)
    focusHeading()
  }

  async function handleSubmit() {
    setSubmitError(null)
    setErrorStep(null)
    setSummary([])

    const valid = await trigger(undefined, { shouldFocus: false })
    if (!valid) {
      const firstBad = Object.keys(errors)[0]
      const target = firstBad ? stepForField(firstBad) : 1
      setSubmitError('Some answers still need attention. We have taken you back to them.')
      setDirection(-1)
      setStep(target)
      announce(target)
      setSummary(errorsForStep(errors, target))
      return
    }

    setSubmitting(true)

    try {
      const result = await submitApplication(toApplicationPayload(getValues()))
      clearDraft()
      setSubmittedId(result.id)
      focusHeading()
    } catch (err) {
      const apiError = toApiError(err)

      // 409 — the email is already known. It lives on step 1, so the message is
      // useless without a way back to it.
      if (apiError.status === 409) {
        setSubmitError(apiError.message)
        setErrorStep(1)
        return
      }

      // 422 — the server sends per-field paths. Map them onto the form and send
      // the applicant to the earliest step that has a problem.
      if (apiError.status === 422 && Array.isArray(apiError.details)) {
        let earliest = REVIEW

        for (const detail of apiError.details) {
          const field = detail.path?.split('.')[0]
          if (!field) continue
          setError(field, { type: 'server', message: detail.message })
          earliest = Math.min(earliest, stepForField(field))
        }

        setSubmitError('Some answers were not accepted. We have taken you back to them.')
        if (earliest <= TOTAL_STEPS) {
          setDirection(-1)
          setStep(earliest)
          announce(earliest)
        }
        return
      }

      setSubmitError(apiError.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedId) {
    return <SubmittedScreen applicationId={submittedId} />
  }

  const onReview = step === REVIEW
  const active = steps.find((s) => s.number === step)

  const slide = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, x: direction * 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: direction * -24 },
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
      }

  if (deciding) {
    return <ResumePrompt draft={draft} onResume={resumeDraft} onStartFresh={startFresh} />
  }

  return (
    <div>
      {/* Off-screen live region. Moving focus announces the heading; this
          announces WHERE you are, which the heading alone does not say. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <StepRail current={onReview ? TOTAL_STEPS : step} />

      <div className="mt-8">
        <Heading
          level={2}
          size="subsection"
          ref={headingRef}
          tabIndex={-1}
          className="text-ink outline-none"
        >
          {onReview ? review.heading : active?.label}
        </Heading>
        {(onReview || stepIntros[step]) && (
          <Text tone="muted" className="mt-2 max-w-measure text-sm">
            {onReview ? review.intro : stepIntros[step]}
          </Text>
        )}
      </div>

      {submitError && (
        <div className="mt-6">
          <FormAlert>
            {submitError}
            {errorStep && (
              <>
                {' '}
                <button
                  type="button"
                  onClick={() => goTo(errorStep, -1)}
                  className="min-h-11 underline underline-offset-4"
                >
                  Go back to {steps.find((s) => s.number === errorStep)?.label.toLowerCase()}
                </button>
              </>
            )}
          </FormAlert>
        </div>
      )}

      <ErrorSummary items={summary} className="mt-6" />

      {/* noValidate: the browser's own bubbles would compete with the inline
          messages, which say how to fix the problem rather than only naming it. */}
      <form noValidate className="mt-8" onSubmit={(e) => e.preventDefault()}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} {...slide}>
            {step === 1 && (
              <StepPersonalDetails register={register} control={control} errors={errors} />
            )}
            {step === 2 && (
              <StepLocationAvailability register={register} control={control} errors={errors} />
            )}
            {step === 3 && (
              <StepProfessionalBackground register={register} control={control} errors={errors} />
            )}
            {step === 4 && (
              <StepPracticeSpecialties register={register} control={control} errors={errors} />
            )}
            {step === 5 && (
              <StepComplianceDocuments
                register={register}
                control={control}
                errors={errors}
                setValue={setValue}
              />
            )}
            {onReview && <ReviewScreen values={values} onEdit={(s) => goTo(s, -1)} />}
          </motion.div>
        </AnimatePresence>

        {/* Stacks on a phone with the primary action on top, so it is not the
            control furthest from the thumb after a long scroll. */}
        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-body text-ui text-ink transition-colors duration-200 hover:bg-mist disabled:invisible sm:justify-start"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {onReview ? (
            <button
              type="button"
              onClick={handleSubmit}
              // Disabled while sending: a double click burns two of the five
              // submissions the rate limiter allows per hour.
              disabled={submitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-ink/50 bg-gold px-6 font-body text-ui font-medium text-ink transition-[filter] duration-200 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Submit application'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-ink/50 bg-gold px-6 font-body text-ui font-medium text-ink transition-[filter] duration-200 hover:brightness-95"
            >
              {step === TOTAL_STEPS ? 'Review your answers' : 'Continue'}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
