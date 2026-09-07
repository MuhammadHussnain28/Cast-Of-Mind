import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Heading, Spinner, Text, useToast } from '../../components/ui'
import StatusBadge from '../../components/admin/applications/StatusBadge'
import FieldList from '../../components/admin/applications/FieldList'
import SensitiveValue from '../../components/admin/applications/SensitiveValue'
import WorkingHoursSummary from '../../components/admin/applications/WorkingHoursSummary'
import DocumentPanel from '../../components/admin/applications/DocumentPanel'
import ReviewActions from '../../components/admin/applications/ReviewActions'
import { fetchApplication } from '../../lib/api/adminApplicationsApi'
import { toApiError } from '../../lib/api/ApiError'
import { formatDate } from '../../lib/dateFormat'

const yesNo = (value) => (value ? 'Yes' : 'No')
const list = (values) => (values?.length ? values.join(' · ') : '')

function Section({ step, title, children }) {
  return (
    <section className="rounded-2xl border border-ink/12 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex items-baseline gap-3">
        <span className="font-body text-caption tabular-nums text-ink/70">Step {step}</span>
        <Heading level={2} size="subsection">
          {title}
        </Heading>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

/**
 * One application, laid out in the five steps the applicant filled in.
 *
 * Schema order would be easier to write and worse to read: the reviewer is
 * checking a story someone told in a particular sequence, and reading it back
 * in that sequence is how omissions become obvious.
 */
export default function ApplicationDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [result, setResult] = useState(null)

  /**
   * After a decision, patch the record already on screen rather than refetching.
   * The admin is looking at the page; replacing it wholesale would scroll them
   * back to the top and blank the documents they had open.
   */
  function handleReviewed(action, apiResult) {
    setResult((current) =>
      current?.id !== id
        ? current
        : {
            ...current,
            data: {
              ...current.data,
              status: action === 'approve' ? 'approved' : 'rejected',
              reviewedAt: apiResult.reviewedAt ?? new Date().toISOString(),
            },
          },
    )

    if (action === 'approve') {
      toast.success(
        apiResult.alreadyApproved
          ? 'This application had already been approved.'
          : apiResult.emailSent
            ? 'Approved. Their account is open and the welcome email has gone out.'
            : 'Approved and their account is open — but the welcome email could not be sent.',
      )
    } else {
      toast.success('Rejected. The application is kept on record and nobody was emailed.')
    }
  }

  // Loading is derived from whether the stored result belongs to the id in the
  // URL, so the effect performs no synchronous setState. See Applications.jsx.
  const loading = result?.id !== id
  const error = result?.id === id ? result.error : null
  const application = result?.id === id ? result.data : null

  useEffect(() => {
    let cancelled = false

    fetchApplication(id)
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

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12">
        <Spinner size="md" />
        <Text tone="muted">Loading the application</Text>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-measure rounded-2xl border border-clay/40 bg-clay/5 px-5 py-6">
        <Text tone="error">{error}</Text>
        <Link
          to="/admin/applications"
          className="mt-4 inline-flex min-h-11 items-center font-body text-caption font-medium text-ink underline underline-offset-4"
        >
          Back to applications
        </Link>
      </div>
    )
  }

  const a = application

  // The two eligibility answers that need a decision rather than a read (§23).
  // Neither auto-rejects — the model records them and the admin decides.
  const flags = [
    a.disciplinaryActions && 'Declared a disciplinary action',
    !a.malpracticeInsurance && 'No malpractice insurance confirmed',
  ].filter(Boolean)

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Link
        to="/admin/applications"
        className="inline-flex min-h-11 items-center self-start font-body text-caption font-medium text-ink underline underline-offset-4"
      >
        Back to applications
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {a.photoUrl && (
            <img
              src={a.photoUrl}
              alt=""
              className="size-16 rounded-full border border-ink/12 object-cover"
            />
          )}
          <div>
            <Heading level={1} size="subsection">
              {a.title} {a.firstName} {a.lastName}
            </Heading>
            <Text size="caption" tone="muted" className="mt-1">
              {a.therapistType} · submitted {formatDate(a.submittedAt)}
            </Text>
          </div>
        </div>
        <StatusBadge status={a.status} />
      </header>

      {flags.length > 0 && (
        <div className="rounded-2xl border border-clay/40 bg-clay/5 px-5 py-4">
          <Text size="ui" tone="error">
            Needs a decision
          </Text>
          <ul className="mt-2 list-disc pl-5">
            {flags.map((flag) => (
              <li key={flag} className="font-body text-caption text-clay">
                {flag}
              </li>
            ))}
          </ul>
          <Text size="caption" tone="muted" className="mt-3">
            Neither answer rejects an application on its own. The details are in steps 4 and 5.
          </Text>
        </div>
      )}

      <Section step={1} title="Personal details">
        <FieldList
          fields={[
            { label: 'Title', value: a.title },
            { label: 'Gender', value: a.gender?.replace(/_/g, ' ') },
            { label: 'First name', value: a.firstName },
            { label: 'Last name', value: a.lastName },
            { label: 'Date of birth', value: formatDate(a.dateOfBirth) },
            { label: 'Email', value: a.email },
            {
              label: 'Password',
              render: (
                <Text size="ui" tone="muted">
                  Set by the applicant — it carries over on approval and is never readable.
                </Text>
              ),
              wide: true,
            },
          ]}
        />
      </Section>

      <Section step={2} title="Location and availability">
        <FieldList
          fields={[
            { label: 'Street address', value: a.streetAddress },
            { label: 'City', value: a.city },
            { label: 'State or province', value: a.stateProvince },
            { label: 'Zip or postal code', value: a.zipPostal },
            { label: 'Country', value: a.country },
            { label: 'Timezone', value: a.timezone },
            { label: 'Languages', value: list(a.languages), wide: true },
            {
              label: 'Working hours',
              wide: true,
              render: (
                <WorkingHoursSummary workingHours={a.workingHours} timezone={a.timezone} />
              ),
            },
          ]}
        />
      </Section>

      <Section step={3} title="Professional background">
        <FieldList
          fields={[
            { label: 'Therapist type', value: a.therapistType },
            { label: 'Credential type', value: a.credentialType },
            { label: 'Credential initials', value: a.credentialInitials },
            { label: 'Years of experience', value: String(a.yearsExperience) },
            { label: 'Licence number', value: a.licenseNumber },
            {
              label: 'Taxpayer identification number',
              render: (
                <SensitiveValue
                  value={a.taxpayerIdNumber}
                  label="taxpayer identification number"
                />
              ),
            },
            { label: 'Summary of education', value: a.educationSummary, wide: true },
            { label: 'Current work situation', value: a.currentWorkSituation, wide: true },
          ]}
        />
      </Section>

      <Section step={4} title="Practice and specialties">
        <FieldList
          fields={[
            {
              label: 'Specialty tags — these drive matching',
              value: list(a.specialtyTags),
              wide: true,
            },
            {
              label: 'Treatment orientations — display only, never matched on',
              value: list(a.treatmentOrientations),
              wide: true,
            },
            { label: 'Bio', value: a.bio, wide: true },
            { label: 'Licensing status', value: a.licensingStatus, wide: true },
            { label: 'Disciplinary actions', value: yesNo(a.disciplinaryActions) },
            ...(a.disciplinaryActions
              ? [{ label: 'Disciplinary details', value: a.disciplinaryDetails, wide: true }]
              : []),
          ]}
        />
      </Section>

      <Section step={5} title="Compliance and documents">
        <FieldList
          fields={[
            { label: 'Malpractice insurance', value: yesNo(a.malpracticeInsurance) },
            { label: 'Insurance details', value: a.insuranceDetails },
          ]}
        />

        <div className="mt-6 flex flex-col gap-3">
          {a.documents.map((doc) => (
            <DocumentPanel key={doc.field} applicationId={a._id} document={doc} />
          ))}
        </div>
      </Section>

      {a.status === 'pending' && (
        <ReviewActions application={a} onReviewed={handleReviewed} />
      )}

      {a.status === 'rejected' && a.rejectionReason && (
        <div className="rounded-2xl border border-ink/12 bg-mist px-5 py-5">
          <Text size="caption" tone="muted">
            Reason recorded when this was rejected
          </Text>
          <Text size="ui" className="mt-2 whitespace-pre-line">
            {a.rejectionReason}
          </Text>
        </div>
      )}
    </div>
  )
}
