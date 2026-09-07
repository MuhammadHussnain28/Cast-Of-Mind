import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Input, Text } from '../components/ui'
import AuthShell from '../components/auth/AuthShell'
import FormAlert from '../components/auth/FormAlert'
import { applyCredentials } from '../lib/authSession'
import { login as loginRequest } from '../lib/api/authApi'
import { toApiError } from '../lib/api/ApiError'
import { loginSchema } from '../lib/validation/auth'
import { zodErrorsToFieldMap } from '../lib/validation/fieldErrors'
import { homeForRole } from '../lib/authRedirect'
import { selectAuthStatus, selectRole } from '../store/authSlice'

/**
 * One login for all three roles — master spec §3.
 *
 * Deliberately absent, both by explicit decision in the spec:
 *   - "Continue with Google". Accounts here are system-issued, never
 *     self-created, so a social login would produce a second identity for
 *     the same person (§3, §22).
 *   - A role selector. The server reads `role` and the app redirects. Asking
 *     someone to classify themselves at the door is both unnecessary and a
 *     way to leak that the three kinds of account exist.
 */

/**
 * Deliberately role-neutral. This page is the shared door for all three roles,
 * so the line has to be true for every one of them.
 *
 * An earlier version read "Sign in to reach your therapist, your sessions and
 * your journal" — which describes only a CLIENT. A therapist has clients, not a
 * therapist; an admin has neither. Spotted by the developer, 2026-08-27.
 */
const INTRO = 'Sign in to pick up where you left off.'
export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const status = useSelector(selectAuthStatus)
  const role = useSelector(selectRole)

  const [values, setValues] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in — send them on rather than showing a form they do not
  // need. Someone who bookmarked /login should not have to log in twice.
  if (status === 'authenticated') {
    return <Navigate to={homeForRole(role)} replace />
  }

  const update = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }))
    // Clear that field's error as soon as they start fixing it. Leaving it
    // there while they type reads as the form still complaining.
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)

    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(zodErrorsToFieldMap(parsed.error))
      return
    }

    setFieldErrors({})
    setSubmitting(true)

    try {
      const { accessToken, user } = await loginRequest(parsed.data)
      applyCredentials(dispatch, { accessToken, user })

      // Back to wherever they were headed before being sent here, or their
      // own portal. `replace` so Back does not return to the login form.
      const intended = location.state?.from?.pathname
      navigate(intended || homeForRole(user.role), { replace: true })
    } catch (error) {
      // The server's message is shown verbatim. It is written to be safe —
      // "Invalid email or password" whether the address exists or not — and
      // rewording it here, or adding a client-side "no account found" check,
      // would undo the enumeration protection the backend was built around.
      setFormError(toApiError(error).message)
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      intro={INTRO}
      footer={
        <Text size="caption" tone="muted">
          New to Cast of Mind?{' '}
          <Link to="/questionnaire" className="text-ink underline underline-offset-4">
            Start with a few questions
          </Link>
        </Text>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {/* Signed out by the admin portal's inactivity timer. Without this the
            admin arrives here with no idea why, and assumes something broke. */}
        {location.state?.reason === 'inactivity' && !formError && (
          <FormAlert tone="notice" role="status">
            You were signed out because the session was inactive for a while.
          </FormAlert>
        )}

        {formError && <FormAlert>{formError}</FormAlert>}

        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={update('email')}
          error={fieldErrors.email}
          required
        />

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            value={values.password}
            onChange={update('password')}
            error={fieldErrors.password}
            required
          />

          {/* Both controls carry a 44px minimum height. The padding is
              invisible but it is what makes them reliably tappable on a
              phone — the project's accessibility floor, and these are the
              two things people reach for when a sign-in is going wrong. */}
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4">
            {/* Typing a password blind is a real cause of failed sign-ins,
                and a failed sign-in is a bad moment for someone already
                struggling. A plain text toggle rather than an eye icon —
                the label says exactly what it will do. */}
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-pressed={showPassword}
              className="inline-flex min-h-11 items-center rounded-md font-body text-caption text-ink/70 underline underline-offset-4 transition-colors duration-200 hover:text-ink"
            >
              {showPassword ? 'Hide password' : 'Show password'}
            </button>

            <Link
              to="/forgot-password"
              className="inline-flex min-h-11 items-center rounded-md font-body text-caption text-ink underline underline-offset-4"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          {submitting ? 'Signing in' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  )
}
