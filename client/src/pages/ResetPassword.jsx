import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input } from '../components/ui'
import AuthShell from '../components/auth/AuthShell'
import FormAlert from '../components/auth/FormAlert'
import { resetPassword } from '../lib/api/authApi'
import { toApiError } from '../lib/api/ApiError'
import { resetPasswordSchema, MIN_PASSWORD_LENGTH } from '../lib/validation/auth'
import { zodErrorsToFieldMap } from '../lib/validation/fieldErrors'

/**
 * Choose a new password, using the token from the emailed link.
 *
 * The token arrives as ?token=... in the URL. It is read, used, and never
 * stored anywhere — for the 30 minutes it is alive it IS the account.
 *
 * Two states matter more than the happy path here, because both arrive at a
 * bad moment for the person: a link that was never valid, and a link that has
 * expired. Neither may dead-end. Each offers the one action that helps —
 * request another.
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [values, setValues] = useState({ password: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const update = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)

    const parsed = resetPasswordSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(zodErrorsToFieldMap(parsed.error))
      return
    }

    setFieldErrors({})
    setSubmitting(true)

    try {
      await resetPassword({ token, password: parsed.data.password })
      setDone(true)
    } catch (error) {
      setFormError(toApiError(error).message)
      setSubmitting(false)
    }
  }

  // Somebody opened /reset-password with nothing attached — a truncated link,
  // or a stray bookmark. Say so plainly and offer the way forward.
  if (!token) {
    return (
      <AuthShell
        title="That link is incomplete"
        intro="The address is missing the part that identifies your request. Email links sometimes get cut short — request a new one and open it straight from the email."
      >
        <Button size="lg" className="w-full" onClick={() => navigate('/forgot-password')}>
          Request a new link
        </Button>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell
        title="Password changed"
        intro="You can sign in with your new password now. Any other devices you were signed in on have been signed out."
      >
        <Button size="lg" className="w-full" onClick={() => navigate('/login')}>
          Go to sign in
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Choose a new password"
      intro="Pick something you have not used here before."
      footer={
        // A link standing on its own is a target, not prose, so it carries the
        // 44px minimum height. The links on the other auth pages sit inside a
        // sentence, where padding would break the line box — WCAG 2.5.8
        // exempts those.
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center rounded-md font-body text-caption text-ink underline underline-offset-4"
        >
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {formError && (
          <FormAlert>
            {formError}{' '}
            <Link to="/forgot-password" className="underline underline-offset-4">
              Request a new link
            </Link>
          </FormAlert>
        )}

        <div>
          <Input
            label="New password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="new-password"
            helper={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            value={values.password}
            onChange={update('password')}
            error={fieldErrors.password}
            required
          />

          {/* 44px minimum height — the padding is invisible, but it is what
              makes this reliably tappable on a phone. */}
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-pressed={showPassword}
            className="mt-1 inline-flex min-h-11 items-center rounded-md font-body text-caption text-ink/70 underline underline-offset-4 transition-colors duration-200 hover:text-ink"
          >
            {showPassword ? 'Hide password' : 'Show password'}
          </button>
        </div>

        <Input
          label="Type it again"
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={update('confirmPassword')}
          error={fieldErrors.confirmPassword}
          required
        />

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          {submitting ? 'Saving' : 'Save new password'}
        </Button>
      </form>
    </AuthShell>
  )
}
