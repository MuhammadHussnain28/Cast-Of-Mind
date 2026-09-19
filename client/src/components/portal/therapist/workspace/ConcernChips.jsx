import { cx } from '../../../../lib/cx'

/**
 * A client's presenting concerns — master spec §8.2.
 *
 * DRAWN AS CHIPS RATHER THAN A COMMA LIST, because this is the clinical payload
 * of the strip: the thing a therapist scans before opening a conversation.
 * Three or four separate concerns set as "Anxiety, Grief, Stress" read as one
 * sentence; as chips they read as a set, which is what they are.
 *
 * This is the opposite call to the client list in 8.1, where message text was
 * deliberately kept off screen. The distinction is not squeamishness about
 * sensitive data — it is that a therapist is the one person on the platform
 * these concerns are FOR, and §8.2 asks for them by name. A quotation from a
 * conversation is not the same thing as the tags someone chose from a fixed
 * list to describe why they came.
 *
 * Sage rather than gold: gold is 1.63:1 on a light surface and never permitted
 * as text or an indicator there. `ink` on a `sage/15` tint over paper measures
 * comfortably past the body floor.
 */
export default function ConcernChips({ tags, size = 'md', className }) {
  if (!tags?.length) return null

  return (
    <ul className={cx('flex flex-wrap gap-1.5', className)}>
      {tags.map((tag) => (
        <li
          key={tag}
          className={cx(
            // The tint alone is 1.17:1 against paper — legible text in a shape
            // nobody can see the edge of. The ring gives each concern a real
            // boundary so they read as a set of distinct things rather than
            // one smudged band, which is the same fix the chat system notice
            // took in 7.4. A ring on a flat chip is a boundary, not elevation,
            // so it does not break the declare-depth-once rule.
            'inline-flex items-center rounded-full bg-sage/15 ring-1 ring-sage/40',
            'font-body text-ink',
            size === 'md' && 'px-3 py-1 text-caption',
            size === 'lg' && 'px-3.5 py-1.5 text-ui',
          )}
        >
          {tag}
        </li>
      ))}
    </ul>
  )
}
