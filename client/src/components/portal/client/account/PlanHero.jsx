import { useState } from 'react'
import { Button } from '../../../ui'
import { cx } from '../../../../lib/cx'
import { formatMoney } from '../../../../lib/dashboardFormat'
import { isoOf, longDate, longDateTime } from '../../../../lib/client/accessDates'
import { openBillingPortal } from '../../../../lib/api/clientPortalApi'
import { ACCOUNT } from '../../../../data/clientPortalContent'

/**
 * The plan, at the top of the Account page (11.5).
 *
 * INK, AND THAT IS THE MECHANISM: the one surface on this page where gold is
 * legible (11.08:1), so the session marks and the accent live here. §13's
 * portal notice sits in this hero, at body size, whenever a renewal is due —
 * the second of the three transparency points, never collapsed or tucked away.
 */

const DOT = { active: 'bg-sage', past_due: 'bg-clay', ending: 'bg-gold' }

function StatusMark({ access }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-paper/10 px-3 py-1.5 font-body text-caption font-medium text-paper">
      <span aria-hidden="true" className={cx('size-2 rounded-full', DOT[access] ?? 'bg-sage')} />
      {ACCOUNT.status[access] ?? ACCOUNT.status.active}
    </p>
  )
}

/** Four gold marks on a thread: filled for what is left this month. */
function SessionMarks({ left, total = 4 }) {
  if (left == null) return null
  return (
    <div className="sm:w-52">
      <div aria-hidden="true" className="relative flex items-center justify-between px-0.5">
        <span className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-paper/20" />
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cx(
              'relative size-4 rounded-full',
              i < left ? 'bg-gold shadow-[0_0_14px_rgb(245_197_24/0.35)]' : 'bg-ink ring-[1.5px] ring-inset ring-paper/45',
            )}
          />
        ))}
      </div>
      <p className="mt-3 font-body text-caption font-medium text-paper">{ACCOUNT.sessionsLeft(left, total)}</p>
      <p className="font-body text-caption text-paper/70">{ACCOUNT.noRollover}</p>
    </div>
  )
}

function UpdateCard() {
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState(null)

  async function open() {
    setOpening(true)
    setError(null)
    try {
      const { url } = await openBillingPortal()
      window.location.assign(url)
    } catch (failure) {
      setOpening(false)
      setError(failure?.status ? failure.message : ACCOUNT.failed)
    }
  }

  return (
    <div className="mt-5">
      <Button
        loading={opening}
        onClick={open}
        className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold aria-busy:disabled:cursor-progress aria-busy:disabled:opacity-100"
      >
        {opening ? ACCOUNT.opening : ACCOUNT.updateCard}
      </Button>
      {error && (
        <p role="alert" className="mt-2 font-body text-caption text-paper">
          {error}
        </p>
      )}
    </div>
  )
}

export default function PlanHero({ subscription, access, accessEndsAt }) {
  if (!subscription) return null

  const amount = formatMoney(subscription.amount, subscription.currency)
  let label = ACCOUNT.nextPayment
  let when = subscription.nextBillingDate
  let whenText = longDate(when)
  let note = ACCOUNT.renewalNotice(longDate(when))

  if (access === 'ending') {
    label = ACCOUNT.endsLabel
    when = accessEndsAt ?? subscription.currentPeriodEnd
    whenText = longDateTime(when)
    note = ACCOUNT.endsNote
  } else if (access === 'past_due') {
    label = ACCOUNT.pastDueLabel
    when = subscription.graceEndsAt ?? accessEndsAt
    whenText = when ? longDateTime(when) : null
    note = ACCOUNT.pastDueNote
  }

  return (
    <section
      aria-labelledby="plan-heading"
      className="relative overflow-hidden rounded-3xl bg-ink px-6 py-7 shadow-[0_24px_60px_-30px_rgb(13_9_22/0.7)] sm:px-9 sm:py-9"
    >
      {/* Light on the surface: a warm gold glow and a sage one, both slow and low. */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full bg-gold/12 blur-[110px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-24 size-72 rounded-full bg-sage/20 blur-[120px]" />

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusMark access={access} />
          <p className="font-body text-caption text-paper/70">
            {ACCOUNT.plan} · {amount}
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 id="plan-heading" className="font-body text-ui text-paper/70">
              {label}
            </h2>
            {whenText && (
              <p className="mt-1 font-body text-[1.75rem] leading-tight font-medium tracking-[-0.02em] text-paper sm:text-[2.125rem]">
                <time dateTime={isoOf(when)}>{whenText}</time>
              </p>
            )}
            {access === 'active' && (
              <p className="mt-1 font-body text-ui text-paper/70">
                <span className="font-medium text-gold">{amount}</span> · renews monthly
              </p>
            )}
          </div>
          <SessionMarks left={access === 'ended' ? 0 : subscription.sessionsRemaining} />
        </div>

        {/* §13's portal notice, quoted exactly, at body size. */}
        <p className="mt-7 max-w-measure border-t border-paper/15 pt-5 font-body text-body leading-relaxed text-paper">
          {note}
        </p>

        {access === 'past_due' && <UpdateCard />}
      </div>
    </section>
  )
}
