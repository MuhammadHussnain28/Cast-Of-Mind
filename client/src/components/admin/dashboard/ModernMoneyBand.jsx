import { useState } from 'react'
import { Text } from '../../ui'
import SignupsTrend from './SignupsTrend'
import { formatCount, formatMoney } from '../../../lib/dashboardFormat'

/**
 * ModernMoneyBand — The refreshed financial metrics centerpiece for the Admin Dashboard.
 *
 * Preserves the full integrity and data-flow of MoneyBand while elevating clarity:
 * - Introduces two distinct primary financial metrics: Monthly Recurring Revenue (MRR)
 *   and Total Revenue Earned (all-time money Asad made).
 * - Interactive privacy Eye toggle to mask both sensitive revenue figures simultaneously.
 * - Five cohesive figures neatly structured on the left, with the 12-month client signup
 *   trend graph on the right.
 * - Fully responsive down to 360px mobile viewports and strictly adhering to the Cast of Mind palette.
 */
export default function ModernMoneyBand({ money, signups }) {
  const [showAmounts, setShowAmounts] = useState(true)
  const noRevenueYet = money.activeSubscriptions === 0

  return (
    <section
      data-surface="dark"
      aria-labelledby="dashboard-money"
      className="relative overflow-hidden rounded-3xl bg-ink-deep px-5 py-6 sm:px-8 sm:py-8"
    >
      {/* Soft atmospheric ambient glow washes adhering to palette tokens */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-sage/10 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -bottom-24 size-72 rounded-full bg-gold/[0.05] blur-[120px]"
      />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-10">
        {/* =========================================================
            LEFT COLUMN: 5 FINANCIAL & CLIENT HEALTH FIGURES
            ========================================================= */}
        <div className="flex flex-col justify-between gap-6">
          {/* Header Row: Category Label & Privacy Eye Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-gold shadow-[0_0_8px_rgba(245,197,24,0.6)]" />
              <h2 id="dashboard-money" className="font-body text-xs font-semibold uppercase tracking-wider text-paper/70">
                Financial Overview
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowAmounts((prev) => !prev)}
              className="group flex cursor-pointer items-center gap-2 rounded-xl border border-paper/10 bg-paper/[0.04] px-3 py-1.5 transition-all hover:border-paper/20 hover:bg-paper/[0.08] focus:outline-none focus:ring-2 focus:ring-gold/40"
              aria-label={showAmounts ? 'Hide revenue amounts' : 'Show revenue amounts'}
              title={showAmounts ? 'Hide revenue amounts' : 'Show revenue amounts'}
            >
              <span className="text-paper/70 transition-colors group-hover:text-paper">
                {showAmounts ? (
                  /* Eye Open Icon */
                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  /* Eye Slashed / Off Icon */
                  <svg
                    className="size-3.5 text-paper/50"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                )}
              </span>
              <span className="font-body text-[11px] font-medium tracking-tight text-paper/80 group-hover:text-paper">
                {showAmounts ? 'Hide amounts' : 'Show amounts'}
              </span>
            </button>
          </div>

          {/* DUAL HERO REVENUE CARDS (FIGURES 1 & 2) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* FIGURE 1: Monthly Recurring Revenue (MRR) */}
            <div className="flex flex-col justify-between rounded-2xl border border-paper/10 bg-paper/[0.03] p-5 shadow-sm transition-all hover:bg-paper/[0.05]">
              <div className="flex items-center justify-between">
                <span className="font-body text-xs font-medium text-paper/70">Monthly recurring (MRR)</span>
                <span className="flex size-7 items-center justify-center rounded-lg border border-paper/10 bg-paper/[0.06] text-sage">
                  {/* Refresh / Cadence Cycle Icon */}
                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                </span>
              </div>

              <div className="mt-4 min-h-[44px] flex items-baseline">
                {showAmounts ? (
                  <p className="font-body text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
                    {formatMoney(money.monthlyRecurringRevenue, money.currency)}
                  </p>
                ) : (
                  <span className="font-mono text-2xl tracking-widest text-paper/40 select-none sm:text-3xl">
                    € • • • •
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-1.5 font-body text-[11px] font-medium text-sage">
                <span className="size-1.5 rounded-full bg-sage" aria-hidden="true" />
                <span>Active subscription revenue</span>
              </div>
            </div>

            {/* FIGURE 2: Total Revenue Earned (All-time Money Asad Made) */}
            <div className="relative flex flex-col justify-between rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/[0.08] to-transparent p-5 shadow-sm transition-all hover:border-gold/40">
              <div className="flex items-center justify-between">
                <span className="font-body text-xs font-semibold text-gold/90">Total revenue earned</span>
                <span className="flex size-7 items-center justify-center rounded-lg border border-gold/30 bg-gold/15 text-gold">
                  {/* Revenue / Vault Coin Icon */}
                  {/* <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg> */}

                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 10h12M4 14h9M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" />
                  </svg>

                </span>
              </div>

              <div className="mt-4 min-h-[44px] flex items-baseline">
                {showAmounts ? (
                  <p className="font-body text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
                    {formatMoney(money.totalRevenueEarned ?? money.monthlyRecurringRevenue, money.currency)}
                  </p>
                ) : (
                  <span className="font-mono text-2xl tracking-widest text-gold/50 select-none sm:text-3xl">
                    € • • • • •
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-1.5 font-body text-[11px] font-medium text-gold/90">
                <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
                <span>All-time money made</span>
              </div>
            </div>
          </div>

          {/* SATELLITE METRIC CARDS (FIGURES 3, 4, 5) */}
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* FIGURE 3: Active Subscriptions */}
            <div className="rounded-xl border border-paper/10 bg-paper/[0.03] p-3.5 transition-all hover:bg-paper/[0.05]">
              <dt className="font-body text-[11px] font-medium text-paper/70">Active subscriptions</dt>
              <dd className="mt-1 font-body text-2xl font-bold tracking-tight text-paper">
                {formatCount(money.activeSubscriptions)}
              </dd>
              <p className="mt-1 font-body text-[10px] text-paper/50">Currently paying clients</p>
            </div>

            {/* FIGURE 4: New This Month */}
            <div className="rounded-xl border border-paper/10 bg-paper/[0.03] p-3.5 transition-all hover:bg-paper/[0.05]">
              <dt className="font-body text-[11px] font-medium text-paper/70">New this month</dt>
              <dd className="mt-1 font-body text-2xl font-bold tracking-tight text-paper">
                {formatCount(money.newThisMonth)}
              </dd>
              <p className="mt-1 font-body text-[10px] text-paper/50">Subscriptions</p>
            </div>

            {/* FIGURE 5: Ended This Month (Churn) */}
            <div className="rounded-xl border border-paper/10 bg-paper/[0.03] p-3.5 transition-all hover:bg-paper/[0.05]">
              <dt className="font-body text-[11px] font-medium text-paper/70">Ended this month</dt>
              <dd className="mt-1 font-body text-2xl font-bold tracking-tight text-paper">
                {formatCount(money.cancelledOrExpiredThisMonth)}
              </dd>
              <p className="mt-1 font-body text-[10px] text-paper/50">Cancelled or expired</p>
            </div>
          </dl>

          {noRevenueYet && (
            <Text size="caption" className="text-paper/60">
              Revenue figures begin once payments are live.
            </Text>
          )}
        </div>

        {/* =========================================================
            RIGHT COLUMN: SIGNUPS TREND GRAPH
            ========================================================= */}
        <div className="flex flex-col justify-between rounded-2xl border border-paper/10 bg-paper/[0.04] p-4 sm:p-5">
          <SignupsTrend points={signups} height={310} className="flex flex-col h-full justify-between" />
        </div>
      </div>
    </section>
  )
}
