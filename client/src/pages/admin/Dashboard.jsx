import { useEffect, useState } from 'react'
import { Button, Text } from '../../components/ui'
import ModernMoneyBand from '../../components/admin/dashboard/ModernMoneyBand'
// import MoneyBand from '../../components/admin/dashboard/MoneyBand'
import StatFigure from '../../components/admin/dashboard/StatFigure'
import PendingApplicationsCard from '../../components/admin/dashboard/PendingApplicationsCard'
import ModernQualityPanel from '../../components/admin/dashboard/ModernQualityPanel'
// import QualityPanel from '../../components/admin/dashboard/QualityPanel'
import SystemStatusCard from '../../components/admin/dashboard/SystemStatusCard'
import { fetchAdminStats } from '../../lib/api/adminApi'
import { toApiError } from '../../lib/api/ApiError'
import { formatCount } from '../../lib/dashboardFormat'
import { cx } from '../../lib/cx'

/**
 * The business at a glance — master spec §9.1.
 *
 * Four groups, four deliberately different forms. Twelve identical stat cards
 * is the obvious build and the wrong one: it gives every figure equal weight,
 * so nothing leads and the one item that needs acting on disappears among the
 * counts. Money is the headline on a dark band, people are quiet figures,
 * pending applications is an action, and quality is a feed.
 *
 * Counts and one trend only. No rates, no projections, no cohorts — §9.1 is
 * explicit that this is a twenty-second overview, not an analytics suite.
 */

function GroupHeading({ id, children }) {
  return (
    <h2 id={id} className="font-body text-caption font-medium text-ink/70">
      {children}
    </h2>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      <div className="h-64 rounded-3xl bg-mist motion-safe:animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-mist motion-safe:animate-pulse" />
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [reloadToken, setReloadToken] = useState(0)
  const [result, setResult] = useState(null)

  // `loading` is derived rather than set inside the effect — the same shape
  // used on the applications screens.
  const loading = result?.key !== reloadToken
  const error = result?.key === reloadToken ? result.error : null
  const stats = result?.data ?? null

  useEffect(() => {
    let cancelled = false

    fetchAdminStats()
      .then((data) => {
        if (!cancelled) setResult({ key: reloadToken, data, error: null })
      })
      .catch((err) => {
        if (!cancelled) setResult({ key: reloadToken, data: null, error: toApiError(err).message })
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  // First load has nothing to show. A refetch holds the previous figures at
  // reduced opacity instead of flashing skeletons — the numbers do not jump
  // around and the layout never collapses under the reader.
  if (loading && !stats) return <Skeleton />

  if (error && !stats) {
    return (
      <div className="max-w-measure rounded-2xl border border-clay/40 bg-clay/5 px-5 py-6">
        <Text tone="error">{error}</Text>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => setReloadToken((n) => n + 1)}
        >
          Try again
        </Button>
      </div>
    )
  }

  const { money, people, activity, quality } = stats

  return (
    <div
      className={cx(
        'flex flex-col gap-10 transition-opacity duration-200 ease-out',
        loading && 'opacity-60',
      )}
      aria-busy={loading || undefined}
    >
      <ModernMoneyBand money={money} signups={activity.signups} />
      {/* Backup original: <MoneyBand money={money} signups={activity.signups} /> */}

      <section aria-labelledby="dashboard-people" className="flex flex-col gap-4">
        <GroupHeading id="dashboard-people">People</GroupHeading>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <dl className="grid grid-cols-2 gap-6 rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:col-span-2 sm:grid-cols-2 sm:px-6">
            <StatFigure
              label="Clients"
              value={formatCount(people.totalClients)}
              note={
                people.totalClients === 0
                  ? 'Accounts open when a payment succeeds.'
                  : `${formatCount(people.activeClients)} active · ${formatCount(people.inactiveClients)} inactive`
              }
            />
            <StatFigure
              label="Therapists"
              value={formatCount(people.totalTherapists)}
              note={
                people.totalTherapists === 0
                  ? 'Approving an application onboards one.'
                  : 'Onboarded and active'
              }
            />
          </dl>

          <PendingApplicationsCard count={people.pendingApplications} />
        </div>
      </section>

      <section aria-labelledby="dashboard-activity" className="flex flex-col gap-4">
        <GroupHeading id="dashboard-activity">Activity and quality</GroupHeading>

        <div className="flex flex-col gap-4">
          {/* SESSIONS SCHEDULED STRIP (Zero empty space) */}
          <div className="rounded-2xl border border-ink/12 bg-paper p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all hover:border-ink/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-sage/30 bg-sage/15 text-sage-deep">
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <span className="font-body text-caption font-medium text-ink/70 block">
                    Sessions scheduled this month
                  </span>
                  <div className="flex flex-wrap items-baseline gap-2.5 mt-0.5">
                    <span className="font-body text-3xl font-extrabold tracking-tight text-ink tabular-nums">
                      {formatCount(activity.sessionsThisMonth)}
                    </span>
                    <span className="font-body text-caption text-ink/60 font-medium">
                      {activity.sessionsThisMonth === 0
                        ? 'Therapists schedule sessions from their portal.'
                        : 'Across every active client booking'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:border-l sm:border-ink/10 sm:pl-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-body text-caption font-medium bg-sage/15 text-sage-deep border border-sage/25">
                  <span className="size-1.5 rounded-full bg-sage-deep" aria-hidden="true" />
                  Live Platform Cadence
                </span>
              </div>
            </div>
          </div>

          {/* THERAPIST QUALITY & FEEDBACK SHOWCASE */}
          <ModernQualityPanel quality={quality} />
          {/* Backup original: <QualityPanel quality={quality} /> */}
        </div>
      </section>

      <SystemStatusCard />
    </div>
  )
}
