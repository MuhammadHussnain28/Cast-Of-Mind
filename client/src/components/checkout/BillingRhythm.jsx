import { motion, useReducedMotion } from 'framer-motion'

/**
 * The recurring charge, drawn.
 *
 * Four marks on a rule: the first filled and labelled "Today", the next three
 * outlined and fading, running off the right edge. It says "this happens again,
 * and again, and does not stop" without a second sentence of copy.
 *
 * This is transparency, not decoration — it makes the recurring nature MORE
 * visible, which is the opposite of burying it in small print.
 *
 * ON INK ONLY. Gold is 11.08:1 here and unusable on any light surface (1.63:1),
 * which is exactly why the disclosure panel is dark.
 */

const MARKS = [0, 1, 2, 3]

export default function BillingRhythm({ todayLabel, caption }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="mt-5">
      <div className="relative flex items-center">
        {/* The rule the marks sit on. Fades out rather than stopping, because
            the billing does not stop either. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-[7px] h-px bg-gradient-to-r from-paper/35 via-paper/20 to-transparent"
        />

        <ul className="relative flex w-full items-start justify-between">
          {MARKS.map((index) => {
            const isFirst = index === 0
            return (
              <li key={index} className="flex flex-col items-center gap-2">
                <motion.span
                  aria-hidden="true"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.45,
                    delay: reduceMotion ? 0 : 0.15 + index * 0.11,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={
                    isFirst
                      ? 'block h-3.5 w-3.5 rounded-full bg-gold'
                      : 'block h-3.5 w-3.5 rounded-full border border-paper/45'
                  }
                  style={index > 1 ? { opacity: 1 - (index - 1) * 0.22 } : undefined}
                />
                {isFirst && (
                  <span className="font-body text-caption text-paper">{todayLabel}</span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* The caption names what the marks mean. The marks are aria-hidden, so
          this line is what a screen reader hears — it has to stand alone. */}
      <p className="mt-4 font-body text-caption text-paper/80">{caption}</p>
    </div>
  )
}
