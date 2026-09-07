import { Input } from '../../ui'
import { screens } from '../../../data/questionnaireContent'

/**
 * Step 7 — email.
 *
 * Collected here and carried to checkout, but it is NOT stored on the client
 * profile: email belongs to the `users` record created when payment succeeds
 * (§10.1, §10.2). The reassurance line says exactly that, in the reader's terms.
 */
export default function StepContact({ answers, onChange, errors }) {
  const copy = screens.contact

  return (
    <div className="max-w-md">
      <Input
        label={copy.emailLabel}
        type="email"
        required
        placeholder={copy.emailPlaceholder}
        autoComplete="email"
        value={answers.email}
        onChange={(event) => onChange({ email: event.target.value })}
        error={errors.email}
      />
    </div>
  )
}
