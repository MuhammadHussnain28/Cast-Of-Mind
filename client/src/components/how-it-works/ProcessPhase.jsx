import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'
import ProcessStep from './ProcessStep'

/**
 * One phase: a heading, a reassurance note, and its steps on a shared rail.
 * The rail is drawn on the list so it stays continuous between steps —
 * per-step segments would break at every gap.
 */
export default function ProcessPhase({ phase, startNumber }) {
  const reduceMotion = useReducedMotion()

  const rail = reduceMotion
    ? {}
    : {
        initial: { scaleY: 0 },
        whileInView: { scaleY: 1 },
        viewport: { once: true, amount: 0.1 },
        transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
      }

  const heading = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.6 },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
      }

  return (
    <section
      aria-labelledby={`phase-${phase.id}`}
      data-surface={phase.surface}
      className={phase.ground}
    >
      {/* <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-20"> */}
      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:py-15">
        <motion.div {...heading}  className="pl-14 sm:pl-16">
          <Heading level={2} id={`phase-${phase.id}`} size="subsection" className="text-ink">
            {phase.title}
          </Heading>
          <Text size="ui" className="mt-2 max-w-measure font-medium text-sage-deep">
            {phase.note}
          </Text>
        </motion.div>

        <ol className="relative mt-4">
          {/* Badge centre is 22px from the left edge; the rail matches it. */}
          <motion.span
            {...rail}
            aria-hidden="true"
            style={{ originY: 0 }}
            className="absolute inset-y-0 left-[1.375rem] w-px bg-sage/30"
          />
          {phase.steps.map((step, index) => (
            <ProcessStep key={step.id} step={step} number={startNumber + index} />
          ))}
        </ol>
      </div>
    </section>
  )
}
