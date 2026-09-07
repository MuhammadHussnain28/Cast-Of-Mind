import { useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button, Heading, Text } from '../ui'
import { intro } from '../../data/howItWorksContent'
import HowItWorksPathway from './HowItWorksPathway'

/**
 * How It Works Hero: Two-column layout with consistent 12-col grid
 * matching the Home and About pages.
 *
 * Contrast: paper on ink-deep 19.7:1, paper/80 12.5:1. Both clear AA.
 */
export default function HowItWorksHero() {
  const containerRef = useRef(null)
  const reduceMotion = useReducedMotion()

  const settle = (delay) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        }

  return (
    <section
      ref={containerRef}
      data-surface="dark"
      aria-labelledby="how-heading"
      className="relative isolate overflow-hidden bg-ink-deep"
    >
      {/* Ambient Sage Drift Wash (§24.9) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-1/4 -top-1/3 -z-10 h-[38rem] w-[38rem] rounded-full bg-sage/12 blur-[130px] motion-safe:animate-drift"
      />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-x-12 gap-y-10 px-5 py-10 sm:px-8 lg:min-h-[calc(100svh-72px)] lg:grid-cols-12 lg:py-12">
        
        {/* Left Column: Headline, Lede, Body, and Primary CTA */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-6">
          <motion.div {...settle(0)}>
            <Heading
              level={1}
              size="hero"
              tone="inverse"
              id="how-heading"
              className="mt-4 max-w-[15ch]"
            >
              {intro.heading}
            </Heading>
          </motion.div>

          <motion.div {...settle(0.1)}>
            <p className="font-display text-section text-paper opacity-90 leading-snug">
              {intro.lede}
            </p>
          </motion.div>

          <motion.div {...settle(0.2)}>
            <Text tone="inverse" className="max-w-measure opacity-80 leading-relaxed">
              {intro.body}
            </Text>
          </motion.div>

          <motion.div
            {...settle(0.3)}
            className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-3"
          >
            <Button as={Link} to="/questionnaire" size="lg">
              Get started free
            </Button>
            <span className="text-xs text-paper/50">
              No card required · 2-minute intake
            </span>
          </motion.div>
        </div>

        {/* Right Column: The 4-Node Circular Care Pathway */}
        <motion.div {...settle(0.15)} className="lg:col-span-6 xl:col-span-7">
          <HowItWorksPathway />
        </motion.div>

      </div>
    </section>
  )
}