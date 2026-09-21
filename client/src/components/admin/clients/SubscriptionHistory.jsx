import { Text } from '../../ui'
import { PeriodMarkIcon } from './ClientIcons'
import { DETAIL } from '../../../data/adminClientContent'
import { formatMoney } from '../../../lib/dashboardFormat'
import { formatDate } from '../../../lib/dateFormat'

/**
 * Everything that came before the current subscription.
 *
 * Drawn as a spine rather than listed as rows, because what the admin is
 * reading here is a sequence: this person subscribed, stopped, came back. The
 * thread between the marks is the part that says so, and it is the same
 * vocabulary the therapist's session history uses — a struck ring for something
 * that was cancelled, a plain one for something that simply ran out. Two
 * shapes, not two colours, so the distinction survives without hue.
 */
export default function SubscriptionHistory({ entries }) {
  if (!entries?.length) {
    return (
      <Text size="caption" tone="muted">
        {DETAIL.historyEmpty}
      </Text>
    )
  }

  return (
    <ol className="relative flex flex-col gap-6">
      {/* The thread. Inset so it runs between the marks rather than through the
          first and last, and aria-hidden because the list already says order. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[13px] top-6 bottom-6 w-px bg-ink/12"
      />

      {entries.map((entry, index) => {
        const cancelled = Boolean(entry.cancelledAt)

        return (
          <li key={`${entry.startDate}-${index}`} className="relative flex items-start gap-4">
            <span className="relative z-10 flex size-[27px] shrink-0 items-center justify-center rounded-full bg-paper text-ink/70">
              <PeriodMarkIcon struck={cancelled} className="size-[22px]" />
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <p className="font-body text-ui font-medium text-ink">
                {formatDate(entry.startDate)} — {formatDate(entry.currentPeriodEnd)}
              </p>
              <p className="mt-1 font-body text-caption text-ink/70">
                {formatMoney(entry.amount, entry.currency)} a month ·{' '}
                {cancelled
                  ? `Cancelled ${formatDate(entry.cancelledAt)}${
                      entry.cancelledBy === 'admin'
                        ? ' by you'
                        : entry.cancelledBy
                          ? ' by the client'
                          : ''
                    }`
                  : 'Ran to the end of its period'}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
