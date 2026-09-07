import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Heading, Spinner, Text, useToast } from '../../components/ui'
import ClientPreviewCard from '../../components/portal/ClientPreviewCard'
import VerifiedPanel from '../../components/portal/VerifiedPanel'
import ProfileEditor from '../../components/portal/ProfileEditor'
import PracticeCounts from '../../components/portal/PracticeCounts'
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Heading level={1} size="subsection">
            Your profile
          </Heading>
          <Text size="caption" tone="muted" className="mt-1">
            With Cast of Mind since {formatDate(profile.memberSince)}
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

      <PracticeCounts stats={profile.stats} />

      <VerifiedPanel profile={profile} />

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

      <section
        aria-labelledby="password"
        className="rounded-2xl border border-ink/12 bg-mist px-5 py-5 sm:px-6"
      >
        <h2 id="password" className="font-body text-caption font-medium text-ink/70">
          Your password
        </h2>
        {/* §11: set once on the application form, recoverable only by reset.
            Nobody can read it back — not the admin, not us. Saying so is kinder
            than leaving someone hunting for a change-password field. */}
        <Text size="ui" className="mt-3">
          Your password is stored in a form nobody can read back, so it cannot be shown or
          changed from here. To set a new one, use{' '}
          <Link to="/forgot-password" className="text-ink underline underline-offset-4">
            Forgot password
          </Link>{' '}
          and follow the link we email you.
        </Text>
      </section>
    </div>
  )
}
