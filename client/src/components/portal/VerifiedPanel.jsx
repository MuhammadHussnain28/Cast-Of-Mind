import { Text } from '../ui'
import { VerifiedIcon } from './PortalIcons'

/**
 * The fields only the team can change — §8.7.
 *
 * Presented as verification, not restriction. §8.7's own rationale is that
 * matching integrity and client trust depend on these being admin-checked; a
 * screen of greyed-out inputs would say "your account is limited", when what is
 * true is "a person confirmed these, which is why a client can rely on them".
 *
 * The mark is a shield and a check rather than a padlock, for the same reason.
 */
function VerifiedField({ label, value, wide }) {
  const empty = value === null || value === undefined || value === ''

  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="flex items-center gap-1.5 font-body text-caption text-ink/70">
        <VerifiedIcon className="shrink-0 text-sage-deep" />
        {label}
      </dt>
      <dd className="mt-1">
        {empty ? (
          <Text size="ui" tone="muted">
            Not recorded
          </Text>
        ) : (
          <Text size="ui" className="whitespace-pre-line">
            {value}
          </Text>
        )}
      </dd>
    </div>
  )
}

const list = (values) => (values?.length ? values.join(' · ') : '')

export default function VerifiedPanel({ profile }) {
  return (
    <section
      aria-labelledby="verified"
      className="rounded-2xl border border-sage/40 bg-sage/[0.06] px-5 py-5 sm:px-6 sm:py-6"
    >
      <div className="flex items-center gap-2">
        <VerifiedIcon size={20} className="shrink-0 text-sage-deep" />
        <h2 id="verified" className="font-body text-subsection font-medium text-ink">
          Verified by Cast of Mind
        </h2>
      </div>

      <Text size="caption" tone="muted" className="mt-2 max-w-measure">
        We checked these when your application was approved, and that check is what makes
        them worth something to a client. Only our team can change them — email us if
        anything here is wrong.
      </Text>

      <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <VerifiedField label="Name" value={`${profile.title} ${profile.firstName} ${profile.lastName}`} />
        <VerifiedField label="Professional title" value={profile.therapistType} />
        <VerifiedField label="Credential" value={profile.credentialType} />
        <VerifiedField label="Credential initials" value={profile.credentialInitials} />
        <VerifiedField label="Licence number" value={profile.licenseNumber} />
        <VerifiedField label="Years of experience" value={`${profile.yearsExperience}`} />
        <VerifiedField
          label="Specialty tags — these decide who is matched with you"
          value={list(profile.specialtyTags)}
          wide
        />
        <VerifiedField
          label="Treatment orientations"
          value={list(profile.treatmentOrientations)}
          wide
        />
        <VerifiedField label="Languages" value={list(profile.languages)} />
        <VerifiedField label="Country" value={profile.country} />
        <VerifiedField label="Timezone" value={profile.timezone} wide />
        <VerifiedField label="Licensing status" value={profile.licensingStatus} wide />
        <VerifiedField label="Summary of education" value={profile.educationSummary} wide />
      </dl>
    </section>
  )
}
