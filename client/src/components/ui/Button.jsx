import { cx } from '../../lib/cx'
import Spinner from './Spinner'

/**
 * Yellow on paper is only 1.63:1, so a filled yellow button has an almost
 * invisible edge. The 1px ink border gives the control a findable boundary
 * (WCAG 1.4.11). ink/50 measures 3.43:1 against paper; ink/15 was tried
 * first and only reached 1.38:1, so it did nothing.
 * The ink TEXT on yellow is 11.1:1, which is comfortable.
 */
const VARIANTS = {
  primary: 'bg-gold text-ink border border-ink/50 hover:bg-gold/90 active:bg-gold/80',
  secondary: 'bg-ink text-paper border border-ink hover:bg-ink-deep active:bg-ink-deep',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-mist active:bg-mist',
  danger: 'bg-clay text-paper border border-clay hover:bg-clay/90 active:bg-clay/80',
}

/**
 * Every size keeps a 44px minimum height. The spec's accessibility floor asks
 * for 44x44 touch targets, so `sm` gets tighter padding and smaller text
 * rather than a shorter box.
 */
const SIZES = {
  sm: 'min-h-11 px-4 text-caption',
  md: 'min-h-11 px-6 text-ui',
  lg: 'min-h-12 px-8 text-body',
}

/**
 * `as` lets a navigation link wear the button's clothes:
 *
 *   <Button as={Link} to="/questionnaire">Get started</Button>
 *
 * Added in chunk 2.1. Without it the "Get started" styling had to be copied by
 * hand onto a <Link> everywhere it appears - already twice in the layout, and
 * once more per marketing page. Four hand-copies of one control is how a design
 * system quietly stops being one.
 *
 * The distinction is real, not cosmetic: something that NAVIGATES must be an
 * <a>, so it opens in a new tab on middle-click, shows its target in the status
 * bar, and is announced as a link. A <button> that navigates breaks all three.
 * The button-only attributes below are therefore withheld when `as` is set -
 * `type` and `disabled` are meaningless on an anchor, and a disabled anchor is
 * not a thing the platform has.
 */
export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...rest
}) {
  const isDisabled = disabled || loading
  const isNativeButton = Tag === 'button'

  return (
    <Tag
      {...(isNativeButton ? { type, disabled: isDisabled } : {})}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full font-body font-medium',
        'transition-colors duration-200 ease-out',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner size={size === 'lg' ? 'md' : 'sm'} />}
      {children}
    </Tag>
  )
}
