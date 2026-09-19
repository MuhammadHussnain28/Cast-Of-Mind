import { cx } from '../../../lib/cx'
import { initialsFrom } from '../../../lib/therapist/initials'

/**
 * A client's initials, drawn as a disc.
 *
 * WHY THIS EXISTS AT ALL. `clientProfiles` holds no photograph — a client never
 * uploads one — so without this the list is a column of names in rectangles,
 * which is exactly the flat outcome the standing UI directive rules out. The
 * disc gives every row an anchor at the leading edge, makes the list scannable
 * as people rather than as text, and gives the selected row somewhere to carry
 * a real material change rather than only a colour swap.
 *
 * Sage rather than gold, because gold is the accent for "attention here" and it
 * is already spoken for by the unread badge at the other end of the row. Two
 * golds in one row and neither means anything.
 *
 * `aria-hidden`: the initials are redundant with the name sitting beside them,
 * and a screen reader announcing "M J, Marta and Joris" is noise.
 *
 * TWO TONES, BECAUSE A TINT COMPOSITES OVER WHATEVER IS BEHIND IT — the failure
 * 7.1 found by measuring and 7.4 found again. `sage/25` over ink is #323241 and
 * wants `paper` initials (12.59:1); the same `sage/25` over mist is #D6DADA and
 * `paper` on it is about 1.2:1, which is invisible. The light tone takes `ink`
 * initials instead (12.81:1).
 */

export default function ClientMonogram({ name, selected = false, size = 'md', tone = 'dark' }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-sage/25',
        'font-body font-medium transition-shadow duration-200 ease-out',
        tone === 'dark' ? 'text-paper' : 'text-ink',
        size === 'md' && 'size-10 text-ui',
        size === 'lg' && 'size-14 text-[1.25rem]',
        // The ring is the SELECTED state made material — the disc lifts out of
        // the rail rather than merely changing tint. Dark tone only: gold is
        // 11.08:1 on ink and 1.63:1 on a light surface, where it is banned
        // outright as an indicator. Nothing on the light side is selectable.
        selected && tone === 'dark' && 'ring-2 ring-gold',
      )}
    >
      {initialsFrom(name)}
    </span>
  )
}
