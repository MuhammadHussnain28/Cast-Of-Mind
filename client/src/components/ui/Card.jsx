import { cx } from '../../lib/cx'

/**
 * Elevation is declared once — a border, not a border plus a shadow.
 * `tone` picks the surface so sections can alternate paper and mist.
 */
const TONES = {
  paper: 'bg-paper border-ink/12',
  mist: 'bg-mist border-ink/10',
  ink: 'bg-ink border-ink text-paper',
}

export default function Card({ tone = 'paper', as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag
      className={cx('rounded-2xl border p-6', TONES[tone], className)}
      {...(tone === 'ink' ? { 'data-surface': 'dark' } : {})}
      {...rest}
    >
      {children}
    </Tag>
  )
}
