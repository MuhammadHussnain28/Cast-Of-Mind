import { VerifiedIcon } from './PortalIcons'
import { cx } from '../../lib/cx'

/**
 * ModernVerifiedPanel — Redesigned clinical dossier for therapist profile (§8.7).
 *
 * Preserves the exact 13 verified data points and word-for-word header text
 * from VerifiedPanel.jsx, but structures them into clean, responsive clinical
 * cards with proper hierarchy, specialty chips, and theme tokens.
 */
function InfoCell({ label, value, empty = false, className }) {
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <dt className="font-body text-caption font-medium text-ink/60">
        {label}
      </dt>
      <dd className="font-body text-ui text-ink min-w-0">
        {empty ? (
          <span className="text-ink/40 font-normal italic">Not recorded</span>
        ) : (
          <span className="font-medium text-ink whitespace-pre-line break-words">{value}</span>
        )}
      </dd>
    </div>
  )
}

export default function ModernVerifiedPanel({ profile }) {
  const specialtyTags = profile?.specialtyTags || []
  const treatmentOrientations = profile?.treatmentOrientations || []
  const languages = profile?.languages || []
  const fullName = [profile?.title, profile?.firstName, profile?.lastName].filter(Boolean).join(' ')

  return (
    <section
      aria-labelledby="verified"
      className="relative overflow-hidden rounded-3xl border border-ink/12 bg-paper p-5 sm:p-7 shadow-xs space-y-6"
    >
      {/* House ambient wash - subtle sage glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-sage/10 blur-[130px]"
      />

      {/* Header: Reassurance and verification context */}
      <div className="relative flex items-start gap-3.5 pb-6 border-b border-ink/8">
        <div className="size-10 rounded-xl bg-sage/12 border border-sage/30 flex items-center justify-center shrink-0 text-sage-deep">
          <VerifiedIcon size={20} />
        </div>
        <div className="space-y-1 min-w-0">
          <h2 id="verified" className="font-body text-subsection font-medium text-ink tracking-tight">
            Verified by Cast of Minds
          </h2>
          <p className="font-body text-caption text-ink/70 leading-relaxed max-w-measure">
            We checked these when your application was approved, and that check is what makes
            them worth something to a client. Only our team can change them — email us if
            anything here is wrong.
          </p>
        </div>
      </div>

      {/* Grid of structured clinical cards */}
      <div className="relative space-y-5">
        
        {/* Card 1: Clinical Identity & Professional Credentials */}
        <div className="rounded-2xl border border-ink/8 bg-mist/60 p-5 sm:p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
            <InfoCell label="Name" value={fullName} />
            <InfoCell label="Professional title" value={profile?.therapistType} />
            <InfoCell label="Years of experience" value={profile?.yearsExperience ? `${profile.yearsExperience} years` : null} />
            <InfoCell label="Credential" value={profile?.credentialType} />
            <InfoCell label="Credential initials" value={profile?.credentialInitials} />
            <InfoCell
              label="Licence number"
              value={profile?.licenseNumber}
              empty={!profile?.licenseNumber}
            />
          </dl>
        </div>

        {/* Card 2: Practice Focus (Specialty Tags & Treatment Orientations) */}
        <div className="rounded-2xl border border-ink/10 bg-paper p-5 sm:p-6 shadow-2xs space-y-5">
          {/* Specialty Tags */}
          <div>
            <dt className="font-body text-caption font-medium text-ink/70 mb-2.5">
              Specialty tags — these decide who is matched with you
            </dt>
            <dd>
              {specialtyTags.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {specialtyTags.map((tag) => (
                    <li
                      key={tag}
                      className="inline-flex items-center rounded-full bg-sage/15 ring-1 ring-sage/40 px-3 py-1 font-body text-caption font-medium text-ink"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-ink/40 text-caption italic">None recorded</span>
              )}
            </dd>
          </div>

          <div className="border-t border-ink/6 pt-4">
            <dt className="font-body text-caption font-medium text-ink/70 mb-2.5">
              Treatment orientations
            </dt>
            <dd>
              {treatmentOrientations.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {treatmentOrientations.map((orientation) => (
                    <li
                      key={orientation}
                      className="inline-flex items-center rounded-full bg-mist border border-ink/10 px-3 py-1 font-body text-caption font-medium text-ink/80"
                    >
                      {orientation}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-ink/40 text-caption italic">None recorded</span>
              )}
            </dd>
          </div>
        </div>

        {/* Card 3: Location & Languages */}
        <div className="rounded-2xl border border-ink/8 bg-mist/60 p-5 sm:p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6">
            <InfoCell label="Country" value={profile?.country} />
            <InfoCell label="Timezone" value={profile?.timezone} />
            <div className="flex flex-col gap-1.5">
              <dt className="font-body text-caption font-medium text-ink/60">
                Languages
              </dt>
              <dd>
                {languages.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {languages.map((lang) => (
                      <span
                        key={lang}
                        className="inline-flex items-center rounded-lg bg-paper border border-ink/10 px-2.5 py-0.5 font-body text-caption font-medium text-ink"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-ink/40 text-caption italic">Not recorded</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Card 4: Official Disclosures & Education Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-ink/8 bg-paper p-5 shadow-2xs">
            <dt className="font-body text-caption font-medium text-ink/70 mb-1.5">
              Licensing status
            </dt>
            <dd className="font-body text-ui text-ink leading-relaxed whitespace-pre-line break-words">
              {profile?.licensingStatus || <span className="text-ink/40 italic">Not recorded</span>}
            </dd>
          </div>

          <div className="rounded-2xl border border-ink/8 bg-paper p-5 shadow-2xs">
            <dt className="font-body text-caption font-medium text-ink/70 mb-1.5">
              Summary of education
            </dt>
            <dd className="font-body text-ui text-ink leading-relaxed whitespace-pre-line break-words">
              {profile?.educationSummary || <span className="text-ink/40 italic">Not recorded</span>}
            </dd>
          </div>
        </div>

      </div>
    </section>
  )
}
