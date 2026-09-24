import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Spinner, Text, useToast } from '../../components/ui'
import TherapistHeader from '../../components/admin/therapists/TherapistHeader'
import TherapistEditForm from '../../components/admin/therapists/TherapistEditForm'
import TherapistActions from '../../components/admin/therapists/TherapistActions'
import RatingsSection from '../../components/admin/therapists/RatingsSection'
import FieldList from '../../components/admin/applications/FieldList'
import WorkingHoursSummary from '../../components/admin/applications/WorkingHoursSummary'
import { fetchTherapist } from '../../lib/api/adminTherapistsApi'
import { toApiError } from '../../lib/api/ApiError'

const list = (values) => (values?.length ? values.join(' · ') : '')

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
 * One therapist — master spec §9.3.
 *
 * The specialties lead, in their own sage-edged panel, because they are the
 * only field on this screen that changes who gets matched with whom. Everything
 * else is background the admin reads occasionally. Panels are weighted rather
 * than uniform, so the page has a shape instead of being a stack of boxes.
 *
 * There is nothing here for reading conversations, journals or clinical notes,
 * and the API has no endpoint that would serve them — §11.
 */
export default function TherapistDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [result, setResult] = useState(null)
  const [editing, setEditing] = useState(false)

  const loading = result?.id !== id
  const error = result?.id === id ? result.error : null
  const therapist = result?.id === id ? result.data : null

  useEffect(() => {
    let cancelled = false

    fetchTherapist(id)
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
        <Text tone="muted">Loading the therapist</Text>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-measure rounded-2xl border border-clay/40 bg-clay/5 px-5 py-6">
        <Text tone="error">{error}</Text>
        <Link
          to="/admin/therapists"
          className="mt-4 inline-flex min-h-11 items-center font-body text-caption font-medium text-ink underline underline-offset-4"
        >
          Back to therapists
        </Link>
      </div>
    )
  }

  const t = therapist

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <Link
        to="/admin/therapists"
        className="inline-flex min-h-11 items-center self-start font-body text-caption font-medium text-ink underline underline-offset-4"
      >
        Back to therapists
      </Link>

      <TherapistHeader therapist={t} />

      {editing ? (
        <TherapistEditForm
          therapist={t}
          onCancel={() => setEditing(false)}
          onSaved={(result) => {
            replace(result.therapist)
            setEditing(false)
            toast.success(
              result.changedFields.includes('email')
                ? 'Saved. Both the old and new addresses have been notified.'
                : 'Saved.',
            )
          }}
        />
      ) : (
        <>
          <Panel
            title="Specialty tags"
            note="The only field that decides matching"
            className="rounded-2xl border border-sage/40 bg-sage/[0.06] px-5 py-5 sm:px-6 sm:py-6"
          >
            <Text size="subsection">{list(t.specialtyTags)}</Text>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="Credentials"
              className="rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:px-6"
            >
              <FieldList
                fields={[
                  { label: 'Credential type', value: t.credentialType },
                  { label: 'Initials', value: t.credentialInitials },
                  { label: 'Licence number', value: t.licenseNumber, wide: true },
                  { label: 'Licensing status', value: t.licensingStatus, wide: true },
                ]}
              />
            </Panel>

            <Panel
              title="Practice"
              className="rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:px-6"
            >
              <FieldList
                fields={[
                  { label: 'Treatment orientations', value: list(t.treatmentOrientations), wide: true },
                  { label: 'Languages', value: list(t.languages) },
                  { label: 'Country', value: t.country },
                  { label: 'Timezone', value: t.timezone, wide: true },
                ]}
              />
            </Panel>
          </div>

          <Panel
            title="Bio"
            note="The therapist's own words — they can edit this"
            className="rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:px-6"
          >
            <Text className="whitespace-pre-line">{t.bio}</Text>
          </Panel>

          <Panel
            title="Working hours"
            className="rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:px-6"
          >
            <WorkingHoursSummary workingHours={t.workingHours} timezone={t.timezone} />
          </Panel>

          {/* §9.6 — the rating, its shape, and every review, paged. */}
          <RatingsSection therapist={t} />

          <div className="flex flex-col gap-4">
            <Button variant="secondary" className="self-start" onClick={() => setEditing(true)}>
              Edit admin-controlled fields
            </Button>

            <TherapistActions therapist={t} onChanged={replace} />
          </div>
        </>
      )}
    </div>
  )
}
