import ConcernChips from './ConcernChips'
import { formatDate } from '../../../../lib/dateFormat'
import { zoneDescription } from '../../../../lib/therapist/sessionTime'
import { CLIENT_INFO } from '../../../../data/therapistPortalContent'
import { cx } from '../../../../lib/cx'

/**
 * ClientInfoDossier — Modern structured card layout for Client info (§8.2).
 *
 * Uses the EXACT same data points, labels, and constants as ClientInfo.jsx,
 * organized into clean, responsive clinical dossier cards with Cast of Mind design tokens.
 */
function InfoItem({ label, value, note, highlight = false }) {
  if (value == null && !note) return null

  return (
    <div className="flex flex-col gap-1 py-3 border-b border-ink/6 last:border-b-0 last:pb-0 first:pt-0">
      <dt className="font-body text-caption font-medium text-ink/60">{label}</dt>
      <dd className="font-body text-ui text-ink min-w-0">
        {highlight ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-mist font-medium text-ink border border-ink/8 text-sm">
            {value}
          </span>
        ) : (
          <span className="font-medium text-ink">{value}</span>
        )}
        {note && <p className="mt-1 font-body text-caption text-ink/70 leading-relaxed">{note}</p>}
      </dd>
    </div>
  )
}

function SectionCard({ title, icon, children, className }) {
  return (
    <section className={cx('rounded-2xl bg-paper border border-ink/10 p-5 sm:p-6 shadow-xs', className)}>
      <div className="flex items-center gap-2.5 pb-3 border-b border-ink/8 mb-3">
        {icon && <div className="text-ink/70 shrink-0">{icon}</div>}
        <h3 className="font-body text-base font-semibold text-ink tracking-tight">{title}</h3>
      </div>
      <dl className="flex flex-col">{children}</dl>
    </section>
  )
}

export default function ClientInfoDossier({ data }) {
  const { client, subscription, matchedAt } = data
  const isCouple = client.type === 'couple'

  const subscriptionLabel = subscription
    ? CLIENT_INFO.subscriptionValues[subscription.status]
    : CLIENT_INFO.subscriptionValues.none

  const accessNote = subscription ? CLIENT_INFO.accessNote[subscription.access] : null

  const typeLabel = CLIENT_INFO.typeValues[client.type] ?? client.type
  const genderPreferenceLabel =
    CLIENT_INFO.genderPreferenceValues[client.therapistGenderPreference] ??
    client.therapistGenderPreference

  return (
    <div className="w-full max-w-5xl space-y-6 pt-2">
      {/* Page Heading */}
      <header>
        <h2 className="font-body text-xl sm:text-2xl font-medium text-ink tracking-tight">
          {CLIENT_INFO.title}
        </h2>
        <p className="mt-1.5 max-w-2xl font-body text-ui text-ink/70 leading-relaxed">
          {CLIENT_INFO.lead}
        </p>
      </header>

      {/* 1. Presenting Concerns Hero Card */}
      {client.concernTags?.length > 0 && (
        <section className="rounded-2xl bg-paper border border-ink/10 p-5 sm:p-6 shadow-xs">
          <h3 className="font-body text-caption font-semibold uppercase tracking-wider text-ink/65 mb-3.5">
            {CLIENT_INFO.groups.concerns}
          </h3>
          <ConcernChips tags={client.concernTags} size="lg" />
        </section>
      )}

      {/* 2. Structured 3-Column Grid for Demographics, Location, and Plan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card A: Who you are working with */}
        <SectionCard
          title={CLIENT_INFO.groups.who}
          icon={
            <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        >
          <InfoItem label={CLIENT_INFO.labels.type} value={typeLabel} highlight />

          {isCouple ? (
            client.partners?.map((partner, index) => (
              <InfoItem
                key={partner.name ?? index}
                label={`Partner ${index + 1}`}
                value={[partner.name, partner.age && `${partner.age}`, partner.gender]
                  .filter(Boolean)
                  .join(' · ')}
              />
            ))
          ) : (
            <>
              {client.age != null && (
                <InfoItem label={CLIENT_INFO.labels.age} value={client.age} />
              )}
              {client.gender && (
                <InfoItem label={CLIENT_INFO.labels.gender} value={client.gender} />
              )}
            </>
          )}

          {client.relationshipStatus && (
            <InfoItem
              label={CLIENT_INFO.labels.relationshipStatus}
              value={client.relationshipStatus}
            />
          )}
        </SectionCard>

        {/* Card B: Where they are */}
        <SectionCard
          title={CLIENT_INFO.groups.where}
          icon={
            <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        >
          {client.country && (
            <InfoItem label={CLIENT_INFO.labels.country} value={client.country} />
          )}
          {client.city && (
            <InfoItem label={CLIENT_INFO.labels.city} value={client.city} />
          )}
          <InfoItem
            label={CLIENT_INFO.labels.timezone}
            value={
              client.timezone ? (
                zoneDescription(client.timezone)
              ) : (
                <span className="text-ink/65 font-normal">{CLIENT_INFO.timezoneUnknown}</span>
              )
            }
          />
        </SectionCard>

        {/* Card C: Their plan with us */}
        <SectionCard
          title={CLIENT_INFO.groups.plan}
          icon={
            <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          <InfoItem
            label={CLIENT_INFO.labels.genderPreference}
            value={genderPreferenceLabel}
          />
          <InfoItem
            label={CLIENT_INFO.labels.matchedAt}
            value={formatDate(matchedAt)}
          />
          <InfoItem
            label={CLIENT_INFO.labels.subscription}
            value={subscriptionLabel}
            note={accessNote}
            highlight
          />
        </SectionCard>

      </div>
    </div>
  )
}
