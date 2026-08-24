import { cx } from '../../lib/cx'

const SIZES = {
  body: 'text-body',
  ui: 'text-ui',
  caption: 'text-caption',
}

const TONES = {
  default: 'text-ink-deep',
  muted: 'text-ink/70', // 6.76:1 on paper — passes AA. Do not go lighter.
  error: 'text-clay',
  success: 'text-sage-deep',
  inverse: 'text-paper',
}

export default function Text({
  as: Tag = 'p',
  size = 'body',
  tone = 'default',
  className,
  children,
  ...rest
}) {
  return (
    <Tag className={cx('font-body', SIZES[size], TONES[tone], className)} {...rest}>
      {children}
    </Tag>
  )
}
