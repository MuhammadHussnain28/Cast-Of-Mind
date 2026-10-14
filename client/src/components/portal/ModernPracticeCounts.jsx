import { ClientsIcon, HistoryIcon, SessionsIcon } from './PortalIcons'

/**
 * ModernPracticeCounts — Modern practice metrics card for therapist profile (§8.7).
 *
 * Preserves the exact 3 practice counts and their helper notes from PracticeCounts.jsx:
 * - stats.activeClients (with "None matched with you yet." if 0)
 * - stats.totalClientsHelped (with "Everyone you have worked with")
 * - stats.sessionsCompleted
 *
 * Designed with distinct high-contrast metric cards, ambient sage glow,
 * semantic DL/DT/DD tags, and responsive layout down to 360px.
 */
function StatCard({ icon: Icon, label, value, note }) {
  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-ink/8 bg-mist/60 p-5 transition-all duration-200 hover:border-ink/15 hover:bg-mist/90 shadow-2xs">
      <div>
        <div className="flex items-center justify-between">
          <span className="flex size-10 items-center justify-center rounded-xl border border-ink/8 bg-paper text-sage-deep shadow-2xs">
            <Icon size={20} />
          </span>
        </div>
        <dt className="mt-4 font-body text-caption font-medium text-ink/70">
          {label}
        </dt>
        <dd className="mt-1 font-body text-2xl font-semibold tracking-tight text-ink tabular-nums sm:text-3xl">
          {value ?? 0}
        </dd>
      </div>
      {note && (
        <p className="mt-3 font-body text-[0.75rem] text-ink/60">
          {note}
        </p>
      )}
    </div>
  )
}

export default function ModernPracticeCounts({ stats = {} }) {
  const noClientsYet = (stats?.totalClientsHelped ?? 0) === 0

  return (
    <section
      aria-labelledby="practice"
      className="relative overflow-hidden rounded-3xl border border-ink/10 bg-paper p-5 sm:p-7 shadow-xs"
    >
      {/* Soft Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-sage/10 blur-[60px]"
      />

      <div className="relative mb-5 flex flex-col justify-between gap-1 border-b border-ink/8 pb-4 sm:flex-row sm:items-center">
        <div>
          <span className="font-body text-[0.7rem] font-semibold uppercase tracking-wider text-ink/60">
            Practice Overview
          </span>
          <h2 id="practice" className="font-body text-base font-semibold text-ink sm:text-lg">
            Your practice
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-ink/8 bg-mist/80 px-2.5 py-1 text-[0.7rem] font-medium text-ink/70 sm:self-auto">
          <span className="size-1.5 rounded-full bg-sage-deep" />
          Live metrics
        </span>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={ClientsIcon}
          label="Active clients"
          value={stats?.activeClients ?? 0}
          note={noClientsYet ? 'None matched with you yet.' : undefined}
        />
        <StatCard
          icon={HistoryIcon}
          label="Clients helped"
          value={stats?.totalClientsHelped ?? 0}
          note="Everyone you have worked with"
        />
        <StatCard
          icon={SessionsIcon}
          label="Sessions completed"
          value={stats?.sessionsCompleted ?? 0}
        />
      </dl>
    </section>
  )
}
