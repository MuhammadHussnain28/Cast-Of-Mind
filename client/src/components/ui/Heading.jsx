import { cx } from '../../lib/cx'

const SIZES = {
  hero: 'font-display text-hero',
  section: 'font-display text-section',
  subsection: 'font-body text-subsection',
}

/**
 * Display heading. `level` sets the HTML tag so headings stay in order for
 * screen readers; `size` sets the look. They are separate on purpose — a page
 * sometimes needs an h2 that looks like a hero.
 */
export default function Heading({
  level = 2,
  size = 'section',
  as,
  className,
  children,
  ...rest
}) {
  const Tag = as || `h${level}`
  return (
    <Tag className={cx(SIZES[size], 'text-balance text-ink', className)} {...rest}>
      {children}
    </Tag>
  )
}
