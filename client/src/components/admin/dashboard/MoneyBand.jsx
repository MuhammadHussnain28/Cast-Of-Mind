import { Text } from '../../ui'
import SignupsTrend from './SignupsTrend'
import { formatCount, formatDelta, formatMoney } from '../../../lib/dashboardFormat'

/**
 * The one thing the dashboard leads with — master spec §9.1's money group.
 *
 * Dark on purpose, and not for decoration: gold and sage cannot carry weight on
 * a light surface (gold on paper is 1.63:1 and is never text), so ink-deep is
 * the only ground in this portal where the palette can actually do its job. It
 * also gives the page one focal point instead of twelve equal rectangles.
 *
 * Exactly one hero figure per view, set in Satoshi like everything else — a
 * serif on a dashboard number reads as decoration, and §24.3 keeps Fraunces to
 * display sizes anyway. Proportional figures, not tabular: equal-width digits
 * make a number like 121 look loose at this size.
 */
function Satellite({ label, value, note }) {
  return (
    <div>
      <dt className="font-body text-caption text-paper/70">{label}</dt>
      <dd className="mt-1 font-body text-subsection font-medium text-paper">{value}</dd>
      {note && (
        <p className="mt-1 font-body text-caption text-paper/70">{note}</p>
      )}
    </div>
  )
}

export default function MoneyBand({ money, signups }) {
  const delta = formatDelta(money.newThisMonth, money.newLastMonth)
  const noRevenueYet = money.activeSubscriptions === 0

  return (
    <section
      data-surface="dark"
      aria-labelledby="dashboard-money"
      className="relative overflow-hidden rounded-3xl bg-ink-deep px-6 py-7 sm:px-8 sm:py-9"
    >
      {/* A soft ambient wash, not a band gradient — light on a surface rather
          than a shape laid over it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-sage/10 blur-[130px]"
      />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
        <div>
          <h2 id="dashboard-money" className="font-body text-caption text-paper/70">
            Monthly recurring revenue
          </h2>

          <p className="mt-2 font-body text-[3rem] font-medium leading-none tracking-tight text-paper sm:text-[3.5rem]">
            {formatMoney(money.monthlyRecurringRevenue, money.currency)}
          </p>

          {noRevenueYet && (
            <Text size="caption" className="mt-3 text-paper/70">
              Revenue figures begin once payments are live.
            </Text>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
            <Satellite
              label="Active subscriptions"
              value={formatCount(money.activeSubscriptions)}
            />
            <Satellite
              label="New this month"
              value={formatCount(money.newThisMonth)}
              note={delta?.label}
            />
            <Satellite
              label="Ended this month"
              value={formatCount(money.cancelledOrExpiredThisMonth)}
              note="Cancelled or expired"
            />
          </dl>
        </div>

        <div className="rounded-2xl bg-paper/[0.04] px-4 py-4 sm:px-5 sm:py-5">
          <SignupsTrend points={signups} />
        </div>
      </div>
    </section>
  )
}
