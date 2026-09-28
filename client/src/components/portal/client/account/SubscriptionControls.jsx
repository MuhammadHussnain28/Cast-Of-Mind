import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Button } from '../../../ui'
import { cx } from '../../../../lib/cx'
import { formatMoney } from '../../../../lib/dashboardFormat'
import { isoOf, longDate, longDateTime } from '../../../../lib/client/accessDates'
import { cancelMySubscription, reactivateMySubscription } from '../../../../lib/api/clientPortalApi'
import { CANCELLATION as COPY } from '../../../../data/clientPortalContent'
import { SUPPORT_EMAIL } from '../../../../data/contactContent'
import { CardStopIcon, HoursIcon, KeptIcon } from '../ClientPortalIcons'

/**
 * Cancelling and reactivating (§13, 11.3).
 *
 * NO RETENTION PRESSURE. The way out is easy to find, the confirmation states
 * facts and nothing else, and its two buttons carry equal weight. Access runs
 * to the end already paid for — the date the server works out, never a guess.
 */

const plate =
  'relative overflow-hidden rounded-2xl bg-paper px-5 py-6 shadow-[0_12px_32px_-20px_rgb(25_18_43/0.35)] sm:px-7 sm:py-7'

// The house ambient wash, felt before it is noticed.
function Wash({ side = 'left' }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        'pointer-events-none absolute -top-20 size-72 rounded-full bg-sage/10 blur-[130px]',
        side === 'left' ? '-left-24' : '-right-24',
      )}
    />
  )
}

function ErrorLine({ children }) {
  if (!children) return null
  return (
    <p role="alert" className="mt-3 font-body text-caption text-clay">
      {children}
    </p>
  )
}

const failureText = (failure, fallback) => (failure?.status ? failure.message : fallback)

/** One station on the drawn path: a disc, a label, a line of fact. */
function Station({ icon, label, children }) {
  return (
    <li className="relative flex gap-4 sm:flex-col sm:items-center sm:gap-3 sm:text-center">
      <span
        aria-hidden="true"
        className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full bg-paper text-sage-deep ring-1 ring-sage/40"
      >
        {icon}
      </span>
      <div className="min-w-0 pt-1 sm:pt-0">
        <p className="font-body text-caption font-medium text-ink">{label}</p>
        <p className="mt-1 font-body text-caption leading-relaxed text-ink/70">{children}</p>
      </div>
    </li>
  )
}

