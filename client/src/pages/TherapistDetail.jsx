import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Button, Heading, Text } from '../components/ui'
import TherapistIdentity from '../components/therapist/TherapistIdentity'
import WorkingHoursTable from '../components/therapist/WorkingHoursTable'
import { ArrowLeft, Check } from '../components/join/JoinIcons'
import { fetchTherapist } from '../lib/api/matchingApi'
import {
  therapistChosen,
  selectSelectedTherapistId,
} from '../store/questionnaireSlice'
import { convertWorkingHours, detectViewerZone, hasAnyHours } from '../lib/workingHours'
import { detail } from '../data/matchesContent'
import { optimisedPhoto } from '../lib/cloudinaryImage'

/**
 * One therapist, in full (§24.7).
 *
 * Its own route and its own request rather than data handed over from /matches,
 * so a bookmarked, refreshed or shared link works. §5 lists /therapist/[id] as
 * a real page, and a page that only exists mid-flow is not one.
 *
 * NO STAR RATINGS ANYWHERE. Reviews are admin-only (§9.6) — never shown on a
 * profile, never shown publicly.
 */
export default function TherapistDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const reduceMotion = useReducedMotion()
  const selectedId = useSelector(selectSelectedTherapistId)

  // LOADING IS DERIVED, not set at the top of the effect. A synchronous
  // setState inside an effect is what the React Compiler rule objects to, and
  // the fix is the same one useApi got in chunk 0.6: describe the request that
  // is wanted, and treat "the stored result is for a different request" as
  // loading. Every setState below happens in a promise callback.
  const [result, setResult] = useState({ key: null, therapist: null, failed: false })
  const status =
    result.key !== id ? 'loading' : result.failed ? 'error' : 'ready'

  useEffect(() => {
    let live = true

    fetchTherapist(id)
      .then((therapist) => live && setResult({ key: id, therapist, failed: false }))
      .catch(() => live && setResult({ key: id, therapist: null, failed: true }))

    return () => {
      live = false
    }
  }, [id])

  const therapist = result.therapist
  const viewerZone = useMemo(() => detectViewerZone(), [])
  const hourRows = useMemo(
    () =>
      therapist
        ? convertWorkingHours(therapist.workingHours, therapist.timezone, viewerZone)
        : [],
    [therapist, viewerZone],
  )

  if (status === 'loading') {
    return (
      <Shell>
        <p className="sr-only" role="status">
          Loading
        </p>
        <div aria-hidden="true" className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="h-64 w-full rounded-2xl bg-ink/8 motion-safe:animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-ink/8 motion-safe:animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-ink/8 motion-safe:animate-pulse" />
          </div>
        </div>
      </Shell>
    )
  }

  if (status === 'error' || !therapist) {
    return (
      <Shell>
        <Heading level={1} size="section" className="max-w-measure">
          {detail.notFoundHeading}
        </Heading>
        <Text tone="muted" className="mt-4 max-w-measure">
          {detail.notFoundBody}
        </Text>
        <Button as={Link} to="/matches" className="mt-8">
          {detail.notFoundCta}
        </Button>
      </Shell>
    )
  }

  const isChosen = selectedId === therapist.id

  return (
    <div className="bg-paper">
      {/* The person, presented — the same dark-stage language the admin detail
          pages and the therapist's own portal card use, so the three views of
          one therapist read as one product. */}
      <section data-surface="dark" className="relative overflow-hidden bg-ink">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-sage/10 blur-[130px] motion-safe:animate-drift"
        />

        <div className="relative mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
          <Link
            to="/matches"
            className="inline-flex min-h-11 items-center gap-2 font-body text-caption text-paper/80 hover:text-paper"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            {detail.back}
          </Link>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-end"
          >
            <img
              src={optimisedPhoto(therapist.photoUrl)}
              alt={`${therapist.firstName} ${therapist.lastName}`}
              className="h-48 w-40 shrink-0 rounded-2xl object-cover sm:h-56 sm:w-48"
            />
            <TherapistIdentity
              therapist={therapist}
              size="detail"
              tone="inverse"
              headingLevel={1}
            />
          </motion.div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_300px] lg:gap-16">
          <div className="min-w-0 space-y-12">
            <Section heading={detail.about}>
              <Text className="max-w-measure whitespace-pre-line">{therapist.bio}</Text>
            </Section>

            {/* Specialties lead and sit in their own panel: they are the only
                field on this page that decides who is matched with whom. */}
            <Section heading={detail.specialties}>
              <div className="rounded-2xl border border-sage/40 bg-sage/6 p-6">
                <ul className="flex flex-wrap gap-2">
                  {therapist.specialtyTags?.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full bg-sage/15 px-3 py-1 font-body text-ui text-ink"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
                <Text size="caption" tone="muted" className="mt-4 max-w-measure">
                  {detail.specialtiesNote}
                </Text>
              </div>
            </Section>

            {/* Orientations are METHOD, not problem, and never affect matching
                (§15, §23). Set as plain outline chips so they cannot be mistaken
                for the sage panel above. */}
            <Section heading={detail.approach}>
              <ul className="flex flex-wrap gap-2">
                {therapist.treatmentOrientations?.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-ink/50 px-3 py-1 font-body text-ui text-ink"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <Text size="caption" tone="muted" className="mt-4 max-w-measure">
                {detail.approachNote}
              </Text>
            </Section>

            <Section heading={detail.hours}>
              {hasAnyHours(hourRows) ? (
                <WorkingHoursTable
                  rows={hourRows}
                  theirZone={therapist.timezone}
                  yourZone={viewerZone}
                />
              ) : (
                <Text tone="muted" className="max-w-measure">
                  {detail.hoursNone}
                </Text>
              )}
            </Section>

            <Section heading={detail.credentials}>
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Fact label={detail.credentials} value={credentialLine(therapist)} />
                <Fact
                  label={detail.experience}
                  value={therapist.yearsExperience ? `${therapist.yearsExperience}` : null}
                />
                <Fact label={detail.languages} value={therapist.languages?.join(', ')} />
                <Fact
                  label={detail.basedIn}
                  value={[therapist.city, therapist.country].filter(Boolean).join(', ')}
                />
              </dl>
            </Section>
          </div>

          {/* The choice, kept in view while reading. */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-ink/12 bg-mist p-6">
              <p className="font-body text-subsection font-medium text-ink">€200 / month</p>
              <Text size="caption" tone="muted" className="mt-2">
                Four sessions a month and unlimited chat.
              </Text>

              <Button
                className="mt-6 w-full"
                onClick={() => dispatch(therapistChosen(summarise(therapist)))}
              >
                {isChosen ? (
                  <span className="inline-flex items-center gap-2">
                    <Check aria-hidden="true" className="h-4 w-4" />
                    {detail.chosen}
                  </span>
                ) : (
                  detail.choose
                )}
              </Button>

              <Text size="caption" tone="muted" className="mt-3">
                {detail.chooseNote}
              </Text>

              {/* Choosing records the selection; this is the way onward. It
                  appears only once a therapist is chosen, so the panel never
                  offers a step that would land on a redirect. */}
              {isChosen && (
                <Button as={Link} to="/checkout" variant="secondary" className="mt-3 w-full">
                  {detail.continueToCheckout}
                </Button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function credentialLine(therapist) {
  return [therapist.credentialInitials, therapist.credentialType].filter(Boolean).join(' · ')
}

/** The minimum the checkout needs to show who was chosen. */
function summarise(therapist) {
  return {
    id: therapist.id,
    firstName: therapist.firstName,
    lastName: therapist.lastName,
    title: therapist.title,
    photoUrl: therapist.photoUrl,
    therapistType: therapist.therapistType,
  }
}

function Section({ heading, children }) {
  return (
    <section>
      <Heading level={2} size="subsection">
        {heading}
      </Heading>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Fact({ label, value }) {
  if (!value) return null
  return (
    <div>
      <dt className="font-body text-caption text-ink/70">{label}</dt>
      <dd className="mt-1 font-body text-ui text-ink-deep">{value}</dd>
    </div>
  )
}

function Shell({ children }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 lg:py-24">{children}</div>
  )
}
