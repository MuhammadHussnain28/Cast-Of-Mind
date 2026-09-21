import { cx } from '../../../lib/cx'

// A calendar leaf: the date as an object, shared by both portals (9.2, 9.4).
// Ink for the next session, mist for later ones, quiet for history.
export default function DateLeaf({ weekday, day, month, tone = 'upcoming' }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'flex shrink-0 flex-col items-center justify-center rounded-xl text-center leading-none',
        tone === 'next' && 'h-20 w-16 bg-ink text-paper shadow-[0_12px_24px_-14px_rgba(25,18,43,0.6)]',
        tone === 'upcoming' && 'h-16 w-14 bg-mist text-ink',
        tone === 'history' && 'h-16 w-14 bg-paper text-ink/70 ring-1 ring-inset ring-ink/12',
      )}
    >
      <span className={cx('font-body text-caption', tone === 'next' && 'text-gold')}>{weekday}</span>
      <span className={cx('mt-1 font-body font-medium tabular-nums', tone === 'next' ? 'text-[1.75rem]' : 'text-subsection')}>
        {day}
      </span>
      <span className="mt-1 font-body text-caption">{month}</span>
    </span>
  )
}
