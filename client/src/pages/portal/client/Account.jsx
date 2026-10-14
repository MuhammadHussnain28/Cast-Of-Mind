import { motion, useReducedMotion } from 'framer-motion'
import { ScreenHeader } from '../../../components/portal/client/ScreenScaffold'
import { AccountIcon } from '../../../components/portal/client/ClientPortalIcons'
import RatingForm from '../../../components/portal/client/review/RatingForm'
import SubscriptionControls from '../../../components/portal/client/account/SubscriptionControls'
import PlanHero from '../../../components/portal/client/account/PlanHero'
import BillingHistory from '../../../components/portal/client/account/BillingHistory'
import { PaymentMethodCard, PasswordCard } from '../../../components/portal/client/account/AccountCards'
import { useClientPortal } from '../../../lib/clientPortalContext'
import { formatDate } from '../../../lib/dateFormat'
import { ACCOUNT } from '../../../data/clientPortalContent'
import { SUPPORT_EMAIL } from '../../../data/contactContent'

/**
 * §7.5 — Subscription & Account (rebuilt in 11.5). The plan leads on ink, with
 * §13's renewal notice always in it; then the card, the payments, cancelling,
 * and the details the client gave us, which only we change.
 */

function Detail({ term, children }) {
  return (
    <div className="flex flex-col gap-0.5 py-3.5 sm:flex-row sm:items-baseline sm:gap-6">
      <dt className="font-body text-caption text-ink/70 sm:w-36 sm:shrink-0">{term}</dt>
      <dd className="font-body text-ui text-ink-deep">{children}</dd>
    </div>
  )
}

function DetailsCard({ user, profile }) {
  const copy = ACCOUNT.details
  const people =
    profile?.type === 'couple'
      ? [profile.coupleData?.partner1, profile.coupleData?.partner2]
          .filter(Boolean)
          .map((partner) => `${partner.name} · ${partner.age}`)
          .join('  and  ')
      : [profile?.name, profile?.age].filter(Boolean).join(' · ')
  const place = [profile?.city, profile?.country].filter(Boolean).join(', ')
  const initials = (profile?.type === 'couple'
    ? [profile.coupleData?.partner1?.name, profile.coupleData?.partner2?.name]
    : (profile?.name ?? '').split(' ')
  )
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

  return (
    <section
      aria-labelledby="details-heading"
      className="rounded-2xl bg-paper px-5 py-6 shadow-[0_12px_32px_-20px_rgb(25_18_43/0.35)] sm:px-7"
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-ink font-body text-caption font-medium text-paper">
          {initials || '·'}
        </span>
        <h2 id="details-heading" className="font-body text-ui font-medium text-ink-deep">
          {copy.heading}
        </h2>
      </div>

      <dl className="mt-3 divide-y divide-ink/12">
        {people && <Detail term={profile?.type === 'couple' ? copy.couple : copy.name}>{people}</Detail>}
        <Detail term={copy.email}>{user.email}</Detail>
        {place && <Detail term={copy.place}>{place}</Detail>}
        {user.memberSince && <Detail term={copy.since}>{formatDate(user.memberSince)}</Detail>}
      </dl>

      <p className="mt-4 max-w-measure font-body text-caption leading-relaxed text-ink/70">
        {copy.note}{' '}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-medium text-ink underline decoration-ink/60 underline-offset-2 hover:decoration-2"
        >
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </section>
  )
}

export default function Account() {
  const { user, profile, subscription, access, accessEndsAt, therapist, reviewState, refresh } =
    useClientPortal()
  const reduce = useReducedMotion()
  // One gentle settle, in order, then stillness. Reduced motion: all at once.
  const rise = (index) => ({
    initial: reduce ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: reduce ? 0 : index * 0.08, ease: [0.16, 1, 0.3, 1] },
  })

  return (
    <section className="pb-12 sm:pb-16">
      <ScreenHeader
        title={ACCOUNT.title}
        lead={ACCOUNT.lead}
        icon={AccountIcon}
        category="Membership & Plan"
        badge={access === 'granted' ? 'Active Plan' : access === 'ending' ? 'Ending' : null}
      />

      <div className="mt-7 flex flex-col gap-6">
        <motion.div {...rise(0)}>
          <PlanHero subscription={subscription} access={access} accessEndsAt={accessEndsAt} />
        </motion.div>

        <motion.div {...rise(1)} className="grid gap-6 sm:grid-cols-2">
          <PaymentMethodCard />
          <PasswordCard email={user.email} />
        </motion.div>

        <motion.div {...rise(2)}>
          <BillingHistory />
        </motion.div>

        <motion.div {...rise(3)}>
          <SubscriptionControls
            subscription={subscription}
            access={access}
            accessEndsAt={accessEndsAt}
            refresh={refresh}
          />
        </motion.div>

        <motion.div {...rise(4)}>
          <DetailsCard user={user} profile={profile} />
        </motion.div>

        {/* §9.6: while a cancelled plan runs out the client is still here to be
            asked — after expiry most never come back. Offered once. */}
        {access === 'ending' && reviewState === 'eligible' && (
          <div className="rounded-2xl bg-paper px-5 py-6 sm:px-7">
            <RatingForm therapistName={therapist?.firstName} />
          </div>
        )}
      </div>
    </section>
  )
}
