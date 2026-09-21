import { Badge, Text } from '../../ui'
import SessionCounter from '../../portal/sessions/SessionCounter'
import { BillingIcon } from './ClientIcons'
import { DETAIL } from '../../../data/adminClientContent'
import { subscriptionState } from '../../../data/subscriptionStates'
import { formatMoney } from '../../../lib/dashboardFormat'
import { formatDate } from '../../../lib/dateFormat'

/**
 * The money, given a surface of its own.
 *
 * The amount leads at display weight rather than sitting in a row of labelled
 * values: on a screen where the admin may be about to stop a payment, what is
 * being charged is the fact the decision turns on. The dates are the supporting
 * detail underneath it, and the session counter is the same drawn component
 * both portals use (9.4, 9.5) so the three screens cannot disagree.
 */
function Row({ label, value, muted = false }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5">
      <dt className="font-body text-caption text-ink/70">{label}</dt>
      <dd
        className={
          muted
            ? 'font-body text-ui text-ink/70 tabular-nums'
            : 'font-body text-ui font-medium text-ink tabular-nums'
        }
      >
        {value}
      </dd>
    </div>
  )
}

export default function SubscriptionPanel({ client }) {
  const sub = client.subscription

  if (!sub) {
    return (
      <section className="rounded-2xl border border-clay/40 bg-clay/5 px-5 py-5 sm:px-6">
        <h2 className="font-body text-caption font-medium text-ink/70">{DETAIL.subscription}</h2>
        <Text size="ui" className="mt-3 max-w-measure">
          {DETAIL.noSubscription}
        </Text>
      </section>
    )
  }

  const state = subscriptionState(sub.status)

  return (
    <section className="rounded-2xl bg-paper shadow-[0_18px_50px_-28px_rgba(25,18,43,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-mist text-ink">
            <BillingIcon className="size-6" />
          </span>
          <div>
            <h2 className="font-body text-caption font-medium text-ink/70">
              {DETAIL.subscription}
            </h2>
            <p className="mt-1 font-body text-subsection font-medium leading-tight text-ink">
              {formatMoney(sub.amount, sub.currency)}
              <span className="font-body text-ui font-normal text-ink/70"> a month</span>
            </p>
          </div>
        </div>

        <Badge tone={state.tone}>{state.label}</Badge>
      </div>

      <dl className="mt-5 divide-y divide-ink/12 border-y border-ink/12 px-5 sm:px-6">
        <Row label="Started" value={formatDate(sub.startDate)} />
        <Row
          label={sub.status === 'cancelled' ? 'Access ends' : 'Current period ends'}
          value={formatDate(sub.currentPeriodEnd)}
        />
        <Row
          label="Next payment"
          value={
            sub.status === 'active' || sub.status === 'past_due'
              ? formatDate(sub.nextBillingDate)
              : 'None — nothing further is charged'
          }
          muted={sub.status !== 'active' && sub.status !== 'past_due'}
        />
        {sub.cancelledAt && (
          <Row
            label="Cancelled"
            value={`${formatDate(sub.cancelledAt)}${
              sub.cancelledBy === 'admin' ? ' · by you' : sub.cancelledBy ? ' · by the client' : ''
            }`}
          />
        )}
      </dl>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <SessionCounter
          bare
          left={sub.sessionsRemaining}
          layout="row"
          title="Sessions left this cycle"
          caption="Resets to four on renewal. Unused sessions do not carry over."
        />

        {sub.platformSubscriptionId && (
          <div className="mt-6 border-t border-ink/12 pt-4">
            <p className="font-body text-caption text-ink/70">{DETAIL.stripeRef}</p>
            <p className="mt-1.5 break-all font-body text-caption text-ink tabular-nums">
              <span className="rounded-lg bg-mist px-2 py-1">{sub.platformSubscriptionId}</span>
            </p>
            <p className="mt-2 font-body text-caption text-ink/70">{DETAIL.stripeRefNote}</p>
          </div>
        )}
      </div>
    </section>
  )
}
