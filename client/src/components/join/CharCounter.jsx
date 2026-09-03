import { cx } from '../../lib/cx'

/**
 * Live character count.
 *
 * DOES NOT TRUNCATE, and there is no `maxLength` on the paired input on
 * purpose: pasting a long bio and silently losing the end is worse than seeing
 * "1,340 / 1,200" turn red and being told to trim it. You always know what
 * happened to your text.
 *
 * aria-hidden: announcing a number on every keystroke is miserable with a
 * screen reader. The limit is stated once in the field's helper text instead.
 */
export default function CharCounter({ value = '', max, className }) {
  const count = value.length
  const over = count > max

  return (
    <p
      aria-hidden="true"
      className={cx(
        'mt-1 text-right font-body text-caption tabular-nums',
        over ? 'text-clay' : 'text-ink/60',
        className,
      )}
    >
      {count.toLocaleString()} / {max.toLocaleString()}
    </p>
  )
}
