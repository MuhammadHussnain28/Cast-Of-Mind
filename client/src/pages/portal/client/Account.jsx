import { ScreenHeader, BuildNote } from '../../../components/portal/client/ScreenScaffold'
import { Text } from '../../../components/ui'
import { useClientPortal } from '../../../lib/clientPortalContext'
import { formatDate } from '../../../lib/dateFormat'
// The one place in the client that knows money is stored in cents (6.1). Named
// for the admin dashboard because that is where it was first needed; reusing it
// is better than a second function that divides by 100.
import { formatMoney } from '../../../lib/dashboardFormat'
import { RENEWAL_NOTICE } from '../../../data/clientPortalContent'

/**
 * §7.5 — READ ONLY in this chunk.
 *
 * Managing a payment method (11.5) and cancelling (11.3) are their own chunks,
 * and both are real actions with real consequences. What is here is the part
 * that is pure reporting, built now because §13 requires the renewal terms
 * visible in the portal at all times, and because `/client/me` already returns
 * every figure on the screen. A placeholder that ignored data we had already
 * fetched would read as unfinished rather than deliberate.
 */

/** The stored status, in words a client would use. Never the raw enum. */
function statusLabel(subscription, access) {
  if (!subscription) return 'No subscription'
  if (access === 'past_due') return 'Payment needed'
  if (access === 'ending') return 'Ending'
  return 'Active'
}

function Row({ term, children }) {
  return (
    <div className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="font-body text-caption text-ink/70 sm:text-ui">{term}</dt>
      <dd className="font-body text-ui text-ink-deep">{children}</dd>
    </div>
  )
}

export default function Account() {
  const { user, profile, subscription, access } = useClientPortal()

  const people =
    profile?.type === 'couple'
      ? [profile.coupleData?.partner1, profile.coupleData?.partner2]
          .filter(Boolean)
          .map((partner) => `${partner.name} · ${partner.age}`)
          .join('  and  ')
      : [profile?.name, profile?.age].filter(Boolean).join(' · ')

  const place = [profile?.city, profile?.country].filter(Boolean).join(', ')

  return (
    <section>
      <ScreenHeader
        title="Account"
        lead="Your subscription and the details you gave us when you signed up."
      />

      <div className="mt-7 rounded-2xl bg-paper px-5 py-2 sm:px-6">
        <h2 className="sr-only">Subscription</h2>
        <dl className="divide-y divide-ink/12">
          <Row term="Status">{statusLabel(subscription, access)}</Row>

          {subscription && (
            <Row term="Plan">
              {formatMoney(subscription.amount, subscription.currency)} a month · 4 sessions and
              unlimited chat
            </Row>
          )}

          {subscription?.sessionsRemaining != null && (
            <Row term="Sessions left">
              {subscription.sessionsRemaining} of 4 this month
              {/* §13: no carry-over. Said here because it is the one place a
                  client would reasonably expect unused sessions to bank. */}
              <Text size="caption" tone="muted" className="mt-1">
                Unused sessions do not roll over into next month.
              </Text>
            </Row>
          )}

          {access === 'ending' && subscription?.currentPeriodEnd && (
            <Row term="Access until">{formatDate(subscription.currentPeriodEnd)}</Row>
          )}

          {access !== 'ending' && subscription?.nextBillingDate && (
            <Row term="Next payment">
              {formatDate(subscription.nextBillingDate)}
              {/* The §13 sentence, required visible in the portal. */}
              <Text size="caption" tone="muted" className="mt-1">
                {RENEWAL_NOTICE}
              </Text>
            </Row>
          )}
        </dl>
      </div>

      <div className="mt-6 rounded-2xl bg-paper px-5 py-2 sm:px-6">
        <h2 className="sr-only">Your details</h2>
        <dl className="divide-y divide-ink/12">
          {people && (
            <Row term={profile?.type === 'couple' ? 'You both' : 'Name'}>{people}</Row>
          )}
          <Row term="Sign in email">{user.email}</Row>
          {place && <Row term="Where you are">{place}</Row>}
          {user.memberSince && <Row term="With us since">{formatDate(user.memberSince)}</Row>}
        </dl>
      </div>

      <BuildNote>
        Changing your card and cancelling your subscription are not switched on
        here yet. To do either now, or to correct anything above, contact us and
        we will take care of it.
      </BuildNote>
    </section>
  )
}
