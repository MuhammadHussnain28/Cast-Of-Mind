import { cx } from '../../lib/cx'

const SIZES = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }

/**
 * Loading spinner. Rotation is decorative, so it is hidden from screen readers;
 * whatever is loading should announce itself (see Button's aria-busy).
 * The spin keeps running under prefers-reduced-motion because the global rule
 * only collapses duration — so we disable it explicitly with motion-reduce.
 */
export default function Spinner({ size = 'md', className }) {
  return (
    <svg
      className={cx(SIZES[size], 'animate-spin motion-reduce:animate-none', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
