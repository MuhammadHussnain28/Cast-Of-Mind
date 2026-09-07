import { Text } from '../../ui'
import { cx } from '../../../lib/cx'

/**
 * A quiet count. Deliberately not a card.
 *
 * The default build for §9.1 is twelve identical bordered tiles, which is the
 * "same-size cards as the page structure" pattern — legible and inert. These
 * carry no border and no shadow; the group around them provides the container,
 * and a hairline rule separates them. The figure is the loudest thing present.
 */
export default function StatFigure({ label, value, note, className }) {
  return (
    <div className={cx('min-w-0', className)}>
      <dt className="font-body text-caption text-ink/70">{label}</dt>
      <dd className="mt-1.5 font-body text-[1.75rem] font-medium leading-none text-ink">
        {value}
      </dd>
      {note && (
        <Text size="caption" tone="muted" className="mt-2">
          {note}
        </Text>
      )}
    </div>
  )
}
