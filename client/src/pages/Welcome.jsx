import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'

import Button from '../components/ui/Button'
import Heading from '../components/ui/Heading'
import Text from '../components/ui/Text'
import Spinner from '../components/ui/Spinner'
import OutcomeCard from '../components/checkout/OutcomeCard'
import { CompletedMark } from '../components/checkout/OutcomeMarks'
import { fetchSessionStatus } from '../lib/api/checkoutApi'
import { clearQuestionnaireDraft } from '../lib/questionnaireDraft'
import { selectSelectedTherapist } from '../store/questionnaireSlice'
import { welcome } from '../data/checkoutContent'

const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 20 // ~40 seconds

export default function Welcome() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const therapist = useSelector(selectSelectedTherapist)

  const [status, setStatus] = useState(sessionId ? 'processing' : 'no-session')
  const attempts = useRef(0)

  useEffect(() => {
    if (!sessionId) return undefined

    let active = true
    let timer

    const poll = async () => {
      try {
        const result = await fetchSessionStatus(sessionId)
        if (!active) return

        if (result === 'ready') {
          setStatus('ready')
          clearQuestionnaireDraft()
          return
        }

        attempts.current += 1
        if (attempts.current >= MAX_POLLS) {
          setStatus('slow')
          return
        }
        timer = setTimeout(poll, POLL_INTERVAL_MS)
      } catch {
        if (!active) return
        attempts.current += 1
        if (attempts.current >= MAX_POLLS) {
          setStatus('slow')
          return
        }
        timer = setTimeout(poll, POLL_INTERVAL_MS)
      }
    }

    poll()

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [sessionId])

  const therapistName = therapist
    ? [therapist.title, therapist.firstName, therapist.lastName].filter(Boolean).join(' ')
    : null

  // ==================== 1. PROCESSING STATE ====================
  if (status === 'processing') {
    return (
      <OutcomeCard mark={<CompletedMark className="h-8 w-8" />}>
        <div className="flex items-center justify-between">
          <Heading level={1} size="subsection">
            {welcome.processingHeading}
          </Heading>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-2.5 py-0.5 font-body text-[11px] font-medium text-sage-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-sage-deep animate-pulse" />
            Provisioning
          </span>
        </div>

        <Text className="mt-3" tone="muted">
          {welcome.processingBody}
        </Text>

        {/* Structured Live Provisioning Checklist */}
        <div className="mt-6 space-y-2.5 rounded-xl border border-ink/8 bg-mist p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage text-paper text-[10px] font-bold">
              ✓
            </span>
            <span className="font-body text-caption font-medium text-ink">
              Payment verified by Stripe
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-paper text-[10px] animate-spin">
              ⟳
            </span>
            <span className="font-body text-caption font-medium text-ink">
              Creating your secure client portal...
            </span>
          </div>

          <div className="flex items-center gap-3 opacity-50">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink/40 font-body text-[10px] text-ink">
              3
            </span>
            <span className="font-body text-caption text-ink">
              Sending your login credentials
            </span>
          </div>
        </div>

        <p
          className="mt-5 flex items-center gap-2 font-body text-caption text-ink/70"
          role="status"
          aria-live="polite"
        >
          <Spinner size="sm" />
          <span>{welcome.processingNote}</span>
        </p>
      </OutcomeCard>
    )
  }

  // ==================== 2. SLOW / DELAYED STATE ====================
  if (status === 'slow') {
    return (
      <OutcomeCard mark={<CompletedMark className="h-8 w-8" />}>
        <Heading level={1} size="subsection">
          {welcome.slowHeading}
        </Heading>
        <Text className="mt-4" tone="muted">
          {welcome.slowBody}
        </Text>
        <Text className="mt-3" tone="muted">
          {welcome.slowNote}
        </Text>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button as={Link} to="/contact" className="sm:w-auto">
            {welcome.slowCta}
          </Button>
          <Button as={Link} to="/login" variant="secondary" className="sm:w-auto">
            {welcome.readyCta}
          </Button>
        </div>
      </OutcomeCard>
    )
  }

  // ==================== 3. DIRECT VISIT (NO SESSION) ====================
  if (status === 'no-session') {
    return (
      <OutcomeCard mark={<CompletedMark className="h-8 w-8" />}>
        <Heading level={1} size="subsection">
          {welcome.unknownHeading}
        </Heading>
        <Text className="mt-4" tone="muted">
          {welcome.unknownBody}
        </Text>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button as={Link} to="/login" className="sm:w-auto">
            {welcome.unknownCta}
          </Button>
          <Button as={Link} to="/questionnaire" variant="secondary" className="sm:w-auto">
            {welcome.unknownSecondary}
          </Button>
        </div>
      </OutcomeCard>
    )
  }

  // ==================== 4. READY STATE ====================
  return (
    <OutcomeCard mark={<CompletedMark className="h-8 w-8" />}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Heading level={1} size="subsection">
            {welcome.readyHeading}
          </Heading>
          <Text className="mt-1" tone="muted">
            {welcome.readyBody}
          </Text>
        </div>
        <span className="rounded-full border border-sage/25 bg-sage/10 px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-wide text-sage-deep shrink-0">
          Active · €200/mo
        </span>
      </div>

      {/* Matched Therapist Connection Card */}
      {therapist && (
        <div className="mt-5 flex items-center gap-3.5 rounded-xl border border-ink/8 bg-mist p-3.5 sm:p-4">
          {therapist.photoUrl ? (
            <img
              src={therapist.photoUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-ink/10 sm:h-14 sm:w-14"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage/15 font-body text-sm font-medium text-sage-deep sm:h-14 sm:w-14">
              {therapist.firstName?.[0] || 'T'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-body text-ui font-medium text-ink truncate">
                {therapistName}
              </p>
              <span className="inline-flex items-center rounded-full bg-sage/20 px-2 py-0.5 font-body text-[11px] font-medium text-sage-deep">
                Your Therapist
              </span>
            </div>
            <p className="font-body text-caption text-ink/70 truncate">
              {therapist.therapistType || 'Licensed Therapist'} · 4 video sessions available
            </p>
          </div>
        </div>
      )}

      {/* 3-Step Guided Roadmap */}
      <div className="mt-6 space-y-2.5">
        <p className="font-body text-[11px] font-semibold uppercase tracking-wider text-ink/50">
          Next steps
        </p>

        <div className="flex items-start gap-3 rounded-lg border border-ink/6 bg-paper p-3 shadow-xs">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage/20 font-body text-xs font-bold text-sage-deep">
            ✓
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body text-caption font-medium text-ink">Account created</p>
            <p className="mt-0.5 font-body text-[13px] text-ink/70">
              Your subscription is active and your therapy records are securely initialized.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-ink/6 bg-paper p-3 shadow-xs">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/40 font-body text-xs font-bold text-ink">
            2
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body text-caption font-medium text-ink">Check your email for your password</p>
            <p className="mt-0.5 font-body text-[13px] text-ink/70">
              {welcome.readyEmail}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-ink/6 bg-paper p-3 shadow-xs">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink/10 font-body text-xs font-bold text-ink">
            3
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body text-caption font-medium text-ink">Sign in & introduce yourself</p>
            <p className="mt-0.5 font-body text-[13px] text-ink/70">
              {welcome.readyNext}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Button as={Link} to="/login" className="w-full sm:w-auto">
          {welcome.readyCta}
        </Button>
      </div>
    </OutcomeCard>
  )
}