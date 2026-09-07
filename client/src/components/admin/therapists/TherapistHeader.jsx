import { Badge, Text } from '../../ui'
import { cx } from '../../../lib/cx'
import { formatCount } from '../../../lib/dashboardFormat'
import { formatDate } from '../../../lib/dateFormat'

/**
 * The therapist's identity and standing, on the same dark ground the dashboard
 * uses for its headline.
 *
 * Consistency is the point: the admin should recognise "this is the thing the
 * page is about" from the surface alone, without reading. It is also the only
 * ground in the portal where gold and sage can carry weight.
 */
function Figure({ label, value, note }) {
  return (
    <div>
      <dt className="font-body text-caption text-paper/70">{label}</dt>
      <dd className="mt-1 font-body text-subsection font-medium text-paper">{value}</dd>
      {note && <p className="mt-1 font-body text-caption text-paper/70">{note}</p>}
    </div>
  )
}

export default function TherapistHeader({ therapist }) {
  const active = therapist.status === 'active'
  const rated = therapist.averageRating !== null

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
          <div className="flex min-w-0 items-center gap-4">
            {therapist.photoUrl && (
              <img
                src={therapist.photoUrl}
                alt=""
                className="size-16 shrink-0 rounded-full object-cover ring-1 ring-paper/20"
              />
            )}
            <div className="min-w-0">
              <h1 className="font-body text-subsection font-medium text-paper">
                {therapist.title} {therapist.firstName} {therapist.lastName}
              </h1>
              <p className="mt-1 font-body text-caption text-paper/70">
                {therapist.therapistType} · {therapist.email}
              </p>
            </div>
          </div>

          {/* One tone for both states, because the light success tone is dark
              on dark here (3.05:1). The WORD carries the state; the dot only
              reinforces it, so nothing depends on colour. */}
          <Badge tone="inverse" className="gap-2">
            <span
              aria-hidden="true"
              className={cx('size-1.5 rounded-full', active ? 'bg-sage' : 'bg-paper/50')}
            />
            {active ? 'Active' : 'Deactivated'}
          </Badge>
        </div>

        {!active && (
          <Text size="caption" className="text-paper/70">
            This therapist cannot sign in, and matching will not offer them to new clients.
          </Text>
        )}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <Figure
            label="Active clients"
            value={formatCount(therapist.activeClients)}
            note={therapist.activeClients === 0 ? 'None matched yet' : undefined}
          />
          <Figure
            label="Average rating"
            value={rated ? therapist.averageRating.toFixed(1) : '—'}
            note={
              rated
                ? `From ${formatCount(therapist.reviewCount)} ${therapist.reviewCount === 1 ? 'rating' : 'ratings'}`
                : 'Not rated yet'
            }
          />
          <Figure label="Experience" value={`${therapist.yearsExperience} yrs`} />
          <Figure label="Onboarded" value={formatDate(therapist.createdAt)} />
        </dl>
      </div>
    </section>
  )
}
