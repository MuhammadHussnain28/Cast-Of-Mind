import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Heading, Spinner, Text, useToast } from '../../components/ui'
import ClientPreviewCard from '../../components/portal/ClientPreviewCard'
import VerifiedPanel from '../../components/portal/VerifiedPanel'
import ModernVerifiedPanel from '../../components/portal/ModernVerifiedPanel'
import ProfileEditor from '../../components/portal/ProfileEditor'
import PracticeCounts from '../../components/portal/PracticeCounts'
import ModernPracticeCounts from '../../components/portal/ModernPracticeCounts'
import WorkingHoursSummary from '../../components/admin/applications/WorkingHoursSummary'
import { fetchOwnProfile } from '../../lib/api/therapistProfileApi'
import { toApiError } from '../../lib/api/ApiError'
import { formatDate } from '../../lib/dateFormat'

/**
 * The therapist's own profile — master spec §8.7.
 *
 * The page is built around one idea: a therapist has two audiences. The card at
 * the top is what a client sees, and it is also the only part they can change;
 * everything below it was verified by our team, which is what makes it worth
 * anything to a client. Structure carries that, rather than a paragraph.
 *
 * No client list and no chat — that is slice 8.
 */
export default function TherapistProfile() {
  const toast = useToast()
  const [reloadToken, setReloadToken] = useState(0)
  const [result, setResult] = useState(null)
  const [editing, setEditing] = useState(false)

  const loading = result?.key !== reloadToken
  const error = result?.key === reloadToken ? result.error : null
  const profile = result?.data ?? null

  useEffect(() => {
    let cancelled = false

    fetchOwnProfile()
      .then((data) => {
        if (!cancelled) setResult({ key: reloadToken, data, error: null })
      })
      .catch((err) => {
        if (!cancelled) setResult({ key: reloadToken, data: null, error: toApiError(err).message })
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  if (loading && !profile) {
    return (
      <div className="flex items-center gap-3 py-12">
        <Spinner size="md" />
        <Text tone="muted">Loading your profile</Text>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="max-w-measure rounded-2xl border border-clay/40 bg-clay/5 px-5 py-6">
        <Text tone="error">{error}</Text>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => setReloadToken((n) => n + 1)}
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pt-6 sm:pt-8 lg:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4 ">
        <div>
          <Heading level={1} size="subsection">
            <span className='italic tracking-wide'>Your Profile</span>
          </Heading>
          <Text size="caption" tone="muted" className="mt-1">
            With Cast of Minds since {formatDate(profile.memberSince)}
          </Text>
        </div>

        {!editing && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Edit photo and bio
          </Button>
        )}
      </div>

      {editing ? (
        <ProfileEditor
          profile={profile}
          onCancel={() => setEditing(false)}
          onSaved={(updated) => {
            setResult((current) => ({ ...current, data: updated }))
            setEditing(false)
            toast.success('Saved. Clients will see this straight away.')
          }}
        />
      ) : (
        <ClientPreviewCard profile={profile} />
      )}

      {/* PREVIOUS VERSION (SAVED FOR BACKUP): <PracticeCounts stats={profile.stats} /> */}
      <ModernPracticeCounts stats={profile.stats} />

      {/* PREVIOUS VERSION (SAVED FOR BACKUP): <VerifiedPanel profile={profile} /> */}
      <ModernVerifiedPanel profile={profile} />

      {/* PREVIOUS VERSION (SAVED FOR BACKUP):
      <section
        aria-labelledby="hours"
        className="rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:px-6 sm:py-6"
      >
        <div className="flex items-center gap-2">
          <h2 id="hours" className="font-body text-caption font-medium text-ink/70">
            Your working hours
          </h2>
        </div>
        <Text size="caption" tone="muted" className="mt-1">
          Shown to your clients at the top of your chat, so they know when to expect you.
        </Text>
        <div className="mt-5">
          <WorkingHoursSummary workingHours={profile.workingHours} timezone={profile.timezone} />
        </div>
      </section>
      */}
      <section
        aria-labelledby="hours"
        className="relative overflow-hidden rounded-3xl border border-ink/10 bg-paper p-5 sm:p-7 shadow-xs"
      >
        {/* Soft Ambient Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-sage/10 blur-[60px]"
        />

        <div className="relative mb-5 flex flex-col justify-between gap-1 border-b border-ink/8 pb-4 sm:flex-row sm:items-center">
          <div>
            <span className="font-body text-[0.7rem] font-semibold uppercase tracking-wider text-ink/60">
              Availability
            </span>
            <h2 id="hours" className="font-body text-base font-semibold text-ink sm:text-lg">
              Your working hours
            </h2>
          </div>
          <Text size="caption" tone="muted" className="mt-0.5">
            Shown to your clients at the top of your chat, so they know when to expect you.
          </Text>
        </div>

        <WorkingHoursSummary workingHours={profile.workingHours} timezone={profile.timezone} />
      </section>

      {/* PREVIOUS VERSION (SAVED FOR BACKUP):
      <section
        aria-labelledby="password"
        className="rounded-2xl border border-ink/12 bg-mist px-5 py-5 sm:px-6"
      >
        <h2 id="password" className="font-body text-caption font-medium text-ink/70">
          Your password
        </h2>
        <Text size="ui" className="mt-3">
          Your password is stored in a form nobody can read back, so it cannot be shown or
          changed from here. To set a new one, use{' '}
          <Link to="/forgot-password" className="text-ink underline underline-offset-4">
            Forgot password
          </Link>{' '}
          and follow the link we email you.
        </Text>
      </section>
      */}
      <section
        aria-labelledby="password"
        className="relative overflow-hidden rounded-3xl border border-ink/10 bg-paper p-5 sm:p-7 shadow-xs"
      >
        {/* Soft Ambient Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-sage/10 blur-[50px]"
        />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3.5">
            <span
              className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-ink/8 bg-mist text-sage-deep shadow-2xs"
              aria-hidden="true"
            >
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="password" className="font-body text-base font-semibold text-ink">
                  Your password
                </h2>
                <span className="inline-flex items-center rounded-md bg-sage/15 px-2 py-0.5 text-[0.7rem] font-medium text-sage-deep">
                  Encrypted & Protected
                </span>
              </div>
              <p className="mt-2 max-w-2xl font-body text-ui leading-relaxed text-ink/75">
                Your password is stored in a form nobody can read back, so it cannot be shown or
                changed from here. To set a new one, use{' '}
                <Link
                  to="/forgot-password"
                  className="font-medium text-ink underline underline-offset-4 transition-colors hover:text-sage-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  Forgot password
                </Link>{' '}
                and follow the link we email you.
              </p>
            </div>
          </div>

          <div className="pt-0.5 sm:shrink-0">
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/12 bg-mist/60 px-4 py-2 font-body text-caption font-medium text-ink shadow-2xs transition-colors hover:bg-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <span>Reset password</span>
              <svg
                className="size-3.5 text-ink/60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
