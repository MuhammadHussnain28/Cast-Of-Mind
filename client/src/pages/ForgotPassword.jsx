import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input, Text } from '../components/ui'
import AuthShell from '../components/auth/AuthShell'
import FormAlert from '../components/auth/FormAlert'
import { forgotPassword } from '../lib/api/authApi'
import { toApiError } from '../lib/api/ApiError'
import { forgotPasswordSchema } from '../lib/validation/auth'
import { zodErrorsToFieldMap } from '../lib/validation/fieldErrors'

/**
 * Request a reset link. Works for all three roles — master spec §11.
 *
 * The confirmation is identical whether or not the address has an account,
 * because the server's reply is. Saying "no account found" here would hand
 * anyone a way to discover who is a patient of this platform, which is the
 * exact leak the backend was written to close.
 *
 * So the wording has to do a careful thing: be reassuring without promising
 * an email will arrive. "If that address has an account" is doing real work.
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)

    const parsed = forgotPasswordSchema.safeParse({ email })
    if (!parsed.success) {
      setFieldErrors(zodErrorsToFieldMap(parsed.error))
      return
    }

    setFieldErrors({})
    setSubmitting(true)

    try {
      await forgotPassword(parsed.data)
      setSent(true)
    } catch (error) {
      // Only reached if the request itself failed — no network, or the rate
      // limit. A rejected email address still returns 200.
      setFormError(toApiError(error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your inbox"
        intro="If that address has an account with us, a link to choose a new password is on its way."
        footer={
          <Text size="caption" tone="muted">
            <Link to="/login" className="text-ink underline underline-offset-4">
              Back to sign in
            </Link>
          </Text>
        }
      >
        <div className="flex flex-col gap-4">
          <Text tone="muted">
            The link works once and expires in 30 minutes. If nothing arrives in a few
            minutes, check your spam folder.
          </Text>

          <Button
            variant="ghost"
            onClick={() => {
              setSent(false)
              setEmail('')
            }}
            className="self-start"
          >
            Use a different email
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      intro="Tell us the email address on your account and we will send you a link."
      footer={
        <Text size="caption" tone="muted">
          Remembered it?{' '}
          <Link to="/login" className="text-ink underline underline-offset-4">
            Back to sign in
          </Link>
        </Text>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {formError && <FormAlert>{formError}</FormAlert>}

        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setFieldErrors({})
          }}
          error={fieldErrors.email}
          required
        />

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          {submitting ? 'Sending' : 'Send the link'}
        </Button>
      </form>
    </AuthShell>
  )
}
