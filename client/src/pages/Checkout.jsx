import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, useReducedMotion } from 'framer-motion'

import logoWhite from '../assets/cast-of-mind-logo-singular-white.png'
import Button from '../components/ui/Button'
import Text from '../components/ui/Text'
import Spinner from '../components/ui/Spinner'
import FormAlert from '../components/auth/FormAlert'
import TherapistSummary from '../components/checkout/TherapistSummary'
import IncludedGrid from '../components/checkout/IncludedGrid'
import RenewalDisclosure from '../components/checkout/RenewalDisclosure'
import { Lock } from '../components/checkout/CheckoutIcons'
import { selectActiveAnswers, selectSelectedTherapist } from '../store/questionnaireSlice'
import { toCheckoutPayload } from '../lib/toCheckoutPayload'
import { createCheckoutSession } from '../lib/api/checkoutApi'
import { checkout, errors as errorRoutes } from '../data/checkoutContent'

/**
 * /checkout — the last screen before Stripe.
 *
 * THE PERSON LEADS, THE PRICE SUPPORTS. There is no form here: Stripe's hosted
 * page collects the card, so this page's only jobs are who you are starting
 * with, what it costs, and the renewal terms stated unmissably.
 *
 * Same split frame as /contact, /join-as-therapist and /questionnaire, so all
 * four pre-account surfaces read as one product.
 */
export default function Checkout() {
  const answers = useSelector(selectActiveAnswers)
  const therapist = useSelector(selectSelectedTherapist)
  const reduceMotion = useReducedMotion()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // A shared link or a fresh tab has no answers and no choice. Sending a
  // request with nothing would 422; sending the visitor back is the honest move.
  if (!answers?.type || !answers?.email) return <Navigate to="/questionnaire" replace />
  if (!therapist?.id) return <Navigate to="/matches" replace />

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      const url = await createCheckoutSession(toCheckoutPayload(answers, therapist.id))
      // A full navigation, not a router push: Stripe is another origin.
      window.location.assign(url)
    } catch (apiError) {
      setError(apiError)
      // Only re-enabled on failure. On success the page is leaving anyway, and
      // re-enabling would let a second click burn another of the 10 hourly
      // attempts the rate limiter allows.
      setSubmitting(false)
    }
  }

  const recovery = error ? errorRoutes[error.code] : null

  return (
    <div className="grid min-h-[calc(100dvh-72px)] lg:grid-cols-[minmax(320px,5fr)_7fr]">
      {/* WHO — the human anchor. */}
      <aside className="relative overflow-hidden bg-ink-deep">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-1/3 h-[420px] w-[420px] rounded-full bg-sage/10 blur-[130px] motion-safe:animate-drift"
        />

        <div className="relative flex h-full flex-col gap-8 px-6 py-8 sm:px-8 lg:sticky lg:top-[72px] lg:gap-12 lg:px-10 lg:py-14">
          <TherapistSummary therapist={therapist} />

          {/* Below lg this sits under the fold on purpose — the disclosure has
              to be reachable without scrolling, and four descriptions here
              would push it down. */}
          <div className="hidden lg:block">
            <IncludedGrid />
          </div>


          <Link
            to={`/therapist/${therapist.id}`}
            className="group mt-0 hidden w-fit items-center gap-2.5 rounded-full border border-paper/15 bg-paper/5 px-4 py-2 font-body text-caption font-medium text-paper/80 shadow-xs backdrop-blur-sm transition-all duration-200 hover:border-paper/30 hover:bg-paper/10 hover:text-paper lg:inline-flex"
          >
            <svg
              className="h-3.5 w-3.5 text-sage transition-transform duration-200 group-hover:-translate-x-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>{checkout.backToTherapist}</span>
          </Link>


        </div>
      </aside>

      {/* THE MONEY. A section, not a <main> — PublicLayout owns that landmark. */}
      <section aria-labelledby="checkout-heading" className="bg-paper px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-[34rem]"
        >
          <h1
            id="checkout-heading"
            className="font-display text-section leading-tight text-ink"
          >
            {checkout.heading}
          </h1>
          <Text className="mt-3 max-w-measure" tone="muted">
            {checkout.intro}
          </Text>

          {/* The price. One figure, given room — no strikethrough, no "was",
              no discount theatre. There is one plan and one price. */}
          <p className="mt-8 flex items-baseline gap-3">
            <span className="font-display text-[2.75rem] leading-none text-ink sm:text-[3.25rem]">
              {checkout.price}
            </span>
            <span className="font-body text-ui text-ink/70">{checkout.priceUnit}</span>
          </p>

          <div className="mt-8">
            <RenewalDisclosure />
          </div>

          {error && (
            <div className="mt-6">
              <FormAlert>
                {error.message}
                {recovery && (
                  <>
                    {' '}
                    <Link
                      to={recovery.to}
                      className="font-medium underline decoration-current underline-offset-4"
                    >
                      {recovery.action}
                    </Link>
                  </>
                )}
              </FormAlert>
            </div>
          )}

          <Button
            className="mt-8 w-full"
            onClick={handleSubmit}
            disabled={submitting}
            aria-busy={submitting || undefined}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" />
                {checkout.submitting}
              </span>
            ) : (
              checkout.submit
            )}
          </Button>

          <p className="mt-4 flex items-start gap-2 font-body text-caption text-ink/70">
            <Lock aria-hidden="true" className="mt-px h-4 w-4 shrink-0 text-sage-deep" />
            <span>{checkout.secureNote}</span>
          </p>

          <p className="mt-6 font-body text-caption leading-relaxed text-ink/70">
            {checkout.legalIntro}{' '}
            <Link to="/terms" className="underline decoration-ink/40 underline-offset-4">
              {checkout.terms}
            </Link>{' '}
            and{' '}
            <Link to="/refund" className="underline decoration-ink/40 underline-offset-4">
              {checkout.refund}
            </Link>
            .
          </p>

          {/* The mobile home for what's included, and for the way back. */}
          <div className="mt-12 rounded-2xl bg-ink-deep px-6 py-7 lg:hidden">
            <IncludedGrid />


            <Link
              to={`/therapist/${therapist.id}`}
              className="group mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-3.5 py-1.5 font-body text-[12px] font-medium text-paper/80 shadow-xs backdrop-blur-sm transition-all duration-200 hover:border-paper/30 hover:bg-paper/10 hover:text-paper"
            >
              <svg
                className="h-3 w-3 text-sage transition-transform duration-200 group-hover:-translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>{checkout.backToTherapist}</span>
            </Link>




          </div>
        </motion.div>
      </section>
    </div>
  )
}
