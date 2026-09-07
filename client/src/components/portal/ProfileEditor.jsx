import { useState } from 'react'
import { Button, Text, Textarea } from '../ui'
import PhotoUpload from '../join/PhotoUpload'
import { updateOwnProfile } from '../../lib/api/therapistProfileApi'
import { toApiError } from '../../lib/api/ApiError'

const BIO_MAX = 1200

/**
 * The two fields a therapist owns — §8.7.
 *
 * PhotoUpload is the same control the application form uses, so the upload
 * states (idle, uploading, uploaded, error, retry) behave identically in both
 * places and the server checks the real bytes either way.
 *
 * Nothing here is a password field, deliberately. §11: the password is set once
 * on the application form and recoverable only through "Forgot password" — the
 * admin cannot see it and neither can we.
 */
export default function ProfileEditor({ profile, onSaved, onCancel }) {
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const over = bio.length > BIO_MAX
  const changed = photoUrl !== profile.photoUrl || bio !== profile.bio

  async function handleSubmit(event) {
    event.preventDefault()
    if (!changed) {
      onCancel()
      return
    }

    setSaving(true)
    setError(null)

    // Only what actually changed, so an untouched field is never reported as
    // an edit.
    const changes = {}
    if (photoUrl !== profile.photoUrl) changes.photoUrl = photoUrl
    if (bio !== profile.bio) changes.bio = bio

    try {
      const result = await updateOwnProfile(changes)
      onSaved(result.profile)
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      <section className="rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:px-6 sm:py-6">
        <h2 className="font-body text-caption font-medium text-ink/70">Your photo</h2>
        <Text size="caption" tone="muted" className="mt-1">
          A clear, warm, professional portrait. This is often the first thing a client sees.
        </Text>

        <div className="mt-5">
          <PhotoUpload value={photoUrl} onChange={setPhotoUrl} id="therapist-photo" />
        </div>
      </section>

      <section className="rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:px-6 sm:py-6">
        <h2 className="font-body text-caption font-medium text-ink/70">Your bio</h2>
        <Text size="caption" tone="muted" className="mt-1">
          Three or four lines, in your own words. Clients read this when deciding who to
          work with.
        </Text>

        <div className="mt-5">
          <Textarea
            label="Bio"
            hideLabel
            rows={6}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            error={over ? `Trim this to ${BIO_MAX} characters or fewer.` : undefined}
          />
          {/* Never truncated — losing the end of a pasted paragraph silently is
              worse than being told the count is over. */}
          <p
            aria-hidden="true"
            className={`mt-2 text-right font-body text-caption tabular-nums ${
              over ? 'text-clay' : 'text-ink/70'
            }`}
          >
            {bio.length.toLocaleString('en-GB')} / {BIO_MAX.toLocaleString('en-GB')}
          </p>
        </div>
      </section>

      {error && (
        <Text tone="error" size="ui" role="alert">
          {error}
        </Text>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={saving} disabled={over}>
          Save changes
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
