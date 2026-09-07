import { Text } from '../ui'
import { ClientsIcon, HistoryIcon, SessionsIcon } from './PortalIcons'

/**
 * Three numbers — §8.7, and no more than three.
 *
 * That section carries an explicit scope warning: these must stay simple
 * counts, because charts and trends belong in the admin portal and putting them
 * here would duplicate the admin dashboard inside the therapist's own.
 *
 * They read zero until bookings and sessions exist, and say so plainly rather
 * than showing a bare 0 that looks like something failed to load.
 */
function Count({ icon: Icon, label, value, note }) {
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 shrink-0 text-sage-deep">
        <Icon />
      </span>
      <div className="min-w-0">
        <dt className="font-body text-caption text-ink/70">{label}</dt>
        <dd className="mt-1 font-body text-[1.75rem] font-medium leading-none text-ink">
          {value}
        </dd>
        {note && (
          <Text size="caption" tone="muted" className="mt-2">
            {note}
          </Text>
        )}
      </div>
    </div>
  )
}

export default function PracticeCounts({ stats }) {
  const noClientsYet = stats.totalClientsHelped === 0

  return (
    <section
      aria-labelledby="practice"
      className="rounded-2xl border border-ink/12 bg-mist px-5 py-5 sm:px-6 sm:py-6"
    >
      <h2 id="practice" className="font-body text-caption font-medium text-ink/70">
        Your practice
      </h2>

      <dl className="mt-5 grid gap-6 sm:grid-cols-3">
        <Count
          icon={ClientsIcon}
          label="Active clients"
          value={stats.activeClients}
          note={noClientsYet ? 'None matched with you yet.' : undefined}
        />
        <Count
          icon={HistoryIcon}
          label="Clients helped"
          value={stats.totalClientsHelped}
          note="Everyone you have worked with"
        />
        <Count
          icon={SessionsIcon}
          label="Sessions completed"
          value={stats.sessionsCompleted}
        />
      </dl>
    </section>
  )
}
