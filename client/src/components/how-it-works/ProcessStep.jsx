import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'
import {
  Questionnaire,
  Matching,
  Choosing,
  Subscribe,
  Credentials,
  Message,
  Sessions,
} from './StepIcons'

const ICONS = {
  questionnaire: Questionnaire,
  matching: Matching,
  choosing: Choosing,
  subscribe: Subscribe,
  credentials: Credentials,
  message: Message,
  sessions: Sessions,
}

/**
 * One step. Badge and icon plate are both `paper` with a sage ring, so the
 * numeral holds 5.5:1 and the icon 3.4:1 on every phase ground — a sage-tinted
 * badge measured 4.40:1 on mist and failed.
 */
export default function ProcessStep({ step, number }) {
  const reduceMotion = useReducedMotion()
  const IconComponent = ICONS[step.icon]

  const reveal = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.4 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        }

  return (
    // <li className="relative py-8 pl-14 sm:pl-16 lg:py-10">
    <li className="relative py-4 pl-14 sm:pl-16 lg:py-6">

      <motion.span
        {...reveal()}
        aria-hidden="true"
        className="absolute left-0 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-paper ring-1 ring-sage/30 lg:top-6"
      >
        <span data-numeric className="font-body text-ui font-medium text-sage-deep">
          {number}
        </span>
      </motion.span>

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-10">
        <motion.div {...reveal(0.05)} className="lg:col-span-2">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-paper ring-1 ring-sage/30">
            <IconComponent className="h-7 w-7 text-sage" />
          </span>
        </motion.div>

        <motion.div {...reveal(0.1)} className="mt-6 lg:col-span-9 lg:col-start-4 lg:mt-0">
          <Heading level={3} size="subsection">
            {step.title}
          </Heading>
          <Text tone="muted" className="mt-3 max-w-measure">
            {step.body}
          </Text>
          <Text size="ui" className="italic mt-4 max-w-measure font-medium text-sage-deep">
            {step.note}
          </Text>
        </motion.div>
      </div>
    </li>
  )
}
