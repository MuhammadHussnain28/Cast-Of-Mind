import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button, Heading, Text } from '../ui'
import { closing } from '../../data/howItWorksContent'

/** Contrast: paper on ink 18.1:1, paper/80 11.7:1, gold button face 11.1:1. */
export default function ClosingCta() {
  const reduceMotion = useReducedMotion()

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.5 },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
      }

  return (
    <section data-surface="dark" aria-labelledby="closing-heading" className="bg-ink">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <motion.div {...reveal}>
          <Heading level={2} id="closing-heading" tone="inverse" className="max-w-[18ch]">
            {closing.heading}
          </Heading>
          <Text tone="inverse" className="mt-7 max-w-measure opacity-80">
            {closing.body}
          </Text>
          <Button as={Link} to="/questionnaire" size="lg" className="mt-10">
            Get started
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
