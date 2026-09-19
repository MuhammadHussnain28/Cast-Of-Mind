import { useReducedMotion } from 'framer-motion'
import { chat } from '../../../data/chatContent'

/**
 * Three dots, on the other party's side of the thread.
 *
 * Ephemeral and purely visual — §14 stores nothing about typing. Under reduced
 * motion the dots hold still and the words carry the meaning instead, which is
 * why the label is real text rather than an aria-label on an animation.
 *
 * NOT ANNOUNCED. This carried `role="status"` until 7.6, which made a screen
 * reader say "Priya is typing" every time the indicator appeared — every few
 * seconds through a long message, and again on every pause and restart. Typing
 * is a glance-level cue with no action attached; the message itself is what
 * gets announced, by the live region in Chat.jsx. Hidden rather than silenced
 * with an empty label, so nothing lands in the accessibility tree at all.
 */
export default function TypingDots({ name }) {
  const reduce = useReducedMotion()

  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <span className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-paper px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            className="size-1.5 rounded-full bg-ink/60 motion-safe:animate-pulse"
            style={reduce ? undefined : { animationDelay: `${i * 180}ms`, animationDuration: '1.4s' }}
          />
        ))}
      </span>
      <span className="font-body text-caption text-ink/70">
        {name} {chat.typing}
      </span>
    </div>
  )
}
