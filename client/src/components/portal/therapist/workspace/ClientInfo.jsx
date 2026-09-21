import ConcernChips from './ConcernChips'
import { formatDate } from '../../../../lib/dateFormat'
import { zoneDescription } from '../../../../lib/therapist/sessionTime'
import { CLIENT_INFO } from '../../../../data/therapistPortalContent'

/**
 * Client info — master spec §8.2.
 *
 * Their own questionnaire answers, unedited. This is the only tab with content
 * in chunk 8.2.
 *
 * FIELD ROWS ON A HAIRLINE RHYTHM, NOT A CARD PER FIELD. Ten bordered
 * rectangles down a page is the shape §24.9 names as "correct but flat", and it
 * would also make ten unrelated facts look equally important. Grouping them
 * under four quiet headings does the work a border would only pretend to do.
 *
 * NOTHING IS GUESSED. Where the platform does not hold a value, the row says so
 * — see the time zone, which has never been collected.
 */

function Row({ label, children, note }) {
  return (
    <div className="flex flex-col gap-1 border-t border-ink/12 py-3.5 sm:flex-row sm:items-baseline sm:gap-6">
      <dt className="font-body text-caption text-ink/70 sm:w-56 sm:shrink-0">{label}</dt>
      <dd className="min-w-0 font-body text-ui text-ink">
        {children}
        {note && <p className="mt-1 font-body text-caption text-ink/70">{note}</p>}
      </dd>
    </div>
  )
}

function Group({ title, children }) {
  return (
    <section className="mt-8 first:mt-0">
      <h3 className="font-body text-caption font-medium text-ink">{title}</h3>
      <dl className="mt-2">{children}</dl>
    </section>
  )
}

export default function ClientInfo({ data }) {
  const { client, subscription, matchedAt } = data
  const isCouple = client.type === 'couple'

  const subscriptionLabel = subscription
    ? CLIENT_INFO.subscriptionValues[subscription.status]
    : CLIENT_INFO.subscriptionValues.none

  const accessNote = subscription ? CLIENT_INFO.accessNote[subscription.access] : null

  return (
    <div className="mt-6 max-w-3xl">
      <header>
        <h2 className="font-body text-ui font-medium text-ink">{CLIENT_INFO.title}</h2>
        <p className="mt-1.5 max-w-measure font-body text-ui leading-relaxed text-ink/70">
          {CLIENT_INFO.lead}
        </p>
      </header>

      <div className="mt-7">
        <Group title={CLIENT_INFO.groups.concerns}>
          {/* Repeated from the strip on purpose: the strip is a glance, this is
              the record. Set larger here because it is the subject of the page
              rather than a label on it. */}
          <div className="border-t border-ink/12 pt-3.5">
            <ConcernChips tags={client.concernTags} size="lg" />
          </div>
        </Group>

        <Group title={CLIENT_INFO.groups.who}>
          <Row label={CLIENT_INFO.labels.type}>
            {CLIENT_INFO.typeValues[client.type] ?? client.type}
          </Row>

          {/* A COUPLE IS TWO PEOPLE SHARING ONE ACCOUNT (§6). Both partners get
              their own row — a therapist working with a couple needs both ages
              and both genders, and collapsing them to one line would quietly
              erase somebody from their own therapy. */}
          {isCouple
            ? client.partners?.map((partner, index) => (
                <Row key={partner.name ?? index} label={`Partner ${index + 1}`}>
                  {[partner.name, partner.age && `${partner.age}`, partner.gender]
                    .filter(Boolean)
                    .join(' · ')}
                </Row>
              ))
            : (
                <>
                  {client.age != null && (
                    <Row label={CLIENT_INFO.labels.age}>{client.age}</Row>
                  )}
                  {client.gender && (
                    <Row label={CLIENT_INFO.labels.gender}>{client.gender}</Row>
                  )}
                </>
              )}

          {client.relationshipStatus && (
            <Row label={CLIENT_INFO.labels.relationshipStatus}>{client.relationshipStatus}</Row>
          )}
        </Group>

        <Group title={CLIENT_INFO.groups.where}>
          {/* Rendered as stored. The questionnaire's country select writes the
              DISPLAY NAME as its value, not the ISO code (`countryOptions` in
              lib/timezones.js), so there is nothing to look up here — and a
              code-to-name map would quietly print "IE" for every real client. */}
          {client.country && <Row label={CLIENT_INFO.labels.country}>{client.country}</Row>}
          {client.city && <Row label={CLIENT_INFO.labels.city}>{client.city}</Row>}

          {/* Saved from their own browser (9.2). Until then, said plainly — never
              guessed from the country, which can span many zones. */}
          <Row label={CLIENT_INFO.labels.timezone}>
            {client.timezone ? (
              zoneDescription(client.timezone)
            ) : (
              <span className="text-ink/70">{CLIENT_INFO.timezoneUnknown}</span>
            )}
          </Row>
        </Group>

        <Group title={CLIENT_INFO.groups.plan}>
          {/* Stated even when it is "no preference" — a blank here cannot be
              told apart from a question nobody answered. §15: this was a soft
              sort on the matching page, never a filter. */}
          <Row label={CLIENT_INFO.labels.genderPreference}>
            {CLIENT_INFO.genderPreferenceValues[client.therapistGenderPreference] ??
              client.therapistGenderPreference}
          </Row>

          <Row label={CLIENT_INFO.labels.matchedAt}>{formatDate(matchedAt)}</Row>

          <Row label={CLIENT_INFO.labels.subscription} note={accessNote}>
            {subscriptionLabel}
          </Row>
        </Group>
      </div>
    </div>
  )
}
