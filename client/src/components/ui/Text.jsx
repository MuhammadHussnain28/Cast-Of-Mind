import { cx } from '../../lib/cx'

const SIZES = {
  // 26px. The type scale's subsection step, added in chunk 2.2 for body copy
  // that has to carry a section on its own — a statement the reader is meant to
  // find themselves in, not a heading.
  //
  // It belongs here rather than being passed as className: both would be
  // font-size utilities, so which one won would be decided by their order in
  // the generated stylesheet rather than by the author. Same trap that made
  // Heading take a tone prop.
  subsection: 'text-subsection',
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
