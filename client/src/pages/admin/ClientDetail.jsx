import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Spinner, Text } from '../../components/ui'
import ClientHeader from '../../components/admin/clients/ClientHeader'
import ClientActions from '../../components/admin/clients/ClientActions'
import SubscriptionPanel from '../../components/admin/clients/SubscriptionPanel'
import SubscriptionHistory from '../../components/admin/clients/SubscriptionHistory'
import ConcernChips from '../../components/portal/therapist/workspace/ConcernChips'
import FieldList from '../../components/admin/applications/FieldList'
import { fetchClient } from '../../lib/api/adminClientsApi'
import { toApiError } from '../../lib/api/ApiError'
import { DETAIL } from '../../data/adminClientContent'
import { formatDate } from '../../lib/dateFormat'

const GENDER_PREFERENCE = {
  male: 'A male therapist',
  female: 'A female therapist',
  no_preference: 'No preference',
}

const GENDER = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
}

function Panel({ title, note, children, className }) {
  return (
    <section className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-body text-caption font-medium text-ink/70">{title}</h2>
        {note && (
          <Text size="caption" tone="muted">
            {note}
          </Text>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/**
 * One client — master spec §9.4.
 *
 * The concerns lead, in their own sage-edged panel, for the same reason the
 * specialties lead on the therapist screen: they are the field that decided who
 * this person was matched with. The subscription follows, because it is the
 * thing the admin is usually here to act on. Panels are weighted rather than
 * uniform, so the page has a shape instead of being a stack of boxes.
 *
 * There is nothing here for reading conversations, journal entries or clinical
 * notes, and the API has no endpoint that would serve them — §11. The screen
 * does not mention their absence either: advertising a capability that was
 * deliberately not built only invites someone to ask for it.
 */
export default function ClientDetail() {
  const { id } = useParams()
  const [result, setResult] = useState(null)

  const loading = result?.id !== id
  const error = result?.id === id ? result.error : null
  const client = result?.id === id ? result.data : null

  useEffect(() => {
    let cancelled = false

    fetchClient(id)
      .then((data) => {
        if (!cancelled) setResult({ id, data, error: null })
      })
      .catch((err) => {
        if (!cancelled) setResult({ id, data: null, error: toApiError(err).message })
      })

    return () => {
      cancelled = true
    }
  }, [id])

  function replace(updated) {
    setResult((current) => (current?.id !== id ? current : { ...current, data: updated }))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12">
        <Spinner size="md" />
        <Text tone="muted">{DETAIL.loading}</Text>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-measure rounded-2xl border border-clay/40 bg-clay/5 px-5 py-6">
        <Text tone="error">{error}</Text>
        <Link
          to="/admin/clients"
          className="mt-4 inline-flex min-h-11 items-center font-body text-caption font-medium text-ink underline underline-offset-4"
        >
          {DETAIL.back}
        </Link>
      </div>
    )
  }

  const c = client
  const couple = c.type === 'couple'

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <Link
        to="/admin/clients"
        className="inline-flex min-h-11 items-center self-start font-body text-caption font-medium text-ink underline underline-offset-4"
      >
        {DETAIL.back}
      </Link>

      <ClientHeader client={c} />

      <Panel
        title={DETAIL.concerns}
        note={DETAIL.concernsNote}
        className="rounded-2xl border border-sage/40 bg-sage/[0.06] px-5 py-5 sm:px-6 sm:py-6"
      >
        <ConcernChips tags={c.concernTags} size="lg" />
      </Panel>

      <SubscriptionPanel client={c} />

      {couple ? (
        <Panel
          title={DETAIL.partners}
          note={DETAIL.partnersNote}
          className="rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:px-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {[c.coupleData?.partner1, c.coupleData?.partner2].filter(Boolean).map((partner, i) => (
              <div key={`${partner.name}-${i}`} className="rounded-xl bg-mist px-4 py-3.5">
                <p className="font-body text-ui font-medium text-ink">{partner.name}</p>
                <p className="mt-1 font-body text-caption text-ink/70">
                  {partner.age} · {GENDER[partner.gender] ?? partner.gender}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={DETAIL.intake}
          note={couple ? undefined : DETAIL.intakeNote}
          className="rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:px-6"
        >
          <FieldList
            fields={[
              ...(couple
                ? []
                : [
                    { label: 'Name', value: c.name },
                    { label: 'Age', value: c.age != null ? String(c.age) : '' },
                    { label: 'Gender', value: GENDER[c.gender] ?? c.gender },
                  ]),
              { label: 'Relationship status', value: c.relationshipStatus },
              { label: 'Country', value: c.country },
              { label: 'City', value: c.city },
              {
                label: 'Therapist gender preference',
                value: GENDER_PREFERENCE[c.therapistGenderPreference],
                wide: true,
              },
              // §15: a soft sort, never a filter. Said out loud here so nobody
              // reads the row above as something that hid therapists.
              {
                label: 'How that was used',
                value: 'Sorted preferred-gender therapists first. It never hid anyone.',
                wide: true,
              },
            ]}
          />
        </Panel>

        <Panel
          title={DETAIL.therapist}
          className="rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:px-6"
        >
          {c.therapist ? (
            <div className="flex items-start gap-4">
              {c.therapist.photoUrl && (
                <img
                  src={c.therapist.photoUrl}
                  alt=""
                  className="size-14 shrink-0 rounded-full object-cover ring-1 ring-ink/12"
                />
              )}
              <div className="min-w-0">
                <Link
                  to={`/admin/therapists/${c.therapist.id}`}
                  className="font-body text-ui font-medium text-ink underline decoration-ink/60 underline-offset-4 transition-colors duration-200 ease-out hover:decoration-ink"
                >
                  {c.therapist.title} {c.therapist.firstName} {c.therapist.lastName}
                </Link>
                <p className="mt-1 font-body text-caption text-ink/70">
                  {c.therapist.therapistType}
                </p>
                <p className="mt-1 font-body text-caption text-ink/70">
                  {c.therapist.country} · {c.therapist.timezone}
                </p>
                {c.booking?.matchedAt && (
                  <p className="mt-2 font-body text-caption text-ink/70">
                    Matched {formatDate(c.booking.matchedAt)}
                    {c.booking.status === 'ended' && ' · booking ended'}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <Text size="caption" tone="muted">
              {DETAIL.noTherapist}
            </Text>
          )}
        </Panel>
      </div>

      <Panel
        title={DETAIL.history}
        className="rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:px-6 sm:py-6"
      >
        <SubscriptionHistory entries={c.subscriptionHistory} />
      </Panel>

      <ClientActions client={c} onChanged={replace} />
    </div>
  )
}
