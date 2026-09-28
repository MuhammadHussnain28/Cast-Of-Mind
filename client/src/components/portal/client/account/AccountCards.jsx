import { useState } from 'react'
import { Button } from '../../../ui'
import { openBillingPortal } from '../../../../lib/api/clientPortalApi'
import { forgotPassword } from '../../../../lib/api/authApi'
import { ACCOUNT } from '../../../../data/clientPortalContent'
import { CardRenewIcon, LockIcon, TickIcon } from '../ClientPortalIcons'

/**
 * The two small action cards on the Account page (11.5): the card on file,
 * held by Stripe, and the password, reset through the standard link.
 */

const card =
  'relative flex h-full flex-col overflow-hidden rounded-2xl bg-paper px-5 py-6 shadow-[0_12px_32px_-20px_rgb(25_18_43/0.35)] sm:px-6'

function CardHead({ icon, id, children }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-sage/15 text-sage-deep">
        {icon}
      </span>
      <h2 id={id} className="font-body text-ui font-medium text-ink-deep">
        {children}
      </h2>
    </div>
  )
}

const actionClass =
  'mt-5 w-full self-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-busy:disabled:cursor-progress aria-busy:disabled:opacity-100 sm:w-auto'

export function PaymentMethodCard() {
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState(null)

  async function open() {
    setOpening(true)
    setError(null)
    try {
      const { url } = await openBillingPortal()
      // Stays "opening" while the browser leaves for Stripe.
      window.location.assign(url)
    } catch (failure) {
      setOpening(false)
      setError(failure?.status ? failure.message : ACCOUNT.failed)
    }
  }

  return (
    <section aria-labelledby="payment-method-heading" className={card}>
      <CardHead icon={<CardRenewIcon size={20} />} id="payment-method-heading">
        {ACCOUNT.payment.heading}
      </CardHead>
      <p className="mt-4 font-body text-ui leading-relaxed text-ink/70">{ACCOUNT.payment.body}</p>
      <p className="mt-2 font-body text-caption leading-relaxed text-ink/70">{ACCOUNT.payment.note}</p>
      <div className="mt-auto">
        <Button variant="secondary" loading={opening} onClick={open} className={actionClass}>
          {opening ? ACCOUNT.opening : ACCOUNT.payment.action}
        </Button>
        {error && (
          <p role="alert" className="mt-2 font-body text-caption text-clay">
            {error}
          </p>
        )}
      </div>
    </section>
  )
}

export function PasswordCard({ email }) {
  const [phase, setPhase] = useState('idle')

  async function send() {
    setPhase('sending')
    try {
      await forgotPassword({ email })
      setPhase('sent')
    } catch {
      setPhase('failed')
    }
  }

  return (
    <section aria-labelledby="password-heading" className={card}>
      <CardHead icon={<LockIcon size={20} />} id="password-heading">
        {ACCOUNT.password.heading}
      </CardHead>
      <p className="mt-4 font-body text-ui leading-relaxed text-ink/70">{ACCOUNT.password.body}</p>

      <div className="mt-auto" aria-live="polite">
        {phase === 'sent' ? (
          <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-sage/12 px-3.5 py-3 font-body text-caption leading-relaxed text-ink">
            <TickIcon size={18} className="mt-0.5 shrink-0 text-sage-deep" />
            {ACCOUNT.password.sent(email)}
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={send}
              disabled={phase === 'sending'}
              aria-busy={phase === 'sending' || undefined}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-ink/50 px-6 font-body text-ui font-medium text-ink transition-colors duration-200 ease-out hover:bg-mist focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-progress sm:w-auto"
            >
              {phase === 'sending' ? ACCOUNT.password.sending : ACCOUNT.password.action}
            </button>
            {phase === 'failed' && (
              <p role="alert" className="mt-2 font-body text-caption text-clay">
                {ACCOUNT.password.failed}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
