import { cx } from '../../lib/cx'
import { badgeLabel } from '../../lib/chat/unreadStore'

/**
 * The unread count — master spec §14.
 *
 * GOLD ON INK, and the colour is a decision rather than a default. Gold is the
 * accent that means "attention here", it is the one colour permitted to carry
 * weight on a dark surface (9.5:1 on ink, against 1.63:1 on paper), and both
 * portal navigations are ink for exactly that reason.
 *
 * DELIBERATELY NOT `clay`. Clay is the error token. A message from your
 * therapist is not an error, and a red badge on a mental health platform reads
 * as an alarm to precisely the reader least able to absorb one.
 *
 * It is `aria-hidden`: a bare numeral announced on its own means nothing, so
 * the count goes into the accessible name of the link that owns it instead —
 * "Chat, 3 unread messages".
 *
 * Not built on `Badge` (chunk 0.4): that is a bordered `px-3` status label
 * sized for words. A count is a different shape and needs to stay narrow enough
 * to sit inside a 64px tab at 360px.
 */
export default function UnreadBadge({ count, variant = 'inline', className }) {
  const label = badgeLabel(count)
  if (!label) return null

  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex items-center justify-center rounded-full bg-gold px-1.5',
        'font-body text-[0.6875rem] font-medium leading-none tabular-nums text-ink',
        variant === 'inline' && 'min-w-5 py-1',
        // Over the icon's corner. The ink ring is the tab bar's own ground
        // showing through, so the pill reads as sitting ABOVE the icon rather
        // than merged into it — a material cut-out, not an applied outline.
        variant === 'corner' &&
          'absolute -right-2 -top-1 min-w-4.5 py-0.5 ring-2 ring-ink',
        className,
      )}
    >
      {label}
    </span>
  )
}
