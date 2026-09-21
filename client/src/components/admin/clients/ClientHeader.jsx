import { Badge, Text } from '../../ui'
import { CoupleIcon } from './ClientIcons'
import { ACCESS_LINES } from '../../../data/adminClientContent'
import { subscriptionState } from '../../../data/subscriptionStates'
import { formatDate } from '../../../lib/dateFormat'

/**
 * The client's identity and standing, on the same dark ground the dashboard
 * headline and the therapist header use.
 *
 * Consistency is the job: the admin should recognise "this is the thing the
 * page is about" from the surface alone, before reading a word. It is also the
 * only ground in this portal where gold is legible — 11.08:1 on ink against
 * 1.63:1 on paper — so the live figure can carry the accent and nothing else
 * on the page has to compete for it.
 */
function Figure({ label, value, note, accent = false }) {
  return (
    <div>
      <dt className="font-body text-caption text-paper/70">{label}</dt>
      <dd
        className={
          accent
            ? 'mt-1 font-body text-subsection font-medium text-gold'
            : 'mt-1 font-body text-subsection font-medium text-paper'
        }
      >
        {value}
      </dd>
      {note && <p className="mt-1 font-body text-caption text-paper/70">{note}</p>}
    </div>
  )
}

export default function ClientHeader({ client }) {
  const state = subscriptionState(client.subscription?.status ?? 'none')
  const couple = client.type === 'couple'
  const deactivated = client.accountStatus !== 'active'
  const sub = client.subscription

  const paidUntil = sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : null
  const live = client.access === 'active' || client.access === 'past_due'

  return (
    <section
      data-surface="dark"
      className="relative overflow-hidden rounded-3xl bg-ink-deep px-6 py-7 sm:px-8 sm:py-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-sage/10 blur-[130px]"
      />

      <div className="relative flex flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            {couple && (
              <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-paper/10 text-paper">
                <CoupleIcon className="size-6" />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="font-body text-subsection font-medium text-paper">
                {client.displayName}
              </h1>
              <p className="mt-1 font-body text-caption text-paper/70">
                {couple && 'Couple · one account, two people · '}
                {client.email}
              </p>
            </div>
          </div>

          {/* One tone for every state on this ground: the light badge tones put
              sage-deep or clay on a pale tint, which is dark on dark here and
              fails (3.05:1, caught in 4.5). The WORD carries the state and the
              dot only reinforces it, so nothing depends on colour. */}
          <Badge tone="inverse" className="gap-2">
            <span
              aria-hidden="true"
              className={
                state.tone === 'success'
                  ? 'size-1.5 rounded-full bg-sage'
                  : state.tone === 'danger'
                    ? 'size-1.5 rounded-full bg-clay'
                    : 'size-1.5 rounded-full bg-paper/50'
              }
            />
            {state.label}
          </Badge>
        </div>

        <Text size="caption" className="max-w-measure text-paper/70">
          {ACCESS_LINES[client.access]}
        </Text>

        {deactivated && (
          <div className="flex items-start gap-3 rounded-2xl bg-paper/10 px-4 py-3">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-clay" />
            <Text size="caption" className="text-paper">
              This account is deactivated, so they cannot sign in. Deactivating never stops the
              billing — check the subscription below.
            </Text>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <Figure
            label={sub?.status === 'cancelled' ? 'Access until' : 'Paid until'}
            value={paidUntil ?? '—'}
            note={sub ? (live ? 'Renews on this date' : 'Nothing further is charged') : 'No record'}
            accent={live}
          />
          <Figure
            label="Sessions left"
            value={sub ? `${sub.sessionsRemaining} of 4` : '—'}
            note={sub ? 'This cycle · no carry-over' : undefined}
          />
          <Figure
            label="Therapist"
            value={
              client.therapist
                ? `${client.therapist.firstName} ${client.therapist.lastName}`
                : 'None'
            }
            note={client.therapist?.therapistType}
          />
          <Figure label="Client since" value={formatDate(client.createdAt)} />
        </dl>
      </div>
    </section>
  )
}
