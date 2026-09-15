import { Link } from 'react-router-dom'
import { Text } from '../../ui'
import { formatDate } from '../../../lib/dateFormat'
import { ACCESS_NOTICES } from '../../../data/clientPortalContent'
import { AttentionIcon, HoursIcon } from './ClientPortalIcons'

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
 * `role="status"`, not `alert`: this is present when the page loads rather than
 * interrupting something the reader was doing. Same call as FormAlert in 4.1.
 */
export default function AccessNotice({ access, subscription }) {
  if (access === 'past_due') {
    const notice = ACCESS_NOTICES.past_due

    return (
      // The paper base is not redundant. A clay tint composites over whatever
      // is behind it, and over `mist` the clay title measured 4.42:1 — under
      // the 4.5 floor. The same tint over paper is 4.90:1, and the body copy
      // 6.01:1. Found by computing it, not by looking at it.
      <div role="status" className="rounded-2xl bg-paper">
        <div className="flex flex-col gap-3 rounded-2xl bg-clay/8 px-4 py-4 sm:flex-row sm:items-start sm:gap-4 sm:px-5">
          <AttentionIcon size={22} className="mt-0.5 shrink-0 text-clay" />

          <div className="min-w-0 flex-1">
            <p className="font-body text-ui font-medium text-clay">{notice.title}</p>
            <Text size="caption" tone="muted" className="mt-1 max-w-measure">
              {notice.body}
            </Text>
          </div>

          <Link
            to="/portal/account"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-clay px-4 font-body text-ui font-medium text-paper transition-colors duration-200 ease-out hover:bg-clay/90"
          >
            {notice.action}
          </Link>
        </div>
      </div>
    )
  }

  if (access === 'ending') {
    const notice = ACCESS_NOTICES.ending
    const until = subscription?.currentPeriodEnd

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
