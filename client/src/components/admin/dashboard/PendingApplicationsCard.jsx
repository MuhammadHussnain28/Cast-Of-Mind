import { Link } from 'react-router-dom'
import { cx } from '../../../lib/cx'
import { formatCount } from '../../../lib/dashboardFormat'
import { ApplicationsIcon } from '../AdminIcons'

/**
 * Not a statistic — an action. §9.1 calls pending applications "an action
 * item", and rendering it as another number beside the client count is exactly
 * what makes it disappear.
 *
 * The whole card is the link, so the target is large rather than a small text
 * link inside a tile. The gold rule marks the one thing on this screen that
 * wants doing; gold may be a fill or a rule on a light surface but never text,
 * so the words stay ink.
 */
export default function PendingApplicationsCard({ count }) {
  const waiting = count > 0

  return (
    <Link
      to="/admin/applications"
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/12 bg-paper px-5 py-5 transition-colors duration-200 ease-out hover:bg-mist"
    >
      <span
        aria-hidden="true"
        className={cx('absolute inset-x-0 top-0 h-1', waiting ? 'bg-gold' : 'bg-ink/12')}
      />

      <span className="flex items-start justify-between gap-4">
        <span className="font-body text-caption text-ink/70">Therapist applications</span>
        <ApplicationsIcon className={waiting ? 'text-ink' : 'text-ink/60'} />
      </span>

      <span className="mt-4 block font-body text-[1.75rem] font-medium leading-none text-ink">
        {formatCount(count)}
      </span>

      <span className="mt-2 block font-body text-caption text-ink/70">
        {waiting
          ? `${count === 1 ? 'One is' : 'They are'} waiting for review`
          : 'Nothing waiting for review'}
      </span>

      <span className="mt-5 inline-flex items-center font-body text-caption font-medium text-ink underline decoration-ink/30 underline-offset-4 transition-colors duration-200 ease-out group-hover:decoration-ink">
        {waiting ? 'Review them' : 'Open applications'}
      </span>
    </Link>
  )
}
