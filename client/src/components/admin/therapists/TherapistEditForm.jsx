import { useState } from 'react'
import { Button, Input, Modal, Select, Text } from '../../ui'
import TagPicker from '../../join/TagPicker'
import { MailIcon, SortArrowIcon } from '../AdminIcons'
import { SPECIALTY_TAGS, SPECIALTY_TAGS_MIN, SPECIALTY_TAGS_MAX } from '../../../data/specialtyTags'
import { updateTherapist } from '../../../lib/api/adminTherapistsApi'
import { toApiError } from '../../../lib/api/ApiError'

const TITLES = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.']
const CREDENTIAL_TYPES = ['Diploma/Degree', 'Certificate', 'License']

/**
 * The admin-controlled fields, and only those — §8.7.
 *
 * These are locked out of the therapist's own profile because matching
 * integrity and client trust depend on specialties and credentials being
 * verified. The form says so rather than leaving the admin to wonder why they
 * can change a credential but not a bio.
 *
 * TagPicker is the same control the application form uses, so the 3-4 limit is
 * enforced the same way and a set that would break matching cannot be saved.
 */
export default function TherapistEditForm({ therapist, onSaved, onCancel }) {
  const [values, setValues] = useState({
    email: therapist.email ?? '',
    title: therapist.title,
    firstName: therapist.firstName,
    lastName: therapist.lastName,
    therapistType: therapist.therapistType,
    credentialType: therapist.credentialType,
    credentialInitials: therapist.credentialInitials,
    licenseNumber: therapist.licenseNumber ?? '',
    specialtyTags: therapist.specialtyTags,
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const set = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const emailChanging = values.email !== therapist.email
  // What the server will store: it trims and lower-cases before saving.
  const nextEmail = values.email.trim().toLowerCase()
  const name = `${therapist.firstName} ${therapist.lastName}`

  // Held while the email confirmation is open; null when it is closed.
  const [pendingChanges, setPendingChanges] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    // Only what actually changed. Sending the whole form would make every save
    // look like an edit of every field in the action log.
    const changes = Object.fromEntries(
      Object.entries(values).filter(([key, value]) =>
        key === 'specialtyTags'
          ? value.join('|') !== therapist.specialtyTags.join('|')
          : value !== (therapist[key] ?? ''),
      ),
    )

    if (Object.keys(changes).length === 0) {
      onCancel()
      return
    }

    // A new sign-in address changes how they get in, so it is confirmed first.
    if ('email' in changes && nextEmail !== therapist.email) {
      setPendingChanges(changes)
      return
    }

    save(changes)
  }

  function confirmEmailChange() {
    const changes = pendingChanges
    setPendingChanges(null)
    save(changes)
  }

  async function save(changes) {
    setSaving(true)

    try {
      const result = await updateTherapist(therapist._id, changes)
      onSaved(result)
    } catch (err) {
      const apiError = toApiError(err)
      if (apiError.details?.length) {
        setFieldErrors(
          Object.fromEntries(apiError.details.map((d) => [d.path, d.message])),
        )
      }
      setFormError(apiError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      <section className="rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:px-6 sm:py-6">
        <h2 className="font-body text-caption font-medium text-ink/70">Identity</h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Select label="Title" value={values.title} onChange={set('title')}>
            {TITLES.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </Select>
          <Input
            label="Professional title"
            value={values.therapistType}
            onChange={set('therapistType')}
            error={fieldErrors.therapistType}
            helper="Shown to clients, in their own words."
          />
          <Input
            label="First name"
            value={values.firstName}
            onChange={set('firstName')}
            error={fieldErrors.firstName}
          />
          <Input
            label="Last name"
            value={values.lastName}
            onChange={set('lastName')}
            error={fieldErrors.lastName}
          />
          <Input
            label="Sign-in email"
            type="email"
            value={values.email}
            onChange={set('email')}
            error={fieldErrors.email}
            className="sm:col-span-2"
            helper={
              emailChanging
                ? 'Both the old and the new address will be emailed about this change.'
                : 'This is the address they sign in with.'
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:px-6 sm:py-6">
        <h2 className="font-body text-caption font-medium text-ink/70">Credentials</h2>
        <Text size="caption" tone="muted" className="mt-1">
          Admin-verified, which is why the therapist cannot edit them.
        </Text>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Select
            label="Credential type"
            value={values.credentialType}
            onChange={set('credentialType')}
          >
            {CREDENTIAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <Input
            label="Credential initials"
            value={values.credentialInitials}
            onChange={set('credentialInitials')}
            error={fieldErrors.credentialInitials}
            placeholder="e.g. MS, M.Phil, PhD"
          />
          <Input
            label="Licence number"
            value={values.licenseNumber}
            onChange={set('licenseNumber')}
            error={fieldErrors.licenseNumber}
            helper="Leave blank if none is recorded."
            className="sm:col-span-2"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-sage/40 bg-sage/[0.06] px-5 py-5 sm:px-6 sm:py-6">
        <TagPicker
          fieldName="specialtyTags"
          legend="Specialty tags"
          hint="This is the only thing that decides which clients are matched with them."
          options={SPECIALTY_TAGS}
          value={values.specialtyTags}
          onChange={(specialtyTags) => setValues((prev) => ({ ...prev, specialtyTags }))}
          min={SPECIALTY_TAGS_MIN}
          max={SPECIALTY_TAGS_MAX}
          prominent
          slots
          error={fieldErrors.specialtyTags}
        />
      </section>

      {formError && (
        <Text tone="error" size="ui" role="alert">
          {formError}
        </Text>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={saving}>
          Save changes
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>

      <Modal
        open={pendingChanges !== null}
        onClose={() => setPendingChanges(null)}
        title={`Change ${name}’s sign-in email?`}
        description="From now on they sign in with the new address. Their password stays the same."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingChanges(null)}>
              Keep the current email
            </Button>
            <Button onClick={confirmEmailChange}>Change the email</Button>
          </>
        }
      >
        <div className="rounded-xl bg-mist px-4 py-4">
          <div className="flex items-center gap-3">
            <MailIcon className="size-5 shrink-0 text-ink/60" />
            <p className="min-w-0 font-body">
              <span className="block text-caption text-ink/70">Now</span>
              <span className="block break-all text-ui text-ink/70 line-through decoration-ink/60">
                {therapist.email}
              </span>
            </p>
          </div>

          {/* The move from one to the other, drawn: a short rule and an arrow. */}
          <div aria-hidden="true" className="flex w-5 flex-col items-center py-1">
            <span className="h-2 w-px bg-ink/25" />
            <SortArrowIcon className="text-ink/60" />
          </div>

          <div className="flex items-center gap-3">
            <MailIcon className="size-5 shrink-0 text-ink" />
            <p className="min-w-0 font-body">
              <span className="block text-caption text-ink/70">From now on</span>
              <span className="block break-all text-ui font-medium text-ink">{nextEmail}</span>
            </p>
          </div>
        </div>

        <Text size="caption" tone="muted" className="mt-4">
          Both addresses are emailed about the change, so the old inbox can raise the alarm if it
          was not expected.
        </Text>
      </Modal>
    </form>
  )
}
