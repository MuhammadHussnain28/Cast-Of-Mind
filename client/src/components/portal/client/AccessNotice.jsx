import { useId, useState } from 'react'
import { Button, Text } from '../../ui'
import { formatDate } from '../../../lib/dateFormat'
import { openBillingPortal } from '../../../lib/api/clientPortalApi'
import { ACCESS_NOTICES } from '../../../data/clientPortalContent'
import { longDateTime, isoOf } from '../../../lib/client/accessDates'
import { CardRenewIcon, HoursIcon } from './ClientPortalIcons'

/**
 * The past-due banner (§13, 11.2). On every portal screen until the card is
 * fixed. States the date access runs to — never a countdown — and offers one
 * way forward: Stripe's own card page, opened from a server-made link.
 */
function PastDueNotice({ subscription }) {
  const notice = ACCESS_NOTICES.past_due
  const headingId = useId()
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState(null)
  const until = subscription?.graceEndsAt ? longDateTime(subscription.graceEndsAt) : null

  async function updateCard() {
    setOpening(true)
    setError(null)
    try {
      const { url } = await openBillingPortal()
      // Stays "opening" while the browser leaves for Stripe.
      window.location.assign(url)
    } catch (failure) {
      setOpening(false)
      setError(failure?.status ? failure.message : notice.failed)
    }
  }

  return (
    // The paper base is not redundant: the clay tint composites over whatever
    // is behind it, and over mist the title measured 4.42:1 (7.1). Over paper
    // it is 4.90:1. One soft shadow lifts the plate off the mist page.
    <section
      aria-labelledby={headingId}
      className="rounded-2xl bg-paper shadow-[0_12px_32px_-20px_rgb(25_18_43/0.35)]"
    >
      <div className="flex flex-col gap-4 rounded-2xl bg-clay/8 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5 sm:py-5">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-clay/12 text-clay"
          >
            <CardRenewIcon size={22} />
          </span>

          <div className="min-w-0">
            {/* A paragraph, not a heading: this sits above each screen's own h1. */}
            <p id={headingId} className="font-body text-ui font-medium text-clay">
              {notice.title}
            </p>
            <p className="mt-1 max-w-measure font-body text-caption leading-relaxed text-ink/70">
              {until ? (
                <>
                  {notice.until}{' '}
                  <time dateTime={isoOf(subscription.graceEndsAt)} className="font-medium text-ink">
                    {until}
                  </time>
                  .{' '}
                </>
              ) : (
                `${notice.untilUnknown} `
              )}
              {notice.body}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
          <Button
            variant="danger"
            loading={opening}
            onClick={updateCard}
            // Loading is not "unavailable": stay at full strength while Stripe opens.
            className="w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-busy:disabled:cursor-progress aria-busy:disabled:opacity-100 sm:w-auto"
          >
            {opening ? notice.opening : notice.action}
          </Button>
          <p className="font-body text-caption leading-snug text-ink/70 sm:text-right">{notice.caption}</p>
        </div>
      </div>

      {error && (
        <p role="alert" className="border-t border-clay/15 bg-clay/8 px-4 py-3 font-body text-caption text-clay sm:px-5">
          {error}
        </p>
      )}
    </section>
  )
}

/**
 * The two subscription states that have something to say (§13).
 *
 * `past_due` is the banner the chunk requires. It is deliberately NOT an alarm
 * strip: clay at low opacity, one drawn mark, one sentence, one way forward.
 * "Your payment failed" already carries enough charge for someone who came here
 * for help with their anxiety — the design's job is to be unmissable and calm
 * at the same time, which is what the tint does and a saturated red would not.
 *
 * `ending` is not in the brief but falls straight out of the state machine, and
 * without it a cancelled subscription is invisible until the day it stops. It
 * carries NO retention pressure — no discount, no "are you sure", no warning
 * about what they will lose. Dark patterns on cancellation are excluded
 * outright, and this is exactly where a lesser product puts one.
 *
 * Neither is `role="alert"`: both are present when the page loads rather than
 * interrupting the reader. Only a failed "Update your card" press is announced.
 */
export default function AccessNotice({ access, subscription, accessEndsAt }) {
  if (access === 'past_due') return <PastDueNotice subscription={subscription} />
  if (access === 'ending') {
    const notice = ACCESS_NOTICES.ending
    // The server's own end (11.3): the paid period, or the grace end.
    const until = accessEndsAt ?? subscription?.currentPeriodEnd

    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl bg-paper px-4 py-4 sm:gap-4 sm:px-5"
      >
        <HoursIcon size={20} className="mt-0.5 shrink-0 text-sage-deep" />

        <div className="min-w-0">
          <p className="font-body text-ui font-medium text-ink">
            {notice.title}
            {until ? ` on ${formatDate(until)}` : ''}
          </p>
          <Text size="caption" tone="muted" className="mt-1 max-w-measure">
            {notice.body}
          </Text>
        </div>
      </div>
    )
  }

  return null
}
