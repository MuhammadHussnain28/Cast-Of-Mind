import { motion, useReducedMotion } from 'framer-motion'
import { asideCopy } from '../../data/questionnaireContent'

/**
 * Everything you have told us, building up as you go.
 *
 * It is here to make Back visibly safe: you can see nothing was lost, rather
 * than clicking back to check. It also stops the flow feeling like a form being
 * filled and makes it feel like someone taking notes.
 *
 * It shows the WHOLE answer set, concern tags included (developer's decision,
 * 2026-09-05 — see the note on selectAnswerEcho for the trade-off accepted).
 *
 * An item carries either `value` (a string) or `values` (a list rendered as
 * pills, so four long tag names wrap instead of running as one paragraph).
 */
export default function AnswerEcho({ items }) {
  const reduceMotion = useReducedMotion()

  return (
    <div>
      <h2 className="font-body text-caption font-medium text-paper/70">{asideCopy.soFar}</h2>

      <div className="mt-3 h-px w-full bg-paper/15" />

      {items.length === 0 ? (
        <p className="mt-4 font-body text-caption text-paper/60">{asideCopy.empty}</p>
      ) : (
        <dl className="mt-4 space-y-3">
          {items.map((item) => (
            <motion.div
              key={item.label}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <dt className="font-body text-caption text-paper/60">{item.label}</dt>

              {item.values ? (
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {item.values.map((entry) => (
                    <span
                      key={entry}
                      className="rounded-full bg-paper/10 px-2.5 py-1 font-body text-caption text-paper"
                    >
                      {entry}
                    </span>
                  ))}
                </dd>
              ) : (
                <dd className="font-body text-ui break-words text-paper">{item.value}</dd>
              )}
            </motion.div>
          ))}
        </dl>
      )}
    </div>
  )
}
