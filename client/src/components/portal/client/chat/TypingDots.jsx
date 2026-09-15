import { useReducedMotion } from 'framer-motion'
import { chat } from '../../../../data/chatContent'

/**
 * Three dots, on the other party's side of the thread.
 *
 * Ephemeral and purely visual — §14 stores nothing about typing. Under reduced
 * motion the dots hold still and the words carry the meaning instead, which is
 * why the label is real text rather than an aria-label on an animation.
 */
export default function TypingDots({ name }) {
  const reduce = useReducedMotion()

  return (
    <div className="flex items-center gap-2" role="status">
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
