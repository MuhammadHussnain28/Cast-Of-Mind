import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'

import Button from '../components/ui/Button'
import Heading from '../components/ui/Heading'
import Text from '../components/ui/Text'
import OutcomeCard from '../components/checkout/OutcomeCard'
import { KeptPlaceMark } from '../components/checkout/OutcomeMarks'
import { selectSelectedTherapist } from '../store/questionnaireSlice'
import { cancelled } from '../data/checkoutContent'

/**
 * /checkout/cancel — where Stripe returns someone who closed the payment page.
 *
 * Grounded card with clear reassurance:
 * - Shows the matched therapist whose session spot is held
 * - Explicitly confirms zero charges occurred
 * - No dark patterns, countdowns, or pressure
 */
export default function CheckoutCancelled() {
  const therapist = useSelector(selectSelectedTherapist)
  const canResume = Boolean(therapist?.id)

  const therapistName = therapist
    ? [therapist.title, therapist.firstName, therapist.lastName].filter(Boolean).join(' ')
    : null

  return (
    <OutcomeCard mark={<KeptPlaceMark className="h-8 w-8" />}>
      <Heading level={1} size="subsection">
        {cancelled.heading}
      </Heading>

      <Text className="mt-4" tone="muted">
        {cancelled.body}
      </Text>

      {/* Held Therapist Card (if selected therapist is present in draft) */}
      {canResume && (
        <div className="mt-6 flex items-center gap-3.5 rounded-xl border border-ink/8 bg-mist p-3.5 sm:p-4">
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
                Spot Held
              </span>
            </div>
            <p className="font-body text-caption text-ink/70 truncate">
              {therapist.therapistType || 'Licensed Therapist'} · Match is safely kept
            </p>
          </div>
        </div>
      )}

      {/* Reassurance Tags */}
      {canResume && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-md border border-ink/8 bg-paper px-2.5 py-1 font-body text-caption text-ink/70">
            ✓ Cancel anytime
          </span>
          <span className="rounded-md border border-ink/8 bg-paper px-2.5 py-1 font-body text-caption text-ink/70">
            ✓ No long-term lock-in
          </span>
          <span className="rounded-md border border-ink/8 bg-paper px-2.5 py-1 font-body text-caption text-ink/70">
            ✓ Switch therapists anytime
          </span>
        </div>
      )}

      <Text className="mt-4" tone="muted">
        {canResume ? cancelled.reassurance : cancelled.lostReassurance}
      </Text>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {canResume ? (
          <>
            <Button as={Link} to="/checkout" className="sm:w-auto">
              {cancelled.resume}
            </Button>
            <Button as={Link} to="/matches" variant="secondary" className="sm:w-auto">
              {cancelled.browse}
            </Button>
          </>
        ) : (
          <Button as={Link} to="/questionnaire" className="sm:w-auto">
            {cancelled.restart}
          </Button>
        )}
      </div>
    </OutcomeCard>
  )
}