function CancelPanel({ subscription, access, accessEndsAt, refresh }) {
  const reduce = useReducedMotion()
  const panelId = useId()
  const headingRef = useRef(null)
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  const pastDue = access === 'past_due'
  const ends = accessEndsAt ?? subscription.currentPeriodEnd
  const endsText = longDateTime(ends)

  function openPanel() {
    setOpen(true)
    setError(null)
  }

  // Focus follows the panel: into its heading on open (reduced motion too), and
  // back to the trigger once it has closed (onExitComplete, below).
  useEffect(() => {
    if (open) headingRef.current?.focus()
  }, [open])

  function keep() {
    setOpen(false)
    setError(null)
  }

  async function confirm() {
    setWorking(true)
    setError(null)
    try {
      await cancelMySubscription()
      // The shell re-reads /me; this panel gives way to the "ends" view.
      refresh()
    } catch (failure) {
      setWorking(false)
      setError(failureText(failure, COPY.failed))
    }
  }

  return (
    <section aria-labelledby={`${panelId}-title`} className={plate}>
      <Wash side="right" />
      <div className="relative">
        <h2 id={`${panelId}-title`} className="font-body text-subsection text-ink-deep">
          {COPY.heading}
        </h2>
        <p className="mt-2 max-w-measure font-body text-ui leading-relaxed text-ink/70">{COPY.intro}</p>

        {/* Easy to find, never hidden: an ink/50 edge (3.44:1) on paper. */}
        {!open && (
          <button
            ref={triggerRef}
            type="button"
            onClick={openPanel}
            aria-expanded={false}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-ink/50 px-6 font-body text-ui font-medium text-ink transition-colors duration-200 ease-out hover:bg-mist focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {COPY.open}
          </button>
        )}

        <AnimatePresence initial={false} onExitComplete={() => triggerRef.current?.focus()}>
          {open && (
            <motion.div
              id={panelId}
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-6 rounded-xl bg-mist px-4 py-5 sm:px-6 sm:py-6">
                <h3
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-body text-ui font-medium text-ink-deep focus-visible:outline-none"
                >
                  {COPY.confirmHeading}
                </h3>

                <ol className="relative mt-5 grid gap-5 sm:grid-cols-3 sm:gap-4">
                  {/* The path the three stations sit on: down on a phone, across above. */}
                  <span aria-hidden="true" className="absolute top-5 bottom-5 left-[1.3125rem] w-px bg-sage sm:hidden" />
                  <span aria-hidden="true" className="absolute top-[1.3125rem] right-[16.5%] left-[16.5%] hidden h-px bg-sage sm:block" />

                  <Station icon={<CardStopIcon size={20} />} label={COPY.stations[pastDue ? 'nowPastDue' : 'now'].label}>
                    {COPY.stations[pastDue ? 'nowPastDue' : 'now'].body}
                  </Station>
                  <Station
                    icon={<HoursIcon size={20} />}
                    label={
                      <>
                        {COPY.stations.until.label} <time dateTime={isoOf(ends)}>{endsText}</time>
                      </>
                    }
                  >
                    {COPY.stations.until.body}
                  </Station>
                  <Station icon={<KeptIcon size={20} />} label={COPY.stations.after.label}>
                    {COPY.stations.after.body}
                  </Station>
                </ol>

                {pastDue && (
                  <p className="mt-5 max-w-measure font-body text-caption leading-relaxed text-ink/70">
                    {COPY.pastDueNote}
                  </p>
                )}

                {/* Equal weight, on purpose: neither answer is the "right" one. */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Button
                    variant="secondary"
                    onClick={keep}
                    disabled={working}
                    className="w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {COPY.keep}
                  </Button>
                  <Button
                    variant="danger"
                    loading={working}
                    onClick={confirm}
                    className="w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-busy:disabled:cursor-progress aria-busy:disabled:opacity-100"
                  >
                    {working ? COPY.cancelling : COPY.confirm}
                  </Button>
                </div>
                <ErrorLine>{error}</ErrorLine>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

function EndingPanel({ subscription, accessEndsAt, refresh }) {
  const headingId = useId()
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  const ends = accessEndsAt ?? subscription.currentPeriodEnd
  // Only the client's own cancellation, and not a past-due one Stripe has ended.
  const canReactivate = subscription.cancelledBy === 'client' && !subscription.graceEndsAt

  async function reactivate() {
    setWorking(true)
    setError(null)
    try {
      await reactivateMySubscription()
      refresh()
    } catch (failure) {
      setWorking(false)
      setError(failureText(failure, COPY.failed))
    }
  }

  return (
    <section aria-labelledby={headingId} className={plate}>
      <Wash side="left" />
      <div className="relative">
        {/* The date itself leads the plan hero above (11.5); here it is drawn. */}
        <h2 id={headingId} className="font-body text-ui font-medium text-ink-deep">
          {COPY.endsHeading}
        </h2>

        {/* The horizon: today, the paid time still ahead, the end. A date, never
            a count of days — a countdown is an urgency tactic. */}
        <div className="mt-5 max-w-md">
          <div aria-hidden="true" className="flex items-center">
            <span className="size-2.5 shrink-0 rounded-full bg-sage-deep" />
            <span className="mx-1.5 h-px flex-1 bg-sage/60" />
            <span className="size-4 shrink-0 rounded-full border-2 border-ink bg-paper" />
          </div>
          <div className="mt-2 flex justify-between font-body text-caption text-ink/70">
            <span>{COPY.today}</span>
            <span>{longDate(ends)}</span>
          </div>
        </div>

        <p className="mt-5 max-w-measure font-body text-ui leading-relaxed text-ink/70">{COPY.endsBody}</p>

        <div className="mt-6 border-t border-ink/12 pt-5">
          {canReactivate ? (
            <>
              <h3 className="font-body text-ui font-medium text-ink-deep">{COPY.reactivateHeading}</h3>
              <p className="mt-1 max-w-measure font-body text-caption leading-relaxed text-ink/70">
                {COPY.reactivateBody(
                  formatMoney(subscription.amount, subscription.currency),
                  longDate(subscription.nextBillingDate ?? subscription.currentPeriodEnd),
                )}
              </p>
              <Button
                variant="secondary"
                loading={working}
                onClick={reactivate}
                className="mt-4 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-busy:disabled:cursor-progress aria-busy:disabled:opacity-100 sm:w-auto"
              >
                {working ? COPY.reactivating : COPY.reactivate}
              </Button>
              <ErrorLine>{error}</ErrorLine>
            </>
          ) : (
            <p className="max-w-measure font-body text-caption leading-relaxed text-ink/70">
              {subscription.graceEndsAt ? COPY.noUndo : COPY.adminCancelled}{' '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-ink underline decoration-ink/60 underline-offset-2 hover:decoration-2"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default function SubscriptionControls({ subscription, access, accessEndsAt, refresh }) {
  if (!subscription) return null
  if (access === 'ending') {
    return <EndingPanel subscription={subscription} accessEndsAt={accessEndsAt} refresh={refresh} />
  }
  if (access === 'active' || access === 'past_due') {
    return (
      <CancelPanel subscription={subscription} access={access} accessEndsAt={accessEndsAt} refresh={refresh} />
    )
  }
  return null
}
