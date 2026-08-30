import { cx } from '../../lib/cx'

const SIZES = {
  hero: 'font-display text-hero',
  section: 'font-display text-section',
  subsection: 'font-body text-subsection',
}

/**
 * Matches Text's tones so a heading and its body copy are set the same way on
 * the same ground. Added in chunk 2.1.
 *
 * Before this, a heading on a dark section was corrected by passing
 * `className="text-paper"`, which only worked because `.text-paper` happens to
 * be emitted AFTER `.text-ink` in the stylesheet - and that ordering is decided
 * by the order the palette is declared in @theme, not by anything intentional.
 * Reordering two lines in index.css would have silently turned every dark
 * section into ink-on-ink. A tone prop picks exactly one colour class instead
 * of relying on two of them fighting.
 */
const TONES = {
  default: 'text-ink',
  inverse: 'text-paper',
}

/**
 * Display heading. `level` sets the HTML tag so headings stay in order for
 * screen readers; `size` sets the look. They are separate on purpose — a page
 * sometimes needs an h2 that looks like a hero.
 */
export default function Heading({
  level = 2,
  size = 'section',
  tone = 'default',
  as,
  className,
  children,
  ...rest
}) {
  const Tag = as || `h${level}`
  return (
    <Tag className={cx(SIZES[size], 'text-balance', TONES[tone], className)} {...rest}>
      {children}
    </Tag>
  )
}
