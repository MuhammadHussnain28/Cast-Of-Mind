import { useEffect, useState } from 'react'
import { Button, Text } from '../../components/ui'
import MoneyBand from '../../components/admin/dashboard/MoneyBand'
import StatFigure from '../../components/admin/dashboard/StatFigure'
import PendingApplicationsCard from '../../components/admin/dashboard/PendingApplicationsCard'
import QualityPanel from '../../components/admin/dashboard/QualityPanel'
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
      <MoneyBand money={money} signups={activity.signups} />

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

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="rounded-2xl border border-ink/12 bg-mist px-5 py-5 sm:px-6">
            <dl>
              <StatFigure
                label="Sessions scheduled this month"
                value={formatCount(activity.sessionsThisMonth)}
                note={
                  activity.sessionsThisMonth === 0
                    ? 'Therapists schedule sessions from their portal.'
                    : 'Across every active booking'
                }
              />
            </dl>
          </div>

          <QualityPanel quality={quality} />
        </div>
      </section>

      <SystemStatusCard />
    </div>
  )
}
